import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 active:opacity-80 focus-visible:ring-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30",
      secondary:
        "bg-[var(--color-secondary)] text-white hover:opacity-90 active:opacity-80 focus-visible:ring-[var(--color-secondary)] shadow-lg shadow-[var(--color-secondary)]/30",
      outline:
        "border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)]/10 active:bg-[var(--color-primary)]/20 focus-visible:ring-[var(--color-primary)]",
      ghost:
        "text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary)]/10 active:bg-[var(--color-primary)]/20 focus-visible:ring-[var(--color-primary)]",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-lg shadow-red-500/30",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 shadow-lg shadow-emerald-500/30",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5 rounded-lg min-h-[36px]",
      md: "px-5 py-2.5 text-base gap-2 rounded-xl min-h-[44px]",
      lg: "px-7 py-3.5 text-lg gap-2.5 rounded-xl min-h-[52px]",
      xl: "px-9 py-4.5 text-xl gap-3 rounded-2xl min-h-[60px]",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], widthClass, className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";