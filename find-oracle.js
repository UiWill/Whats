const fs = require('fs');
const path = require('path');

console.log('🔍 Procurando instalação Oracle...\n');

// Caminhos possíveis onde o Oracle pode estar
const possiblePaths = [
  'C:\\oracle',
  'C:\\app\\oracle',
  'C:\\Program Files\\Oracle',
  'C:\\oraclexe',
  'C:\\instantclient',
  'C:\\oracle\\instantclient',
  'C:\\sqldeveloper',
  process.env.ORACLE_HOME,
  process.env.ORACLE_BASE
].filter(Boolean);

// Adicionar caminhos do PATH que contenham 'oracle'
if (process.env.PATH) {
  const pathEntries = process.env.PATH.split(';');
  pathEntries.forEach(pathEntry => {
    if (pathEntry.toLowerCase().includes('oracle')) {
      possiblePaths.push(pathEntry);
    }
  });
}

console.log('📂 Caminhos sendo verificados:');
possiblePaths.forEach(p => console.log(`   ${p}`));
console.log('');

async function searchForOracleFiles(startPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];

  const results = [];

  try {
    if (!fs.existsSync(startPath)) return results;

    const items = fs.readdirSync(startPath);

    for (const item of items) {
      const fullPath = path.join(startPath, item);

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          // Procurar por arquivos importantes do Oracle
          if (item.toLowerCase() === 'oci.dll' ||
              item.toLowerCase() === 'sqlplus.exe' ||
              item.toLowerCase() === 'oracledb.dll') {
            results.push({
              file: item,
              path: fullPath,
              dir: path.dirname(fullPath)
            });
          }
        } else if (stat.isDirectory() && currentDepth < maxDepth) {
          // Buscar recursivamente
          const subResults = await searchForOracleFiles(fullPath, maxDepth, currentDepth + 1);
          results.push(...subResults);
        }
      } catch (err) {
        // Ignorar erros de acesso
      }
    }
  } catch (err) {
    // Ignorar erros de acesso
  }

  return results;
}

async function findOracle() {
  let allResults = [];

  for (const basePath of possiblePaths) {
    console.log(`🔍 Procurando em: ${basePath}`);

    try {
      const results = await searchForOracleFiles(basePath);
      allResults.push(...results);

      if (results.length > 0) {
        console.log(`   ✅ Encontrado ${results.length} arquivo(s)`);
        results.forEach(r => console.log(`      ${r.file} → ${r.path}`));
      } else {
        console.log(`   ❌ Nada encontrado`);
      }
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }

    console.log('');
  }

  // Resumo
  console.log('📋 RESUMO:');
  console.log('==========================================');

  if (allResults.length === 0) {
    console.log('❌ Nenhuma biblioteca Oracle encontrada');
    console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Instalar Oracle Instant Client');
    console.log('2. Verificar se SQL Developer tem bibliotecas client');
    console.log('3. Instalar Oracle Database Client completo');
  } else {
    // Agrupar por diretório
    const dirs = {};
    allResults.forEach(r => {
      if (!dirs[r.dir]) dirs[r.dir] = [];
      dirs[r.dir].push(r.file);
    });

    console.log('✅ Bibliotecas Oracle encontradas:');
    Object.entries(dirs).forEach(([dir, files]) => {
      console.log(`\n📁 ${dir}`);
      files.forEach(file => console.log(`   └── ${file}`));
    });

    // Recomendar o melhor diretório
    const bestDir = Object.keys(dirs).find(dir =>
      dirs[dir].includes('oci.dll') &&
      (dirs[dir].includes('sqlplus.exe') || dirs[dir].includes('oracledb.dll'))
    ) || Object.keys(dirs)[0];

    if (bestDir) {
      console.log(`\n🎯 RECOMENDADO:`);
      console.log(`   Use este diretório: ${bestDir}`);
      console.log(`\n📝 Adicione esta linha no seu .env:`);
      console.log(`   ORACLE_CLIENT_PATH=${bestDir}`);
    }
  }

  console.log('\n🔗 Variáveis de ambiente atuais:');
  console.log(`   ORACLE_HOME: ${process.env.ORACLE_HOME || 'não definida'}`);
  console.log(`   ORACLE_BASE: ${process.env.ORACLE_BASE || 'não definida'}`);

  const pathOracle = process.env.PATH.split(';').filter(p => p.toLowerCase().includes('oracle'));
  if (pathOracle.length > 0) {
    console.log(`   PATH (Oracle): ${pathOracle.join('; ')}`);
  } else {
    console.log(`   PATH: nenhum caminho Oracle encontrado`);
  }
}

findOracle().catch(console.error);