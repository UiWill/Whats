# 📷 Nova API Simplificada - Envio de Imagens Base64

A nova API é muito mais simples e não precisa de banco de dados nem arquivos!

## 🚀 Novo Endpoint: POST /api/enviar-imagem

**URL:** `http://localhost:3000/api/enviar-imagem`

### 📝 Parâmetros (JSON):

```json
{
  "imagemBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "numeroGrupo": "120363142926103927",
  "mensagem": "📊 Relatório de vendas do dia!"
}
```

- **imagemBase64**: String base64 da imagem (obrigatório)
- **numeroGrupo**: Número do grupo WhatsApp (obrigatório)
- **mensagem**: Texto que acompanha a imagem (opcional)

### ✅ Exemplo de Resposta:

```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "grupo": "120363142926103927",
    "mensagem": "📊 Relatório de vendas do dia!",
    "messageId": "false_120363142926103927@g.us_3EB0C67...",
    "timestamp": "2025-09-24T23:45:12.345Z",
    "groupName": "Vendas - Loja Centro"
  },
  "meta": {
    "duration": "1247ms",
    "processedAt": "2025-09-24T23:45:12.345Z",
    "imagemTamanho": "245KB"
  }
}
```

## 🔧 Como usar no seu aplicativo:

### JavaScript/Node.js:
```javascript
const axios = require('axios');

async function enviarImagem() {
  try {
    // Converter sua imagem para base64
    const imagemBase64 = "data:image/jpeg;base64," + suaImagemEmBase64;

    const response = await axios.post('http://localhost:3000/api/enviar-imagem', {
      imagemBase64: imagemBase64,
      numeroGrupo: "120363142926103927",
      mensagem: "📊 Relatório de vendas!"
    });

    console.log('Sucesso:', response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
}
```

### PHP:
```php
<?php
$data = [
    'imagemBase64' => 'data:image/jpeg;base64,' . base64_encode($imagemBinaria),
    'numeroGrupo' => '120363142926103927',
    'mensagem' => '📊 Relatório de vendas!'
];

$ch = curl_init('http://localhost:3000/api/enviar-imagem');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

### Python:
```python
import requests
import base64

# Ler imagem e converter para base64
with open('relatorio.jpg', 'rb') as f:
    imagem_base64 = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

data = {
    'imagemBase64': imagem_base64,
    'numeroGrupo': '120363142926103927',
    'mensagem': '📊 Relatório de vendas!'
}

response = requests.post('http://localhost:3000/api/enviar-imagem', json=data)
print(response.json())
```

## 🎯 Vantagens da Nova API:

✅ **Mais simples** - Não precisa banco de dados
✅ **Mais rápida** - Não consulta arquivos
✅ **Mais flexível** - Você controla tudo
✅ **Qualquer linguagem** - Base64 é padrão
✅ **Menos dependências** - Só WhatsApp

## ⚠️ Importante:

1. **Formato da imagem base64:**
   - Deve começar com: `data:image/jpeg;base64,` ou similar
   - Formatos aceitos: jpeg, jpg, png, gif

2. **Número do grupo:**
   - Apenas números (remove caracteres especiais automaticamente)
   - O bot deve estar no grupo

3. **Tamanho da imagem:**
   - Recomendado: até 5MB
   - Base64 aumenta ~33% o tamanho

## 🔍 API Antiga (Legado):

A API antiga `/api/enviar-relatorio` continua funcionando para compatibilidade, mas a nova é mais simples e eficiente!