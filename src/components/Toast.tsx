import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, PlusCircle, AlertTriangle, Info, X, Bell } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success' || !toast.type;
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-2xl shadow-xl border p-3.5 sm:p-4 backdrop-blur-md flex items-start gap-3 transition-colors ${
                isSuccess
                  ? 'bg-white/95 dark:bg-[#0d1627]/95 border-emerald-500/40 text-gray-900 dark:text-white'
                  : isWarning
                  ? 'bg-white/95 dark:bg-[#1f1508]/95 border-amber-500/50 text-gray-900 dark:text-white'
                  : isError
                  ? 'bg-white/95 dark:bg-[#200d0d]/95 border-red-500/50 text-gray-900 dark:text-white'
                  : 'bg-white/95 dark:bg-[#0c162c]/95 border-blue-500/40 text-gray-900 dark:text-white'
              }`}
            >
              {/* Icono temático */}
              <div
                className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                    : isWarning
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                    : isError
                    ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-950/80 text-[#00236f] dark:text-blue-300'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {isError && <AlertTriangle className="w-5 h-5" />}
                {isInfo && <Info className="w-5 h-5" />}
              </div>

              {/* Contenido textual */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug line-clamp-2">
                    {toast.message}
                  </p>
                )}

                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00236f] text-white text-[11px] font-bold hover:bg-[#183375] transition active:scale-95"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{toast.action.label}</span>
                  </button>
                )}
              </div>

              {/* Botón de cerrar */}
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
