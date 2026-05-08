interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

/**
 * Composant de skeleton pour les états de chargement
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  count = 1,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200 rounded";

  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "",
    card: "rounded-2xl p-4",
  };

  const style = {
    width: width || "100%",
    height: height || (variant === "text" ? "1rem" : undefined),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

/**
 * Skeleton pour les cartes métriques
 */
export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton variant="text" width="60%" height="0.75rem" />
        <Skeleton variant="rectangular" width="40px" height="20px" />
      </div>
      <div className="mt-2 flex items-center gap-2 sm:mt-3">
        <Skeleton variant="circular" width="8px" height="8px" />
        <Skeleton variant="text" width="50%" height="1.5rem" />
      </div>
      <Skeleton
        variant="text"
        width="70%"
        height="0.75rem"
        className="mt-1.5 sm:mt-2"
      />
    </div>
  );
}

/**
 * Skeleton pour les cartes de données
 */
export function DataCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2 mb-3">
        <Skeleton variant="circular" width="32px" height="32px" />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height="0.875rem" />
          <Skeleton
            variant="text"
            width="40%"
            height="0.75rem"
            className="mt-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" height="1rem" />
        <Skeleton variant="text" width="85%" height="1rem" />
        <Skeleton variant="text" width="70%" height="1rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour les lignes de tableau
 */
export function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant="text" width="40%" height="1rem" />
            <Skeleton variant="rectangular" width="60px" height="24px" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="text" width="30%" height="0.875rem" />
            <Skeleton variant="text" width="25%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
