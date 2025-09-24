const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Instalador Oracle Instant Client\n');

const ORACLE_DIR = 'C:\\oracle\\instantclient_21_13';
const DOWNLOAD_URL = 'https://download.oracle.com/otn_software/nt/instantclient/2113000/instantclient-basic-windows.x64-21.13.0.0.0dbru.zip';

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log('📥 Baixando Oracle Instant Client...');
    console.log(`    URL: ${url}`);
    console.log(`    Destino: ${dest}\n`);

    const file = fs.createWriteStream(dest);

    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Redirect
        console.log('🔄 Redirecionamento detectado...');
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Status ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      let lastPercent = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = Math.floor((downloadedSize / totalSize) * 100);

        if (percent !== lastPercent && percent % 10 === 0) {
          console.log(`📊 Progresso: ${percent}% (${Math.floor(downloadedSize/1024/1024)}MB/${Math.floor(totalSize/1024/1024)}MB)`);
          lastPercent = percent;
        }
      });

      response.pipe(file);
    });

    file.on('finish', () => {
      file.close();
      console.log('✅ Download concluído!\n');
      resolve();
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => {}); // Remove arquivo parcial
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(dest, () => {}); // Remove arquivo parcial
      reject(err);
    });
  });
}

async function extractZip(zipPath, extractTo) {
  console.log('📂 Extraindo arquivo...');

  try {
    // Tentar usar PowerShell para extrair
    const command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractTo}' -Force"`;
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Extração concluída!\n');

    // Remover arquivo ZIP
    fs.unlinkSync(zipPath);
    console.log('🗑️ Arquivo ZIP removido\n');

  } catch (error) {
    console.log('❌ Erro na extração com PowerShell, tentando método alternativo...');

    // Método alternativo usando 7zip se disponível
    try {
      execSync(`7z x "${zipPath}" -o"${extractTo}" -y`, { stdio: 'inherit' });
      console.log('✅ Extração concluída com 7zip!\n');
      fs.unlinkSync(zipPath);
    } catch (err) {
      throw new Error('Não foi possível extrair o arquivo. Instale 7-Zip ou extraia manualmente.');
    }
  }
}

async function addToPath(newPath) {
  console.log('🔧 Adicionando ao PATH...');

  try {
    const command = `powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';${newPath}', 'Machine')"`;
    execSync(command, { stdio: 'inherit' });
    console.log('✅ PATH atualizado!\n');

    // Atualizar PATH da sessão atual
    process.env.PATH += `;${newPath}`;

  } catch (error) {
    console.log('⚠️ Não foi possível atualizar PATH automaticamente.');
    console.log('💡 Adicione manualmente ao PATH:');
    console.log(`   ${newPath}\n`);
  }
}

async function installOracleClient() {
  try {
    // 1. Criar diretório
    console.log('📁 Criando diretório...');
    if (!fs.existsSync(path.dirname(ORACLE_DIR))) {
      fs.mkdirSync(path.dirname(ORACLE_DIR), { recursive: true });
    }

    // 2. Verificar se já existe
    if (fs.existsSync(ORACLE_DIR)) {
      console.log('⚠️ Oracle Instant Client já existe em:');
      console.log(`   ${ORACLE_DIR}`);
      console.log('🔄 Removendo versão anterior...\n');

      execSync(`rmdir /s /q "${ORACLE_DIR}"`, { stdio: 'inherit' });
    }

    // 3. Download
    const zipPath = path.join(__dirname, 'instantclient-basic.zip');

    // Usar URL alternativa mais confiável
    const downloadUrl = 'https://download.oracle.com/otn_software/nt/instantclient/2113000/instantclient-basic-windows.x64-21.13.0.0.0dbru.zip';

    await downloadFile(downloadUrl, zipPath);

    // 4. Extrair
    await extractZip(zipPath, 'C:\\oracle');

    // 5. Verificar extração
    const extractedPath = path.join('C:\\oracle', 'instantclient_21_13');
    if (!fs.existsSync(extractedPath)) {
      // Pode ter extraído com nome diferente
      const oracleBase = 'C:\\oracle';
      const items = fs.readdirSync(oracleBase);
      const instantClientDir = items.find(item => item.startsWith('instantclient'));

      if (instantClientDir) {
        const oldPath = path.join(oracleBase, instantClientDir);
        fs.renameSync(oldPath, extractedPath);
        console.log(`🔄 Renomeado: ${instantClientDir} → instantclient_21_13\n`);
      } else {
        throw new Error('Diretório instantclient não encontrado após extração');
      }
    }

    // 6. Adicionar ao PATH
    await addToPath(extractedPath);

    // 7. Atualizar configuração
    console.log('⚙️ Atualizando configuração da API...');
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('ORACLE_CLIENT_PATH=')) {
      envContent = envContent.replace(/ORACLE_CLIENT_PATH=.*/, `ORACLE_CLIENT_PATH=${extractedPath}`);
    } else {
      envContent += `\n# Oracle Client Path\nORACLE_CLIENT_PATH=${extractedPath}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env atualizado\n');

    // 8. Verificar instalação
    console.log('🔍 Verificando instalação...');
    const requiredFiles = ['oci.dll', 'oraclient21.dll'];
    let allFound = true;

    requiredFiles.forEach(file => {
      const filePath = path.join(extractedPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} não encontrado`);
        allFound = false;
      }
    });

    if (allFound) {
      console.log('\n🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('📁 Oracle Instant Client instalado em:');
      console.log(`   ${extractedPath}`);
      console.log('\n🚀 Próximos passos:');
      console.log('1. Feche e reabra o terminal');
      console.log('2. Execute: npm run teste-conexao');
      console.log('3. Se funcionar, execute: npm run dev');
      console.log('\n💡 Se ainda der erro, reinicie o Windows');
    } else {
      throw new Error('Alguns arquivos necessários não foram encontrados');
    }

  } catch (error) {
    console.error('❌ Erro na instalação:', error.message);
    console.log('\n🔗 INSTALAÇÃO MANUAL:');
    console.log('1. Acesse: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html');
    console.log('2. Baixe: Basic Package (ZIP)');
    console.log('3. Extraia em: C:\\oracle\\instantclient_21_13');
    console.log('4. Adicione ao PATH: C:\\oracle\\instantclient_21_13');
  }
}

// Executar instalação
console.log('🚀 Iniciando instalação...\n');
installOracleClient();