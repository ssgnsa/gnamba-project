import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const handleBack = () => {
    if (items.length > 1 && items[items.length - 2].onClick) {
      items[items.length - 2].onClick?.();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Bouton Retour */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        title="Retour (Alt + ←)"
      >
        <ChevronRight size={16} className="rotate-180" />
        <span className="hidden sm:inline">Retour</span>
      </button>

      <span className="text-gray-300">/</span>

      {/* Home */}
      <button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("egs:navigate", { detail: "dashboard" }),
          )
        }
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        title="Accueil"
      >
        <Home size={14} />
      </button>

      <span className="text-gray-300">/</span>

      {/* Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {isLast ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <>
                <button
                  onClick={item.onClick}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </button>
                <span className="text-gray-300">/</span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
