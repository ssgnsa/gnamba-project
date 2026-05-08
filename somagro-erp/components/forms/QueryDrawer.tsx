"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useMobile";

type QueryDrawerProps = {
  queryKey: string;
  queryValue?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  clearKeys?: string[];
  children: React.ReactNode;
};

export default function QueryDrawer({
  queryKey,
  queryValue = "1",
  eyebrow = "Nouveau",
  title,
  description,
  clearKeys = [],
  children,
}: QueryDrawerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isOpen = searchParams.get(queryKey) === queryValue;

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handleClose = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(queryKey);
    clearKeys.forEach((key) => nextParams.delete(key));
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  // Swipe to close on mobile
  useSwipeGesture(drawerRef, () => handleClose());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0"
        aria-label="Fermer"
      />
      <div
        ref={drawerRef}
        className="relative flex h-full w-full flex-col bg-white shadow-xl sm:max-w-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900 truncate sm:text-lg">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-xs text-slate-500 truncate sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pb-20 sm:pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}
