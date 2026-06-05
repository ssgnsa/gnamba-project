import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, DollarSign } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "payment";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    payment: <DollarSign className="w-5 h-5 text-green-500" />,
  };

  const colors = {
    success: "border-green-500 bg-green-50",
    error: "border-red-500 bg-red-50",
    info: "border-blue-500 bg-blue-50",
    payment: "border-green-500 bg-green-50",
  };

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg ${colors[toast.type]} animate-slide-in`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{toast.title}</p>
        <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-50 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
