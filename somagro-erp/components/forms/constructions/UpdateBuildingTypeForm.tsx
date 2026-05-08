"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type BuildingTypeRecord = {
  id: string;
  name: string | null;
  category: string | null;
};

type UpdateBuildingTypeFormProps = {
  types: BuildingTypeRecord[];
};

export default function UpdateBuildingTypeForm({
  types,
}: UpdateBuildingTypeFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const typeId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => types.find((type) => type.id === typeId) ?? null,
    [typeId, types],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [category, setCategory] = useState(selected?.category ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setCategory(selected.category ?? "");
  }, [selected]);

  const canSubmit = Boolean(name.trim() && typeId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le type de batiment.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      category: category || null,
    };

    const { error: updateError } = await supabase
      .from("building_types")
      .update(payload)
      .eq("id", typeId);

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
      queryValue="building-type"
      eyebrow="Edition"
      title="Modifier le type de batiment"
      description="Ajustez la designation et la categorie."
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
        <Field label="Categorie">
          <select
            className={selectClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Selectionner</option>
            <option value="livestock">elevage</option>
            <option value="storage">stockage</option>
            <option value="crop">culture</option>
            <option value="mixed">mixte</option>
          </select>
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
