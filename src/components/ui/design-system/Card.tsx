import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  border?: boolean;
}

const variantClasses = {
  default: "bg-white shadow-sm",
  outlined: "bg-white border border-gray-200 shadow-none",
  elevated: "bg-white shadow-lg",
  filled: "bg-gray-50 border border-gray-100",
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", hover = false, border = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-200",
          variantClasses[variant],
          paddingClasses[padding],
          border && "border border-gray-200",
          hover && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  subtitle?: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, subtitle, children, ...props }, ref) => {
    return (
      <div {...props}>
        <h3
          ref={ref}
          className={cn("text-xl font-bold text-gray-900", className)}
        >
          {children}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    );
  },
);

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-500 mt-1", className)}
        {...props}
      >
        {children}
      </p>
    );
  },
);

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    );
  },
);

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-4 pt-4 border-t border-gray-100 flex items-center gap-3", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardFooter.displayName = "CardFooter";

export interface CardGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

export const CardGrid = forwardRef<HTMLDivElement, CardGridProps>(
  ({ className, children, columns = 3, gap = "md", ...props }, ref) => {
    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    const gapClasses = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    return (
      <div
        ref={ref}
        className={cn("grid", columnClasses[columns], gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardGrid.displayName = "CardGrid";