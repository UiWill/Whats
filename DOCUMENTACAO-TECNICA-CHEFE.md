# 📱 API WhatsApp - Como Usar

**O que faz:** Envia imagens para grupos do WhatsApp Business automaticamente.

---

## 🚀 **1. Instalar no Servidor**

```bash
git clone https://github.com/UiWill/Whats.git
cd Whats
npm install
npm start
```

**✅ Servidor rodando em:** `http://localhost:3000`

---

## 📱 **2. Conectar WhatsApp (1 vez só)**

1. Execute `npm start`
2. **QR Code aparece** no terminal
3. **Escaneie com WhatsApp Business** da empresa
4. ✅ **Pronto!** Fica conectado para sempre

---

## 👥 **3. Ver Grupos (Opcional)**

**No Insomnia:**

- **Método:** `GET`
- **URL:** `http://localhost:3000/api/grupos`
- **Clique em Send**

**Resposta:**
```json
{
  "success": true,
  "grupos": [
    {
      "nome": "Vendas - Loja Centro",
      "numeroGrupo": "120363142926103927"
    }
  ]
}
```

📝 **Anote o `numeroGrupo`**

---

## 📤 **4. Enviar Imagem**

**No Insomnia:**

### **Configuração:**
- **Método:** `POST`
- **URL:** `http://localhost:3000/api/enviar-imagem`
- **Header:** `Content-Type: application/json`

### **Body (JSON):**
```json
{
  "imagemBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "numeroGrupo": "120363142926103927",
  "mensagem": "📊 Relatório de Vendas!"
}
```

### **Explicação:**
- **`imagemBase64`** = Sua imagem convertida (use conversor online)
- **`numeroGrupo`** = Número do grupo (do passo 3)
- **`mensagem`** = Texto que aparece com a imagem

### **Converter imagem para base64:**
1. Acesse: https://www.base64-image.de/
2. Faça upload da imagem
3. Copie o resultado completo

---

## ✅ **Resposta de Sucesso**

```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "grupo": "120363142926103927",
    "mensagem": "📊 Relatório de Vendas!",
    "groupName": "Vendas - Loja Centro"
  }
}
```

## ❌ **Erros Comuns**

| Erro | Solução |
|------|---------|
| `WHATSAPP_DISCONNECTED` | Reconectar WhatsApp (escanear QR) |
| `MISSING_IMAGE` | Verificar se imagemBase64 foi enviado |
| `INVALID_IMAGE_FORMAT` | Base64 deve começar com `data:image/` |
| `Grupo não encontrado` | Verificar se numeroGrupo está correto |

---

## 🎯 **Resumo Rápido**

1. **Instalar:** `npm install` e `npm start`
2. **Conectar:** Escanear QR Code 1 vez
3. **Ver grupos:** GET `/api/grupos`
4. **Enviar:** POST `/api/enviar-imagem` com JSON

**É isso!** 🚀