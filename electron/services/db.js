const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

let db;

function init() {
  const dbPath = path.join(app.getPath('userData'), 'payroll.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT,
      employee_name TEXT,
      email TEXT,
      month TEXT,
      department TEXT,
      net_salary TEXT,
      status TEXT,
      error TEXT,
      payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_status ON email_log(status);
    CREATE INDEX IF NOT EXISTS idx_created ON email_log(created_at);
  `);
}

function insertLog(r) {
  return db.prepare(`
    INSERT INTO email_log (employee_id, employee_name, email, month, department, net_salary, status, error, payload)
    VALUES (@employee_id, @employee_name, @email, @month, @department, @net_salary, @status, @error, @payload)
  `).run({
    employee_id: r.employee_id, employee_name: r.employee_name, email: r.email,
    month: r.month, department: r.department || '', net_salary: String(r.net_salary || ''),
    status: r.status, error: r.error || null, payload: r.payload,
  });
}

function updateStatus(id, status, error) {
  db.prepare('UPDATE email_log SET status=?, error=?, created_at=CURRENT_TIMESTAMP WHERE id=?').run(status, error, id);
}

function getHistory({ q = '', status = 'all', limit = 500 } = {}) {
  const where = [];
  const params = {};
  if (status && status !== 'all') { where.push('status = @status'); params.status = status; }
  if (q) {
    where.push('(employee_name LIKE @q OR email LIKE @q OR employee_id LIKE @q)');
    params.q = `%${q}%`;
  }
  const sql = `SELECT * FROM email_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ${Number(limit) || 500}`;
  return db.prepare(sql).all(params);
}

function getById(id) {
  return db.prepare('SELECT * FROM email_log WHERE id = ?').get(id);
}

function getStats() {
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) AS sent,
      SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
      COUNT(*) AS total
    FROM email_log
  `).get();
  return { sent: row.sent || 0, failed: row.failed || 0, pending: row.pending || 0, total: row.total || 0 };
}

module.exports = { init, insertLog, updateStatus, getHistory, getById, getStats };
