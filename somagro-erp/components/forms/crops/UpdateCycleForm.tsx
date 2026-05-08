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

type FieldOption = {
  id: string;
  name: string | null;
};

type CycleRecord = {
  id: string;
  name: string | null;
  field_id: string;
  field_name: string | null;
  crop_type: string | null;
  variety: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  notes: string | null;
};

type UpdateCycleFormProps = {
  cycles: CycleRecord[];
  fields: FieldOption[];
};

export default function UpdateCycleForm({
  cycles,
  fields,
}: UpdateCycleFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const cycleId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => cycles.find((cycle) => cycle.id === cycleId) ?? null,
    [cycleId, cycles],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [fieldId, setFieldId] = useState(selected?.field_id ?? "");
  const [cropType, setCropType] = useState(selected?.crop_type ?? "");
  const [variety, setVariety] = useState(selected?.variety ?? "");
  const [startDate, setStartDate] = useState(selected?.start_date ?? "");
  const [endDate, setEndDate] = useState(selected?.end_date ?? "");
  const [status, setStatus] = useState(selected?.status ?? "planned");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setFieldId(selected.field_id ?? "");
    setCropType(selected.crop_type ?? "");
    setVariety(selected.variety ?? "");
    setStartDate(selected.start_date ?? "");
    setEndDate(selected.end_date ?? "");
    setStatus(selected.status ?? "planned");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(
    name.trim() && fieldId && cropType && startDate && cycleId,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Veuillez renseigner le nom, la parcelle, le type de culture et la date de debut.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      field_id: fieldId,
      crop_type: cropType,
      variety: variety || null,
      start_date: startDate,
      end_date: endDate || null,
      status,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("crop_cycles")
      .update(payload)
      .eq("id", cycleId);

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
      queryValue="cycle"
      eyebrow="Edition"
      title="Modifier le cycle de culture"
      description="Ajustez les informations du cycle."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du cycle" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Parcelle" required>
          <select
            className={selectClass}
            value={fieldId}
            onChange={(event) => setFieldId(event.target.value)}
          >
            <option value="">-- Selectionner une parcelle --</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name ?? "Parcelle sans nom"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type de culture" required>
          <input
            className={inputClass}
            value={cropType}
            onChange={(event) => setCropType(event.target.value)}
          />
        </Field>
        <Field label="Variete">
          <input
            className={inputClass}
            value={variety}
            onChange={(event) => setVariety(event.target.value)}
          />
        </Field>
        <Field label="Date de debut" required>
          <input
            className={inputClass}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Field>
        <Field label="Date de fin">
          <input
            className={inputClass}
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
        <Field label="Statut">
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="planned">planned</option>
            <option value="growing">growing</option>
            <option value="harvested">harvested</option>
            <option value="failed">failed</option>
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
