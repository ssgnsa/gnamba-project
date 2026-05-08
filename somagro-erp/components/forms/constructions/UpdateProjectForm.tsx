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

type ProjectRecord = {
  id: string;
  project_name: string | null;
  project_type: string | null;
  building_id: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  contractor: string | null;
  status: string | null;
  documents_urls: string[] | null;
  notes: string | null;
};

type UpdateProjectFormProps = {
  buildings: Option[];
  projects: ProjectRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateProjectForm({
  buildings,
  projects,
}: UpdateProjectFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const projectId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
  );

  const [projectName, setProjectName] = useState(selected?.project_name ?? "");
  const [projectType, setProjectType] = useState(
    selected?.project_type ?? "new",
  );
  const [buildingId, setBuildingId] = useState(selected?.building_id ?? "");
  const [startDate, setStartDate] = useState(toInputDate(selected?.start_date));
  const [endDate, setEndDate] = useState(toInputDate(selected?.end_date));
  const [budget, setBudget] = useState(
    selected?.budget !== null && selected?.budget !== undefined
      ? String(selected.budget)
      : "",
  );
  const [actualCost, setActualCost] = useState(
    selected?.actual_cost !== null && selected?.actual_cost !== undefined
      ? String(selected.actual_cost)
      : "",
  );
  const [contractor, setContractor] = useState(selected?.contractor ?? "");
  const [status, setStatus] = useState(selected?.status ?? "planned");
  const [documents, setDocuments] = useState(
    selected?.documents_urls?.join("\n") ?? "",
  );
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setProjectName(selected.project_name ?? "");
    setProjectType(selected.project_type ?? "new");
    setBuildingId(selected.building_id ?? "");
    setStartDate(toInputDate(selected.start_date));
    setEndDate(toInputDate(selected.end_date));
    setBudget(
      selected.budget !== null && selected.budget !== undefined
        ? String(selected.budget)
        : "",
    );
    setActualCost(
      selected.actual_cost !== null && selected.actual_cost !== undefined
        ? String(selected.actual_cost)
        : "",
    );
    setContractor(selected.contractor ?? "");
    setStatus(selected.status ?? "planned");
    setDocuments(selected.documents_urls?.join("\n") ?? "");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(projectName.trim() && projectId);

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

    const { error: updateError } = await supabase
      .from("construction_projects")
      .update(payload)
      .eq("id", projectId);

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
      queryValue="project"
      eyebrow="Edition"
      title="Modifier le projet"
      description="Ajustez le planning, le budget et le prestataire."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du projet" required>
          <input
            className={inputClass}
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
