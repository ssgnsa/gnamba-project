import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
    const variants: Record<string, string> = {
      primary: "bg-brand-600 text-white hover:bg-brand-700",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
