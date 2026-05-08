"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  intervalMs?: number;
};

export default function AutoRefresh({ intervalMs = 60000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (intervalMs <= 0) return;
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, router]);

  return null;
}
