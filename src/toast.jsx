import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

let nextId = 1;
const subscribers = new Set();
let toasts = [];

function emit() { subscribers.forEach(fn => fn(toasts)); }

export function toast(message, opts = {}) {
  const t = { id: nextId++, message, type: opts.type || 'info', duration: opts.duration ?? 3500 };
  toasts = [...toasts, t];
  emit();
  if (t.duration > 0) setTimeout(() => dismiss(t.id), t.duration);
  return t.id;
}
toast.success = (m, o) => toast(m, { ...o, type: 'success' });
toast.error   = (m, o) => toast(m, { ...o, type: 'error', duration: 6000 });
toast.info    = (m, o) => toast(m, { ...o, type: 'info' });

export function dismiss(id) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error:   <XCircle size={18} className="text-rose-500" />,
  info:    <Info size={18} className="text-brand-500" />,
};
const BORDERS = {
  success: 'border-l-emerald-500',
  error:   'border-l-rose-500',
  info:    'border-l-brand-500',
};

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    subscribers.add(setItems);
    return () => subscribers.delete(setItems);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {items.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto card border-l-4 ${BORDERS[t.type]} px-4 py-3 flex items-start gap-3 shadow-lg animate-slide-in`}
          role="status"
        >
          <div className="mt-0.5">{ICONS[t.type]}</div>
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
