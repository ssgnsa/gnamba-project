"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    tenantName.trim().length > 0 &&
    tenantSlug.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 5;

  const handleTenantName = (value: string) => {
    setTenantName(value);
    if (!slugTouched) {
      setTenantSlug(slugify(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Veuillez remplir tous les champs et un mot de passe de 6 caracteres minimum.",
      );
      return;
    }
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_name: tenantName.trim(),
        tenant_slug: tenantSlug.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Impossible de creer le compte.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Inscription</h2>
      <p className="mt-2 text-sm text-slate-600">
        Creez votre tenant SomAgro et invitez votre equipe.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Nom de l&apos;exploitation
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="text"
            value={tenantName}
            onChange={(event) => handleTenantName(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Slug tenant
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="text"
            value={tenantSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setTenantSlug(event.target.value);
            }}
            placeholder="somagro"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Nom complet
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mot de passe
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          type="submit"
          disabled={!canSubmit || loading}
        >
          {loading ? "Creation..." : "Creer le compte"}
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        Deja un compte ?{" "}
        <a href="/login" className="text-brand-600">
          Connexion
        </a>
      </p>
    </div>
  );
}
