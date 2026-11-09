/** PageHeader — En-tête standardisé pour toutes les pages CRUD.
 * Layout : titre + subtitle à gauche, actions à droite.
 * Responsive : les actions passent en dessous sur mobile.
 */
import { FC } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: { label: string; icon: string; onClick: () => void; variant?: "danger" | "warning" | "default"; disabled?: boolean }[];
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = [],
}) => {
  const handleAction = (onClick: () => void, disabled: boolean) => {
    if (disabled) return;
    onClick();
  };

  return (
    <header className="border-b border-gray-200 pb-4 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 sm:flex-order-2">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex sm:order-1 gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.onClick, action.disabled)}
                disabled={action.disabled}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  action.variant === "danger"
                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                    : action.variant === "warning"
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
                aria-label={action.label}
                title={action.label}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};