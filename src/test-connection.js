const Database = require('./config/database');

async function testConnections() {
  console.log('🔍 Testando conexões...\n');

  try {
    // Teste conexão Oracle
    console.log('1. Testando conexão Oracle...');
    const dbTest = await Database.testConnection();

    if (dbTest.success) {
      console.log('✅ Oracle:', dbTest.message);

      // Teste consulta específica
      console.log('\n2. Testando consulta na tabela D_EMPRESAS...');
      const testCNPJ = '52183883000116'; // CNPJ real encontrado na tabela
      const empresaTest = await Database.getWhatsAppGroupByCNPJ(testCNPJ);

      if (empresaTest.success) {
        console.log('✅ Consulta D_EMPRESAS: OK');
        console.log('   Empresa:', empresaTest.data.razaoSocial);
        console.log('   Grupo WhatsApp:', empresaTest.data.numeroGrupo);
      } else {
        console.log('⚠️ Consulta D_EMPRESAS:', empresaTest.message);
      }
    } else {
      console.log('❌ Oracle:', dbTest.message);
    }

    console.log('\n✅ Teste de conexões concluído');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  } finally {
    await Database.close();
    process.exit(0);
  }
}

// Executar testes
testConnections();