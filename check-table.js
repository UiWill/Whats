const Database = require('./src/config/database');

async function checkTable() {
  let connection;
  try {
    console.log('🔍 Verificando estrutura da tabela D_EMPRESAS...\n');

    connection = await Database.getConnection();

    // 1. Verificar se a tabela existe
    const tableCheck = await connection.execute(`
      SELECT COUNT(*) as COUNT_TABLE
      FROM USER_TABLES
      WHERE TABLE_NAME = 'D_EMPRESAS'
    `);

    console.log('📋 Tabela D_EMPRESAS existe:', tableCheck.rows[0][0] > 0 ? 'SIM' : 'NÃO');

    if (tableCheck.rows[0][0] === 0) {
      // Procurar tabelas similares
      const similarTables = await connection.execute(`
        SELECT TABLE_NAME
        FROM USER_TABLES
        WHERE TABLE_NAME LIKE '%EMPRESA%'
        OR TABLE_NAME LIKE '%CLIENT%'
        ORDER BY TABLE_NAME
      `);

      console.log('\\n📋 Tabelas similares encontradas:');
      similarTables.rows.forEach(row => {
        console.log(`   - ${row[0]}`);
      });
      return;
    }

    // 2. Verificar colunas da tabela
    console.log('\\n📋 Colunas da tabela D_EMPRESAS:');
    const columns = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'D_EMPRESAS'
      ORDER BY COLUMN_ID
    `);

    columns.rows.forEach(row => {
      console.log(`   - ${row[0].padEnd(25)} (${row[1]}${row[2] ? `(${row[2]})` : ''}) ${row[3] === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });

    // 3. Procurar por colunas com CNPJ
    console.log('\\n🔍 Colunas relacionadas a CNPJ:');
    const cnpjColumns = columns.rows.filter(row =>
      row[0].includes('CNPJ') || row[0].includes('CPF') || row[0].includes('DOCUMENT')
    );

    if (cnpjColumns.length > 0) {
      cnpjColumns.forEach(row => {
        console.log(`   ✅ ${row[0]} (${row[1]})`);
      });
    } else {
      console.log('   ❌ Nenhuma coluna com CNPJ encontrada');
    }

    // 4. Procurar por colunas com WhatsApp
    console.log('\\n📱 Colunas relacionadas a WhatsApp:');
    const whatsappColumns = columns.rows.filter(row =>
      row[0].includes('WHATSAPP') || row[0].includes('TELEFONE') || row[0].includes('PHONE') || row[0].includes('GRUPO')
    );

    if (whatsappColumns.length > 0) {
      whatsappColumns.forEach(row => {
        console.log(`   ✅ ${row[0]} (${row[1]})`);
      });
    } else {
      console.log('   ❌ Nenhuma coluna com WhatsApp encontrada');
    }

    // 5. Mostrar alguns registros de exemplo
    console.log('\\n📊 Exemplo de registros (primeiros 3):');
    const sample = await connection.execute(`
      SELECT * FROM (
        SELECT * FROM D_EMPRESAS ORDER BY ROWNUM
      ) WHERE ROWNUM <= 3
    `);

    if (sample.rows.length > 0) {
      // Cabeçalhos
      const headers = sample.metaData.map(col => col.name);
      console.log('   Colunas:', headers.join(' | '));
      console.log('   ' + '-'.repeat(80));

      // Dados
      sample.rows.forEach((row, index) => {
        console.log(`   [${index + 1}]`, row.map(val =>
          val === null ? 'NULL' :
          typeof val === 'string' ? val.substring(0, 20) :
          val.toString()
        ).join(' | '));
      });
    } else {
      console.log('   ❌ Nenhum registro encontrado na tabela');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erro ao fechar conexão:', err.message);
      }
    }
    await Database.close();
  }
}

checkTable();