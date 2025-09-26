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

      // Se é um contato individual e não existe, tentar criar/verificar se o número é válido
      if (!targetChat && !isGroup) {
        try {
          // Verificar se o número existe no WhatsApp
          const numberCheck = await this.client.checkNumberStatus(chatId);

          if (!numberCheck.exists) {
            throw new Error(`Número ${chatNumber} não está registrado no WhatsApp`);
          }

          console.log(`📞 Número ${chatNumber} validado, criando conversa...`);

          // Criar/inicializar chat enviando uma mensagem simples primeiro
          await this.client.sendText(chatId, ' '); // Mensagem vazia para inicializar

          // Aguardar um momento para o chat ser criado
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Buscar novamente o chat
          const updatedChats = await this.client.listChats();
          targetChat = updatedChats.find(chat => (chat.id._serialized || chat.id) === chatId);

        } catch (error) {
          throw new Error(`Erro ao validar número ${chatNumber}: ${error.message}`);
        }
      }

      if (!targetChat) {
        const chatType = isGroup ? 'grupo' : 'contato';
        throw new Error(`${chatType.charAt(0).toUpperCase() + chatType.slice(1)} ${chatNumber} não encontrado. Verifique se o bot tem acesso.`);
      }

      // Enviar imagem base64
      const result = await this.client.sendFileFromBase64(
        chatId,
        imageBase64,
        'imagem.jpg', // nome do arquivo
        caption
      );

      const chatType = isGroup ? 'grupo' : 'contato';
      console.log(`✅ Imagem base64 enviada com sucesso para ${chatType}:`, targetChat.name || chatNumber);

      return {
        success: true,
        messageId: result.id,
        chatName: targetChat.name || chatNumber,
        chatId: chatId,
        isGroup: isGroup,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar imagem base64:', error.message);
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
    const cleanNumber = number.toString().replace(/\D/g, '');

    // Detectar se é grupo ou número individual
    // Grupos geralmente têm mais de 11 dígitos (formato: 120363142926103927)
    // Números individuais têm entre 10-14 dígitos (formato brasileiro: 5537991470016)
    if (cleanNumber.length > 15) {
      // É um grupo
      return `${cleanNumber}@g.us`;
    } else {
      // É um número individual
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