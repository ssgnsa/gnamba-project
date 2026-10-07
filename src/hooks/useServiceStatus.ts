import { useEffect, useRef, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";

export interface ServiceLink {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  category: "application" | "database" | "api" | "tool";
  status: "online" | "offline";
}

interface UseServiceStatusOptions {
  services: ServiceLink[];
  checkInterval?: number;
  checkTimeout?: number;
  enabled?: boolean;
}

interface UseServiceStatusReturn {
  services: ServiceLink[];
  checking: boolean;
  lastCheck: Date | null;
  checkNow: () => Promise<void>;
}

/**
 * Hook to check service status with periodic polling
 * Only checks HTTP services, assumes others are online
 */
export function useServiceStatus({
  services,
  checkInterval = 60000, // 1 minute default
  checkTimeout = 3000,
  enabled = true,
}: UseServiceStatusOptions): UseServiceStatusReturn {
  const [serviceStatus, setServiceStatus] = useState<ServiceLink[]>(services);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const isFirstCheckRef = useRef(true);

  // Check a single service
  const checkService = useCallback(async (service: ServiceLink): Promise<ServiceLink> => {
    // Non-HTTP services are assumed online
    if (!service.url.startsWith("http")) {
      return { ...service, status: "online" };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), checkTimeout);

      // Use HEAD for lighter check, fallback to GET if needed
      await fetch(service.url, {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors", // Allow cross-origin
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      return { ...service, status: "online" };
    } catch {
      return { ...service, status: "offline" };
    }
  }, [checkTimeout]);

  // Check all services
  const checkNow = useCallback(async () => {
    if (!enabled || checking) return;

    setChecking(true);
    try {
      const updatedServices = await Promise.all(
        serviceStatus.map((service) => checkService(service))
      );

      if (mountedRef.current) {
        setServiceStatus(updatedServices);
        setLastCheck(new Date());
      }
    } finally {
      if (mountedRef.current) {
        setChecking(false);
      }
    }
  }, [serviceStatus, checkService, enabled, checking]);

  // Setup interval
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    if (isFirstCheckRef.current) {
      isFirstCheckRef.current = false;
      checkNow();
    }

    // Periodic checks
    intervalRef.current = setInterval(() => {
      checkNow();
    }, checkInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, checkInterval, checkNow]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { services: serviceStatus, checking, lastCheck, checkNow };
}