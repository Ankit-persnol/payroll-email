# Payroll Email — HR Automation Desktop App

A cross-platform Electron desktop application for HR teams to bulk-send personalized salary slip PDFs to employees from a CSV file.

## Features (MVP)

- CSV upload with validation, duplicate detection, drag & drop, and preview
- Auto-generated professional salary slip PDFs (PDFKit)
- Email delivery via SMTP (Gmail, Outlook, custom) or SendGrid API
- Editable email template with `{{placeholders}}`
- SQLite-backed history with search, filter, status, retry, CSV export
- Dashboard with success/failure/pending stats
- Light & dark mode
- Local credential obfuscation (AES-GCM, machine-bound key)

## Stack

- **Electron 32** desktop shell, cross-platform (Windows / macOS / Linux)
- **React 18 + Vite + Tailwind** for the UI
- **better-sqlite3** for local history
- **nodemailer** + **@sendgrid/mail** for delivery
- **PDFKit** for salary slip generation
- **electron-store** for settings persistence
- **electron-builder** for installers

## Getting started

```bash
npm install
npm run dev          # starts Vite (5173) + Electron with hot reload
```

To package an installer:

```bash
npm run package      # outputs to ./release/
```

## CSV format

See [`sample.csv`](sample.csv). Required columns:

`employee_id, employee_name, email, month, net_salary`

Optional: `department, basic, allowances, deductions`

## First-time setup inside the app

1. Open **Settings** → fill in Company name, From name/email, SMTP host/port/credentials (or SendGrid key).
2. Click **Send test email** to verify.
3. Open **Templates** → customize subject/body using `{{employee_name}}`, `{{month}}`, `{{net_salary}}`, etc.
4. Open **Upload CSV** → drop a file, review preview, click **Generate & send all**.
5. Watch progress; check **History** for per-employee status and retry failed sends.

## Project structure

```
electron/
  main.js              Electron main process + IPC routing
  preload.js           contextBridge → window.api
  services/
    db.js              SQLite schema, queries
    csv.js             Parse + validate
    pdf.js             Salary slip PDF generator
    mailer.js          SMTP / SendGrid send + test
    store.js           Settings + template persistence (AES-GCM for secrets)
src/
  App.jsx              Shell layout + nav + theme
  main.jsx             React entry, routing
  api.js               window.api proxy
  pages/               Dashboard, Upload, History, Templates, Settings
sample.csv             Example payroll input
```

## Security notes

- SMTP/SendGrid credentials are AES-GCM encrypted with a machine-derived key before being written to `electron-store`. This protects against casual disk inspection but is **not** a substitute for OS keychain storage. For production, replace `electron/services/store.js` secret handling with [`keytar`](https://github.com/atom/node-keytar) or the platform credential manager.
- The renderer has `contextIsolation: true` and `nodeIntegration: false`. All Node access is mediated by `preload.js`.
- Validate the source of any CSV you upload — the PDFs and emails are sent exactly to the addresses listed.

## Roadmap (not in MVP)

- Multi-company support
- Email queue persistence + crash recovery
- Auto-update channel (electron-updater)
- Rich-text template editor & per-template attachments
- Password-protected PDFs (`pdf-lib` + owner password)
- Reports module (PDF/Excel exports)
- Audit-grade encrypted SQLite (SQLCipher)

## License

MIT
