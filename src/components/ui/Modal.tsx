import { ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const shouldRestoreFocus = useRef(false);
  const previousBodyOverflow = useRef("");

  const getFocusableElements = useCallback(
    () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ),
    [],
  );

  const getPreferredFocusTarget = useCallback(() => {
    if (!modalRef.current) return null;

    const autoFocusTarget = modalRef.current.querySelector<HTMLElement>(
      '[data-autofocus="true"]',
    );
    if (autoFocusTarget && !autoFocusTarget.hasAttribute("disabled")) {
      return autoFocusTarget;
    }

    const editableTarget = modalRef.current.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    if (editableTarget) return editableTarget;

    return getFocusableElements()[0] || null;
  }, [getFocusableElements]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Set initial focus when the modal opens.
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    shouldRestoreFocus.current = true;

    const focusTimer = window.setTimeout(() => {
      const currentActiveElement = document.activeElement as HTMLElement | null;
      if (
        currentActiveElement &&
        modalRef.current?.contains(currentActiveElement)
      ) {
        return;
      }

      getPreferredFocusTarget()?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [getPreferredFocusTarget, isOpen]);

  // Restore focus only when the modal actually closes.
  useEffect(() => {
    if (isOpen || !shouldRestoreFocus.current) return;

    shouldRestoreFocus.current = false;
    previousActiveElement.current?.focus?.();
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousBodyOverflow.current;
    }
    return () => {
      document.body.style.overflow = previousBodyOverflow.current;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCloseRef.current();
      return;
    }

    if (e.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (
        document.activeElement === firstEl ||
        document.activeElement === modalRef.current
      ) {
        e.preventDefault();
        lastEl.focus();
      }
      return;
    }

    if (document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`relative bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_24px_64px_rgba(15,23,42,0.24)] w-full mx-0 sm:mx-4 ${sizeClasses[size]} max-h-[min(92vh,calc(100dvh-0.75rem))] sm:max-h-[90vh] flex flex-col border border-slate-200/80`}
        style={{ paddingBottom: "max(0px, var(--sab))" }}
      >
        <div className="px-4 sm:px-6 py-4 pr-16 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 id={titleId} className="text-lg font-semibold text-slate-800">
            {title}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        <button
          type="button"
          aria-label="Fermer le formulaire"
          onClick={onClose}
          className="absolute right-4 sm:right-6 top-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
