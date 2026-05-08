"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { createClient } from "@/lib/supabase/client";
import { syncInventoryMovementStock } from "@/lib/inventory";

type MovementRecord = {
  id: string;
  item_id: string | null;
  movement_type: string | null;
  quantity: number | null;
  movement_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  item_name?: string | null;
};

type DeleteInventoryMovementFormProps = {
  movements: MovementRecord[];
};

export default function DeleteInventoryMovementForm({
  movements,
}: DeleteInventoryMovementFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const movementId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => movements.find((movement) => movement.id === movementId) ?? null,
    [movementId, movements],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) {
      setError("Mouvement introuvable.");
      return;
    }

    setSaving(true);
    setError(null);

    const previousMovement = {
      item_id: selected.item_id,
      movement_type: selected.movement_type,
      quantity: Number(selected.quantity ?? 0),
    };

    const stockError = await syncInventoryMovementStock(
      supabase,
      previousMovement,
      null,
    );
    if (stockError) {
      setError(stockError);
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("id", movementId);

    if (deleteError) {
      const rollbackError = await syncInventoryMovementStock(
        supabase,
        null,
        previousMovement,
      );
      setError(
        rollbackError
          ? `${deleteError.message} | rollback stock: ${rollbackError}`
          : deleteError.message,
      );
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
      queryValue="movement"
      eyebrow="Suppression"
      title="Supprimer le mouvement"
      description="Le stock associe sera automatiquement re-synchronise."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleDelete}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          <p className="font-semibold">
            {selected.item_name ?? "Mouvement de stock"}
          </p>
          <p className="mt-2 text-xs leading-6 text-rose-800">
            {selected.reference_type
              ? `${selected.reference_type} ${selected.reference_id ?? ""}`.trim()
              : "Sans reference"}{" "}
            • {selected.movement_type ?? "--"} • {selected.quantity ?? 0}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-rose-700">
            Cette action est irreversible.
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
