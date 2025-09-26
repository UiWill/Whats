const wppconnect = require('@wppconnect-team/wppconnect');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class WhatsAppService {
  static client = null;
  static isReady = false;

  static async initialize() {
    try {
      console.log('🔄 Inicializando WhatsApp...');

      this.client = await wppconnect.create({
        session: process.env.WHATSAPP_SESSION_NAME || 'erp-session',
        catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
          console.log('📱 QR Code recebido. Escaneie com seu WhatsApp:');
          console.log(asciiQR);
        },
        statusFind: (statusSession, session) => {
          console.log('📊 Status da sessão:', statusSession, session);
        },
        headless: 'new',
        devtools: false,
        useChrome: false,
        debug: false,
        logQR: true,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.isReady = true;
      console.log('✅ WhatsApp conectado com sucesso!');

      // Configurar eventos
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar WhatsApp:', error.message);
      this.isReady = false;
      throw error;
    }
  }

  static setupEventListeners() {
    if (!this.client) return;

    // Evento de desconexão
    this.client.onStateChange((state) => {
      console.log('📊 Estado WhatsApp mudou:', state);
      this.isReady = state === 'CONNECTED';
    });

    // Evento de mensagem recebida (opcional, para logs)
    this.client.onMessage((message) => {
      if (message.body === '!status' && message.isGroupMsg) {
        this.client.sendText(message.chatId, '✅ Bot ERP está online!');
      }
    });
  }

  static async sendImageBase64ToGroup(chatNumber, imageBase64, caption = '') {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp não está conectado. Execute a inicialização primeiro.');
      }

      // Formatar número (grupo ou individual)
      const chatId = this.formatChatId(chatNumber);
      const isGroup = chatId.includes('@g.us');

      // Verificar se o chat existe
      const chats = await this.client.listChats();
      let targetChat = chats.find(chat => (chat.id._serialized || chat.id) === chatId);

      // Se é um contato individual e não existe, tentar criar a conversa primeiro
      if (!targetChat && !isGroup) {
        console.log(`📞 Contato ${chatNumber} não encontrado na lista. Criando conversa...`);

        try {
          // 1. Enviar uma mensagem de texto primeiro para inicializar a conversa
          console.log(`💬 Enviando mensagem inicial para criar conversa...`);
          await this.client.sendText(chatId, '👋');

          // 2. Aguardar um pouco para a conversa ser criada
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 3. Buscar novamente o chat
          const updatedChats = await this.client.listChats();
          targetChat = updatedChats.find(chat => (chat.id._serialized || chat.id) === chatId);

          if (targetChat) {
            console.log(`✅ Conversa criada com sucesso para ${chatNumber}`);
          } else {
            // Se ainda não encontrou, criar um objeto temporário
            console.log(`⚠️ Conversa não encontrada após criação. Tentando envio direto...`);
            targetChat = {
              id: { _serialized: chatId },
              name: chatNumber,
              isGroup: false
            };
          }

        } catch (initError) {
          console.log(`⚠️ Erro ao inicializar conversa: ${initError.message}. Tentando envio direto...`);
          // Se der erro na inicialização, criar objeto temporário mesmo assim
          targetChat = {
            id: { _serialized: chatId },
            name: chatNumber,
            isGroup: false
          };
        }
      }

      if (!targetChat) {
        const chatType = isGroup ? 'grupo' : 'contato';
        throw new Error(`${chatType.charAt(0).toUpperCase() + chatType.slice(1)} ${chatNumber} não encontrado. Verifique se o bot tem acesso.`);
      }

      // Detectar tipo de arquivo e definir nome/extensão
      const isPDF = imageBase64.startsWith('data:application/pdf;base64,');
      const fileName = isPDF ? 'documento.pdf' : 'imagem.jpg';
      const fileType = isPDF ? 'documento' : 'imagem';

      // Enviar arquivo base64 (imagem ou PDF)
      const result = await this.client.sendFileFromBase64(
        chatId,
        imageBase64,
        fileName,
        caption
      );

      const chatType = isGroup ? 'grupo' : 'contato';
      console.log(`✅ ${fileType.charAt(0).toUpperCase() + fileType.slice(1)} base64 enviado com sucesso para ${chatType}:`, targetChat.name || chatNumber);

      return {
        success: true,
        messageId: result.id,
        chatName: targetChat.name || chatNumber,
        chatId: chatId,
        isGroup: isGroup,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar arquivo base64:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async sendImageToGroup(chatNumber, imagePath, caption = '') {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp não está conectado. Execute a inicialização primeiro.');
      }

      // Verificar se arquivo existe
      if (!(await fs.pathExists(imagePath))) {
        throw new Error(`Arquivo de imagem não encontrado: ${imagePath}`);
      }

      // Formatar número (grupo ou individual)
      const chatId = this.formatChatId(chatNumber);
      const isGroup = chatId.includes('@g.us');

      // Verificar se o chat existe
      const chats = await this.client.listChats();
      const targetChat = chats.find(chat => (chat.id._serialized || chat.id) === chatId);

      if (!targetChat) {
        const chatType = isGroup ? 'grupo' : 'contato';
        throw new Error(`${chatType.charAt(0).toUpperCase() + chatType.slice(1)} ${chatNumber} não encontrado. Verifique se o bot tem acesso.`);
      }

      // Enviar imagem
      const result = await this.client.sendFile(
        chatId,
        imagePath,
        path.basename(imagePath),
        caption
      );

      const chatType = isGroup ? 'grupo' : 'contato';
      console.log(`✅ Imagem enviada com sucesso para ${chatType}:`, targetChat.name || chatNumber);

      return {
        success: true,
        messageId: result.id,
        chatName: targetChat.name || chatNumber,
        chatId: chatId,
        isGroup: isGroup,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static formatChatId(number) {
    // Remove caracteres especiais
    let cleanNumber = number.toString().replace(/\D/g, '');

    // Detectar se é grupo ou número individual
    // Grupos geralmente têm mais de 15 dígitos (formato: 120363142926103927)
    if (cleanNumber.length > 15) {
      // É um grupo
      return `${cleanNumber}@g.us`;
    } else {
      // É um número individual - verificar formato correto

      // Se tem 10 dígitos (ex: 3791470016) = DD + 8 dígitos, adicionar 55
      if (cleanNumber.length === 10) {
        cleanNumber = '55' + cleanNumber;
        console.log(`📞 Adicionado código do Brasil (+55): ${cleanNumber}`);
      }
      // Se tem menos que 10 dígitos, retornar erro
      else if (cleanNumber.length < 10) {
        throw new Error(`Número inválido: ${number}. Use o formato DDNNNNNNNN (ex: 3791470016)`);
      }
      // Se já tem 12 dígitos (55 + DD + 8), está correto
      else if (cleanNumber.length === 12) {
        console.log(`📞 Número já formatado corretamente: ${cleanNumber}`);
      }
      // Se tem formato inválido
      else {
        throw new Error(`Número inválido: ${number}. Use o formato DDNNNNNNNN (ex: 3791470016)`);
      }

      return `${cleanNumber}@c.us`;
    }
  }

  static async getChatInfo(chatNumber) {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp não está conectado');
      }

      const chatId = this.formatChatId(chatNumber);
      const isGroup = chatId.includes('@g.us');
      const chats = await this.client.listChats();
      const chat = chats.find(c => (c.id._serialized || c.id) === chatId);

      if (!chat) {
        const chatType = isGroup ? 'grupo' : 'contato';
        return {
          success: false,
          message: `${chatType.charAt(0).toUpperCase() + chatType.slice(1)} ${chatNumber} não encontrado`
        };
      }

      return {
        success: true,
        data: {
          id: chat.id,
          name: chat.name || chatNumber,
          participantsCount: chat.participants ? chat.participants.length : (isGroup ? 0 : 1),
          isGroup: chat.isGroup || isGroup,
          chatType: isGroup ? 'grupo' : 'individual'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async testConnection() {
    try {
      if (!this.client) {
        return {
          success: false,
          message: 'Cliente WhatsApp não inicializado'
        };
      }

      if (!this.isReady) {
        return {
          success: false,
          message: 'WhatsApp não está conectado'
        };
      }

      // Tentar obter informações da conta
      const hostDevice = await this.client.getHostDevice();

      return {
        success: true,
        message: 'WhatsApp conectado',
        data: {
          device: hostDevice,
          ready: this.isReady
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  static async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.isReady = false;
        console.log('✅ WhatsApp desconectado');
      }
    } catch (error) {
      console.error('❌ Erro ao fechar WhatsApp:', error.message);
    }
  }
}

module.exports = WhatsAppService;