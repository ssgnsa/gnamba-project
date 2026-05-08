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

type EquipmentRecord = {
  id: string;
  name: string | null;
  building_id: string | null;
  equipment_type: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  installation_date: string | null;
  warranty_end: string | null;
  maintenance_interval_days: number | null;
  last_maintenance_date: string | null;
  status: string | null;
  notes: string | null;
};

type UpdateEquipmentFormProps = {
  buildings: Option[];
  equipment: EquipmentRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateEquipmentForm({
  buildings,
  equipment,
}: UpdateEquipmentFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const equipmentId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => equipment.find((item) => item.id === equipmentId) ?? null,
    [equipmentId, equipment],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [buildingId, setBuildingId] = useState(selected?.building_id ?? "");
  const [equipmentType, setEquipmentType] = useState(
    selected?.equipment_type ?? "",
  );
  const [brand, setBrand] = useState(selected?.brand ?? "");
  const [model, setModel] = useState(selected?.model ?? "");
  const [serialNumber, setSerialNumber] = useState(
    selected?.serial_number ?? "",
  );
  const [installationDate, setInstallationDate] = useState(
    toInputDate(selected?.installation_date),
  );
  const [warrantyEnd, setWarrantyEnd] = useState(
    toInputDate(selected?.warranty_end),
  );
  const [maintenanceInterval, setMaintenanceInterval] = useState(
    selected?.maintenance_interval_days !== null &&
      selected?.maintenance_interval_days !== undefined
      ? String(selected.maintenance_interval_days)
      : "",
  );
  const [lastMaintenance, setLastMaintenance] = useState(
    toInputDate(selected?.last_maintenance_date),
  );
  const [status, setStatus] = useState(selected?.status ?? "operational");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setBuildingId(selected.building_id ?? "");
    setEquipmentType(selected.equipment_type ?? "");
    setBrand(selected.brand ?? "");
    setModel(selected.model ?? "");
    setSerialNumber(selected.serial_number ?? "");
    setInstallationDate(toInputDate(selected.installation_date));
    setWarrantyEnd(toInputDate(selected.warranty_end));
    setMaintenanceInterval(
      selected.maintenance_interval_days !== null &&
        selected.maintenance_interval_days !== undefined
        ? String(selected.maintenance_interval_days)
        : "",
    );
    setLastMaintenance(toInputDate(selected.last_maintenance_date));
    setStatus(selected.status ?? "operational");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(name.trim() && equipmentId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom de l equipement.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      building_id: buildingId || null,
      equipment_type: equipmentType || null,
      brand: brand || null,
      model: model || null,
      serial_number: serialNumber || null,
      installation_date: installationDate || null,
      warranty_end: warrantyEnd || null,
      maintenance_interval_days: maintenanceInterval
        ? Number(maintenanceInterval)
        : null,
      last_maintenance_date: lastMaintenance || null,
      status: status || null,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("equipment")
      .update(payload)
      .eq("id", equipmentId);

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
      queryValue="equipment"
      eyebrow="Edition"
      title="Modifier l equipement"
      description="Ajustez l affectation et le plan de maintenance."
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
        <Field label="Batiment">
          <select
            className={selectClass}
            value={buildingId}
            onChange={(event) => setBuildingId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type equipement">
            <input
              className={inputClass}
              value={equipmentType}
              onChange={(event) => setEquipmentType(event.target.value)}
            />
          </Field>
          <Field label="Marque">
            <input
              className={inputClass}
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Modele">
            <input
              className={inputClass}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </Field>
          <Field label="Numero de serie">
            <input
              className={inputClass}
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date installation">
            <input
              className={inputClass}
              type="date"
              value={installationDate}
              onChange={(event) => setInstallationDate(event.target.value)}
            />
          </Field>
          <Field label="Fin garantie">
            <input
              className={inputClass}
              type="date"
              value={warrantyEnd}
              onChange={(event) => setWarrantyEnd(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Intervalle maintenance (jours)">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={maintenanceInterval}
              onChange={(event) => setMaintenanceInterval(event.target.value)}
            />
          </Field>
          <Field label="Derniere maintenance">
            <input
              className={inputClass}
              type="date"
              value={lastMaintenance}
              onChange={(event) => setLastMaintenance(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Statut">
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="operational">operationnel</option>
            <option value="maintenance">maintenance</option>
            <option value="repair">reparation</option>
            <option value="out_of_service">hors service</option>
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
