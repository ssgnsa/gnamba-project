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
type BreedOption = Option & { species_id?: string | null };

type LotRecord = {
  id: string;
  name: string | null;
  species_id: string | null;
  breed_id: string | null;
  building_id: string | null;
  batch_code: string | null;
  start_date: string | null;
  initial_count: number | null;
  current_count: number | null;
  status: string | null;
  notes: string | null;
};

type UpdateLotFormProps = {
  species: Option[];
  breeds: BreedOption[];
  buildings: Option[];
  lots: LotRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateLotForm({
  species,
  breeds,
  buildings,
  lots,
}: UpdateLotFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const lotId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => lots.find((lot) => lot.id === lotId) ?? null,
    [lotId, lots],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [speciesId, setSpeciesId] = useState(selected?.species_id ?? "");
  const [breedId, setBreedId] = useState(selected?.breed_id ?? "");
  const [buildingId, setBuildingId] = useState(selected?.building_id ?? "");
  const [batchCode, setBatchCode] = useState(selected?.batch_code ?? "");
  const [startDate, setStartDate] = useState(toInputDate(selected?.start_date));
  const [initialCount, setInitialCount] = useState(
    selected?.initial_count !== null && selected?.initial_count !== undefined
      ? String(selected.initial_count)
      : "",
  );
  const [currentCount, setCurrentCount] = useState(
    selected?.current_count !== null && selected?.current_count !== undefined
      ? String(selected.current_count)
      : "",
  );
  const [status, setStatus] = useState(selected?.status ?? "active");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredBreeds = useMemo(
    () =>
      breeds.filter((breed) => !speciesId || breed.species_id === speciesId),
    [breeds, speciesId],
  );

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setSpeciesId(selected.species_id ?? "");
    setBreedId(selected.breed_id ?? "");
    setBuildingId(selected.building_id ?? "");
    setBatchCode(selected.batch_code ?? "");
    setStartDate(toInputDate(selected.start_date));
    setInitialCount(
      selected.initial_count !== null && selected.initial_count !== undefined
        ? String(selected.initial_count)
        : "",
    );
    setCurrentCount(
      selected.current_count !== null && selected.current_count !== undefined
        ? String(selected.current_count)
        : "",
    );
    setStatus(selected.status ?? "active");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(
    name.trim() && speciesId && startDate && initialCount && lotId,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
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

    const { error: updateError } = await supabase
      .from("lots")
      .update(payload)
      .eq("id", lotId);

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
      queryValue="lot"
      eyebrow="Edition"
      title="Modifier le lot"
      description="Mettez a jour l effectif, le site et le statut."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du lot" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
