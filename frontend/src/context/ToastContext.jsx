import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const icons  = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const colors = {
  success: 'border-l-emerald-500 bg-emerald-50   dark:bg-emerald-500/10  text-emerald-800 dark:text-emerald-200',
  error:   'border-l-red-500    bg-red-50        dark:bg-red-500/10      text-red-800   dark:text-red-200',
  info:    'border-l-blue-500   bg-blue-50       dark:bg-blue-500/10     text-blue-800  dark:text-blue-200',
  warning: 'border-l-yellow-500 bg-yellow-50     dark:bg-yellow-500/10   text-yellow-800 dark:text-yellow-200',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3
              border-l-4 px-4 py-3 rounded-xl min-w-[280px] max-w-sm
              shadow-lg backdrop-blur-sm animate-slide-in-toast
              border border-slate-200 dark:border-transparent
              ${colors[t.type] || colors.info}
            `}
          >
            <span className="text-lg flex-shrink-0">{icons[t.type]}</span>
            <span className="text-sm font-medium">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
