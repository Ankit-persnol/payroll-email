import { useEffect, useState } from 'react';
import { Save, Send } from 'lucide-react';
import { api } from '../api.js';

const empty = {
  company_name: '', company_address: '', company_website: '',
  logo_path: '', signature_image_path: '',
  from_name: '', from_email: '',
  transport: 'smtp', smtp_host: '', smtp_port: 587, smtp_secure: false,
  smtp_user: '', smtp_pass: '', sendgrid_key: '',
};

export default function Settings() {
  const [s, setS] = useState(empty);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getSettings?.().then(d => setS({ ...empty, ...d })).catch(() => {}); }, []);

  const upd = (k) => (e) => setS({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save() {
    await api.saveSettings?.(s);
    setMsg('Saved'); setTimeout(() => setMsg(''), 2000);
  }
  async function test() {
    setMsg('Sending test…');
    try {
      await api.sendTestEmail?.(s);
      setMsg('Test email sent ✓');
    } catch (e) { setMsg('Test failed: ' + e.message); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header><h2 className="text-2xl font-bold">Settings</h2></header>

      <section className="card p-5 space-y-3">
        <h3 className="font-semibold">Company branding</h3>
        <input className="input" placeholder="Company name (e.g. Talentelgia Technologies Pv.t Ltd)" value={s.company_name} onChange={upd('company_name')} />
        <textarea className="input" placeholder="Company address (one line per row — appears in header)" rows="3" value={s.company_address} onChange={upd('company_address')} />
        <input className="input" placeholder="Company website (e.g. www.example.com)" value={s.company_website} onChange={upd('company_website')} />
        <input className="input" placeholder="Logo PNG/JPG absolute path (e.g. /home/you/logo.png)" value={s.logo_path} onChange={upd('logo_path')} />
        <input className="input" placeholder="Signature image PNG/JPG absolute path (optional)" value={s.signature_image_path} onChange={upd('signature_image_path')} />
        <p className="text-xs text-slate-500">Tip: copy your logo/signature into a permanent folder, then paste the full path here.</p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-semibold">Sender</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="From name" value={s.from_name} onChange={upd('from_name')} />
          <input className="input" placeholder="From email" value={s.from_email} onChange={upd('from_email')} />
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-semibold">Email transport</h3>
        <select className="input" value={s.transport} onChange={upd('transport')}>
          <option value="smtp">SMTP (Gmail, Outlook, custom)</option>
          <option value="sendgrid">SendGrid API</option>
        </select>

        {s.transport === 'smtp' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <input className="input col-span-2" placeholder="Host (e.g. smtp.gmail.com)" value={s.smtp_host} onChange={upd('smtp_host')} />
              <input className="input" type="number" placeholder="Port" value={s.smtp_port} onChange={upd('smtp_port')} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.smtp_secure} onChange={upd('smtp_secure')} /> Use TLS/SSL (port 465)</label>
            <input className="input" placeholder="Username" value={s.smtp_user} onChange={upd('smtp_user')} />
            <input className="input" type="password" placeholder="Password / app password" value={s.smtp_pass} onChange={upd('smtp_pass')} />
          </div>
        ) : (
          <input className="input" type="password" placeholder="SendGrid API key" value={s.sendgrid_key} onChange={upd('sendgrid_key')} />
        )}
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-primary"><Save size={16} /> Save</button>
        <button onClick={test} className="btn-ghost"><Send size={16} /> Send test email</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
