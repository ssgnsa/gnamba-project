import { RefreshCcw } from "lucide-react";

type SyncRemoteButtonProps = {
  pendingCount: number;
  syncing: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "default" | "compact";
  className?: string;
};

export default function SyncRemoteButton({
  pendingCount,
  syncing,
  onClick,
  disabled = false,
  size = "default",
  className = "",
}: SyncRemoteButtonProps) {
  const sizeClasses =
    size === "compact"
      ? "px-3 py-1.5 rounded-full text-xs font-medium"
      : "px-4 py-2.5 rounded-xl text-sm font-semibold";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || syncing || pendingCount === 0}
      className={`inline-flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses} ${className}`}
      aria-busy={syncing}
    >
      <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
      <span>
        {syncing
          ? "Synchronisation..."
          : `Synchroniser vers le serveur distant${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
      </span>
    </button>
  );
}
