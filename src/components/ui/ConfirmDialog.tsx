/** ConfirmDialog — Remplace window.confirm() par un modal dialog uniforme.
 * Props : isOpen, title, message, confirmLabel, cancelLabel, variant ("danger" | "warning" | "default"), onConfirm, onCancel, loading?
 * Affiche un modal centré avec 2 boutons.
 * Variant "danger" : bouton rouge.
 * Support clavier : Échap = cancel, Entrée = confirm.
 */
import { FC, useEffect, useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  onConfirm,
  onCancel,
  loading,
}) => {
  // Gestion du clavier : Échap = cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, onCancel]);

  if (!isOpen) return null;

  const variantClasses = {
    danger: "bg-red-100 text-red-800 hover:bg-red-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    default: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${variantClasses[variant]}`}
              disabled={loading}
            >
              {loading ? "Annulation…" : cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? "Validation…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};