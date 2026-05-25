const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const db = require('./services/db');
const csv = require('./services/csv');
const pdf = require('./services/pdf');
const mailer = require('./services/mailer');
const store = require('./services/store');

const isDev = process.env.NODE_ENV === 'development';

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  db.init();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ---------- IPC handlers ----------
ipcMain.handle('csv:parse', async (_e, text) => csv.parseAndValidate(text));

ipcMain.handle('settings:get', () => store.getSettings());
ipcMain.handle('settings:save', (_e, s) => store.saveSettings(s));

ipcMain.handle('template:get', () => store.getTemplate());
ipcMain.handle('template:save', (_e, t) => store.saveTemplate(t));

ipcMain.handle('history:get', (_e, opts) => db.getHistory(opts || {}));
ipcMain.handle('history:stats', () => db.getStats());
ipcMain.handle('history:export', async () => {
  const rows = db.getHistory({ limit: 100000 });
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    defaultPath: `payroll-history-${Date.now()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return { path: null };
  const header = 'id,employee_id,employee_name,email,month,status,error,created_at\n';
  const body = rows.map(r =>
    [r.id, r.employee_id, r.employee_name, r.email, r.month, r.status,
     JSON.stringify(r.error || ''), r.created_at].join(',')
  ).join('\n');
  fs.writeFileSync(filePath, header + body);
  return { path: filePath };
});

ipcMain.handle('email:test', async (_e, settings) => mailer.sendTest(settings));

ipcMain.handle('email:retry', async (_e, id) => {
  const row = db.getById(id);
  if (!row) throw new Error('Not found');
  const payload = JSON.parse(row.payload);
  return processOne(payload, id);
});

ipcMain.handle('email:sendBatch', async (event, rows) => {
  const settings = store.getSettings();
  const template = store.getTemplate();
  let sent = 0, failed = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      await processOne(rows[i], null, settings, template);
      sent++;
    } catch (_) {
      failed++;
    }
    event.sender.send('email:progress', { done: i + 1, total: rows.length, sent, failed });
  }
  return { sent, failed };
});

async function processOne(row, existingId = null, settings, template) {
  settings = settings || store.getSettings();
  template = template || store.getTemplate();
  const pdfDir = path.join(app.getPath('userData'), 'slips');
  fs.mkdirSync(pdfDir, { recursive: true });
  const pdfPath = path.join(pdfDir, `${row.employee_id}_${row.month}.pdf`.replace(/\s+/g, '_'));

  let status = 'pending', error = null;
  try {
    await pdf.generateSalarySlip(row, settings, pdfPath);
    await mailer.sendPayrollEmail(row, settings, template, pdfPath);
    status = 'sent';
  } catch (e) {
    status = 'failed';
    error = e.message || String(e);
  }

  if (existingId) {
    db.updateStatus(existingId, status, error);
  } else {
    db.insertLog({ ...row, status, error, payload: JSON.stringify(row) });
  }
  if (status === 'failed') throw new Error(error);
  return { status };
}
