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

type UserOption = { id: string; full_name: string | null };

type CreateInterventionFormProps = {
  cycles: Option[];
  products: Option[];
  users: UserOption[];
};

export default function CreateInterventionForm({
  cycles,
  products,
  users,
}: CreateInterventionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [cycleId, setCycleId] = useState("");
  const [interventionType, setInterventionType] = useState("irrigation");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [appliedBy, setAppliedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = cycleId && interventionType && applicationDate;

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

    const { error: insertError } = await supabase
      .from("crop_interventions")
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
      queryValue="intervention"
      title="Nouvelle intervention"
      description="Irrigation, traitement ou fertilisation."
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
              placeholder="kg, L"
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
