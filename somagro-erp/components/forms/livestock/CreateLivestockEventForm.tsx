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

type CreateLivestockEventFormProps = {
  lots: Option[];
  animals: Option[];
  users: UserOption[];
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  birth: "naissance",
  death: "deces",
  sale: "vente",
  purchase: "achat",
  transfer_in: "transfert entree",
  transfer_out: "transfert sortie",
};

export default function CreateLivestockEventForm({
  lots,
  animals,
  users,
}: CreateLivestockEventFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [eventType, setEventType] = useState("birth");
  const [lotId, setLotId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [eventDate, setEventDate] = useState("");
  const [reason, setReason] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [price, setPrice] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = eventType && eventDate && quantity;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      event_type: eventType,
      lot_id: lotId || null,
      animal_id: animalId || null,
      quantity: Number(quantity),
      event_date: eventDate,
      reason: reason || null,
      weight_kg: weightKg ? Number(weightKg) : null,
      price: price ? Number(price) : null,
      created_by: createdBy || null,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("livestock_events")
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

  const showPrice = eventType === "sale" || eventType === "purchase";
  const showWeight =
    eventType === "birth" || eventType === "sale" || eventType === "purchase";

  return (
    <QueryDrawer
      queryKey="create"
      queryValue="event"
      title="Nouvel evenement elevage"
      description="Enregistrez une naissance, un deces, une vente ou un mouvement."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type d'evenement" required>
            <select
              className={selectClass}
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Lot">
            <select
              className={selectClass}
              value={lotId}
              onChange={(event) => setLotId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Animal">
            <select
              className={selectClass}
              value={animalId}
              onChange={(event) => setAnimalId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Quantite" required>
            <input
              className={inputClass}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min="1"
            />
          </Field>
          {showWeight && (
            <Field label="Poids (kg)">
              <input
                className={inputClass}
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
              />
            </Field>
          )}
          {showPrice && (
            <Field label="Prix (FCFA)">
              <input
                className={inputClass}
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label="Motif / Raison">
          <input
            className={inputClass}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Cause du deces, raison de la vente..."
          />
        </Field>
        <Field label="Responsable">
          <select
            className={selectClass}
            value={createdBy}
            onChange={(event) => setCreatedBy(event.target.value)}
          >
            <option value="">Selectionner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name ?? user.id}
              </option>
            ))}
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
