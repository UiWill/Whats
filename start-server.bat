@echo off
cls
echo.
echo ======================================================
echo             API ERP-WHATSAPP INICIANDO
echo ======================================================
echo.
echo 1. Oracle Database: Conectando...
echo 2. WhatsApp: Aguardando QR Code...
echo 3. Servidor: http://localhost:3000
echo.
echo ======================================================
echo.

cd /d "C:\ERP_SISTEMAS\WHATSAPPnovo"
npm run dev

pause