/* eslint-disable react-refresh/only-export-components */
/**
 * Design System React Context & Hooks
 * Provides easy access to design tokens across components
 */

import { createContext, useContext, useMemo, ReactNode } from 'react';
import designSystem from './index';

interface DesignSystemContextValue {
  colors: typeof designSystem.colors;
  typography: typeof designSystem.typography;
  spacing: typeof designSystem.spacing;
  borderRadius: typeof designSystem.borderRadius;
  shadows: typeof designSystem.shadows;
  transitions: typeof designSystem.transitions;
  zIndex: typeof designSystem.zIndex;
  breakpoints: typeof designSystem.breakpoints;
  containers: typeof designSystem.containers;
  componentStyles: typeof designSystem.componentStyles;
  cx: typeof designSystem.cx;
  getColor: typeof designSystem.getColor;
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

interface DesignSystemProviderProps {
  children: ReactNode;
}

export function DesignSystemProvider({ children }: DesignSystemProviderProps) {
  const value = useMemo(() => designSystem, []);

  return (
    <DesignSystemContext.Provider value={value}>
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem(): DesignSystemContextValue {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
}

// Specialized hooks for common use cases
export function useColors() {
  const { colors } = useDesignSystem();
  return colors;
}

export function useSpacing() {
  const { spacing } = useDesignSystem();
  return spacing;
}

export function useComponentStyles() {
  const { componentStyles } = useDesignSystem();
  return componentStyles;
}

export function useButtonStyles(variant: keyof typeof designSystem.componentStyles.buttons = 'primary') {
  const { componentStyles } = useDesignSystem();
  return componentStyles.buttons[variant];
}

export function useInputStyles() {
  const { componentStyles } = useDesignSystem();
  return componentStyles.inputs;
}

export function useCardStyles(variant: keyof typeof designSystem.componentStyles.cards = 'default') {
  const { componentStyles } = useDesignSystem();
  return componentStyles.cards[variant];
}

export function useSectionStyles() {
  const { componentStyles } = useDesignSystem();
  return componentStyles.sections;
}

export function useGradients() {
  const { componentStyles } = useDesignSystem();
  return componentStyles.gradients;
}

export function usePatterns() {
  const { componentStyles } = useDesignSystem();
  return componentStyles.patterns;
}