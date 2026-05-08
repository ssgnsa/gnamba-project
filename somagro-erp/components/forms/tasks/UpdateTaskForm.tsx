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

type UserOption = { id: string; name: string };

type TaskRecord = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
};

type UpdateTaskFormProps = {
  users: UserOption[];
  tasks: TaskRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateTaskForm({ users, tasks }: UpdateTaskFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const taskId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => tasks.find((task) => task.id === taskId) ?? null,
    [taskId, tasks],
  );

  const [title, setTitle] = useState(selected?.title ?? "");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [status, setStatus] = useState(selected?.status ?? "open");
  const [priority, setPriority] = useState(selected?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(toInputDate(selected?.due_date));
  const [assignedTo, setAssignedTo] = useState(selected?.assigned_to ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title ?? "");
    setDescription(selected.description ?? "");
    setStatus(selected.status ?? "open");
    setPriority(selected.priority ?? "medium");
    setDueDate(toInputDate(selected.due_date));
    setAssignedTo(selected.assigned_to ?? "");
  }, [selected]);

  const canSubmit = title.trim().length > 0 && taskId.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le titre de la tache.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description || null,
      status,
      priority: priority || null,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
    };

    const { error: updateError } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId);

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
      queryValue="task"
      eyebrow="Edition"
      title="Modifier la tache"
      description="Ajustez le statut, la priorite et l'affectation."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Titre" required>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
