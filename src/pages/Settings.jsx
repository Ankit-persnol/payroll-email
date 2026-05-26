import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';

const empty = {
  company_name: '', company_address: '', company_website: '',
  logo_path: '', signature_image_path: '',
  from_name: '', from_email: '',
  transport: 'smtp', smtp_host: '', smtp_port: 587, smtp_secure: false,
  smtp_user: '', smtp_pass: '', sendgrid_key: '',
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState(empty);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.getSettings?.().then(d => setS({ ...empty, ...d })).catch(() => {});
  }, []);

  const upd = (k) => (e) =>
    setS({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save() {
    try {
      await api.saveSettings?.(s);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
  }
  async function test() {
    setTesting(true);
    const id = toast.info('Sending test email…', { duration: 0 });
    try {
      await api.sendTestEmail?.(s);
      // dismiss the "sending" toast and show success
      import('../toast.jsx').then(({ dismiss }) => dismiss(id));
      toast.success(`Test email sent to ${s.from_email}`);
    } catch (e) {
      import('../toast.jsx').then(({ dismiss }) => dismiss(id));
      toast.error('Test failed: ' + e.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-500 text-sm">Configure company branding and email transport. These values are used in every salary slip PDF and outgoing email.</p>
      </header>

      <section className="card p-5 space-y-4">
        <h3 className="font-semibold">Company branding</h3>

        <Field label="Company name" hint="Shown in the PDF header and the 'For ___' signatory line.">
          <input className="input" placeholder="Talentelgia Technologies Pv.t Ltd" value={s.company_name} onChange={upd('company_name')} />
        </Field>

        <Field label="Company address" hint="One line per row. Each line appears stacked, right-aligned, next to the logo.">
          <textarea className="input" rows="3"
            placeholder={'Dibon Building, Ground Floor, Plot No ITC-2, Sector 67\nMohali, Punjab (160062)'}
            value={s.company_address} onChange={upd('company_address')} />
        </Field>

        <Field label="Company website" hint="Optional. Appears as the last line of the header block.">
          <input className="input" placeholder="www.talentelgia.com" value={s.company_website} onChange={upd('company_website')} />
        </Field>

        <Field label="Logo image path" hint="Absolute path on this machine. PNG with transparent background works best. Leave blank to show the company name as text.">
          <input className="input" placeholder="/home/ubuntu/payroll-assets/logo.png" value={s.logo_path} onChange={upd('logo_path')} />
        </Field>

        <Field label="Signature image path" hint="Absolute path. Appears above '(Authorized Signatory)'. Optional.">
          <input className="input" placeholder="/home/ubuntu/payroll-assets/signature.png" value={s.signature_image_path} onChange={upd('signature_image_path')} />
        </Field>
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-semibold">Sender identity</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From name" hint="Display name shown in recipient's inbox.">
            <input className="input" placeholder="HR Team" value={s.from_name} onChange={upd('from_name')} />
          </Field>
          <Field label="From email" hint="Must be a verified sender in your SMTP/Brevo account.">
            <input className="input" placeholder="hr@yourcompany.com" value={s.from_email} onChange={upd('from_email')} />
          </Field>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-semibold">Email transport</h3>

        <Field label="Provider">
          <select className="input" value={s.transport} onChange={upd('transport')}>
            <option value="smtp">SMTP (Brevo, Gmail, Outlook, custom)</option>
            <option value="sendgrid">SendGrid API</option>
          </select>
        </Field>

        {s.transport === 'smtp' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="SMTP host" hint="Brevo: smtp-relay.brevo.com • Gmail: smtp.gmail.com">
                  <input className="input" placeholder="smtp-relay.brevo.com" value={s.smtp_host} onChange={upd('smtp_host')} />
                </Field>
              </div>
              <Field label="Port" hint="587 (STARTTLS) or 465 (SSL)">
                <input className="input" type="number" placeholder="587" value={s.smtp_port} onChange={upd('smtp_port')} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.smtp_secure} onChange={upd('smtp_secure')} />
              Use SSL (enable only for port 465)
            </label>
            <Field label="SMTP username" hint="Brevo: looks like 9abc12@smtp-brevo.com">
              <input className="input" placeholder="your-login@smtp-brevo.com" value={s.smtp_user} onChange={upd('smtp_user')} />
            </Field>
            <Field label="SMTP password / API key" hint="Brevo: generate under SMTP & API → SMTP → 'Generate a new SMTP key'. Stored encrypted on disk.">
              <input className="input" type="password" placeholder="••••••••••••••••" value={s.smtp_pass} onChange={upd('smtp_pass')} />
            </Field>
          </div>
        ) : (
          <Field label="SendGrid API key" hint="Generate at sendgrid.com → Settings → API Keys. Stored encrypted on disk.">
            <input className="input" type="password" placeholder="SG.••••••••••••••••" value={s.sendgrid_key} onChange={upd('sendgrid_key')} />
          </Field>
        )}
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-slate-50 dark:bg-slate-950 py-4">
        <button onClick={save} className="btn-primary"><Save size={16} /> Save settings</button>
        <button onClick={test} disabled={testing} className="btn-secondary disabled:opacity-60">
          <Send size={16} /> {testing ? 'Sending…' : 'Send test email'}
        </button>
      </div>
    </div>
  );
}
