import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';

export default function History() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [month, setMonth] = useState('all');
  const [months, setMonths] = useState([]);

  const load = () =>
    api.getHistory?.({ q, status, month })
      .then(setRows)
      .catch(() => {});

  useEffect(() => { load(); }, [q, status, month]);

  // Pull the full list of months that appear in history (for the dropdown)
  useEffect(() => {
    api.getHistory?.({ limit: 100000 }).then(all => {
      const uniq = Array.from(new Set(all.map(r => r.month).filter(Boolean))).sort().reverse();
      setMonths(uniq);
    }).catch(() => {});
  }, [rows.length]);

  async function exportCsv() {
    try {
      const res = await api.exportHistoryCsv?.();
      if (res?.path) toast.success(`Exported to ${res.path}`);
    } catch (e) { toast.error('Export failed: ' + e.message); }
  }
  async function retry(id) {
    try {
      await api.retryEmail?.(id);
      toast.success('Email re-sent');
      load();
    } catch (e) { toast.error('Retry failed: ' + e.message); }
  }
  function resetFilters() {
    setQ(''); setStatus('all'); setMonth('all');
  }

  const hasFilter = q || status !== 'all' || month !== 'all';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email history</h2>
          <p className="text-slate-500 text-sm">{rows.length} record{rows.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={exportCsv} className="btn-ghost text-sm">
          <Download size={16} /> Export CSV
        </button>
      </header>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <input
              className="input"
              placeholder="Search name, email, employee ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {hasFilter && (
          <button onClick={resetFilters} className="text-xs text-brand-600 hover:underline">
            Clear all filters
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th className="p-3">Employee</th>
              <th>Email</th>
              <th>Month</th>
              <th>Status</th>
              <th>Error</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="7" className="text-center text-slate-500 p-6">No records</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800/50">
                <td className="p-3">
                  {r.employee_name}
                  <div className="text-xs text-slate-500">{r.employee_id}</div>
                </td>
                <td>{r.email}</td>
                <td>{r.month}</td>
                <td>
                  <span className={`badge-${r.status === 'sent' ? 'success' : r.status === 'failed' ? 'error' : 'pending'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="text-rose-600 text-xs max-w-xs truncate" title={r.error}>{r.error}</td>
                <td className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  {r.status === 'failed' && (
                    <button onClick={() => retry(r.id)} className="btn-ghost text-xs">
                      <RefreshCw size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
