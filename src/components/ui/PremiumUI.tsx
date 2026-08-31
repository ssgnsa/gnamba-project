/* eslint-disable react-refresh/only-export-components */
/**
 * Premium UI Components built on the Design System
 * Reusable, consistent, and polished components for the vitrine
 */

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type LabelHTMLAttributes,
} from 'react';
import { cx, componentStyles } from '@/designSystem';

// ============================================
// BUTTON
// ============================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Accept both known variants and any custom variant defined in the design system
  variant?: string;
  // Accept known sizes or custom size keys
  size?: string;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const styles = (componentStyles.buttons as any)[variant] ?? componentStyles.buttons.primary;
    const sizeStyles = (componentStyles.buttons as any).sizes?.[size] ?? (componentStyles.buttons as any).sizes?.md;

    const baseClasses = cx(
      styles.base,
      sizeStyles,
      styles.default,
      styles.hover,
      styles.active,
      styles.disabled,
      fullWidth && 'w-full',
      className
    );

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && iconLeft && <span className="flex-shrink-0" aria-hidden="true">{iconLeft}</span>}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
        {!loading && iconRight && <span className="flex-shrink-0" aria-hidden="true">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// INPUT
// ============================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, iconLeft, iconRight, className = '', id, ...props }, ref) => {
    const styles = componentStyles.inputs;
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const hasLeftIcon = !!iconLeft;
    const hasRightIcon = !!iconRight;

    const inputClasses = cx(
      styles.base,
      styles.default,
      styles.focus,
      error && styles.error,
      props.disabled && styles.disabled,
      className
    );

    const describedBy = cx(errorId, helperId);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" aria-hidden="true">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cx(
              inputClasses,
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10'
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" aria-hidden="true">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// TEXTAREA
// ============================================

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const styles = componentStyles.inputs;
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;

    const textareaClasses = cx(
      styles.base,
      styles.default,
      styles.focus,
      error && styles.error,
      props.disabled && styles.disabled,
      'resize-none',
      className
    );

    const describedBy = cx(errorId, helperId);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// SELECT
// ============================================

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, placeholder, options, className = '', id, ...props }, ref) => {
    const styles = componentStyles.inputs;
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;

    const selectClasses = cx(
      styles.base,
      styles.default,
      styles.focus,
      error && styles.error,
      props.disabled && styles.disabled,
      'bg-white appearance-none',
      className
    );

    const describedBy = cx(errorId, helperId);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================
// LABEL
// ============================================

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', children, ...props }, ref) => {
    const styles = componentStyles.inputs;
    return (
      <label ref={ref} className={cx(styles.label, className)} {...props}>
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';

// ============================================
// CARD
// ============================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // Allow any variant key (mapped to design system keys) for flexibility
  variant?: string;
  interactive?: boolean;
  // Accept named paddings or raw class strings
  padding?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
} as const;

const cardVariantStyles: Record<string, string> = {
  default: componentStyles.cards.default,
  elevated: componentStyles.cards.elevated,
  bordered: componentStyles.cards.bordered,
  featured: componentStyles.cards.featured,
  glass: componentStyles.cards.glass,
  muted: 'bg-neutral-50 border-neutral-200',
  primary: 'bg-primary-50 border-primary-200 text-primary-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  danger: 'bg-red-50 border-red-200 text-red-900',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      interactive = false,
      padding = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const styles = cardVariantStyles[variant] ?? (componentStyles.cards as any).default ?? componentStyles.cards.default;

    const baseClasses = cx(
      componentStyles.cards.base,
      styles,
      interactive && componentStyles.cards.interactive,
      (paddingStyles as any)[padding] ?? padding,
      className
    );

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', padding = 'none', children, ...props }, ref) => (
    <div ref={ref} className={cx('mb-4', paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={cx('font-bold text-neutral-900 text-lg', className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={cx('text-neutral-500 text-sm mt-1', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', padding = 'none', children, ...props }, ref) => (
    <div ref={ref} className={cx(paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', padding = 'none', children, ...props }, ref) => (
    <div ref={ref} className={cx('mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3', paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

// ============================================
// BADGE
// ============================================

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const badgeVariants = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-accent-100 text-accent-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  outline: 'bg-transparent text-neutral-600 border border-neutral-200',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    const baseClasses = cx(
      'inline-flex items-center gap-1.5 font-semibold rounded-full',
      badgeVariants[variant],
      badgeSizes[size],
      className
    );

    return (
      <span ref={ref} className={baseClasses} {...props}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${badgeVariants[variant].replace('bg-', 'bg-').replace('text-', '')}`} aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================
// CONTAINER
// ============================================

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padded?: boolean;
}

const containerSizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1400px]',
  full: 'max-w-full',
};

const paddingStylesContainer = {
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 lg:px-8 xl:px-12',
  xl: 'px-8 lg:px-12 xl:px-16',
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'xl', padded = true, className = '', children, ...props }, ref) => {
    const baseClasses = cx(
      'mx-auto w-full',
      containerSizes[size],
      padded && paddingStylesContainer.md,
      className
    );

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// ============================================
// SECTION
// ============================================

export interface SectionProps extends HTMLAttributes<HTMLElementTagNameMap['section']> {
  variant?: 'default' | 'muted' | 'dark' | 'primary' | 'accent';
  padded?: boolean;
  narrow?: boolean;
}

const sectionVariants = {
  default: 'bg-white',
  muted: 'bg-neutral-50',
  dark: 'bg-neutral-900 text-white',
  primary: 'bg-primary-900 text-white',
  accent: 'bg-accent-50',
};

export const Section = forwardRef<HTMLElementTagNameMap['section'], SectionProps>(
  ({ variant = 'default', padded = true, narrow = false, className = '', children, ...props }, ref) => {
    const baseClasses = cx(
      'w-full',
      sectionVariants[variant],
      padded && 'py-16 sm:py-20 lg:py-24 xl:py-28',
      narrow && 'max-w-4xl mx-auto',
      !narrow && padded && 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      className
    );

    return (
      <section ref={ref} className={baseClasses} {...props}>
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

// ============================================
// GRID
// ============================================

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | { base: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string;
  gapY?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const GRID_COLS_BASE: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const gapStyles = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const gapYStyles = {
  none: 'gap-y-0',
  sm: 'gap-y-4',
  md: 'gap-y-6',
  lg: 'gap-y-8',
  xl: 'gap-y-12',
};

const flexAlignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const resolveGapClass = (value?: string) => {
  if (!value) return '';
  if (value in gapStyles) return gapStyles[value as keyof typeof gapStyles];
  return `gap-[${value}]`;
};

const resolveGapYClass = (value?: string) => {
  if (!value) return '';
  if (value in gapYStyles) return gapYStyles[value as keyof typeof gapYStyles];
  return `gap-y-[${value}]`;
};

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 1, gap = 'md', gapY, align, className = '', children, ...props }, ref) => {
    let gridCols: string = GRID_COLS_BASE[1];

    if (typeof cols === 'number') {
      gridCols = GRID_COLS_BASE[cols] ?? GRID_COLS_BASE[1];
    } else {
      const gridConfig = cols as { base: number; sm?: number; md?: number; lg?: number; xl?: number };
      gridCols = `grid-cols-${gridConfig.base}`;
      if (gridConfig.sm) gridCols += ` sm:grid-cols-${gridConfig.sm}`;
      if (gridConfig.md) gridCols += ` md:grid-cols-${gridConfig.md}`;
      if (gridConfig.lg) gridCols += ` lg:grid-cols-${gridConfig.lg}`;
      if (gridConfig.xl) gridCols += ` xl:grid-cols-${gridConfig.xl}`;
    }

    const currentAlign = align as keyof typeof flexAlignStyles | undefined;
    const baseClasses = cx(
      'grid',
      gridCols,
      resolveGapClass(typeof gap === 'string' ? gap : undefined),
      resolveGapYClass(typeof gapY === 'string' ? gapY : undefined),
      currentAlign ? flexAlignStyles[currentAlign] : '',
      className
    );

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

// ============================================
// FLEX
// ============================================

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string;
  wrap?: boolean;
  smDirection?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  smAlign?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  smJustify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  flex?: boolean;
}

const directionStyles: Record<NonNullable<FlexProps['direction']>, string> = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const alignStyles: Record<NonNullable<FlexProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const flexJustifyStyles: Record<NonNullable<FlexProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({
    direction = 'row',
    align = 'stretch',
    justify = 'start',
    gap = 'md',
    wrap = false,
    smDirection,
    smAlign,
    smJustify,
    flex = false,
    className = '',
    children,
    ...props
  }, ref) => {
    const gapClass = typeof gap === 'string'
      ? (gap in gapStyles ? gapStyles[gap as keyof typeof gapStyles] : `gap-[${gap}]`)
      : '';

    const baseClasses = cx(
      'flex',
      directionStyles[direction],
      alignStyles[align],
      flexJustifyStyles[justify],
      wrap && 'flex-wrap',
      flex && 'flex-1',
      gapClass,
      smDirection ? `sm:${directionStyles[smDirection]}` : '',
      smAlign ? `sm:${alignStyles[smAlign]}` : '',
      smJustify ? `sm:${flexJustifyStyles[smJustify]}` : '',
      className
    );

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';

// ============================================
// DIVIDER
// ============================================

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'dashed' | 'dotted';
  spacing?: 'sm' | 'md' | 'lg';
}

const dividerSpacing = {
  sm: 'my-4',
  md: 'my-6',
  lg: 'my-8',
};

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ orientation = 'horizontal', variant = 'default', spacing = 'md', className = '', ...props }, ref) => {
    const borderStyles = {
      default: 'border-neutral-200',
      dashed: 'border-neutral-200 border-dashed',
      dotted: 'border-neutral-200 border-dotted',
    };

    const baseClasses = cx(
      orientation === 'horizontal' ? 'w-full border-t' : 'h-full border-l',
      dividerSpacing[spacing],
      borderStyles[variant],
      className
    );

    return <hr ref={ref} className={baseClasses} {...props} />;
  }
);

Divider.displayName = 'Divider';

// ============================================
// ICON WRAPPER
// ============================================

export interface IconWrapperProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'accent' | 'ghost';
  shape?: 'rounded' | 'circle' | 'square';
}

const iconSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconVariants = {
  default: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-accent-100 text-accent-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  accent: 'bg-accent-100 text-accent-700',
  ghost: 'bg-transparent text-neutral-600',
};

const iconShapes = {
  rounded: 'rounded-xl',
  circle: 'rounded-full',
  square: 'rounded-lg',
};

export const IconWrapper = forwardRef<HTMLDivElement, IconWrapperProps>(
  ({ size = 'md', variant = 'default', shape = 'rounded', className = '', children, ...props }, ref) => {
    const baseClasses = cx(
      'inline-flex items-center justify-center flex-shrink-0',
      iconSizes[size],
      iconVariants[variant],
      iconShapes[shape],
      className
    );

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

IconWrapper.displayName = 'IconWrapper';

// ============================================
// SKELETON
// ============================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

const skeletonAnimations = {
  pulse: 'animate-pulse',
  wave: 'animate-[shimmer_2s_infinite]',
  none: '',
};

const skeletonStyles = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, animation = 'pulse', className = '', ...props }, ref) => {
    const baseClasses = cx(
      'bg-neutral-200',
      skeletonStyles[variant],
      skeletonAnimations[animation],
      width && `w-${width}`,
      height && `h-${height}`,
      className
    );

    return <div ref={ref} className={baseClasses} {...props} />;
  }
);

Skeleton.displayName = 'Skeleton';

// ============================================
// TOOLTIP
// ============================================

export type TooltipProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
};

export const Tooltip = ({ content, position = 'top', children, delay = 200, ...props }: TooltipProps) => {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900',
  };

  return (
    <div {...props} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} className="relative inline-block">
      {children}
      {visible && (
        <div
          className={cx(
            'absolute z-50 px-3 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg shadow-lg whitespace-nowrap',
            positionStyles[position]
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cx(
              'absolute w-0 h-0 border-4 border-transparent',
              arrowStyles[position]
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';

// ============================================
// ANIMATION HOOKS
// ============================================

import { useEffect, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setIsIntersecting(true);
        setHasAnimated(true);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options });

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return { ref: elementRef, isVisible: isIntersecting || hasAnimated };
}

export function useStaggeredAnimation(itemCount: number, baseDelay = 100) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const { ref, isVisible } = useIntersectionObserver();

  useEffect(() => {
    if (!isVisible) return;

    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < itemCount; i++) {
      timers.push(setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]));
      }, i * baseDelay));
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [isVisible, itemCount, baseDelay]);

  return { ref, visibleItems };
}


// Re-export React for useIntersectionObserver
import * as React from 'react';