const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar serviços
const WhatsAppService = require('./services/whatsapp');
const ReportController = require('./controllers/reportController');
const { Logger, logActivity } = require('./utils/logger');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Configurar middlewares
      this.setupMiddlewares();

      // Configurar rotas
      this.setupRoutes();

      // Configurar error handlers
      this.setupErrorHandlers();

      // Inicializar WhatsApp
      console.log('🔄 Inicializando WhatsApp...');
      await WhatsAppService.initialize();

      // Configurar graceful shutdown
      this.setupGracefulShutdown();

      // Limpeza de logs antigos
      await Logger.cleanOldLogs(30);

      console.log('✅ Servidor inicializado com sucesso!');
      logActivity('INFO', 'Servidor inicializado', { port: this.port });

    } catch (error) {
      console.error('❌ Erro na inicialização:', error.message);
      logActivity('ERROR', 'Erro na inicialização do servidor', { error: error.message });
      process.exit(1);
    }
  }

  setupMiddlewares() {
    // Segurança
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));

    // Logging de requests
    const logFormat = process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev';
    this.app.use(morgan(logFormat));

    // Parse JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timeout
    this.app.use((req, res, next) => {
      req.setTimeout(30000); // 30 segundos
      res.setTimeout(30000);
      next();
    });

    // Request ID para tracking
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substring(2, 15);
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // NOVA Rota simplificada (recebe base64 diretamente)
    this.app.post('/api/enviar-imagem', ReportController.enviarImagem);

    // Rota principal do ERP (antiga - mantida para compatibilidade)
    this.app.post('/api/enviar-relatorio', ReportController.enviarRelatorio);

    // Teste de conexões
    this.app.get('/api/teste-conexao', ReportController.testeConexao);

    // Listar grupos WhatsApp
    this.app.get('/api/grupos', ReportController.listarGrupos);

    // Informações de empresa (útil para debug)
    this.app.get('/api/empresa/:cnpj', ReportController.getEmpresaInfo);

    // Status do sistema
    this.app.get('/api/status', async (req, res) => {
      try {
        const whatsappStatus = await WhatsAppService.testConnection();

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          services: {
            whatsapp: whatsappStatus
          },
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Logs recentes (últimas 24h)
    this.app.get('/api/logs', async (req, res) => {
      try {
        const hours = parseInt(req.query.hours) || 24;
        const logs = await Logger.getRecentLogs(hours);

        res.json({
          success: true,
          count: logs.length,
          hours: hours,
          logs: logs.slice(0, 100) // Limitar a 100 entradas
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Rota 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        availableEndpoints: [
          'POST /api/enviar-imagem (NOVO - base64)',
          'POST /api/enviar-relatorio (legado)',
          'GET /api/teste-conexao',
          'GET /api/grupos',
          'GET /api/empresa/:cnpj',
          'GET /api/status',
          'GET /api/logs',
          'GET /health'
        ]
      });
    });
  }

  setupErrorHandlers() {
    // Error handler global
    this.app.use((error, req, res, next) => {
      console.error('❌ Erro não tratado:', error);

      logActivity('ERROR', 'Erro não tratado na API', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        requestId: req.id
      });

      // Não expor detalhes do erro em produção
      const message = process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : error.message;

      res.status(500).json({
        success: false,
        message: message,
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;

      console.log(`\\n🔄 Recebido sinal ${signal}. Encerrando servidor...`);
      this.isShuttingDown = true;

      logActivity('INFO', 'Iniciando graceful shutdown', { signal });

      // Parar de aceitar novas conexões
      this.server.close(async () => {
        console.log('✅ Servidor HTTP fechado');

        try {
          // Fechar WhatsApp
          await WhatsAppService.close();

          console.log('✅ Cleanup concluído. Encerrando processo.');
          logActivity('INFO', 'Graceful shutdown concluído', { signal });

          process.exit(0);
        } catch (error) {
          console.error('❌ Erro durante shutdown:', error.message);
          logActivity('ERROR', 'Erro durante shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Timeout de segurança
      setTimeout(() => {
        console.error('❌ Timeout no shutdown. Forçando encerramento.');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Capturar erros não tratados
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error);
      logActivity('ERROR', 'Erro não capturado', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      logActivity('ERROR', 'Promise rejeitada não tratada', {
        reason: reason,
        promise: promise
      });
      process.exit(1);
    });
  }

  async start() {
    await this.initialize();

    this.server = this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`\\n🚀 Servidor rodando em http://localhost:${this.port}`);
      console.log(`📚 Documentação da API:`);
      console.log(`   📷 POST http://localhost:${this.port}/api/enviar-imagem (NOVO - base64)`);
      console.log(`   📄 POST http://localhost:${this.port}/api/enviar-relatorio (legado)`);
      console.log(`   🔍 GET  http://localhost:${this.port}/api/teste-conexao`);
      console.log(`   📊 GET  http://localhost:${this.port}/api/status`);
      console.log(`   ❤️  GET  http://localhost:${this.port}/health\\n`);

      logActivity('INFO', 'Servidor iniciado', {
        port: this.port,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }
}

// Iniciar servidor
if (require.main === module) {
  const server = new Server();
  server.start().catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error.message);
    process.exit(1);
  });
}

module.exports = Server;