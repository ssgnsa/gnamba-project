import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  subItems?: DropdownItem[];
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
  maxHeight?: string;
}

export function Dropdown({
  trigger: _trigger,
  items,
  onSelect,
  placeholder,
  value,
  disabled = false,
  align = "left",
  className,
  maxHeight = "280px",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect(item.value);
    setIsOpen(false);
  };

  const renderItems = (items: DropdownItem[], level = 0) => (
    <div
      role="menu"
      className={cn(
        "py-1",
        level > 0 && "absolute left-full top-0 ml-1 min-w-[200px]",
      )}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <hr key={`divider-${index}`} className="my-1 border-gray-100" role="separator" />
          );
        }

        const isSubmenu = item.subItems && item.subItems.length > 0;

        return (
          <div
            key={item.value}
            className="relative"
          >
            <button
              onClick={() => !isSubmenu && handleItemClick(item)}
              disabled={item.disabled}
              role={isSubmenu ? "menuitem" : "menuitem"}
              aria-haspopup={isSubmenu}
              aria-expanded={isSubmenu ? isOpen : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                "focus:outline-none focus:bg-gray-50",
                item.disabled && "opacity-50 cursor-not-allowed",
                item.danger && "text-red-600 hover:bg-red-50",
                !item.danger && !item.disabled && "text-gray-700 hover:bg-gray-50",
                value === item.value && !item.danger && "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
              )}
            >
              {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
              <span className="flex-1 text-left truncate">{item.label}</span>
              {value === item.value && !item.danger && (
                <Check size={16} className="text-[var(--color-primary)] flex-shrink-0" />
              )}
              {isSubmenu && <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
            </button>
            {isSubmenu && (
              <div className="absolute left-full top-0 ml-1 min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                {renderItems(item.subItems!, level + 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const selectedItem = items.find((item) => item.value === value);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border",
          "bg-white text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-h-[44px] min-w-[200px]",
          "border-gray-200 hover:border-gray-300",
          isOpen && "border-[var(--color-primary)] shadow-sm",
        )}
      >
        <span className="truncate flex-1 text-left">
          {selectedItem?.label || placeholder || "Sélectionner..."}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "flex-shrink-0 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100",
            "min-w-[200px] max-h-[280px] overflow-y-auto",
            align === "left" ? "left-0" : "right-0",
            "animate-fade-in",
          )}
          style={{ maxHeight }}
          role="menu"
        >
          {renderItems(items)}
        </div>
      )}

      {/* Focus trap for accessibility */}
      {isOpen && (
        <button
          tabIndex={-1}
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export interface SelectDropdownProps extends DropdownProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export function SelectDropdown({
  label,
  error,
  hint,
  required,
  fullWidth = true,
  className,
  ...props
}: SelectDropdownProps) {
  const wrapperClassName = cn("w-full", fullWidth ? "w-full" : "", className);

  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <Dropdown {...props} />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export interface ActionMenuProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  align?: "left" | "right";
}

export function ActionMenu({ items, trigger, align = "right" }: ActionMenuProps) {
  return (
    <Dropdown
      trigger={
        trigger || (
          <Button variant="ghost" size="sm" aria-label="Menu d'actions">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        )
      }
      items={items}
      onSelect={() => {}}
      align={align}
    />
  );
}