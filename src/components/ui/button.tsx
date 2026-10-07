import { ButtonHTMLAttributes, forwardRef } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className || ''}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
