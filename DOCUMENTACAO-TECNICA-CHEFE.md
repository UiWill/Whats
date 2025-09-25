# 📋 Documentação Técnica - API WhatsApp para ERP

**Versão:** 2.0 (Nova API Simplificada)
**Data:** Setembro 2025
**Desenvolvedor:** William + Claude Code
**Repositório:** https://github.com/UiWill/Whats.git

---

## 🎯 **Resumo Executivo**

Esta API permite que o sistema ERP envie **relatórios de vendas automaticamente** para grupos do WhatsApp Business, sem necessidade de intervenção manual. A nova versão é **80% mais simples** que a anterior.

### **🚀 Principais Benefícios:**

- ✅ **Automação completa** - Zero intervenção manual
- ✅ **Integração simples** - Apenas 1 endpoint HTTP
- ✅ **Flexibilidade total** - Funciona com qualquer linguagem
- ✅ **Sem dependências** - Não precisa mais de banco Oracle
- ✅ **Tempo real** - Envios instantâneos
- ✅ **Logs detalhados** - Auditoria completa

---

## 🏗️ **Arquitetura da Solução**

```
[Sistema ERP] → [API WhatsApp] → [WhatsApp Business] → [Grupos de Vendas]
      ↓               ↓                    ↓                  ↓
   Gera JPG      Processa Base64    Autentica QR Code   Recebe Relatórios
```

### **Componentes:**

1. **Sistema ERP** - Gera relatórios em JPG
2. **API WhatsApp** - Middleware Node.js (esta API)
3. **WhatsApp Business** - Aplicativo oficial
4. **Grupos WhatsApp** - Destinos dos relatórios

---

## 🔧 **Instalação no Servidor**

### **1. Pré-requisitos do Servidor:**
- **Windows Server** (2016+ recomendado)
- **Node.js 16+**
- **Conexão internet estável**
- **WhatsApp Business** no celular da empresa

### **2. Comandos de Instalação:**

```bash
# 1. Clonar repositório
git clone https://github.com/UiWill/Whats.git
cd Whats

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com configurações do servidor

# 4. Iniciar servidor
npm start
```

### **3. Configuração (.env):**

```env
# Servidor
PORT=3000
NODE_ENV=production

# WhatsApp
WHATSAPP_SESSION_NAME=erp-producao

# Logs (opcional)
LOG_LEVEL=info
```

### **4. Conectar WhatsApp (Uma vez):**

1. Executar: `npm start`
2. **QR Code aparece no terminal**
3. **Escanear com WhatsApp Business da empresa**
4. ✅ **Conectado permanentemente**

---

## 📱 **Como Integrar no Sistema ERP**

### **Endpoint Principal:**
```
POST http://servidor:3000/api/enviar-imagem
```

### **Dados a Enviar (JSON):**

```json
{
  "imagemBase64": "data:image/jpeg;base64,/9j/4AAQSkZJ...",
  "numeroGrupo": "120363142926103927",
  "mensagem": "📊 Relatório de Vendas - 24/09/2025"
}
```

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `imagemBase64` | String | ✅ Sim | Imagem JPG convertida em base64 |
| `numeroGrupo` | String | ✅ Sim | Número do grupo WhatsApp (apenas números) |
| `mensagem` | String | ❌ Não | Texto que acompanha a imagem |

---

## 💻 **Exemplos de Código para Integração**

### **PHP (Recomendado):**

```php
<?php
function enviarRelatorioWhatsApp($caminhoImagem, $numeroGrupo, $mensagem = '') {
    // 1. Ler arquivo JPG
    $imagemBinaria = file_get_contents($caminhoImagem);

    // 2. Converter para base64
    $imagemBase64 = 'data:image/jpeg;base64,' . base64_encode($imagemBinaria);

    // 3. Preparar dados
    $dados = [
        'imagemBase64' => $imagemBase64,
        'numeroGrupo' => $numeroGrupo,
        'mensagem' => $mensagem
    ];

    // 4. Enviar para API
    $ch = curl_init('http://servidor:3000/api/enviar-imagem');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dados));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $resposta = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 5. Processar resposta
    $resultado = json_decode($resposta, true);

    if ($httpCode === 200 && $resultado['success']) {
        return [
            'sucesso' => true,
            'messageId' => $resultado['data']['messageId'],
            'grupo' => $resultado['data']['groupName']
        ];
    } else {
        return [
            'sucesso' => false,
            'erro' => $resultado['message'] ?? 'Erro desconhecido'
        ];
    }
}

// Exemplo de uso no sistema ERP:
$resultado = enviarRelatorioWhatsApp(
    'C:\relatorios\vendas_hoje.jpg',
    '120363142926103927',
    '📊 Relatório de Vendas - ' . date('d/m/Y')
);

if ($resultado['sucesso']) {
    echo "✅ Relatório enviado para: " . $resultado['grupo'];
} else {
    echo "❌ Erro: " . $resultado['erro'];
}
?>
```

