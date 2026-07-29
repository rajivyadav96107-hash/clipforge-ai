import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let counter = 0;
const listeners = new Set<(t: Toast) => void>();

export function toast(kind: ToastKind, message: string) {
  const t: Toast = { id: ++counter, kind, message };
  listeners.forEach((l) => l(t));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4200);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info;
        const accent =
          t.kind === 'success'
            ? 'text-accent-400'
            : t.kind === 'error'
            ? 'text-rose-400'
            : 'text-sky-accent';
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-850/95 p-4 shadow-card backdrop-blur-xl animate-fade-up"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${accent}`} />
            <p className="flex-1 text-sm text-slate-200">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
