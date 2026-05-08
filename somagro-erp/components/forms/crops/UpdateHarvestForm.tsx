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

type Option = { id: string; name: string };

type HarvestRecord = {
  id: string;
  crop_cycle_id: string | null;
  harvest_date: string | null;
  quantity: number | null;
  unit: string | null;
  quality_grade: string | null;
  destination: string | null;
  notes: string | null;
};

type UpdateHarvestFormProps = {
  cycles: Option[];
  harvests: HarvestRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateHarvestForm({
  cycles,
  harvests,
}: UpdateHarvestFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const harvestId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => harvests.find((harvest) => harvest.id === harvestId) ?? null,
    [harvestId, harvests],
  );

  const [cycleId, setCycleId] = useState(selected?.crop_cycle_id ?? "");
  const [harvestDate, setHarvestDate] = useState(
    toInputDate(selected?.harvest_date),
  );
  const [quantity, setQuantity] = useState(
    selected?.quantity !== null && selected?.quantity !== undefined
      ? String(selected.quantity)
      : "",
  );
  const [unit, setUnit] = useState(selected?.unit ?? "kg");
  const [quality, setQuality] = useState(selected?.quality_grade ?? "");
  const [destination, setDestination] = useState(
    selected?.destination ?? "sale",
  );
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setCycleId(selected.crop_cycle_id ?? "");
    setHarvestDate(toInputDate(selected.harvest_date));
    setQuantity(
      selected.quantity !== null && selected.quantity !== undefined
        ? String(selected.quantity)
        : "",
    );
    setUnit(selected.unit ?? "kg");
    setQuality(selected.quality_grade ?? "");
    setDestination(selected.destination ?? "sale");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(cycleId && harvestDate && quantity && harvestId);

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

    const { error: updateError } = await supabase
      .from("harvests")
      .update(payload)
      .eq("id", harvestId);

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
      queryValue="harvest"
      eyebrow="Edition"
      title="Modifier la recolte"
      description="Ajustez la quantite, la qualite et la destination."
      clearKeys={["id"]}
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
            />
          </Field>
          <Field label="Qualite">
            <input
              className={inputClass}
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
