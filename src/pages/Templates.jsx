import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';

// Placeholders HR can use — shown as clickable chips
const PLACEHOLDERS = [
  { key: '{{employee_name}}', label: 'Employee Name' },
  { key: '{{month}}',         label: 'Month' },
  { key: '{{net_salary}}',    label: 'Net Salary' },
  { key: '{{employee_id}}',   label: 'Employee Code' },
  { key: '{{designation}}',   label: 'Designation' },
  { key: '{{company_name}}',  label: 'Company Name' },
  { key: '{{year}}',          label: 'Year' },
];

export default function Templates() {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');

  useEffect(() => {
    api.getTemplate?.().then(t => {
      if (t?.subject) setSubject(t.subject);
      if (t?.body)    setBody(t.body);
    }).catch(() => {});
  }, []);

  async function save() {
    try {
      await api.saveTemplate?.({ subject, body });
      toast.success('Template saved');
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
  }

  // Insert placeholder at cursor position in the active textarea
  function insertPlaceholder(key, fieldSetter, fieldValue, ref) {
    const el = ref.current;
    if (!el) { fieldSetter(fieldValue + key); return; }
    const start = el.selectionStart ?? fieldValue.length;
    const end   = el.selectionEnd   ?? fieldValue.length;
    const next  = fieldValue.slice(0, start) + key + fieldValue.slice(end);
    fieldSetter(next);
    // Restore cursor after inserted text
    setTimeout(() => { el.focus(); el.setSelectionRange(start + key.length, start + key.length); }, 0);
  }

  const subjectRef = { current: null };
  const bodyRef    = { current: null };
  const [lastFocus, setLastFocus] = useState('body');

  function onInsertChip(key) {
    if (lastFocus === 'subject') insertPlaceholder(key, setSubject, subject, subjectRef);
    else                         insertPlaceholder(key, setBody,    body,    bodyRef);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="text-2xl font-bold">Email Template</h2>
        <p className="text-slate-500 text-sm">
          Write your email in plain text. The app automatically applies professional styling when sending.
          Use the buttons below to insert employee data into your message.
        </p>
      </header>

      {/* Placeholder chips */}
      <div className="card p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Insert placeholder — click a chip then it appears at your cursor</p>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map(p => (
            <button
              key={p.key}
              onClick={() => onInsertChip(p.key)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-700 transition-colors"
              title={`Insert ${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        {/* Subject */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Subject
            <span className="ml-2 text-xs font-normal text-slate-400">This also appears as the bold heading inside the email</span>
          </label>
          <input
            ref={el => subjectRef.current = el}
            className="input mt-1"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            onFocus={() => setLastFocus('subject')}
            placeholder="Your Salary Slip for {{month}}"
          />
        </div>

        {/* Body */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email Body
            <span className="ml-2 text-xs font-normal text-slate-400">Plain text — leave a blank line between paragraphs. Use --- for a divider line.</span>
          </label>
          <textarea
            ref={el => bodyRef.current = el}
            className="input mt-1 text-sm leading-relaxed"
            rows="14"
            value={body}
            onChange={e => setBody(e.target.value)}
            onFocus={() => setLastFocus('body')}
            placeholder={`Dear {{employee_name}},\n\nPlease find attached your salary slip for {{month}}.\n\nBest regards,\nHR Team`}
          />
        </div>

        <button onClick={save} className="btn-primary"><Save size={16} /> Save template</button>
      </div>

      {/* Preview note */}
      <p className="text-xs text-slate-400 text-center pb-4">
        The email recipient will see a professionally styled version of the above text — you only write the words.
      </p>
    </div>
  );
}
