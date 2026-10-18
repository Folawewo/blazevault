import React from 'react';
import { CheckCircle2, ExternalLink, X } from 'lucide-react';
import { truncateTxid } from '../utils/formatters';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  txid?: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="p-4 rounded-2xl glass-panel border border-emerald-500/40 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 bg-slate-900/95"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-white">{t.title}</div>
            <div className="text-slate-300 mt-0.5 leading-relaxed">{t.description}</div>
            {t.txid && (
              <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                <span>TX: {truncateTxid(t.txid)}</span>
                <a
                  href={`https://chipnet.imaginary.cash/tx/${t.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-0.5 ml-1 text-cyan-400"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
          <button onClick={() => onDismiss(t.id)} className="text-slate-500 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
