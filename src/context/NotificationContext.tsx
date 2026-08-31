import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Toast, ToastType } from "../components/ui/Toast";
import { generateUUID } from "../utils/reference";

interface NotificationContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  showPaymentNotification: (tenantName: string, amount: number, property?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration?: number) => {
    const newToast: Toast = {
      id: generateUUID(),
      type,
      title,
      message,
      duration: duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showPaymentNotification = useCallback((tenantName: string, amount: number, property?: string) => {
    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount);

    const message = property
      ? `${tenantName} a payé ${formattedAmount} pour ${property}`
      : `${tenantName} a payé ${formattedAmount}`;

    showToast("payment", "💰 Nouveau paiement reçu", message, 8000);
  }, [showToast]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        showPaymentNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
