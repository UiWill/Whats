# 🧪 Como Testar a Nova API no Insomnia

Este guia mostra como testar a nova API simplificada de envio de imagens WhatsApp usando o Insomnia.

## 📋 Pré-requisitos

1. **Insomnia** instalado
2. **Servidor rodando** em `http://localhost:3000`
3. **WhatsApp conectado** (QR Code escaneado)

## 🚀 1. Iniciando o Servidor

Primeiro, inicie o servidor:

```bash
cd C:\ERP_SISTEMAS\WHATSAPPnovo
npm start
```

Aguarde aparecer:
```
🚀 Servidor rodando em http://localhost:3000
📷 POST http://localhost:3000/api/enviar-imagem (NOVO - base64)
```

## 📱 2. Conectar WhatsApp

1. Escaneie o **QR Code** que aparece no terminal
2. Aguarde a mensagem: `✅ WhatsApp conectado com sucesso!`

## 🔍 3. Primeiro Teste: Verificar Status

### **Request:**
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/status`

### **Response esperada:**
```json
{
  "success": true,
  "timestamp": "2025-09-24T23:45:12.345Z",
  "services": {
    "whatsapp": {
      "success": true,
      "message": "WhatsApp conectado",
      "data": {
        "device": {...},
        "ready": true
      }
    }
  }
}
```

## 📋 4. Listar Grupos WhatsApp

### **Request:**
- **Método:** `GET`
- **URL:** `http://localhost:3000/api/grupos`

### **Response:**
```json
{
  "success": true,
  "count": 5,
  "grupos": [
    {
      "id": "120363142926103927@g.us",
      "nome": "Vendas - Loja Centro",
      "participantes": 8,
      "isGroup": true,
      "numeroGrupo": "120363142926103927"
    }
  ]
}
```

**📝 Anote o `numeroGrupo` que você quer usar!**

## 📷 5. Enviar Imagem (PRINCIPAL)

### **Request:**
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/enviar-imagem`
- **Headers:**
```
Content-Type: application/json
```

### **Body (JSON):**
```json
{
  "imagemBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "numeroGrupo": "120363142926103927",
  "mensagem": "🧪 Teste da nova API do ERP!"
}
```

### **Campos obrigatórios:**
- **`imagemBase64`**: String base64 da imagem (deve começar com `data:image/`)
- **`numeroGrupo`**: Número do grupo WhatsApp (apenas números)

### **Campo opcional:**
- **`mensagem`**: Texto que acompanha a imagem

### **Response de sucesso:**
```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "grupo": "120363142926103927",
    "mensagem": "🧪 Teste da nova API do ERP!",
    "messageId": "false_120363142926103927@g.us_3EB0C67...",
    "timestamp": "2025-09-24T23:45:12.345Z",
    "groupName": "Vendas - Loja Centro"
  },
  "meta": {
    "duration": "1247ms",
    "processedAt": "2025-09-24T23:45:12.345Z",
    "imagemTamanho": "2KB"
  }
}
```

## 🖼️ 6. Como Gerar Base64 de Imagem

### **Opção 1: Online (mais fácil)**
1. Acesse: https://www.base64-image.de/
2. Faça upload da sua imagem
3. Copie o resultado (já vem com `data:image/jpeg;base64,`)

### **Opção 2: JavaScript**
```javascript
// No navegador
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => console.log(reader.result);
  reader.readAsDataURL(file);
};
input.click();
```

### **Opção 3: Node.js**
```javascript
const fs = require('fs');
const base64 = fs.readFileSync('imagem.jpg', { encoding: 'base64' });
const dataUri = `data:image/jpeg;base64,${base64}`;
```

## ❌ 7. Tratamento de Erros

### **WhatsApp não conectado:**
```json
{
  "success": false,
  "message": "WhatsApp não está conectado",
  "code": "WHATSAPP_DISCONNECTED"
}
```
**Solução:** Escaneie o QR Code novamente

### **Imagem inválida:**
```json
{
  "success": false,
  "message": "Formato de imagem inválido. Use: data:image/jpeg;base64,... ou similar",
  "code": "INVALID_IMAGE_FORMAT"
}
```
**Solução:** Certifique-se que o base64 começa com `data:image/`

### **Grupo não encontrado:**
```json
{
  "success": false,
  "message": "Grupo 123456789 não encontrado. Verifique se o bot está no grupo.",
  "code": "WHATSAPP_SEND_ERROR"
}
```
**Solução:** Use `/api/grupos` para obter o número correto

### **Dados ausentes:**
```json
{
  "success": false,
  "message": "Imagem em base64 é obrigatória",
  "code": "MISSING_IMAGE"
}
```
**Solução:** Verifique se todos os campos obrigatórios estão presentes

## 📊 8. Outros Endpoints Úteis

### **Teste de conexão:**
```
GET http://localhost:3000/api/teste-conexao
```

### **Health check:**
```
GET http://localhost:3000/health
```

### **API antiga (legado):**
```
POST http://localhost:3000/api/enviar-relatorio
```

## 🔧 9. Dicas para Desenvolvimento

### **Collection do Insomnia**
Crie uma **Collection** com os seguintes requests:

1. **Status** - GET `/api/status`
2. **Grupos** - GET `/api/grupos`
3. **Enviar Imagem** - POST `/api/enviar-imagem`
4. **Teste Conexão** - GET `/api/teste-conexao`

### **Environment Variables**
Configure no Insomnia:
```json
{
  "base_url": "http://localhost:3000",
  "test_group": "120363142926103927",
  "test_message": "🧪 Teste automatizado"
}
```

Use nas URLs: `{{ _.base_url }}/api/enviar-imagem`

### **Templates de Teste**

**Teste básico:**
```json
{
  "imagemBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "numeroGrupo": "{{ _.test_group }}",
  "mensagem": "{{ _.test_message }}"
}
```

**Teste sem mensagem:**
```json
{
  "imagemBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "numeroGrupo": "{{ _.test_group }}"
}
```

## 🎯 10. Cenários de Teste

### **✅ Cenários de Sucesso**
1. Imagem pequena + mensagem curta
2. Imagem média + mensagem longa
3. Imagem grande (até 5MB)
4. Envio sem mensagem
5. Diferentes formatos: JPG, PNG, GIF

### **❌ Cenários de Erro**
1. Base64 inválido
2. Grupo inexistente
3. WhatsApp desconectado
4. Campos obrigatórios ausentes
5. Imagem muito grande (>10MB)

## 🚀 11. Integração com seu Sistema

Depois dos testes, integre com seu sistema:

### **PHP:**
```php
$data = [
    'imagemBase64' => 'data:image/jpeg;base64,' . base64_encode($imagemBinaria),
    'numeroGrupo' => '120363142926103927',
    'mensagem' => 'Relatório automático'
];

$ch = curl_init('http://localhost:3000/api/enviar-imagem');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
```

### **JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/enviar-imagem', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imagemBase64: 'data:image/jpeg;base64,...',
    numeroGrupo: '120363142926103927',
    mensagem: 'Relatório automático'
  })
});
```

---

## 🎉 Pronto!

Agora você pode testar e integrar a nova API com facilidade!

**💡 Dica:** Comece sempre testando `/api/status` para garantir que tudo está funcionando.