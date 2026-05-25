import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Mail } from 'lucide-react';
import { api } from '../api.js';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${tone}`}><Icon size={20} /></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0, total: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.getStats?.().then(setStats).catch(() => {});
    api.getHistory?.({ limit: 5 }).then(setRecent).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-500 text-sm">Overview of payroll email activity</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={Mail} label="Total sent" value={stats.sent} tone="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" />
        <Stat icon={CheckCircle2} label="Success" value={stats.sent} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
        <Stat icon={XCircle} label="Failed" value={stats.failed} tone="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" />
        <Stat icon={Clock} label="Pending" value={stats.pending} tone="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3">Recent activity</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No emails sent yet. Upload a CSV to begin.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr><th className="py-2">Employee</th><th>Email</th><th>Month</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-2">{r.employee_name}</td>
                  <td>{r.email}</td>
                  <td>{r.month}</td>
                  <td><span className={`badge-${r.status === 'sent' ? 'success' : r.status === 'failed' ? 'error' : 'pending'}`}>{r.status}</span></td>
                  <td className="text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
