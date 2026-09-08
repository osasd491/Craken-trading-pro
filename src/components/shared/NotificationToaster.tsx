import React, { useEffect, useState, useRef } from 'react';
import { Bell, CheckCircle2, TrendingUp, MessageSquare, DollarSign, X } from 'lucide-react';
import { SystemNotification } from '../../types';
import { StoreService } from '../../services/store';

export const NotificationToaster: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const [activeToasts, setActiveToasts] = useState<SystemNotification[]>([]);
  // Track processed notification IDs across renders and StrictMode remounts
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Initialize with initial existing notification IDs so historical/seed notifications do not fire as live push alerts
  useEffect(() => {
    const initialState = StoreService.getState();
    if (initialState.notifications) {
      initialState.notifications.forEach((n) => {
        processedIdsRef.current.add(n.id);
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = StoreService.subscribe((state) => {
      const latest = state.notifications[0];
      if (latest && !processedIdsRef.current.has(latest.id)) {
        processedIdsRef.current.add(latest.id);

        // Check if belongs to user or global
        if (!latest.userId || latest.userId === currentUserId) {
          setActiveToasts((prev) => {
            // Strictly guarantee unique keys by filtering out any matching id
            const filtered = prev.filter((t) => t.id !== latest.id);
            return [latest, ...filtered.slice(0, 2)];
          });

          // Auto dismiss after 6.5s
          setTimeout(() => {
            setActiveToasts((prev) => prev.filter((t) => t.id !== latest.id));
          }, 6500);
        }
      }
    });

    return unsubscribe;
  }, [currentUserId]);

  const dismiss = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => {
        let icon = <Bell className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderClass = 'border-emerald-500/40 bg-slate-900/95';

        if (toast.type === 'profit') {
          icon = <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/60 bg-emerald-950/90';
        } else if (toast.type === 'withdrawal') {
          icon = <DollarSign className="w-5 h-5 text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/50 bg-slate-900/95';
        } else if (toast.type === 'chat') {
          icon = <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0" />;
          borderClass = 'border-cyan-500/50 bg-slate-900/95';
        } else if (toast.type === 'kyc') {
          icon = <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />;
          borderClass = 'border-blue-500/50 bg-slate-900/95';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-white transition-all transform animate-in slide-in-from-bottom-2 duration-300 ${borderClass}`}
          >
            <div className="p-1.5 rounded-lg bg-white/10">{icon}</div>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-sm tracking-tight text-white mb-0.5">{toast.title}</div>
              <p className="text-slate-300 leading-relaxed">{toast.message}</p>
              <div className="text-[10px] text-slate-400 mt-1">Just now • Live Push Notice</div>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
