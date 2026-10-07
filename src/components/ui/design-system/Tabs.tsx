import { forwardRef, useState, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline" | "enclosed";
  fullWidth?: boolean;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  fullWidth = false,
  className,
}: TabsProps) {
  const variantClasses = {
    default: "bg-gray-100 p-1 rounded-xl",
    pills: "",
    underline: "border-b border-gray-200",
    enclosed: "bg-gray-100 p-1 rounded-xl",
  };

  const tabBaseClasses = "flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const tabVariants = {
    default: (isActive: boolean) =>
      cn(
        "px-4 py-2.5 rounded-lg text-sm",
        isActive
          ? "bg-white text-[var(--color-primary)] shadow-sm"
          : "text-gray-600 hover:text-gray-900 hover:bg-white/50",
      ),
    pills: (isActive: boolean) =>
      cn(
        "px-4 py-2.5 rounded-lg text-sm",
        isActive
          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
      ),
    underline: (isActive: boolean) =>
      cn(
        "px-4 py-3 text-sm border-b-2 -mb-px",
        isActive
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
      ),
    enclosed: (isActive: boolean) =>
      cn(
        "px-4 py-2.5 rounded-lg text-sm",
        isActive
          ? "bg-white text-[var(--color-primary)] shadow-sm"
          : "text-gray-600 hover:text-gray-900",
      ),
  };

  const containerClass = cn(
    "flex gap-1",
    fullWidth && "w-full",
    variantClasses[variant],
    variant === "pills" && "gap-2",
    className,
  );

  return (
    <div role="tablist" aria-label="Onglets" className={containerClass}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const TabVariant = tabVariants[variant];
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              tabBaseClasses,
              TabVariant(isActive),
              fullWidth && "flex-1",
              tab.disabled && "cursor-not-allowed",
            )}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && <span className="flex-shrink-0" aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== "" && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs font-semibold rounded-full",
                  variant === "pills" && isActive
                    ? "bg-white/20 text-inherit"
                    : "bg-[var(--color-primary)] text-[var(--color-on-primary)]",
                )}
                aria-label={`${tab.badge} éléments`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  active: boolean;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ id, active, children, className, ...props }, ref) => {
    if (!active) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${id}`}
        aria-labelledby={`tab-${id}`}
        className={cn("animate-fade-in", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

TabPanel.displayName = "TabPanel";

export interface TabsContainerProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline" | "enclosed";
  fullWidth?: boolean;
  className?: string;
  children: (activeTab: string) => ReactNode;
}

export function TabsContainer({
  tabs,
  defaultTab,
  onChange,
  variant = "default",
  fullWidth = false,
  className,
  children,
}: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={cn(className)}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleChange}
        variant={variant}
        fullWidth={fullWidth}
      />
      <div className="mt-4" role="tabpanel" aria-label="Contenu des onglets">
        {children(activeTab)}
      </div>
    </div>
  );
}