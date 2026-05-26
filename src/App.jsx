import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Upload, History, FileText, Settings, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster } from './toast.jsx';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload CSV', icon: Upload },
  { to: '/history', label: 'History', icon: History },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-lg font-bold text-brand-600">Payroll Email</h1>
          <p className="text-xs text-slate-500">HR Automation Suite</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setDark(!dark)}
          className="m-3 btn-ghost text-sm justify-start"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? 'Light' : 'Dark'} mode
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8"><Outlet /></main>
      <Toaster />
    </div>
  );
}
