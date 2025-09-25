# 📱 Como Usar a API WhatsApp

## 1. Ver Grupos (Opcional)

**Método:** `GET`
**URL:** `http://localhost:3000/api/grupos`
**Headers:** Nenhum

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

---

## 2. Enviar Imagem

**Método:** `POST`
**URL:** `http://localhost:3000/api/enviar-imagem`
**Headers:** `Content-Type: application/json`

**Body (JSON):**
```json
{
  "imagemBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "numeroGrupo": "120363142926103927",
  "mensagem": "📊 Relatório de Vendas!"
}
```

**Campos:**
- `imagemBase64` = Imagem convertida em base64
- `numeroGrupo` = Número do grupo WhatsApp
- `mensagem` = Texto (opcional)

**Resposta de sucesso:**
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

---

## 3. Converter Imagem para Base64

1. Acesse: https://www.base64-image.de/
2. Faça upload da imagem
3. Copie o resultado completo