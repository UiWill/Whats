const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class FileService {
  static getReportPath(cnpj) {
    const basePath = process.env.RELATORIOS_BASE_PATH || 'C:\\br.com.ControleVendaComercio';
    const filename = process.env.RELATORIO_FILENAME || 'RelatorioVendas.jpg';

    return path.join(basePath, `ERP_${cnpj}_VENDAS_COMERCIO`, filename);
  }

  static async checkReportExists(cnpj) {
    try {
      const reportPath = this.getReportPath(cnpj);
      const exists = await fs.pathExists(reportPath);

      if (!exists) {
        return {
          success: false,
          message: `Relatório não encontrado para CNPJ ${cnpj}`,
          path: reportPath
        };
      }

      // Verificar se é um arquivo válido e não está vazio
      const stats = await fs.stat(reportPath);

      if (stats.size === 0) {
        return {
          success: false,
          message: `Arquivo de relatório está vazio para CNPJ ${cnpj}`,
          path: reportPath
        };
      }

      return {
        success: true,
        path: reportPath,
        size: stats.size,
        lastModified: stats.mtime
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro ao verificar arquivo: ${error.message}`,
        path: this.getReportPath(cnpj)
      };
    }
  }

  static async getReportInfo(cnpj) {
    try {
      const reportPath = this.getReportPath(cnpj);

      if (!(await fs.pathExists(reportPath))) {
        return {
          success: false,
          message: `Relatório não encontrado`,
          expectedPath: reportPath
        };
      }

      const stats = await fs.stat(reportPath);

      return {
        success: true,
        data: {
          cnpj: cnpj,
          path: reportPath,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          lastModified: stats.mtime,
          lastModifiedFormatted: stats.mtime.toLocaleString('pt-BR'),
          extension: path.extname(reportPath),
          filename: path.basename(reportPath)
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Método para listar todos os relatórios disponíveis (útil para debug)
  static async listAllReports() {
    try {
      const basePath = process.env.RELATORIOS_BASE_PATH || 'C:\\br.com.ControleVendaComercio';

      if (!(await fs.pathExists(basePath))) {
        return {
          success: false,
          message: `Diretório base não existe: ${basePath}`
        };
      }

      const items = await fs.readdir(basePath);
      const reports = [];

      for (const item of items) {
        const itemPath = path.join(basePath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory() && item.startsWith('ERP_') && item.includes('_VENDAS_COMERCIO')) {
          const cnpjMatch = item.match(/ERP_(\d+)_VENDAS_COMERCIO/);
          if (cnpjMatch) {
            const cnpj = cnpjMatch[1];
            const reportPath = path.join(itemPath, process.env.RELATORIO_FILENAME || 'RelatorioVendas.jpg');

            if (await fs.pathExists(reportPath)) {
              const reportStats = await fs.stat(reportPath);
              reports.push({
                cnpj: cnpj,
                path: reportPath,
                size: reportStats.size,
                lastModified: reportStats.mtime
              });
            }
          }
        }
      }

      return {
        success: true,
        data: reports,
        count: reports.length
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Método para criar diretório de relatório se não existir (útil para testes)
  static async createReportDirectory(cnpj) {
    try {
      const basePath = process.env.RELATORIOS_BASE_PATH || 'C:\\br.com.ControleVendaComercio';
      const reportDir = path.join(basePath, `ERP_${cnpj}_VENDAS_COMERCIO`);

      await fs.ensureDir(reportDir);

      return {
        success: true,
        path: reportDir,
        message: `Diretório criado: ${reportDir}`
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = FileService;