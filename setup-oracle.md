# ⚠️ Configuração Oracle Instant Client (OBRIGATÓRIA)

O seu Oracle é versão antiga e precisa do **Oracle Instant Client**.

## 🔧 **Como instalar:**

### **Opção 1: Download Manual**

1. **Baixe o Oracle Instant Client:**
   - Acesse: https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Escolha: **Windows x64**
   - Baixe: **Basic Package** (instantclient-basic-windows.x64-21.11.0.0.0dbru.zip)

2. **Extraia em:** `C:\oracle\instantclient_21_11`

3. **Configure as variáveis de ambiente:**
   ```cmd
   # Adicione ao PATH:
   C:\oracle\instantclient_21_11

   # Configure (opcional):
   set ORACLE_HOME=C:\oracle\instantclient_21_11
   ```

4. **Reinicie o terminal** e teste:
   ```bash
   npm run teste-conexao
   ```

### **Opção 2: Usando Chocolatey (mais fácil)**

```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Oracle Instant Client
choco install oracle-instantclient
```

## ✅ **Após instalar, teste:**

```bash
npm run teste-conexao
```

**Resultado esperado:**
```
✅ Oracle Thick Client inicializado
✅ Pool de conexões Oracle criado com sucesso
✅ Teste de conexão Oracle: OK
✅ Consulta D_EMPRESAS: OK (ou empresa não encontrada)
```

## 🎯 **WhatsApp - Sem configuração adicional**

O WPPConnect **NÃO precisa de API key**:

1. Execute: `npm run dev`
2. **QR Code aparece no terminal**
3. **Escaneie com WhatsApp Business**
4. Pronto! Conectado.

---

**⚠️ SEM o Oracle Instant Client, a API não funcionará com seu banco Oracle.**