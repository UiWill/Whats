const Database = require('../config/database');
const WhatsAppService = require('../services/whatsapp');
const FileService = require('../services/fileService');
const { logActivity } = require('../utils/logger');

class ReportController {
  // Endpoint principal: POST /api/enviar-relatorio
  static async enviarRelatorio(req, res) {
    const startTime = Date.now();
    const { cnpj } = req.body;

    // Log da requisição
    logActivity('INFO', 'Iniciando envio de relatório', { cnpj, ip: req.ip });

    try {
      // Validação básica
      if (!cnpj) {
        const error = { success: false, message: 'CNPJ é obrigatório', code: 'MISSING_CNPJ' };
        logActivity('ERROR', 'CNPJ não fornecido', { ip: req.ip });
        return res.status(400).json(error);
      }

      // Limpar CNPJ (remover caracteres especiais)
      const cnpjLimpo = cnpj.replace(/\D/g, '');

      if (cnpjLimpo.length !== 14) {
        const error = { success: false, message: 'CNPJ deve ter 14 dígitos', code: 'INVALID_CNPJ' };
        logActivity('ERROR', 'CNPJ inválido', { cnpj, cnpjLimpo });
        return res.status(400).json(error);
      }

      // 1. Consultar empresa no Oracle
      console.log(`🔍 Consultando empresa CNPJ: ${cnpjLimpo}`);
      const empresaResult = await Database.getWhatsAppGroupByCNPJ(cnpjLimpo);

      if (!empresaResult.success) {
        const error = { success: false, message: empresaResult.message, code: 'COMPANY_NOT_FOUND' };
        logActivity('ERROR', 'Empresa não encontrada', { cnpj: cnpjLimpo, error: empresaResult.message });
        return res.status(404).json(error);
      }

      const empresa = empresaResult.data;

      // 2. Verificar se arquivo de relatório existe
      console.log(`📄 Verificando arquivo de relatório para CNPJ: ${cnpjLimpo}`);
      const fileResult = await FileService.checkReportExists(cnpjLimpo);

      if (!fileResult.success) {
        const error = {
          success: false,
          message: fileResult.message,
          code: 'REPORT_FILE_NOT_FOUND',
          expectedPath: fileResult.path
        };
        logActivity('ERROR', 'Arquivo de relatório não encontrado', {
          cnpj: cnpjLimpo,
          empresa: empresa.razaoSocial,
          path: fileResult.path
        });
        return res.status(404).json(error);
      }

      // 3. Verificar conexão WhatsApp
      if (!WhatsAppService.isReady) {
        const error = { success: false, message: 'WhatsApp não está conectado', code: 'WHATSAPP_DISCONNECTED' };
        logActivity('ERROR', 'WhatsApp não conectado', { cnpj: cnpjLimpo });
        return res.status(503).json(error);
      }

      // 4. Enviar imagem para o grupo (sem legenda)
      console.log(`📱 Enviando relatório para grupo: ${empresa.numeroGrupo}`);

      const whatsappResult = await WhatsAppService.sendImageToGroup(
        empresa.numeroGrupo,
        fileResult.path,
        '' // Sem legenda - apenas a imagem
      );

      if (!whatsappResult.success) {
        const error = {
          success: false,
          message: `Erro ao enviar WhatsApp: ${whatsappResult.error}`,
          code: 'WHATSAPP_SEND_ERROR'
        };
        logActivity('ERROR', 'Erro no envio WhatsApp', {
          cnpj: cnpjLimpo,
          empresa: empresa.razaoSocial,
          grupo: empresa.numeroGrupo,
          error: whatsappResult.error
        });
        return res.status(500).json(error);
      }

      // 5. Resposta de sucesso
      const duration = Date.now() - startTime;
      const response = {
        success: true,
        status: 'enviado',
        data: {
          cnpj: cnpjLimpo,
          empresa: empresa.razaoSocial,
          grupo: empresa.numeroGrupo,
          messageId: whatsappResult.messageId,
          timestamp: whatsappResult.timestamp,
          arquivo: {
            path: fileResult.path,
            size: fileResult.size,
            lastModified: fileResult.lastModified
          }
        },
        meta: {
          duration: `${duration}ms`,
          processedAt: new Date().toISOString()
        }
      };

      logActivity('SUCCESS', 'Relatório enviado com sucesso', {
        cnpj: cnpjLimpo,
        empresa: empresa.razaoSocial,
        grupo: empresa.numeroGrupo,
        messageId: whatsappResult.messageId,
        duration
      });

      return res.status(200).json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Erro interno:', error.message);

      logActivity('ERROR', 'Erro interno no envio', {
        cnpj,
        error: error.message,
        stack: error.stack,
        duration
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Endpoint de teste: GET /api/teste-conexao
  static async testeConexao(req, res) {
    try {
      const tests = {
        database: await Database.testConnection(),
        whatsapp: await WhatsAppService.testConnection(),
        timestamp: new Date().toISOString()
      };

      const allOk = tests.database.success && tests.whatsapp.success;

      return res.status(allOk ? 200 : 503).json({
        success: allOk,
        message: allOk ? 'Todas as conexões OK' : 'Algumas conexões com problema',
        tests: tests
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao testar conexões',
        error: error.message
      });
    }
  }

  // Endpoint para listar grupos WhatsApp: GET /api/grupos
  static async listarGrupos(req, res) {
    try {
      if (!WhatsAppService.isReady) {
        return res.status(503).json({
          success: false,
          message: 'WhatsApp não está conectado'
        });
      }

      // Voltar para getAllGroups que funcionava
      const grupos = await WhatsAppService.client.getAllGroups();

      const gruposFormatados = grupos.map(grupo => {
        // Tratar diferentes formatos de ID
        const idString = grupo.id._serialized || grupo.id.toString() || String(grupo.id);

        return {
          id: idString,
          nome: grupo.name,
          participantes: grupo.participants ? grupo.participants.length : 0,
          isGroup: grupo.isGroup,
          // Extrair apenas o número do ID (antes do @g.us)
          numeroGrupo: idString.split('@')[0]
        };
      });

      return res.json({
        success: true,
        count: gruposFormatados.length,
        grupos: gruposFormatados
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack
      });
    }
  }

  // Endpoint para informações de empresa: GET /api/empresa/:cnpj
  static async getEmpresaInfo(req, res) {
    try {
      const { cnpj } = req.params;
      const cnpjLimpo = cnpj.replace(/\D/g, '');

      if (cnpjLimpo.length !== 14) {
        return res.status(400).json({
          success: false,
          message: 'CNPJ deve ter 14 dígitos'
        });
      }

      const empresaResult = await Database.getWhatsAppGroupByCNPJ(cnpjLimpo);
      const fileResult = await FileService.getReportInfo(cnpjLimpo);

      return res.json({
        success: true,
        data: {
          empresa: empresaResult.success ? empresaResult.data : null,
          arquivo: fileResult.success ? fileResult.data : null,
          status: {
            empresaEncontrada: empresaResult.success,
            arquivoEncontrado: fileResult.success
          }
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ReportController;