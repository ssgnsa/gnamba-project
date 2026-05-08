"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import {
  Field,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/forms/Field";

type FieldRecord = {
  id: string;
  name: string | null;
  area_hectares: number | null;
  soil_type: string | null;
  status: string | null;
  notes: string | null;
};

type UpdateFieldFormProps = {
  fields: FieldRecord[];
};

export default function UpdateFieldForm({ fields }: UpdateFieldFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const fieldId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => fields.find((field) => field.id === fieldId) ?? null,
    [fieldId, fields],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [area, setArea] = useState(
    selected?.area_hectares !== null && selected?.area_hectares !== undefined
      ? String(selected.area_hectares)
      : "",
  );
  const [soilType, setSoilType] = useState(selected?.soil_type ?? "");
  const [status, setStatus] = useState(selected?.status ?? "active");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setArea(
      selected.area_hectares !== null && selected.area_hectares !== undefined
        ? String(selected.area_hectares)
        : "",
    );
    setSoilType(selected.soil_type ?? "");
    setStatus(selected.status ?? "active");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(name.trim() && area && fieldId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom et la superficie.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      area_hectares: Number(area),
      soil_type: soilType || null,
      status,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("fields")
      .update(payload)
      .eq("id", fieldId);

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
      queryValue="field"
      eyebrow="Edition"
      title="Modifier la parcelle"
      description="Ajustez la surface, le sol et le statut."
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
        <Field label="Superficie (ha)" required>
          <input
            className={inputClass}
            type="number"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            min="0"
            step="0.01"
          />
        </Field>
        <Field label="Type de sol">
          <input
            className={inputClass}
            value={soilType}
            onChange={(event) => setSoilType(event.target.value)}
          />
        </Field>
        <Field label="Statut">
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">active</option>
            <option value="fallow">fallow</option>
            <option value="retired">retired</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea
            className={textareaClass}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
