const WhatsAppService = require('../services/whatsapp');
const { logActivity } = require('../utils/logger');

class ReportController {
  // NOVO Endpoint flexível: POST /api/enviar-imagem
  static async enviarImagem(req, res) {
    const startTime = Date.now();
    const { imagemBase64, numeroGrupo, mensagem } = req.body;

    // Log da requisição
    const temImagem = imagemBase64 && imagemBase64.trim() !== '';
    logActivity('INFO', 'Iniciando envio via WhatsApp', {
      numeroGrupo,
      temImagem,
      temMensagem: !!mensagem,
      tipoEnvio: temImagem ? 'imagem_com_texto' : 'apenas_texto',
      ip: req.ip
    });

    try {
      // Validações básicas
      if (!numeroGrupo) {
        const error = { success: false, message: 'Número do destinatário é obrigatório', code: 'MISSING_RECIPIENT' };
        logActivity('ERROR', 'Número do destinatário não fornecido', { ip: req.ip });
        return res.status(400).json(error);
      }

      // Limpar número (remover caracteres especiais)
      const numeroLimpo = numeroGrupo.toString().replace(/\D/g, '');

      if (!numeroLimpo) {
        const error = { success: false, message: 'Número do destinatário inválido', code: 'INVALID_RECIPIENT' };
        logActivity('ERROR', 'Número inválido', { numeroGrupo, numeroLimpo });
        return res.status(400).json(error);
      }

      // Se tem imagem, validar formato
      if (imagemBase64 && imagemBase64.trim() !== '') {
        const base64Regex = /^data:(image\/(jpeg|jpg|png|gif)|application\/pdf);base64,/;
        if (!base64Regex.test(imagemBase64)) {
          const error = {
            success: false,
            message: 'Formato de arquivo inválido. Use: data:image/jpeg;base64,... ou data:application/pdf;base64,...',
            code: 'INVALID_FILE_FORMAT'
          };
          logActivity('ERROR', 'Formato de arquivo inválido', { numeroLimpo });
          return res.status(400).json(error);
        }
      }

      // Se não tem imagem nem mensagem, retornar erro
      if ((!imagemBase64 || imagemBase64.trim() === '') && (!mensagem || mensagem.trim() === '')) {
        const error = { success: false, message: 'É obrigatório enviar uma imagem ou uma mensagem', code: 'MISSING_CONTENT' };
        logActivity('ERROR', 'Nem imagem nem mensagem fornecidas', { ip: req.ip });
        return res.status(400).json(error);
      }

      // Verificar conexão WhatsApp
      if (!WhatsAppService.isReady) {
        const error = { success: false, message: 'WhatsApp não está conectado', code: 'WHATSAPP_DISCONNECTED' };
        logActivity('ERROR', 'WhatsApp não conectado', { numeroLimpo });
        return res.status(503).json(error);
      }

      // Detectar se é grupo ou número individual automaticamente
      const isGroup = numeroLimpo.length > 15;
      const chatType = isGroup ? 'grupo' : 'contato';

      let whatsappResult;

      // Verificar se tem imagem para enviar
      if (imagemBase64 && imagemBase64.trim() !== '') {
        // Enviar imagem com mensagem
        console.log(`📱 Enviando imagem para ${chatType}: ${numeroLimpo}`);
        console.log(`💬 Mensagem: ${mensagem || 'Sem mensagem'}`);

        whatsappResult = await WhatsAppService.sendImageBase64ToGroup(
          numeroLimpo,
          imagemBase64,
          mensagem || ''
        );
      } else {
        // Enviar apenas mensagem de texto
        console.log(`📱 Enviando mensagem de texto para ${chatType}: ${numeroLimpo}`);
        console.log(`💬 Mensagem: ${mensagem}`);

        whatsappResult = await WhatsAppService.sendTextToGroup(
          numeroLimpo,
          mensagem
        );
      }

      if (!whatsappResult.success) {
        const error = {
          success: false,
          message: `Erro ao enviar WhatsApp: ${whatsappResult.error}`,
          code: 'WHATSAPP_SEND_ERROR'
        };
        logActivity('ERROR', 'Erro no envio WhatsApp', {
          destinatario: numeroLimpo,
          chatType: chatType,
          error: whatsappResult.error
        });
        return res.status(500).json(error);
      }

      // Resposta de sucesso
      const duration = Date.now() - startTime;
      const temImagem = imagemBase64 && imagemBase64.trim() !== '';

      const response = {
        success: true,
        status: 'enviado',
        data: {
          destinatario: numeroLimpo,
          chatType: chatType,
          isGroup: whatsappResult.isGroup,
          mensagem: mensagem || null,
          messageId: whatsappResult.messageId,
          timestamp: whatsappResult.timestamp,
          chatName: whatsappResult.chatName || null,
          tipoEnvio: temImagem ? 'imagem_com_texto' : 'apenas_texto'
        },
        meta: {
          duration: `${duration}ms`,
          processedAt: new Date().toISOString(),
          imagemTamanho: temImagem ? Math.round(imagemBase64.length / 1024) + 'KB' : null
        }
      };

      logActivity('SUCCESS', `${temImagem ? 'Imagem' : 'Mensagem'} enviada com sucesso`, {
        destinatario: numeroLimpo,
        chatType: chatType,
        messageId: whatsappResult.messageId,
        duration,
        tipoEnvio: response.data.tipoEnvio,
        imagemTamanho: response.meta.imagemTamanho
      });

      return res.status(200).json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Erro interno:', error.message);

      logActivity('ERROR', 'Erro interno no envio', {
        grupo: numeroGrupo,
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
        whatsapp: await WhatsAppService.testConnection(),
        timestamp: new Date().toISOString()
      };

      const allOk = tests.whatsapp.success;

      return res.status(allOk ? 200 : 503).json({
        success: allOk,
        message: allOk ? 'WhatsApp conectado' : 'WhatsApp desconectado',
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

  // Endpoint para informações de empresa: GET /api/empresa/:cnpj (DESABILITADO - usar nova API)
  static async getEmpresaInfo(req, res) {
    return res.status(410).json({
      success: false,
      message: 'Endpoint descontinuado. Use a nova API: POST /api/enviar-imagem',
      newEndpoint: 'POST /api/enviar-imagem',
      example: {
        imagemBase64: 'data:image/jpeg;base64,...',
        numeroGrupo: '120363142926103927',
        mensagem: 'Sua mensagem aqui'
      }
    });
  }
}

module.exports = ReportController;