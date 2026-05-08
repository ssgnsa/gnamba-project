import { headers } from "next/headers";
import { resolveSupabaseConfig } from "@/lib/supabase/config";
import SupabaseStatusClient from "@/components/status/SupabaseStatusClient";

function maskKey(value?: string) {
  if (!value) return "non defini";
  if (value.length <= 10) return `${value.slice(0, 3)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function StatusPage() {
  const host = headers().get("host") ?? "unknown";
  const serverConfig = resolveSupabaseConfig(host);
  const baseMode =
    process.env.SOMAGRO_SUPABASE_MODE ||
    process.env.NEXT_PUBLIC_SUPABASE_MODE ||
    "cloud";
  const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || "";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          SomAgro ERP
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Etat Supabase (hybrid cloud/local)
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Cette page affiche la configuration Supabase choisie cote serveur et
          cote navigateur pour verifier le mode hybrid.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Serveur (Next.js)
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Selection calculee avec <code>resolveSupabaseConfig(host)</code>.
          </p>
          <dl className="mt-4 grid gap-2 text-sm text-slate-700">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Host detecte</dt>
              <dd className="text-slate-600">{host}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Mode base</dt>
              <dd className="text-slate-600">{baseMode}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Mode actif</dt>
              <dd className="text-slate-600">{serverConfig.mode}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">URL Supabase</dt>
              <dd className="text-slate-600">{serverConfig.url}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Anon key</dt>
              <dd className="text-slate-600">
                {maskKey(serverConfig.anonKey)}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Cloud URL definie</dt>
              <dd className="text-slate-600">{cloudUrl ? "oui" : "non"}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-medium">Local URL definie</dt>
              <dd className="text-slate-600">{localUrl ? "oui" : "non"}</dd>
            </div>
          </dl>
        </div>

        <SupabaseStatusClient />
      </div>
    </main>
  );
}
