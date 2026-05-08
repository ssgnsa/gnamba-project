"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

type CreateCycleFormProps = {
  fields: FieldOption[];
};

export default function CreateCycleForm({ fields }: CreateCycleFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [cropType, setCropType] = useState("");
  const [variety, setVariety] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name && fieldId && cropType && startDate;

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
      name,
      field_id: fieldId,
      crop_type: cropType,
      variety: variety || null,
      start_date: startDate,
      end_date: endDate || null,
      status,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("crop_cycles")
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
      queryValue="cycle"
      title="Nouveau cycle de culture"
      description="Associez un cycle a une parcelle et suivez sa progression."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du cycle" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cycle Mais 2026"
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
            placeholder="Mais"
          />
        </Field>
        <Field label="Variete">
          <input
            className={inputClass}
            value={variety}
            onChange={(event) => setVariety(event.target.value)}
            placeholder="SC 403"
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
