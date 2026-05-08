"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 px-3 pb-6 pt-4 sm:px-4 sm:pb-8 sm:pt-6 md:px-6 md:pb-10 md:pt-6">
          {/* Mobile header */}
          <div className="sticky top-0 z-30 mb-4 md:mb-6">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center md:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 hidden sm:block">
                    SomAgro Premium
                  </p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    Vue d&apos;ensemble - pilotage temps reel
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 flex-shrink-0">
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 sm:px-3 sm:py-1 sm:text-xs">
                  sync ok
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 hidden sm:inline sm:text-xs">
                  mode hybrid
                </span>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
