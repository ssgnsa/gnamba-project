import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            SomAgro ERP
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Espace securise
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Acces reserve aux equipes autorisees.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
