import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api.js';

const PLACEHOLDERS = ['{{employee_name}}', '{{month}}', '{{net_salary}}', '{{employee_id}}', '{{department}}'];
const DEFAULT_SUBJECT = 'Salary slip for {{month}}';
const DEFAULT_BODY = `Hi {{employee_name}},

Please find attached your salary slip for {{month}}.

Net salary: {{net_salary}}

Regards,
HR Team`;

export default function Templates() {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getTemplate?.().then(t => {
      if (t?.subject) setSubject(t.subject);
      if (t?.body) setBody(t.body);
    }).catch(() => {});
  }, []);

  async function save() {
    await api.saveTemplate?.({ subject, body });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h2 className="text-2xl font-bold">Email template</h2>
        <p className="text-slate-500 text-sm">Available placeholders: {PLACEHOLDERS.join(', ')}</p>
      </header>

      <div className="card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Subject</label>
          <input className="input mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Body</label>
          <textarea className="input mt-1 font-mono text-sm" rows="12" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button onClick={save} className="btn-primary"><Save size={16} /> {saved ? 'Saved!' : 'Save template'}</button>
      </div>
    </div>
  );
}
