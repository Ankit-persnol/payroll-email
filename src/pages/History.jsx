import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api } from '../api.js';

export default function History() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const load = () => api.getHistory?.({ q, status }).then(setRows).catch(() => {});
  useEffect(() => { load(); }, [q, status]);

  async function exportCsv() {
    const res = await api.exportHistoryCsv?.();
    if (res?.path) alert('Exported to ' + res.path);
  }
  async function retry(id) {
    await api.retryEmail?.(id);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email history</h2>
          <p className="text-slate-500 text-sm">All payroll emails sent from this machine</p>
        </div>
        <button onClick={exportCsv} className="btn-ghost text-sm"><Download size={16} /> Export CSV</button>
      </header>

      <div className="flex gap-3">
        <input className="input flex-1" placeholder="Search name, email, employee ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option><option value="sent">Sent</option>
          <option value="failed">Failed</option><option value="pending">Pending</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-900/60">
            <tr><th className="p-3">Employee</th><th>Email</th><th>Month</th><th>Status</th><th>Error</th><th>Time</th><th></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="text-center text-slate-500 p-6">No records</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800/50">
                <td className="p-3">{r.employee_name}<div className="text-xs text-slate-500">{r.employee_id}</div></td>
                <td>{r.email}</td>
                <td>{r.month}</td>
                <td><span className={`badge-${r.status === 'sent' ? 'success' : r.status === 'failed' ? 'error' : 'pending'}`}>{r.status}</span></td>
                <td className="text-rose-600 text-xs max-w-xs truncate" title={r.error}>{r.error}</td>
                <td className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.status === 'failed' && <button onClick={() => retry(r.id)} className="btn-ghost text-xs"><RefreshCw size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
