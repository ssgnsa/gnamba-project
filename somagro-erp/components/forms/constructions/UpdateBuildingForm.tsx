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

type BuildingRecord = {
  id: string;
  name: string | null;
  building_type_id: string | null;
  code: string | null;
  construction_date: string | null;
  capacity: number | null;
  current_occupancy: number | null;
  status: string | null;
  notes: string | null;
};

type UpdateBuildingFormProps = {
  types: Option[];
  buildings: BuildingRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateBuildingForm({
  types,
  buildings,
}: UpdateBuildingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const buildingId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => buildings.find((building) => building.id === buildingId) ?? null,
    [buildingId, buildings],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [typeId, setTypeId] = useState(selected?.building_type_id ?? "");
  const [code, setCode] = useState(selected?.code ?? "");
  const [constructionDate, setConstructionDate] = useState(
    toInputDate(selected?.construction_date),
  );
  const [capacity, setCapacity] = useState(
    selected?.capacity !== null && selected?.capacity !== undefined
      ? String(selected.capacity)
      : "",
  );
  const [occupancy, setOccupancy] = useState(
    selected?.current_occupancy !== null &&
      selected?.current_occupancy !== undefined
      ? String(selected.current_occupancy)
      : "",
  );
  const [status, setStatus] = useState(selected?.status ?? "operational");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setTypeId(selected.building_type_id ?? "");
    setCode(selected.code ?? "");
    setConstructionDate(toInputDate(selected.construction_date));
    setCapacity(
      selected.capacity !== null && selected.capacity !== undefined
        ? String(selected.capacity)
        : "",
    );
    setOccupancy(
      selected.current_occupancy !== null &&
        selected.current_occupancy !== undefined
        ? String(selected.current_occupancy)
        : "",
    );
    setStatus(selected.status ?? "operational");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(name.trim() && buildingId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom du batiment.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      building_type_id: typeId || null,
      code: code || null,
      construction_date: constructionDate || null,
      capacity: capacity ? Number(capacity) : null,
      current_occupancy: occupancy ? Number(occupancy) : null,
      status,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("buildings")
      .update(payload)
      .eq("id", buildingId);

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
      queryValue="building"
      eyebrow="Edition"
      title="Modifier le batiment"
      description="Ajustez le type, la capacite et l occupation."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
