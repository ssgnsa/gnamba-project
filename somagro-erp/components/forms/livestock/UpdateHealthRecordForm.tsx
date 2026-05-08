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
type UserOption = { id: string; full_name: string | null };

type HealthRecord = {
  id: string;
  record_type: string | null;
  lot_id: string | null;
  animal_id: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medication_id: string | null;
  dosage: string | null;
  withdrawal_days: number | null;
  administered_by: string | null;
  administered_date: string | null;
  next_due_date: string | null;
  notes: string | null;
};

type UpdateHealthRecordFormProps = {
  lots: Option[];
  animals: Option[];
  medications: Option[];
  users: UserOption[];
  records: HealthRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateHealthRecordForm({
  lots,
  animals,
  medications,
  users,
  records,
}: UpdateHealthRecordFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const recordId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => records.find((record) => record.id === recordId) ?? null,
    [recordId, records],
  );

  const [recordType, setRecordType] = useState(
    selected?.record_type ?? "treatment",
  );
  const [lotId, setLotId] = useState(selected?.lot_id ?? "");
  const [animalId, setAnimalId] = useState(selected?.animal_id ?? "");
  const [diagnosis, setDiagnosis] = useState(selected?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(selected?.treatment ?? "");
  const [medicationId, setMedicationId] = useState(
    selected?.medication_id ?? "",
  );
  const [dosage, setDosage] = useState(selected?.dosage ?? "");
  const [withdrawalDays, setWithdrawalDays] = useState(
    selected?.withdrawal_days !== null &&
      selected?.withdrawal_days !== undefined
      ? String(selected.withdrawal_days)
      : "",
  );
  const [administeredBy, setAdministeredBy] = useState(
    selected?.administered_by ?? "",
  );
  const [administeredDate, setAdministeredDate] = useState(
    toInputDate(selected?.administered_date),
  );
  const [nextDueDate, setNextDueDate] = useState(
    toInputDate(selected?.next_due_date),
  );
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setRecordType(selected.record_type ?? "treatment");
    setLotId(selected.lot_id ?? "");
    setAnimalId(selected.animal_id ?? "");
    setDiagnosis(selected.diagnosis ?? "");
    setTreatment(selected.treatment ?? "");
    setMedicationId(selected.medication_id ?? "");
    setDosage(selected.dosage ?? "");
    setWithdrawalDays(
      selected.withdrawal_days !== null &&
        selected.withdrawal_days !== undefined
        ? String(selected.withdrawal_days)
        : "",
    );
    setAdministeredBy(selected.administered_by ?? "");
    setAdministeredDate(toInputDate(selected.administered_date));
    setNextDueDate(toInputDate(selected.next_due_date));
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(recordType && administeredDate && recordId);

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

    const { error: updateError } = await supabase
      .from("health_records")
      .update(payload)
      .eq("id", recordId);

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
      queryValue="health"
      eyebrow="Edition"
      title="Modifier l acte veterinaire"
      description="Ajustez le protocole, les dates et les responsables."
      clearKeys={["id"]}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
