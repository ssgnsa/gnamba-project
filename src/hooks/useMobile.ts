import { useState, useEffect, useMemo } from "react";

interface MobileBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const BREAKPOINTS: MobileBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

interface UseMobileReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  viewportWidth: number;
  breakpoints: MobileBreakpoints;
}

/**
 * Hook pour détecter le type d'appareil et gérer le responsive
 * Optimisé pour Android Chrome et autres navigateurs mobiles
 */
export function useMobile(): UseMobileReturn {
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1024;
    return window.visualViewport?.width || window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    let timeoutId: number | null = null;

    const commitViewportWidth = () => {
      setViewportWidth(window.visualViewport?.width || window.innerWidth);
    };

    const handleResize = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(commitViewportWidth, 100);
    };

    const handleOrientationChange = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(commitViewportWidth, 180);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, {
      passive: true,
    });
    viewport?.addEventListener("resize", handleResize);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      viewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return useMemo(() => {
    const isSmallMobile = viewportWidth < 375; // < iPhone SE
    const isLargeMobile =
      viewportWidth >= 375 && viewportWidth < BREAKPOINTS.sm;
    const isMobile = viewportWidth < BREAKPOINTS.md;
    const isTablet =
      viewportWidth >= BREAKPOINTS.md && viewportWidth < BREAKPOINTS.lg;
    const isDesktop = viewportWidth >= BREAKPOINTS.lg;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isSmallMobile,
      isLargeMobile,
      viewportWidth,
      breakpoints: BREAKPOINTS,
    };
  }, [viewportWidth]);
}

/**
 * Hook pour détecter si l'appareil est tactile
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkTouch = () => {
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook pour gérer les gestes mobiles (swipe, etc.)
 */
export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart === null) return;
      const touchEnd = e.touches[0].clientX;
      const diff = touchStart - touchEnd;

      // Swipe détecté si > 50px
      if (Math.abs(diff) > 50) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight();
        }
        setTouchStart(null);
      }
    };

    const handleTouchEnd = () => {
      setTouchStart(null);
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, touchStart, onSwipeLeft, onSwipeRight]);
}

/**
 * Hook pour gérer le safe area sur les appareils avec encoche
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const env = getComputedStyle(document.documentElement);
    const top = parseInt(env.getPropertyValue("--sat")) || 0;
    const right = parseInt(env.getPropertyValue("--sar")) || 0;
    const bottom = parseInt(env.getPropertyValue("--sab")) || 0;
    const left = parseInt(env.getPropertyValue("--sal")) || 0;

    setSafeArea({ top, right, bottom, left });
  }, []);

  return safeArea;
}