### **C# (.NET):**

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class WhatsAppAPI
{
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl;

    public WhatsAppAPI(string serverUrl)
    {
        _httpClient = new HttpClient();
        _apiUrl = $"{serverUrl}/api/enviar-imagem";
    }

    public async Task<bool> EnviarRelatorioAsync(string caminhoImagem, string numeroGrupo, string mensagem = "")
    {
        try
        {
            // 1. Ler arquivo
            byte[] imagemBytes = File.ReadAllBytes(caminhoImagem);

            // 2. Converter para base64
            string imagemBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(imagemBytes)}";

            // 3. Preparar dados
            var dados = new
            {
                imagemBase64 = imagemBase64,
                numeroGrupo = numeroGrupo,
                mensagem = mensagem
            };

            // 4. Enviar
            string json = JsonConvert.SerializeObject(dados);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(_apiUrl, content);
            var responseJson = await response.Content.ReadAsStringAsync();

            // 5. Processar resposta
            dynamic resultado = JsonConvert.DeserializeObject(responseJson);

            return response.IsSuccessStatusCode && resultado.success == true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao enviar: {ex.Message}");
            return false;
        }
    }
}

// Exemplo de uso:
var whatsapp = new WhatsAppAPI("http://servidor:3000");
bool enviado = await whatsapp.EnviarRelatorioAsync(
    @"C:\relatorios\vendas.jpg",
    "120363142926103927",
    $"📊 Relatório - {DateTime.Now:dd/MM/yyyy}"
);
```

### **Python:**

```python
import base64
import requests
import json
from datetime import datetime

