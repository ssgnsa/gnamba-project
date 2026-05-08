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

type UserOption = { id: string; name: string };

type CreateTaskFormProps = {
  users: UserOption[];
};

export default function CreateTaskForm({ users }: CreateTaskFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim().length > 0;

  const resolveTenantId = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return null;
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    return profile?.tenant_id ?? null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le titre de la tache.");
      return;
    }
    setSaving(true);
    setError(null);

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      setError("Impossible de determiner le tenant actif.");
      setSaving(false);
      return;
    }

    const payload = {
      tenant_id: tenantId,
      title: title.trim(),
      description: description || null,
      status,
      priority: priority || null,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
    };

    const { error: insertError } = await supabase.from("tasks").insert(payload);

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
      queryValue="task"
      title="Nouvelle tache"
      description="Planifier une action et l'affecter aux equipes."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Titre" required>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Vaccination lot 12"
          />
        </Field>
        <Field label="Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="open">ouverte</option>
              <option value="in_progress">en cours</option>
              <option value="completed">terminee</option>
            </select>
          </Field>
          <Field label="Priorite">
            <select
              className={selectClass}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="low">basse</option>
              <option value="medium">moyenne</option>
              <option value="high">haute</option>
              <option value="critical">critique</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Echeance">
            <input
              className={inputClass}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
          <Field label="Assigne a">
            <select
              className={selectClass}
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
            >
              <option value="">Selectionner</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
