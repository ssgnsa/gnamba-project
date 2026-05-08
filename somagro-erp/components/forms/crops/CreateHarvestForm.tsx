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

type CreateHarvestFormProps = {
  cycles: Option[];
};

export default function CreateHarvestForm({ cycles }: CreateHarvestFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [cycleId, setCycleId] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quality, setQuality] = useState("");
  const [destination, setDestination] = useState("sale");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = cycleId && harvestDate && quantity;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le cycle, la date et la quantite.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      crop_cycle_id: cycleId,
      harvest_date: harvestDate,
      quantity: Number(quantity),
      unit,
      quality_grade: quality || null,
      destination: destination || null,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("harvests")
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
      queryValue="harvest"
      title="Nouvelle recolte"
      description="Quantite, qualite et destination."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Cycle" required>
          <select
            className={selectClass}
            value={cycleId}
            onChange={(event) => setCycleId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={harvestDate}
              onChange={(event) => setHarvestDate(event.target.value)}
            />
          </Field>
          <Field label="Quantite" required>
            <input
              className={inputClass}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min="0"
              step="0.01"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Unite">
            <input
              className={inputClass}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="kg"
            />
          </Field>
          <Field label="Qualite">
            <input
              className={inputClass}
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
              placeholder="A"
            />
          </Field>
          <Field label="Destination">
            <select
              className={selectClass}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="sale">vente</option>
              <option value="storage">stockage</option>
              <option value="transformation">transformation</option>
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
