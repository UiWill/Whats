# API ERP-WhatsApp

API Node.js para integração entre sistemas ERP e WhatsApp Business, permitindo envio automático de relatórios de vendas para grupos do WhatsApp.

## 🚀 Funcionalidades

- ✅ Integração com banco de dados Oracle
- ✅ Envio automático de imagens para grupos WhatsApp
- ✅ API REST para integração com sistemas ERP
- ✅ Logs detalhados de todas as operações
- ✅ Tratamento robusto de erros
- ✅ Suporte a múltiplas empresas/grupos

## 📋 Pré-requisitos

- Node.js 16+
- Oracle Instant Client
- WhatsApp Business ou WhatsApp normal
- Banco de dados Oracle

## 🔧 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/UiWill/Whats.git
cd Whats
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Instale o Oracle Instant Client:**
- Baixe em: https://www.oracle.com/database/technologies/instant-client/
- Extraia em: `C:\oracle\instantclient_21_13`
- Adicione ao PATH do sistema

## ⚙️ Configuração

### Arquivo .env

```env
# Servidor
PORT=3000
NODE_ENV=development

# Oracle Database
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=seu_host
DB_PORT=1521
DB_SID=xe
ORACLE_CLIENT_PATH=C:\oracle\instantclient_21_13

# WhatsApp
WHATSAPP_SESSION_NAME=erp-session

# Paths
RELATORIOS_BASE_PATH=C:\\br.com.ControleVendaComercio
RELATORIO_FILENAME=RelatorioVendas.jpg
```

### Estrutura do Banco Oracle

```sql
-- Tabela principal
CREATE TABLE D_EMPRESAS (
    CNPJ_C02 VARCHAR2(14),
    XNOME_C03 VARCHAR2(100),
    NUMERO_WHATSAPP_GRUPO VARCHAR2(100)
);

-- Exemplo de dados
INSERT INTO D_EMPRESAS VALUES (
    '11111111111111',
    'EMPRESA TESTE LTDA',
    '120363142926103927'
);
```

### Estrutura de Arquivos

```
C:\br.com.ControleVendaComercio\
└── ERP_{CNPJ}_VENDAS_COMERCIO\
    └── RelatorioVendas.jpg
```

## 🚀 Uso

### 1. Iniciar o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testar conexões
npm run teste-conexao
```

### 2. Conectar WhatsApp

Na primeira execução, será exibido um QR Code. Escaneie com seu WhatsApp Business.

### 3. Usar a API

**Enviar relatório:**
```bash
POST http://localhost:3000/api/enviar-relatorio
Content-Type: application/json

{
  "cnpj": "11111111111111"
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "cnpj": "11111111111111",
    "empresa": "EMPRESA TESTE LTDA",
    "grupo": "120363142926103927",
    "messageId": "...",
    "timestamp": "2025-09-24T23:11:53.542Z"
  }
}
```

## 📚 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/enviar-relatorio` | Envia relatório para WhatsApp |
| GET | `/api/teste-conexao` | Testa conexões Oracle e WhatsApp |
| GET | `/api/grupos` | Lista grupos WhatsApp disponíveis |
| GET | `/api/empresa/:cnpj` | Informações de uma empresa |
| GET | `/api/status` | Status geral do sistema |
| GET | `/health` | Health check |

## 🏗️ Arquitetura

```
src/
├── config/
│   └── database.js          # Configuração Oracle
├── controllers/
│   └── reportController.js  # Controladores da API
├── services/
│   ├── whatsapp.js          # Integração WhatsApp
│   └── fileService.js       # Manipulação de arquivos
├── utils/
│   └── logger.js            # Sistema de logs
└── server.js                # Servidor principal
```

## 🔍 Logs

Os logs são salvos em `logs/erp-whatsapp-YYYY-MM-DD.log` com informações detalhadas de:
- Conexões Oracle e WhatsApp
- Envios de relatórios
- Erros e exceções
- Performance das operações

## ⚠️ Tratamento de Erros

A API possui tratamento robusto para:
- `MISSING_CNPJ` - CNPJ não fornecido
- `INVALID_CNPJ` - CNPJ inválido
- `COMPANY_NOT_FOUND` - Empresa não encontrada
- `REPORT_FILE_NOT_FOUND` - Arquivo não encontrado
- `WHATSAPP_DISCONNECTED` - WhatsApp desconectado
- `WHATSAPP_SEND_ERROR` - Erro no envio

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Testar conexões
npm run teste-conexao
```

## 📞 Suporte

Para dúvidas e suporte, entre em contato através dos issues do GitHub.

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.