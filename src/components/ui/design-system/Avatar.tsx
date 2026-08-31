import { forwardRef, type HTMLAttributes, type ReactNode, useState, type ReactElement, cloneElement } from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "rounded" | "square";
  status?: "online" | "offline" | "busy" | "away";
  statusPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  border?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
  "2xl": "w-24 h-24 text-2xl",
};

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

const statusSizes = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-3.5 h-3.5",
  "2xl": "w-4 h-4",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = "",
      fallback,
      size = "md",
      shape = "circle",
      status,
      statusPosition = "bottom-right",
      border = false,
      ...props
    },
    ref,
  ) => {
    const [imageError, setImageError] = useState(false);

    const showFallback = !src || imageError;

    const statusPositionClasses = {
      "bottom-right": "bottom-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "top-right": "top-0 right-0",
      "top-left": "top-0 left-0",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden bg-gray-100",
          "flex-shrink-0",
          sizeClasses[size],
          shapeClasses[shape],
          border && "ring-2 ring-white",
          className,
        )}
        {...props}
      >
        {!showFallback ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/20",
              "text-[var(--color-primary)] font-semibold select-none",
            )}
            aria-hidden="true"
          >
            {fallback || (
              <span>
                {alt
                  ? alt
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </span>
            )}
          </div>
        )}

        {status && (
          <span
            className={cn(
              "absolute rounded-full border-2 border-white",
              statusColors[status],
              statusSizes[size],
              statusPositionClasses[statusPosition],
            )}
            aria-label={`Statut: ${status}`}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  max?: number;
  size?: AvatarProps["size"];
  overlap?: boolean;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max, size = "md", overlap = true, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    const visibleChildren = max ? childArray.slice(0, max) : childArray;
    const remainingCount = max && childArray.length > max ? childArray.length - max : 0;

    return (
      <div
        ref={ref}
        className={cn("flex items-center", overlap ? "-space-x-2" : "space-x-1", className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <span
            key={index}
            className={cn("flex-shrink-0", index > 0 && overlap && "relative z-10")}
            style={{ zIndex: visibleChildren.length - index }}
          >
            {typeof child === "object" && child !== null && "props" in child
              ? cloneElement(child as ReactElement<AvatarProps>, { size })
              : child}
          </span>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              "flex items-center justify-center bg-gray-100 text-gray-600 font-medium border-2 border-white",
              sizeClasses[size],
              shapeClasses.circle,
            )}
            aria-label={`${remainingCount} autres personnes`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  },
);

AvatarGroup.displayName = "AvatarGroup";