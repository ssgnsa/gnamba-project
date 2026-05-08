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

type Option = { id: string; name: string };

type CreateBuildingFormProps = {
  types: Option[];
};

export default function CreateBuildingForm({ types }: CreateBuildingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [code, setCode] = useState("");
  const [constructionDate, setConstructionDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [status, setStatus] = useState("operational");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom du batiment.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name,
      building_type_id: typeId || null,
      code: code || null,
      construction_date: constructionDate || null,
      capacity: capacity ? Number(capacity) : null,
      current_occupancy: occupancy ? Number(occupancy) : null,
      status,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("buildings")
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
      queryValue="building"
      title="Nouveau batiment"
      description="Caracteristiques et capacites."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Poulailler 3"
          />
        </Field>
        <Field label="Type">
          <select
            className={selectClass}
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code">
            <input
              className={inputClass}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="BAT-03"
            />
          </Field>
          <Field label="Date construction">
            <input
              className={inputClass}
              type="date"
              value={constructionDate}
              onChange={(event) => setConstructionDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Capacite">
            <input
              className={inputClass}
              type="number"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              min="0"
            />
          </Field>
          <Field label="Occupation">
            <input
              className={inputClass}
              type="number"
              value={occupancy}
              onChange={(event) => setOccupancy(event.target.value)}
              min="0"
            />
          </Field>
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="operational">operational</option>
              <option value="maintenance">maintenance</option>
              <option value="construction">construction</option>
              <option value="retired">retired</option>
            </select>
          </Field>
        </div>
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
