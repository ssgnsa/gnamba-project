"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type TenantOption = { id: string; name: string; logo_url?: string | null };

type UpdateLogoFormProps = {
  tenants: TenantOption[];
};

export default function UpdateLogoForm({ tenants }: UpdateLogoFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [logoUrl, setLogoUrl] = useState(tenants[0]?.logo_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = tenantId && logoUrl.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez selectionner un tenant et un logo.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("tenants")
      .update({ logo_url: logoUrl.trim() })
      .eq("id", tenantId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  const handleTenantChange = (value: string) => {
    setTenantId(value);
    const selected = tenants.find((tenant) => tenant.id === value);
    setLogoUrl(selected?.logo_url ?? "");
  };

  return (
    <QueryDrawer
      queryKey="create"
      queryValue="logo"
      title="Logo du tenant"
      description="Mettre a jour le logo affiche dans la vitrine et le dashboard."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Tenant" required>
          <select
            className={selectClass}
            value={tenantId}
            onChange={(event) => handleTenantChange(event.target.value)}
          >
            <option value="">Selectionner</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Logo URL" required>
          <input
            className={inputClass}
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
          />
        </Field>
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
