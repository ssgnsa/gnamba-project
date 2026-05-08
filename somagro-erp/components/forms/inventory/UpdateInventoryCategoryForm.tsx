"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass } from "@/components/forms/Field";

type CategoryRecord = {
  id: string;
  name: string | null;
  unit: string | null;
};

type UpdateInventoryCategoryFormProps = {
  categories: CategoryRecord[];
};

export default function UpdateInventoryCategoryForm({
  categories,
}: UpdateInventoryCategoryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const categoryId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [unit, setUnit] = useState(selected?.unit ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setUnit(selected.unit ?? "");
  }, [selected]);

  const canSubmit = name.trim().length > 0 && categoryId.length > 0;

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

    const { error: updateError } = await supabase
      .from("inventory_categories")
      .update(payload)
      .eq("id", categoryId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  if (!selected) return null;

  return (
    <QueryDrawer
      queryKey="edit"
      queryValue="category"
      eyebrow="Edition"
      title="Modifier la categorie"
      description="Ajustez le nom et l'unite par defaut."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Unite par defaut">
          <input
            className={inputClass}
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
