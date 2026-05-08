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
type UserOption = { id: string; full_name: string | null };

type InterventionRecord = {
  id: string;
  crop_cycle_id: string | null;
  intervention_type: string | null;
  product_id: string | null;
  quantity_used: number | null;
  unit: string | null;
  application_date: string | null;
  applied_by: string | null;
  notes: string | null;
};

type UpdateInterventionFormProps = {
  cycles: Option[];
  products: Option[];
  users: UserOption[];
  interventions: InterventionRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateInterventionForm({
  cycles,
  products,
  users,
  interventions,
}: UpdateInterventionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const interventionId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () =>
      interventions.find(
        (intervention) => intervention.id === interventionId,
      ) ?? null,
    [interventionId, interventions],
  );

  const [cycleId, setCycleId] = useState(selected?.crop_cycle_id ?? "");
  const [interventionType, setInterventionType] = useState(
    selected?.intervention_type ?? "irrigation",
  );
  const [productId, setProductId] = useState(selected?.product_id ?? "");
  const [quantity, setQuantity] = useState(
    selected?.quantity_used !== null && selected?.quantity_used !== undefined
      ? String(selected.quantity_used)
      : "",
  );
  const [unit, setUnit] = useState(selected?.unit ?? "");
  const [applicationDate, setApplicationDate] = useState(
    toInputDate(selected?.application_date),
  );
  const [appliedBy, setAppliedBy] = useState(selected?.applied_by ?? "");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setCycleId(selected.crop_cycle_id ?? "");
    setInterventionType(selected.intervention_type ?? "irrigation");
    setProductId(selected.product_id ?? "");
    setQuantity(
      selected.quantity_used !== null && selected.quantity_used !== undefined
        ? String(selected.quantity_used)
        : "",
    );
    setUnit(selected.unit ?? "");
    setApplicationDate(toInputDate(selected.application_date));
    setAppliedBy(selected.applied_by ?? "");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(
    cycleId && interventionType && applicationDate && interventionId,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le cycle, le type et la date.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      crop_cycle_id: cycleId,
      intervention_type: interventionType,
      product_id: productId || null,
      quantity_used: quantity ? Number(quantity) : null,
      unit: unit || null,
      application_date: applicationDate,
      applied_by: appliedBy || null,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("crop_interventions")
      .update(payload)
      .eq("id", interventionId);

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
      queryValue="intervention"
      eyebrow="Edition"
      title="Modifier l intervention"
      description="Mettez a jour la date, le produit et les quantites."
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
          <Field label="Type" required>
            <select
              className={selectClass}
              value={interventionType}
              onChange={(event) => setInterventionType(event.target.value)}
            >
              <option value="irrigation">irrigation</option>
              <option value="fertilization">fertilization</option>
              <option value="pesticide">pesticide</option>
              <option value="weeding">weeding</option>
            </select>
          </Field>
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={applicationDate}
              onChange={(event) => setApplicationDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Produit">
            <select
              className={selectClass}
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantite">
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Unite">
            <input
              className={inputClass}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </Field>
          <Field label="Applique par">
            <select
              className={selectClass}
              value={appliedBy}
              onChange={(event) => setAppliedBy(event.target.value)}
            >
              <option value="">Selectionner</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name ?? user.id}
                </option>
              ))}
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
