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

type CreateProjectFormProps = {
  buildings: Option[];
};

export default function CreateProjectForm({
  buildings,
}: CreateProjectFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("new");
  const [buildingId, setBuildingId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [contractor, setContractor] = useState("");
  const [status, setStatus] = useState("planned");
  const [documents, setDocuments] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = projectName.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom du projet.");
      return;
    }
    setSaving(true);
    setError(null);

    const documentsUrls = documents
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      project_name: projectName.trim(),
      project_type: projectType || null,
      building_id: buildingId || null,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budget ? Number(budget) : null,
      actual_cost: actualCost ? Number(actualCost) : null,
      contractor: contractor || null,
      status,
      documents_urls: documentsUrls.length > 0 ? documentsUrls : null,
      notes: notes || null,
    };

    const { error: insertError } = await supabase
      .from("construction_projects")
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
      queryValue="project"
      title="Nouveau projet"
      description="Planning, budget et rattachement au site."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du projet" required>
          <input
            className={inputClass}
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Extension hangar stockage"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select
              className={selectClass}
              value={projectType}
              onChange={(event) => setProjectType(event.target.value)}
            >
              <option value="new">nouveau</option>
              <option value="renovation">renovation</option>
              <option value="extension">extension</option>
            </select>
          </Field>
          <Field label="Batiment associe">
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
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date debut">
            <input
              className={inputClass}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label="Date fin">
            <input
              className={inputClass}
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Budget (FCFA)">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </Field>
          <Field label="Cout reel (FCFA)">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={actualCost}
              onChange={(event) => setActualCost(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Prestataire">
            <input
              className={inputClass}
              value={contractor}
              onChange={(event) => setContractor(event.target.value)}
              placeholder="Entreprise, artisan..."
            />
          </Field>
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="planned">planifie</option>
              <option value="in_progress">en cours</option>
              <option value="completed">termine</option>
              <option value="on_hold">en pause</option>
            </select>
          </Field>
        </div>
        <Field label="Documents" hint="URLs une par ligne">
          <textarea
            className={textareaClass}
            rows={3}
            value={documents}
            onChange={(event) => setDocuments(event.target.value)}
          />
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
