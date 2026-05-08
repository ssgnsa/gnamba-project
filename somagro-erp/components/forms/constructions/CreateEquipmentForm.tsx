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

type CreateEquipmentFormProps = {
  buildings: Option[];
};

export default function CreateEquipmentForm({
  buildings,
}: CreateEquipmentFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [warrantyEnd, setWarrantyEnd] = useState("");
  const [maintenanceInterval, setMaintenanceInterval] = useState("");
  const [lastMaintenance, setLastMaintenance] = useState("");
  const [status, setStatus] = useState("operational");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom de l'equipement.");
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

    const { error: insertError } = await supabase
      .from("equipment")
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
      queryValue="equipment"
      title="Nouvel equipement"
      description="Identification, rattachement et plan de maintenance."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ventilation principale"
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
              placeholder="Ventilation, irrigation..."
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
