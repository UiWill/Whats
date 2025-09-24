# Como usar a API ERP-WhatsApp

## 1. Instalação e Configuração

```bash
# Instalar dependências
npm install

# Testar conexões
npm run teste-conexao
```

## 2. Iniciar o Servidor

```bash
# Desenvolvimento (com reload automático)
npm run dev

# Produção
npm start
```

O servidor será iniciado em: `http://localhost:3000`

## 3. Endpoints Disponíveis

### POST /api/enviar-relatorio

**Endpoint principal usado pelo ERP**

```bash
curl -X POST http://localhost:3000/api/enviar-relatorio \
  -H "Content-Type: application/json" \
  -d '{"cnpj": "62567108000101"}'
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "cnpj": "62567108000101",
    "empresa": "Nome da Empresa Ltda",
    "grupo": "5511999999999",
    "messageId": "123456789",
    "timestamp": "2024-03-15T10:30:00.000Z",
    "arquivo": {
      "path": "C:\\br.com.ControleVendaComercio\\ERP_62567108000101_VENDAS_COMERCIO\\RelatorioVendas.jpg",
      "size": 256789,
      "lastModified": "2024-03-15T09:45:00.000Z"
    }
  },
  "meta": {
    "duration": "1250ms",
    "processedAt": "2024-03-15T10:30:01.250Z"
  }
}
```

### GET /api/teste-conexao

**Testa todas as conexões**

```bash
curl http://localhost:3000/api/teste-conexao
```

### GET /api/empresa/:cnpj

**Obter informações de uma empresa específica**

```bash
curl http://localhost:3000/api/empresa/62567108000101
```

### GET /api/status

**Status do sistema**

```bash
curl http://localhost:3000/api/status
```

### GET /api/logs

**Logs recentes (últimas 24h)**

```bash
curl http://localhost:3000/api/logs
```

## 4. Integração com o ERP

No seu sistema ERP, ao clicar no botão de envio, faça uma requisição HTTP POST:

### Exemplo em JavaScript (Node.js):
```javascript
const axios = require('axios');

async function enviarRelatorio(cnpj) {
  try {
    const response = await axios.post('http://localhost:3000/api/enviar-relatorio', {
      cnpj: cnpj
    });

    console.log('✅ Relatório enviado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
enviarRelatorio('62567108000101');
```

### Exemplo em PHP:
```php
<?php
function enviarRelatorio($cnpj) {
    $url = 'http://localhost:3000/api/enviar-relatorio';
    $data = json_encode(['cnpj' => $cnpj]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        echo "✅ Sucesso: " . $response;
    } else {
        echo "❌ Erro: " . $response;
    }

    return json_decode($response, true);
}

// Uso
enviarRelatorio('62567108000101');
?>
```

## 5. Tratamento de Erros

A API retorna códigos de erro específicos:

- `MISSING_CNPJ` - CNPJ não fornecido
- `INVALID_CNPJ` - CNPJ inválido (deve ter 14 dígitos)
- `COMPANY_NOT_FOUND` - Empresa não encontrada no banco
- `REPORT_FILE_NOT_FOUND` - Arquivo de relatório não existe
- `WHATSAPP_DISCONNECTED` - WhatsApp não conectado
- `WHATSAPP_SEND_ERROR` - Erro no envio pelo WhatsApp
- `INTERNAL_ERROR` - Erro interno do servidor

## 6. Primeiro Uso - Configuração WhatsApp

Na primeira execução, será mostrado um QR Code no terminal. Escaneie com o WhatsApp Business para autenticar.

```
📱 QR Code recebido. Escaneie com seu WhatsApp:
[QR CODE aparecerá aqui]
```

Após escanear, a sessão será salva e não precisará autenticar novamente.

## 7. Logs e Monitoramento

Logs são salvos em `logs/erp-whatsapp-YYYY-MM-DD.log`

Para monitorar em tempo real:
```bash
tail -f logs/erp-whatsapp-$(date +%Y-%m-%d).log
```

## 8. Estrutura de Diretórios Esperada

Certifique-se que existe:
```
C:\br.com.ControleVendaComercio\
├── ERP_62567108000101_VENDAS_COMERCIO\
│   └── RelatorioVendas.jpg
├── ERP_12345678000123_VENDAS_COMERCIO\
│   └── RelatorioVendas.jpg
└── ...
```