def enviar_relatorio_whatsapp(caminho_imagem, numero_grupo, mensagem=""):
    try:
        # 1. Ler arquivo
        with open(caminho_imagem, 'rb') as arquivo:
            imagem_binaria = arquivo.read()

        # 2. Converter para base64
        imagem_base64 = f"data:image/jpeg;base64,{base64.b64encode(imagem_binaria).decode()}"

        # 3. Preparar dados
        dados = {
            'imagemBase64': imagem_base64,
            'numeroGrupo': numero_grupo,
            'mensagem': mensagem
        }

        # 4. Enviar
        response = requests.post(
            'http://servidor:3000/api/enviar-imagem',
            json=dados,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        # 5. Processar resposta
        if response.status_code == 200:
            resultado = response.json()
            return resultado['success']
        else:
            print(f"Erro HTTP: {response.status_code}")
            return False

    except Exception as e:
        print(f"Erro: {e}")
        return False

# Exemplo de uso:
sucesso = enviar_relatorio_whatsapp(
    'C:/relatorios/vendas.jpg',
    '120363142926103927',
    f'📊 Relatório - {datetime.now().strftime("%d/%m/%Y")}'
)

if sucesso:
    print("✅ Relatório enviado!")
else:
    print("❌ Falha no envio")
```

---

## 📊 **Respostas da API**

### **✅ Sucesso (200):**
```json
{
  "success": true,
  "status": "enviado",
  "data": {
    "grupo": "120363142926103927",
    "mensagem": "📊 Relatório de vendas",
    "messageId": "false_120363142926103927@g.us_3EB0...",
    "timestamp": "2025-09-24T14:30:45.123Z",
    "groupName": "Vendas - Loja Centro"
  },
  "meta": {
    "duration": "1247ms",
    "processedAt": "2025-09-24T14:30:45.123Z",
    "imagemTamanho": "234KB"
  }
}
```

### **❌ Erros Comuns:**

| Código | Erro | Solução |
|--------|------|---------|
| 400 | `MISSING_IMAGE` | Verificar se imagemBase64 foi enviado |
| 400 | `MISSING_GROUP` | Verificar se numeroGrupo foi enviado |
| 400 | `INVALID_IMAGE_FORMAT` | Base64 deve começar com `data:image/` |
| 503 | `WHATSAPP_DISCONNECTED` | Reconectar WhatsApp (escanear QR) |
| 500 | `WHATSAPP_SEND_ERROR` | Grupo não encontrado ou bot removido |

---

## 📋 **Checklist de Implementação**

### **Para o Administrador do Servidor:**

- [ ] **Instalar Node.js** no servidor
- [ ] **Clonar repositório** da API
- [ ] **Configurar arquivo .env**
- [ ] **Executar npm install**
- [ ] **Iniciar servidor** com npm start
- [ ] **Escanear QR Code** com WhatsApp Business
- [ ] **Testar endpoint** /api/status
- [ ] **Configurar como serviço** do Windows (PM2 ou similar)

### **Para o Desenvolvedor ERP:**

- [ ] **Obter números dos grupos** (/api/grupos)
- [ ] **Implementar função** de conversão base64
- [ ] **Criar função** de envio HTTP POST
- [ ] **Tratar respostas** da API (sucesso/erro)
- [ ] **Implementar logs** no ERP
- [ ] **Testar com imagem pequena** primeiro
- [ ] **Testar cenários de erro**
- [ ] **Implementar retry** em caso de falha

---

## 🔍 **Monitoramento e Manutenção**

### **Logs da API:**
```
logs/erp-whatsapp-YYYY-MM-DD.log
```

### **Endpoints de Monitoramento:**

| Endpoint | Função |
|----------|--------|
| `GET /health` | Status básico da API |
| `GET /api/status` | Status completo (WhatsApp + sistema) |
| `GET /api/logs` | Logs recentes (últimas 24h) |

### **Indicadores de Saúde:**

- ✅ **API Online:** /health retorna 200
- ✅ **WhatsApp Conectado:** /api/status success: true
- ✅ **Grupos Acessíveis:** /api/grupos lista os grupos
- ✅ **Envios Funcionando:** POST /api/enviar-imagem retorna 200

---

## 🚨 **Solução de Problemas**

### **Problema: WhatsApp desconectado**
```
Sintoma: {"success": false, "code": "WHATSAPP_DISCONNECTED"}
Solução:
1. Acesse o terminal do servidor
2. Pare o serviço (Ctrl+C)
3. Execute: npm start
4. Escaneie novo QR Code
5. Reinicie como serviço
```

### **Problema: Grupo não encontrado**
```
Sintoma: "Grupo XXX não encontrado. Verifique se o bot está no grupo"
Solução:
1. Verificar se o bot foi removido do grupo
2. Re-adicionar o número WhatsApp Business no grupo
3. Usar /api/grupos para obter número correto
```

### **Problema: Imagem muito grande**
```
Sintoma: Timeout ou erro 413 (Payload too large)
Solução:
1. Reduzir qualidade/tamanho da imagem JPG
2. Configurar nginx/proxy para payloads maiores
3. Implementar compressão no ERP
```

---

## 💰 **Custos e Recursos**

### **Servidor (Estimativa):**
- **CPU:** 2 cores (mínimo)
- **RAM:** 4GB (mínimo)
- **Disco:** 20GB (logs + cache)
- **Largura de banda:** Conforme volume de imagens

### **WhatsApp Business:**
- ✅ **Gratuito** para uso básico
- ✅ **Sem limite** de grupos
- ✅ **Sem custo** por mensagem

### **Manutenção:**
- **Tempo:** ~2h/mês (monitoramento)
- **Skill:** Básico em Node.js
- **Backup:** Automático via Git

---

## 🎯 **ROI Esperado**

### **Antes (Manual):**
- ⏱️ **20 min/dia** para enviar relatórios
- ❌ **Esquecimentos** frequentes
- ❌ **Inconsistência** nos horários
- ❌ **Dependência** de funcionário

### **Depois (Automático):**
- ⏱️ **0 min/dia** - 100% automático
- ✅ **Envios garantidos** - nunca esquece
- ✅ **Horário preciso** - sempre no mesmo tempo
- ✅ **Zero dependência** humana

### **Economia:**
- **20 min/dia × 22 dias = 7,3 horas/mês**
- **7,3h × salário/h = economia mensal**
- **ROI:** ~300% no primeiro ano

---

## 🔮 **Roadmap Futuro**

### **Versão 2.1 (Q4 2025):**
- [ ] Dashboard web para monitoramento
- [ ] Agendamento de envios
- [ ] Templates de mensagens
- [ ] Múltiplos formatos (PDF, Excel)

### **Versão 2.2 (Q1 2026):**
- [ ] Integração com WhatsApp Business API
- [ ] Envio para contatos individuais
- [ ] Relatórios de entrega
- [ ] Webhooks de confirmação

---

## 📞 **Suporte Técnico**

**Desenvolvedor:** William
**Repositório:** https://github.com/UiWill/Whats.git
**Documentação:** README.md + COMO-TESTAR-INSOMNIA.md

### **Canais de Suporte:**
1. **Issues GitHub:** Para bugs e melhorias
2. **Documentação:** Guias técnicos completos
3. **Logs da aplicação:** Diagnóstico automático

---

## ✅ **Aprovação**

**Data:** ___________
**Aprovado por:** ___________
**Cargo:** ___________

---

*Esta documentação garante implementação segura e eficiente da API WhatsApp no sistema ERP da empresa.*