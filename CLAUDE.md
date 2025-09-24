# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WhatsApp integration project for an ERP system that automatically sends sales reports to WhatsApp groups based on company CNPJ. The system connects to an Oracle database to retrieve company information and sends report images via WhatsApp API.

## Architecture

The system follows this flow:
1. ERP system triggers API call with company CNPJ
2. API queries Oracle database (`D_EMPRESAS` table) to get WhatsApp group number
3. API constructs image path: `C:\br.com.ControleVendaComercio\ERP_{cnpj}_VENDAS_COMERCIO\RelatorioVendas.jpg`
4. API sends the report image to the corresponding WhatsApp group via WhatsApp service (Whatsmeow/WPPConnect)

## Database Configuration

- **Database**: Oracle
- **Host**: nuvem.dnotas.com.br
- **Port**: 1521
- **SID**: xe
- **User**: DID_SISTEMAS
- **Password**: D_d2017

Key table: `D_EMPRESAS`
- Query: `SELECT NUMERO_WHATSAPP_GRUPO FROM D_EMPRESAS WHERE CNPJ_CO2 = :cnpj`

## API Endpoints

### POST /api/enviar-relatorio
- **Input**: `{ "cnpj": "62567108000101" }`
- **Action**: Query database, construct image path, send image to WhatsApp group
- **Output**: `{ "status": "enviado", "grupo": "...", "cnpj": "..." }`

### GET /api/teste-conexao (Optional)
- **Purpose**: Validate database and WhatsApp connections

## File Structure

Report images are stored at:
```
C:\br.com.ControleVendaComercio\ERP_{cnpj}_VENDAS_COMERCIO\RelatorioVendas.jpg
```

## WhatsApp Integration

The system supports sending images via:
- **Local file upload**: Read .jpg file and send binary data
- **URL method**: Expose images via HTTP server and send URLs

Message format:
- **Phone**: Group number (format: `1203xxxx@g.us`)
- **Filename**: `RelatorioVendas.jpg`
- **Caption**: `Relatório do dia`

## Error Handling Requirements

- File not found errors
- Group not found in database
- Database connection failures
- WhatsApp session management
- Logging of all send attempts with timestamps

## Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run test` - Test database and WhatsApp connections
- `npm run teste-conexao` - Same as test (alias)

### Dependencies
Key dependencies:
- `express` - Web framework
- `oracledb` - Oracle database driver
- `@wppconnect-team/wppconnect` - WhatsApp integration
- `fs-extra` - Enhanced file system operations
- `helmet` - Security middleware
- `morgan` - HTTP request logger

## Environment Configuration

Required environment variables in `.env`:
```
PORT=3000
DB_USER=DID_SISTEMAS
DB_PASSWORD=D_d2017
DB_HOST=nuvem.dnotas.com.br
DB_PORT=1521
DB_SID=xe
WHATSAPP_SESSION_NAME=erp-session
RELATORIOS_BASE_PATH=C:\\br.com.ControleVendaComercio
```

## Code Architecture

### Directory Structure
```
src/
├── config/database.js     - Oracle connection pool
├── controllers/           - API route handlers
├── services/
│   ├── whatsapp.js       - WhatsApp integration
│   └── fileService.js    - File operations
├── utils/logger.js        - Logging system
└── server.js             - Main application server
```

### Key Classes
- `Database` - Oracle connection management and queries
- `WhatsAppService` - WPPConnect integration for sending messages
- `FileService` - Report file validation and path management
- `ReportController` - Main API logic orchestration
- `Logger` - Structured logging with file rotation

## Development Setup

1. Install Oracle Instant Client for `oracledb` package
2. Configure WhatsApp session (will show QR code on first run)
3. Ensure report directory structure exists
4. Test connections before deployment