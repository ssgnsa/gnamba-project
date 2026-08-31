/**
 * Premium Design System for GNAMBA SERVICES Vitrine Website
 *
 * A sophisticated, professional design language that conveys trust,
 * expertise, and premium quality for the Ivorian real estate/construction market.
 */

// ============================================
// COLOR PALETTE - Inspired by Ivorian landscape & premium branding
// ============================================

export const colors = {
  // Primary - Deep navy/indigo (trust, professionalism)
  primary: {
    50: '#eff1f7',
    100: '#dbe0ec',
    200: '#b8c3db',
    300: '#8fa0c4',
    400: '#687cad',
    500: '#4c5e91',    // Main brand color
    600: '#3d4d75',    // Primary actions
    700: '#303d5c',    // Primary text
    800: '#27314a',    // Deep navy
    900: '#1f293e',    // Near black
    950: '#151e2d',    // Darkest
  },

  // Accent - Warm gold/amber (premium, warmth, Ivorian sun)
  accent: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',    // Warm gold
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  // Success - Emerald (growth, success, nature)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Neutral - Warm slate (sophisticated, not cold)
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },

  // Surface colors for cards, backgrounds
  surface: {
    white: '#ffffff',
    subtle: '#fafafa',
    muted: '#f4f4f5',
    elevated: '#ffffff',
    overlay: 'rgba(15, 30, 45, 0.5)',
  },

  // Semantic
  text: {
    primary: '#18181b',
    secondary: '#3f3f46',
    tertiary: '#71717a',
    inverse: '#ffffff',
    link: '#3d4d75',
    linkHover: '#27314a',
  },

  border: {
    light: '#e4e4e7',
    default: '#d4d4d8',
    strong: '#a1a1aa',
  },
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'Inter Display, Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.1' }],
    '6xl': ['3.75rem', { lineHeight: '1.1' }],
    '7xl': ['4.5rem', { lineHeight: '1.1' }],
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.04em',
    widest: '0.1em',
  },
} as const;

// ============================================
// SPACING SYSTEM (8px base)
// ============================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

// ============================================
// SHADOWS - Layered depth system
// ============================================

export const shadows = {
  // Elevation 1 - Subtle, for cards at rest
  sm: '0 1px 2px 0 rgba(15, 30, 45, 0.03), 0 1px 3px 0 rgba(15, 30, 45, 0.05)',

  // Elevation 2 - Default card shadow
  md: '0 4px 6px -1px rgba(15, 30, 45, 0.04), 0 2px 4px -2px rgba(15, 30, 45, 0.03)',

  // Elevation 3 - Hover state, dropdowns
  lg: '0 10px 15px -3px rgba(15, 30, 45, 0.05), 0 4px 6px -4px rgba(15, 30, 45, 0.04)',

  // Elevation 4 - Modals, popovers
  xl: '0 20px 25px -5px rgba(15, 30, 45, 0.06), 0 8px 10px -6px rgba(15, 30, 45, 0.04)',

  // Elevation 5 - Major overlays
  '2xl': '0 25px 50px -12px rgba(15, 30, 45, 0.1)',

  // Colored shadows for primary elements
  primary: '0 10px 25px -5px rgba(61, 77, 117, 0.25)',
  primaryHover: '0 15px 30px -5px rgba(61, 77, 117, 0.35)',
  accent: '0 10px 25px -5px rgba(234, 179, 8, 0.25)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(15, 30, 45, 0.03)',
} as const;

// ============================================
// TRANSITIONS - Premium feel
// ============================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',

  // Specific transitions
  color: 'color 200ms ease',
  background: 'background-color 200ms ease',
  border: 'border-color 200ms ease',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 200ms ease',
  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// CONTAINER WIDTHS
// ============================================

export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',  // Custom wide container
  full: '100%',
} as const;

// ============================================
// ANIMATION KEYFRAMES (for inline styles)
// ============================================

