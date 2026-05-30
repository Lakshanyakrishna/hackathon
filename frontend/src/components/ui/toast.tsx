import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/utils/cn';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'border-success/30 bg-success-bg text-success',
  error: 'border-error/30 bg-error-bg text-error',
  warning: 'border-warning/30 bg-warning-bg text-warning',
  info: 'border-info/30 bg-info-bg text-info',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  type,
  title,
  message,
  onClose,
}: {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-up min-w-[320px] max-w-[420px]',
        colors[type],
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="text-xs mt-0.5 opacity-80">{message}</p>}
      </div>
      <button onClick={onClose} className="shrink-0 rounded p-0.5 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
