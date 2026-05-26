// electron-store persists settings and template JSON under userData.
// Sensitive fields (smtp_pass, sendgrid_key) are obfuscated with a
// machine-derived key. This is NOT real encryption — for production,
// swap to keytar/OS keychain.
const Store = require('electron-store');
const crypto = require('crypto');
const os = require('os');

const SECRET_FIELDS = ['smtp_pass', 'sendgrid_key'];
const key = crypto.createHash('sha256').update(os.hostname() + os.userInfo().username).digest();

function enc(v) {
  if (!v) return v;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(String(v), 'utf8'), c.final()]);
  return 'enc:' + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
}
function dec(v) {
  if (!v || typeof v !== 'string' || !v.startsWith('enc:')) return v;
  try {
    const buf = Buffer.from(v.slice(4), 'base64');
    const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), ct = buf.subarray(28);
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  } catch { return ''; }
}

const store = new Store({ name: 'config' });

const DEFAULT_TEMPLATE = {
  subject: 'Salary slip for {{month}}',
  body: 'Hi {{employee_name}},\n\nPlease find attached your salary slip for {{month}}.\n\nNet salary: {{net_salary}}\n\nRegards,\nHR Team',
};

const DEFAULT_SETTINGS = {
  company_name: 'Talentelgia Technologies Pv.t Ltd',
  company_address: 'Dibon Building, Ground Floor, Plot No ITC-2, Sector 67\nMohali, Punjab (160062)',
  company_website: 'www.talentelgia.com',
  logo_path: '',
  signature_image_path: '',
  from_name: 'HR Team',
  from_email: '',
  transport: 'smtp',
  smtp_host: 'smtp-relay.brevo.com',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_pass: '',
  sendgrid_key: '',
};

function getSettings() {
  const saved = store.get('settings', null);
  // First run: hand back the defaults so the form is pre-populated.
  if (!saved) return { ...DEFAULT_SETTINGS };
  const out = { ...DEFAULT_SETTINGS, ...saved };
  for (const f of SECRET_FIELDS) out[f] = dec(out[f]);
  return out;
}
function saveSettings(s) {
  const safe = { ...s };
  for (const f of SECRET_FIELDS) if (safe[f]) safe[f] = enc(safe[f]);
  store.set('settings', safe);
  return { ok: true };
}
function getTemplate() { return store.get('template', DEFAULT_TEMPLATE); }
function saveTemplate(t) { store.set('template', t); return { ok: true }; }

module.exports = { getSettings, saveSettings, getTemplate, saveTemplate };