export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `,
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
} as const;

// ============================================
// COMPONENT STYLE PRESETS
// ============================================

export const componentStyles = {
  // Button variants
  buttons: {
    primary: {
      base: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
      hover: 'hover:-translate-y-0.5 hover:shadow-primary',
      active: 'active:scale-[0.98] active:bg-primary-800',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
    },
    secondary: {
      base: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 focus:ring-primary-500 shadow-sm',
      hover: 'hover:border-primary-300 hover:shadow-sm',
      active: 'active:scale-[0.98] active:bg-primary-100',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    outline: {
      base: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'bg-transparent text-primary-600 border-2 border-primary-200 hover:bg-primary-50 focus:ring-primary-500',
      hover: 'hover:border-primary-300 hover:bg-primary-50',
      active: 'active:scale-[0.98] active:bg-primary-100',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    ghost: {
      base: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      hover: 'hover:bg-primary-50',
      active: 'active:bg-primary-100',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    accent: {
      base: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 shadow-sm hover:shadow-accent',
      hover: 'hover:-translate-y-0.5 hover:shadow-accent',
      active: 'active:scale-[0.98] active:bg-accent-700',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
    },
    whatsapp: {
      base: 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      default: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 shadow-sm',
      hover: 'hover:-translate-y-0.5',
      active: 'active:scale-[0.98] active:bg-emerald-700',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    sizes: {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-8 py-4 text-base gap-2.5',
      xl: 'px-10 py-5 text-lg gap-3',
    },
  },

  // Input variants
  inputs: {
    base: 'w-full px-4 py-3 text-base bg-white border rounded-xl transition-all duration-200',
    default: 'border-neutral-200 placeholder-neutral-400 text-neutral-900',
    focus: 'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    error: 'border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50',
    success: 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50',
    disabled: 'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed',
    label: 'block text-xs font-medium text-neutral-700 mb-1.5',
    errorText: 'mt-1 text-xs text-red-600 font-medium',
    helperText: 'mt-1 text-xs text-neutral-500',
  },

  // Card variants
  cards: {
    base: 'bg-white rounded-2xl border transition-all duration-300',
    default: 'border-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-1',
    elevated: 'border-neutral-200 shadow-md hover:shadow-xl hover:-translate-y-1.5',
    bordered: 'border-neutral-200',
    interactive: 'cursor-pointer',
    featured: 'border-primary-100 shadow-sm ring-1 ring-primary-100/50',
    glass: 'bg-white/80 backdrop-blur-md border-white/20 shadow-lg',
  },

  // Section spacing
  sections: {
    py: 'py-16 sm:py-20 lg:py-24 xl:py-28',
    px: 'px-4 sm:px-6 lg:px-8',
    container: 'max-w-7xl mx-auto',
  },

  // Text gradients
  gradients: {
    primary: 'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent',
    accent: 'bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 bg-clip-text text-transparent',
    hero: 'bg-gradient-to-br from-primary-900/90 via-primary-700/80 to-primary-600/90',
    heroAlt: 'bg-gradient-to-br from-neutral-900 via-primary-900/50 to-primary-700/30',
    card: 'bg-gradient-to-br from-primary-500/10 to-primary-600/5',
    accentCard: 'bg-gradient-to-br from-accent-500/10 to-accent-600/5',
    mesh: 'bg-gradient-to-br from-primary-900/20 via-transparent to-accent-500/10',
  },

  // Patterns
  patterns: {
    grid: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    dots: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M20 20c5.5 0 10-4.5 10-10s-4.5-10-10-10S10 14.5 10 20s4.5 10 10 10zm0-18c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z'/%3E%3C/g%3E%3C/svg%3E")`,
    diagonal: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
  },
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const cx = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getColor = (colorPath: string): string => {
  const keys = colorPath.split('.');
  let value: any = colors;
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return '';
  }
  return value;
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  containers,
  animations,
  componentStyles,
  cx,
  getColor,
};