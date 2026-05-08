"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { createClient } from "@/lib/supabase/client";

type DeleteRecordOption = {
  id: string;
  label: string;
  description?: string | null;
};

type ConfirmDeleteDrawerProps = {
  queryValue: string;
  table: string;
  title: string;
  description: string;
  records: DeleteRecordOption[];
  warning?: string;
};

export default function ConfirmDeleteDrawer({
  queryValue,
  table,
  title,
  description,
  records,
  warning = "Cette action est irreversible.",
}: ConfirmDeleteDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const recordId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => records.find((record) => record.id === recordId) ?? null,
    [recordId, records],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recordId) {
      setError("Element introuvable.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      setError(deleteError.message);
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
      queryKey="delete"
      queryValue={queryValue}
      eyebrow="Suppression"
      title={title}
      description={description}
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleDelete}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          <p className="font-semibold">{selected.label}</p>
          {selected.description ? (
            <p className="mt-2 text-xs leading-6 text-rose-800">
              {selected.description}
            </p>
          ) : null}
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-rose-700">
            {warning}
          </p>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {saving ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
