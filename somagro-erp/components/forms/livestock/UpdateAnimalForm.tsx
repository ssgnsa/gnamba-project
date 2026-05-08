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

type LotOption = { id: string; name: string };

type AnimalRecord = {
  id: string;
  identification_number: string | null;
  lot_id: string | null;
  rfid_tag: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  health_status: string | null;
  notes: string | null;
};

type UpdateAnimalFormProps = {
  lots: LotOption[];
  animals: AnimalRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateAnimalForm({
  lots,
  animals,
}: UpdateAnimalFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const animalId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => animals.find((animal) => animal.id === animalId) ?? null,
    [animalId, animals],
  );

  const [identification, setIdentification] = useState(
    selected?.identification_number ?? "",
  );
  const [lotId, setLotId] = useState(selected?.lot_id ?? "");
  const [rfidTag, setRfidTag] = useState(selected?.rfid_tag ?? "");
  const [birthDate, setBirthDate] = useState(toInputDate(selected?.birth_date));
  const [weight, setWeight] = useState(
    selected?.weight_kg !== null && selected?.weight_kg !== undefined
      ? String(selected.weight_kg)
      : "",
  );
  const [healthStatus, setHealthStatus] = useState(
    selected?.health_status ?? "healthy",
  );
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setIdentification(selected.identification_number ?? "");
    setLotId(selected.lot_id ?? "");
    setRfidTag(selected.rfid_tag ?? "");
    setBirthDate(toInputDate(selected.birth_date));
    setWeight(
      selected.weight_kg !== null && selected.weight_kg !== undefined
        ? String(selected.weight_kg)
        : "",
    );
    setHealthStatus(selected.health_status ?? "healthy");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean((identification || lotId || rfidTag) && animalId);

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

    const { error: updateError } = await supabase
      .from("animals")
      .update(payload)
      .eq("id", animalId);

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
      queryValue="animal"
      eyebrow="Edition"
      title="Modifier l animal"
      description="Ajustez l identification, le lot et l etat sanitaire."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Identifiant" hint="Boucle, code interne ou reference.">
          <input
            className={inputClass}
            value={identification}
            onChange={(event) => setIdentification(event.target.value)}
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
