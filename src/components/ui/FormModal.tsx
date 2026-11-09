/** FormModal — Template uniforme pour tous les modaux de formulaire.
 * Props : isOpen, title, subtitle?, onSubmit, onClose, loading, error?, children, submitLabel?, cancelLabel?
 * Header : titre + bouton fermer
 * Footer : Annuler + Submit
 * Gère loading (désactive submit) et error (bandeau rouge).
 * Form HTML natif avec onSubmit.
 */
import { FC, ReactNode } from "react";

interface FormModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading?: boolean;
  error?: string;
  children?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

export const FormModal: FC<FormModalProps> = ({
  isOpen,
  title,
  subtitle,
  onSubmit,
  onClose,
  loading = false,
  error,
  children,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 sm:mx-0 rounded-2xl bg-white shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer le modal"
          >
            ×
          </button>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-t-none rounded-b-0 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
          className="p-6 space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};