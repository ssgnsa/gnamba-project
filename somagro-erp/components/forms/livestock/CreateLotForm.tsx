"use client";

import { useMemo, useState } from "react";
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

type BreedOption = Option & { species_id?: string | null };

type CreateLotFormProps = {
  species: Option[];
  breeds: BreedOption[];
  buildings: Option[];
};

export default function CreateLotForm({
  species,
  breeds,
  buildings,
}: CreateLotFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [breedId, setBreedId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [initialCount, setInitialCount] = useState("");
  const [currentCount, setCurrentCount] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredBreeds = useMemo(
    () =>
      breeds.filter((breed) => !speciesId || breed.species_id === speciesId),
    [breeds, speciesId],
  );

  const canSubmit = name && speciesId && startDate && initialCount;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name,
      species_id: speciesId,
      breed_id: breedId || null,
      building_id: buildingId || null,
      batch_code: batchCode || null,
      start_date: startDate,
      initial_count: Number(initialCount),
      current_count: currentCount ? Number(currentCount) : null,
      status,
      notes: notes || null,
    };

    const { error: insertError } = await supabase.from("lots").insert(payload);

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
      queryValue="lot"
      title="Creer un lot"
      description="Definir l espece, le batiment et les effectifs initiaux."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du lot" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Lot poulets chair 2026"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Espece" required>
            <select
              className={selectClass}
              value={speciesId}
              onChange={(event) => setSpeciesId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {species.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Race">
            <select
              className={selectClass}
              value={breedId}
              onChange={(event) => setBreedId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {filteredBreeds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Batiment">
          <select
            className={selectClass}
            value={buildingId}
            onChange={(event) => setBuildingId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {buildings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code lot">
            <input
              className={inputClass}
              value={batchCode}
              onChange={(event) => setBatchCode(event.target.value)}
              placeholder="LOT-2026-01"
            />
          </Field>
          <Field label="Date demarrage" required>
            <input
              className={inputClass}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Effectif initial" required>
            <input
              className={inputClass}
              type="number"
              value={initialCount}
              onChange={(event) => setInitialCount(event.target.value)}
              min="0"
            />
          </Field>
          <Field label="Effectif actuel">
            <input
              className={inputClass}
              type="number"
              value={currentCount}
              onChange={(event) => setCurrentCount(event.target.value)}
              min="0"
            />
          </Field>
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">actif</option>
              <option value="completed">termine</option>
              <option value="culled">reforme</option>
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
