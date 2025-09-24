const fs = require('fs-extra');
const path = require('path');

class Logger {
  static logDir = path.join(__dirname, '../../logs');

  static async ensureLogDir() {
    await fs.ensureDir(this.logDir);
  }

  static getLogFileName(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return `erp-whatsapp-${dateStr}.log`;
  }

  static formatLogEntry(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    return JSON.stringify(logEntry) + '\\n';
  }

  static async writeLog(level, message, data = {}) {
    try {
      await this.ensureLogDir();
      const logFile = path.join(this.logDir, this.getLogFileName());
      const logEntry = this.formatLogEntry(level, message, data);

      await fs.appendFile(logFile, logEntry);

      // Console output também
      const consoleMessage = `[${new Date().toISOString()}] ${level}: ${message}`;
      console.log(consoleMessage, data && Object.keys(data).length > 0 ? data : '');

    } catch (error) {
      console.error('Erro ao escrever log:', error.message);
    }
  }

  static async info(message, data = {}) {
    await this.writeLog('INFO', message, data);
  }

  static async error(message, data = {}) {
    await this.writeLog('ERROR', message, data);
  }

  static async warn(message, data = {}) {
    await this.writeLog('WARN', message, data);
  }

  static async success(message, data = {}) {
    await this.writeLog('SUCCESS', message, data);
  }

  // Método para atividades específicas do sistema
  static async activity(level, message, data = {}) {
    await this.writeLog(level, message, data);
  }

  // Limpeza de logs antigos (manter últimos 30 dias)
  static async cleanOldLogs(daysToKeep = 30) {
    try {
      await this.ensureLogDir();
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        if (file.startsWith('erp-whatsapp-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            console.log(`Log antigo removido: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro na limpeza de logs:', error.message);
    }
  }

  // Método para obter logs recentes
  static async getRecentLogs(hours = 24) {
    try {
      await this.ensureLogDir();
      const files = await fs.readdir(this.logDir);
      const logs = [];
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('erp-whatsapp-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line);
              const logTime = new Date(logEntry.timestamp);

              if (logTime >= cutoffTime) {
                logs.push(logEntry);
              }
            } catch (e) {
              // Ignora linhas inválidas
            }
          }
        }
      }

      // Ordenar por timestamp
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return logs;
    } catch (error) {
      console.error('Erro ao obter logs:', error.message);
      return [];
    }
  }
}

// Função auxiliar para uso direto
function logActivity(level, message, data = {}) {
  return Logger.activity(level, message, data);
}

module.exports = { Logger, logActivity };