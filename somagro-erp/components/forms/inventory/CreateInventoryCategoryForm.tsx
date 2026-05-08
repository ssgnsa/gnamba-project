"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass } from "@/components/forms/Field";

export default function CreateInventoryCategoryForm() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner la categorie.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      unit: unit || null,
    };

    const { error: insertError } = await supabase
      .from("inventory_categories")
      .insert(payload);

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
      queryValue="category"
      title="Nouvelle categorie"
      description="Classez les intrants, materiels et aliments."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aliments"
          />
        </Field>
        <Field label="Unite par defaut">
          <input
            className={inputClass}
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder="kg, sac, litre"
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
