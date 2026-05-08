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

type LotOption = { id: string; name: string };

type CreateAnimalFormProps = {
  lots: LotOption[];
};

export default function CreateAnimalForm({ lots }: CreateAnimalFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [identification, setIdentification] = useState("");
  const [lotId, setLotId] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = identification || lotId || rfidTag;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Ajoutez au moins une identification ou un lot.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      identification_number: identification || null,
      lot_id: lotId || null,
      rfid_tag: rfidTag || null,
      birth_date: birthDate || null,
      weight_kg: weight ? Number(weight) : null,
      health_status: healthStatus || null,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("animals")
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
      queryValue="animal"
      title="Ajouter un animal"
      description="Identification individuelle et rattachement au lot."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Identifiant" hint="Boucle, code interne ou reference.">
          <input
            className={inputClass}
            value={identification}
            onChange={(event) => setIdentification(event.target.value)}
            placeholder="RFID-2398"
          />
        </Field>
        <Field label="Lot associe">
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tag RFID">
            <input
              className={inputClass}
              value={rfidTag}
              onChange={(event) => setRfidTag(event.target.value)}
            />
          </Field>
          <Field label="Date naissance">
            <input
              className={inputClass}
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Poids (kg)">
            <input
              className={inputClass}
              type="number"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              min="0"
              step="0.1"
            />
          </Field>
          <Field label="Etat sante">
            <select
              className={selectClass}
              value={healthStatus}
              onChange={(event) => setHealthStatus(event.target.value)}
            >
              <option value="healthy">healthy</option>
              <option value="monitor">monitor</option>
              <option value="critical">critical</option>
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
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
