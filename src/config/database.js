const oracledb = require('oracledb');
require('dotenv').config();

// Configurar para usar Thick Client (necessário para versões antigas do Oracle)
try {
  // Primeiro, tentar o caminho do .env se existir
  const oracleClientPath = process.env.ORACLE_CLIENT_PATH;

  if (oracleClientPath) {
    const fs = require('fs');
    if (fs.existsSync(oracleClientPath)) {
      console.log(`🔍 Tentando Oracle Client do .env: ${oracleClientPath}`);
      oracledb.initOracleClient({ libDir: oracleClientPath });
      console.log(`✅ Oracle Thick Client inicializado: ${oracleClientPath}`);
    } else {
      throw new Error(`Caminho do .env não existe: ${oracleClientPath}`);
    }
  } else {
    // Caminhos automáticos
    const possiblePaths = [
      'C:\\oracle\\instantclient_21_13',
      'C:\\oracle\\instantclient_21_11',
      'C:\\oracle\\instantclient_19_19',
      'C:\\oracle\\product\\19.0.0\\client_1\\bin',
      'C:\\oracle\\product\\18.0.0\\client_1\\bin',
      'C:\\oracle\\product\\12.2.0\\client_1\\bin',
      'C:\\oracle\\product\\11.2.0\\client_1\\bin',
      'C:\\app\\oracle\\product\\19.0.0\\client_1\\bin',
      'C:\\app\\oracle\\product\\18.0.0\\client_1\\bin'
    ];

    let oracleFound = false;
    const fs = require('fs');

    for (const libDir of possiblePaths) {
      try {
        if (fs.existsSync(libDir)) {
          console.log(`🔍 Tentando Oracle em: ${libDir}`);
          oracledb.initOracleClient({ libDir: libDir });
          console.log(`✅ Oracle Thick Client inicializado: ${libDir}`);
          oracleFound = true;
          break;
        }
      } catch (pathErr) {
        console.log(`❌ Erro em ${libDir}: ${pathErr.message}`);
        continue;
      }
    }

    // Se não encontrou, tentar PATH do sistema
    if (!oracleFound) {
      oracledb.initOracleClient();
      console.log('✅ Oracle Thick Client inicializado (PATH do sistema)');
    }
  }

} catch (err) {
  console.log('⚠️ Oracle Thick Client não disponível:', err.message);
  console.log('💡 Solução: Execute "node install-oracle-client.js" ou configure ORACLE_CLIENT_PATH no .env');
}

// Configuração do pool de conexões Oracle
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING,
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 300, // 5 minutos
  poolPingInterval: 60, // 1 minuto
  edition: 'ORA$BASE'
};

class Database {
  static pool = null;

  static async initialize() {
    try {
      this.pool = await oracledb.createPool(dbConfig);
      console.log('✅ Pool de conexões Oracle criado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar pool Oracle:', error.message);
      throw error;
    }
  }

  static async getConnection() {
    try {
      if (!this.pool) {
        await this.initialize();
      }
      return await this.pool.getConnection();
    } catch (error) {
      console.error('❌ Erro ao obter conexão:', error.message);
      throw error;
    }
  }

  static async close() {
    try {
      if (this.pool) {
        await this.pool.close(10);
        this.pool = null;
        console.log('✅ Pool Oracle fechado');
      }
    } catch (error) {
      console.error('❌ Erro ao fechar pool:', error.message);
    }
  }

  static async testConnection() {
    let connection;
    try {
      connection = await this.getConnection();
      const result = await connection.execute('SELECT 1 FROM DUAL');
      console.log('✅ Teste de conexão Oracle: OK');
      return { success: true, message: 'Conexão Oracle funcionando' };
    } catch (error) {
      console.error('❌ Teste de conexão Oracle falhou:', error.message);
      return { success: false, message: error.message };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Erro ao fechar conexão de teste:', err.message);
        }
      }
    }
  }

  // Consulta específica para buscar grupo WhatsApp por CNPJ
  static async getWhatsAppGroupByCNPJ(cnpj) {
    let connection;
    try {
      connection = await this.getConnection();

      const query = `
        SELECT NUMERO_WHATSAPP_GRUPO, XNOME_C03 as RAZAO_SOCIAL
        FROM D_EMPRESAS
        WHERE CNPJ_C02 = :cnpj
      `;

      const result = await connection.execute(
        query,
        { cnpj: cnpj },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: `Empresa com CNPJ ${cnpj} não encontrada`
        };
      }

      const empresa = result.rows[0];

      if (!empresa.NUMERO_WHATSAPP_GRUPO) {
        return {
          success: false,
          message: `Empresa ${empresa.RAZAO_SOCIAL} não possui grupo WhatsApp configurado`
        };
      }

      return {
        success: true,
        data: {
          cnpj: cnpj,
          razaoSocial: empresa.RAZAO_SOCIAL,
          numeroGrupo: empresa.NUMERO_WHATSAPP_GRUPO
        }
      };

    } catch (error) {
      console.error('❌ Erro na consulta Oracle:', error.message);
      return {
        success: false,
        message: `Erro na consulta: ${error.message}`
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Erro ao fechar conexão:', err.message);
        }
      }
    }
  }
}

// Configuração para encerrar pool no shutdown da aplicação
process.on('SIGINT', async () => {
  console.log('🔄 Encerrando aplicação...');
  await Database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Encerrando aplicação...');
  await Database.close();
  process.exit(0);
});

module.exports = Database;