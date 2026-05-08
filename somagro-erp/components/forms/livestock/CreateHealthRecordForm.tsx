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

type CreateHealthRecordFormProps = {
  lots: Option[];
  animals: Option[];
  medications: Option[];
  users: UserOption[];
};

export default function CreateHealthRecordForm({
  lots,
  animals,
  medications,
  users,
}: CreateHealthRecordFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [recordType, setRecordType] = useState("treatment");
  const [lotId, setLotId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [dosage, setDosage] = useState("");
  const [withdrawalDays, setWithdrawalDays] = useState("");
  const [administeredBy, setAdministeredBy] = useState("");
  const [administeredDate, setAdministeredDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = recordType && administeredDate;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      record_type: recordType,
      lot_id: lotId || null,
      animal_id: animalId || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      medication_id: medicationId || null,
      dosage: dosage || null,
      withdrawal_days: withdrawalDays ? Number(withdrawalDays) : null,
      administered_by: administeredBy || null,
      administered_date: administeredDate,
      next_due_date: nextDueDate || null,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("health_records")
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
      queryValue="health"
      title="Nouvel acte veterinaire"
      description="Suivi des traitements, vaccins et symptomes."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type" required>
            <select
              className={selectClass}
              value={recordType}
              onChange={(event) => setRecordType(event.target.value)}
            >
              <option value="treatment">treatment</option>
              <option value="vaccination">vaccination</option>
              <option value="checkup">checkup</option>
              <option value="symptom">symptom</option>
            </select>
          </Field>
          <Field label="Date d administration" required>
            <input
              className={inputClass}
              type="date"
              value={administeredDate}
              onChange={(event) => setAdministeredDate(event.target.value)}
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
        <Field label="Diagnostic">
          <input
            className={inputClass}
            value={diagnosis}
            onChange={(event) => setDiagnosis(event.target.value)}
          />
        </Field>
        <Field label="Traitement">
          <input
            className={inputClass}
            value={treatment}
            onChange={(event) => setTreatment(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Medicament">
            <select
              className={selectClass}
              value={medicationId}
              onChange={(event) => setMedicationId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {medications.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dose">
            <input
              className={inputClass}
              value={dosage}
              onChange={(event) => setDosage(event.target.value)}
              placeholder="2 ml / kg"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Delai retrait (jours)">
            <input
              className={inputClass}
              type="number"
              value={withdrawalDays}
              onChange={(event) => setWithdrawalDays(event.target.value)}
              min="0"
            />
          </Field>
          <Field label="Prochaine echeance">
            <input
              className={inputClass}
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
            />
          </Field>
          <Field label="Responsable">
            <select
              className={selectClass}
              value={administeredBy}
              onChange={(event) => setAdministeredBy(event.target.value)}
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
