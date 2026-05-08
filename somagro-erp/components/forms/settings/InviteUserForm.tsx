"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type TenantOption = { id: string; name: string };

type InviteUserFormProps = {
  tenants: TenantOption[];
};

const roles = [
  { value: "visitor", label: "visiteur (site vitrine)" },
  { value: "worker", label: "operateur" },
  { value: "technician", label: "technicien" },
  { value: "veterinarian", label: "veterinaire" },
  { value: "accountant", label: "comptable" },
  { value: "manager", label: "manager" },
  { value: "admin", label: "admin" },
];

export default function InviteUserForm({ tenants }: InviteUserFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("worker");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner l'email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        full_name: fullName || null,
        role,
        tenant_id: tenantId || null,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Invitation impossible.");
      setLoading(false);
      return;
    }

    setSuccess("Invitation envoyee. Le lien a ete transmis par email.");
    setLoading(false);
    router.replace(pathname, { scroll: false });
    router.refresh();
  };

  return (
    <QueryDrawer
      queryKey="create"
      queryValue="invite"
      title="Inviter un utilisateur"
      description="Envoie un email d'invitation et cree le profil automatiquement."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Email" required>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom@entreprise.com"
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
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tenant">
            <select
              className={selectClass}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            >
              <option value="">Tenant par defaut</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer l'invitation"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
