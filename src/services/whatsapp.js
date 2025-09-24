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
        headless: process.env.WHATSAPP_HEADLESS === 'true',
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
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

  static async sendImageToGroup(groupNumber, imagePath, caption = '') {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp não está conectado. Execute a inicialização primeiro.');
      }

      // Verificar se arquivo existe
      if (!(await fs.pathExists(imagePath))) {
        throw new Error(`Arquivo de imagem não encontrado: ${imagePath}`);
      }

      // Formatar número do grupo
      const groupId = this.formatGroupId(groupNumber);

      // Verificar se o grupo existe
      const chats = await this.client.listChats();
      const groups = chats.filter(chat => chat.isGroup);
      const targetGroup = groups.find(group => (group.id._serialized || group.id) === groupId);

      if (!targetGroup) {
        throw new Error(`Grupo ${groupNumber} não encontrado. Verifique se o bot está no grupo.`);
      }

      // Enviar imagem
      const result = await this.client.sendFile(
        groupId,
        imagePath,
        path.basename(imagePath),
        caption
      );

      console.log('✅ Imagem enviada com sucesso para:', targetGroup.name);

      return {
        success: true,
        messageId: result.id,
        groupName: targetGroup.name,
        groupId: groupId,
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

  static formatGroupId(groupNumber) {
    // Remove caracteres especiais e formata como ID do grupo
    const cleanNumber = groupNumber.toString().replace(/\D/g, '');
    return `${cleanNumber}@g.us`;
  }

  static async getGroupInfo(groupNumber) {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp não está conectado');
      }

      const groupId = this.formatGroupId(groupNumber);
      const chats = await this.client.listChats();
      const groups = chats.filter(chat => chat.isGroup);
      const group = groups.find(g => (g.id._serialized || g.id) === groupId);

      if (!group) {
        return {
          success: false,
          message: `Grupo ${groupNumber} não encontrado`
        };
      }

      return {
        success: true,
        data: {
          id: group.id,
          name: group.name,
          participantsCount: group.participants ? group.participants.length : 0,
          isGroup: group.isGroup
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