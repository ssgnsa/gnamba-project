"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type TenantOption = { id: string; name: string };

type CreateUserFormProps = {
  tenants: TenantOption[];
};

export default function CreateUserForm({ tenants }: CreateUserFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [authId, setAuthId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("manager");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit =
    authId.trim().length > 0 && email.trim().length > 0 && tenantId;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner l'UID auth, l'email et le tenant.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      id: authId.trim(),
      tenant_id: tenantId,
      email: email.trim(),
      full_name: fullName || null,
      role,
      phone: phone || null,
      avatar_url: avatarUrl || null,
      is_active: isActive,
    };

    const { error: insertError } = await supabase.from("users").insert(payload);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  return (
    <QueryDrawer
      queryKey="create"
      queryValue="user"
      title="Nouvel utilisateur"
      description="Profil, role et rattachement au tenant."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="UID Auth" required hint="ID Supabase Auth">
          <input
            className={inputClass}
            value={authId}
            onChange={(event) => setAuthId(event.target.value)}
            placeholder="UUID Supabase"
          />
        </Field>
        <Field label="Email" required>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Nom complet">
          <input
            className={inputClass}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Role">
            <select
              className={selectClass}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="visitor">visiteur (site vitrine)</option>
              <option value="worker">operateur</option>
              <option value="technician">technicien</option>
              <option value="veterinarian">veterinaire</option>
              <option value="accountant">comptable</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <Field label="Tenant" required>
            <select
              className={selectClass}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telephone">
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label="Avatar URL">
            <input
              className={inputClass}
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Actif
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
