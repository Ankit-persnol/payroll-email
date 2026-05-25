import { useState } from 'react';
import { UploadCloud, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js';

export default function Upload() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [filename, setFilename] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setFilename(file.name);
    const text = await file.text();
    const result = await api.parseCsv(text);
    setRows(result.rows);
    setErrors(result.errors);
  }

  async function handleSend() {
    setSending(true);
    setProgress({ done: 0, total: rows.length });
    try {
      const result = await api.sendBatch(rows, (p) => setProgress(p));
      setProgress({ done: rows.length, total: rows.length, ...result });
    } catch (e) {
      alert('Send failed: ' + e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Upload payroll CSV</h2>
        <p className="text-slate-500 text-sm">Required columns: employee_id, employee_name, email, month, department, basic, allowances, deductions, net_salary</p>
      </header>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className="card p-10 flex flex-col items-center justify-center gap-3 border-dashed border-2 cursor-pointer hover:border-brand-500"
      >
        <UploadCloud size={40} className="text-slate-400" />
        <p className="font-medium">Drop CSV here or click to browse</p>
        {filename && <p className="text-sm text-brand-600">{filename}</p>}
        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </label>

      {errors.length > 0 && (
        <div className="card p-4 border-rose-300">
          <div className="flex items-center gap-2 text-rose-600 font-medium mb-2"><AlertCircle size={16} /> {errors.length} validation issue(s)</div>
          <ul className="text-sm space-y-1">
            {errors.slice(0, 10).map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Preview — {rows.length} employees</h3>
            <button className="btn-primary" disabled={sending} onClick={handleSend}>
              <Send size={16} /> {sending ? 'Sending…' : 'Generate & send all'}
            </button>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 sticky top-0 bg-white dark:bg-slate-900">
                <tr><th className="py-2">ID</th><th>Name</th><th>Email</th><th>Month</th><th>Net</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/50">
                    <td className="py-1">{r.employee_id}</td>
                    <td>{r.employee_name}</td>
                    <td>{r.email}</td>
                    <td>{r.month}</td>
                    <td>{r.net_salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {progress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{progress.done}/{progress.total}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              {progress.sent !== undefined && (
                <p className="text-sm mt-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={16} /> Sent {progress.sent}, failed {progress.failed}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
