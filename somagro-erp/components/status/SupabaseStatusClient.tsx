"use client";

import { useEffect, useState } from "react";

type ClientSupabaseConfig = {
  url?: string;
  anonKey?: string;
  mode?: "cloud" | "local";
};

function maskKey(value?: string) {
  if (!value) return "non defini";
  if (value.length <= 10) return `${value.slice(0, 3)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function SupabaseStatusClient() {
  const [config, setConfig] = useState<ClientSupabaseConfig | null>(null);
  const [host, setHost] = useState<string>("?");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = (
      window as Window & { __SOMAGRO_SUPABASE__?: ClientSupabaseConfig }
    ).__SOMAGRO_SUPABASE__;
    if (payload) setConfig(payload);
    setHost(window.location.host);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Client (navigateur)
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Cette section lit la configuration injectee dans le navigateur via{" "}
        <code>window.__SOMAGRO_SUPABASE__</code>.
      </p>
      <dl className="mt-4 grid gap-2 text-sm text-slate-700">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium">Host detecte</dt>
          <dd className="text-slate-600">{host}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium">Mode actif</dt>
          <dd className="text-slate-600">{config?.mode ?? "non defini"}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium">URL Supabase</dt>
          <dd className="text-slate-600">{config?.url ?? "non definie"}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="font-medium">Anon key</dt>
          <dd className="text-slate-600">{maskKey(config?.anonKey)}</dd>
        </div>
      </dl>
    </div>
  );
}
