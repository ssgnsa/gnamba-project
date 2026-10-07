import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      fullWidth = true,
      id: providedId,
      type = "text",
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = !!error;

    const describedBy = [hasError && errorId, hint && hintId].filter(Boolean).join(" ");

    return (
      <div className={cn("w-full", fullWidth ? "w-full" : "")}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1.5",
              required && "after:content-['*'] after:text-red-500 after:ml-0.5",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {leftElement}
            </div>
          )}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy || undefined}
            className={cn(
              "w-full rounded-xl border bg-white text-gray-900 placeholder:text-gray-400",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              "min-h-[44px] px-4 py-3 text-base",
              leftElement && "pl-10",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              rightIcon && "pr-10",
              hasError
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 hover:border-gray-300",
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {rightElement}
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
          {hasError && (
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, hint, fullWidth = true, id: providedId, disabled, required, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = !!error;

    const describedBy = [hasError && errorId, hint && hintId].filter(Boolean).join(" ");

    return (
      <div className={cn("w-full", fullWidth ? "w-full" : "")}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1.5",
              required && "after:content-['*'] after:text-red-500 after:ml-0.5",
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full rounded-xl border bg-white text-gray-900 placeholder:text-gray-400",
            "transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            "min-h-[120px] px-4 py-3 text-base",
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 hover:border-gray-300",
            className,
          )}
          {...props}
        />
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, placeholder, options, fullWidth = true, id: providedId, disabled, required, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = !!error;

    const describedBy = [hasError && errorId, hint && hintId].filter(Boolean).join(" ");

    return (
      <div className={cn("w-full", fullWidth ? "w-full" : "")}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1.5",
              required && "after:content-['*'] after:text-red-500 after:ml-0.5",
            )}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full rounded-xl border bg-white text-gray-900",
            "transition-all duration-200 appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            "min-h-[44px] px-4 py-3 text-base pr-10",
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 hover:border-gray-300",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {hasError && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
        {!hasError && hint && (
          <p id={hintId} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, id: providedId, disabled, required, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            disabled={disabled}
            required={required}
            aria-describedby={description ? `${id}-desc` : undefined}
            className={cn(
              "w-5 h-5 rounded border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:ring-offset-2",
              "checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)]",
              "indeterminate:bg-[var(--color-primary)] indeterminate:border-[var(--color-primary)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "border-gray-300 text-[var(--color-primary)]",
              className,
            )}
            {...props}
          />
          {indeterminate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-0.5 bg-white rounded" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor={id}
            className={cn(
              "block text-sm font-medium text-gray-900 cursor-pointer select-none",
              disabled && "text-gray-400 cursor-not-allowed",
            )}
          >
            {label}
          </label>
          {description && (
            <p id={`${id}-desc`} className="mt-0.5 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export interface RadioGroupProps {
  className?: string;
  label: string;
  name: string;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  direction?: "vertical" | "horizontal";
  required?: boolean;
  error?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, label, name, options, value, onChange, direction = "vertical", required, error, ...props }, ref) => {
    const generatedId = useId();
    const groupId = generatedId;
    const errorId = `${groupId}-error`;
    const hasError = !!error;

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <fieldset className="border-0 p-0">
          <legend className={cn("text-sm font-medium text-gray-700 mb-3", required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
            {label}
          </legend>
          <div className={cn("space-y-3", direction === "horizontal" && "flex flex-wrap gap-6")}>
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-start gap-3 cursor-pointer select-none transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  direction === "horizontal" && "flex-shrink-0",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange?.(option.value)}
                  disabled={option.disabled}
                  required={required}
                  className={cn(
                    "w-5 h-5 mt-0.5 border-2 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:ring-offset-2",
                    "checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)]",
                    "disabled:opacity-50",
                    "border-gray-300 text-[var(--color-primary)]",
                  )}
                  aria-describedby={hasError ? errorId : undefined}
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                  {option.description && (
                    <span className="block text-sm text-gray-500 mt-0.5">{option.description}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
          {hasError && (
            <p id={errorId} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </p>
          )}
        </fieldset>
      </div>
    );
  },
);

RadioGroup.displayName = "RadioGroup";

export interface SwitchProps {
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = "md", id: providedId, disabled, required, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    const sizeClasses = {
      sm: "w-8 h-5",
      md: "w-11 h-6",
      lg: "w-14 h-7",
    };

    const thumbSizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const thumbTranslateClasses = {
      sm: "translate-x-4",
      md: "translate-x-5",
      lg: "translate-x-7",
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            role="switch"
            disabled={disabled}
            required={required}
            aria-describedby={description ? `${id}-desc` : undefined}
            className={cn(
              "peer appearance-none rounded-full border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:ring-offset-2",
              "checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "border-gray-300 bg-gray-200",
              sizeClasses[size],
              className,
            )}
            {...props}
          />
          <span
            className={cn(
              "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-transform duration-200",
              "peer-checked:translate-x-full",
              thumbSizeClasses[size],
              thumbTranslateClasses[size],
              "pointer-events-none",
            )}
            aria-hidden="true"
          />
        </div>
        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  "block text-sm font-medium text-gray-900 cursor-pointer select-none",
                  disabled && "text-gray-400 cursor-not-allowed",
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={`${id}-desc`} className="mt-0.5 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";