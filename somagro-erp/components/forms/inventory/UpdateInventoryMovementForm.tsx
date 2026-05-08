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
import { syncInventoryMovementStock } from "@/lib/inventory";

type ItemOption = {
  id: string;
  name: string;
  unit?: string | null;
  current_stock?: number | null;
};
type UserOption = { id: string; name: string };

type MovementRecord = {
  id: string;
  item_id: string | null;
  movement_type: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_cost: number | null;
  movement_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_by: string | null;
  notes: string | null;
};

type UpdateInventoryMovementFormProps = {
  items: ItemOption[];
  users: UserOption[];
  movements: MovementRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateInventoryMovementForm({
  items,
  users,
  movements,
}: UpdateInventoryMovementFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const movementId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => movements.find((movement) => movement.id === movementId) ?? null,
    [movementId, movements],
  );

  const [itemId, setItemId] = useState(selected?.item_id ?? "");
  const [movementType, setMovementType] = useState(
    selected?.movement_type ?? "purchase",
  );
  const [quantity, setQuantity] = useState(
    selected?.quantity !== null && selected?.quantity !== undefined
      ? String(selected.quantity)
      : "",
  );
  const [unitPrice, setUnitPrice] = useState(
    selected?.unit_price !== null && selected?.unit_price !== undefined
      ? String(selected.unit_price)
      : "",
  );
  const [totalCost, setTotalCost] = useState(
    selected?.total_cost !== null && selected?.total_cost !== undefined
      ? String(selected.total_cost)
      : "",
  );
  const [movementDate, setMovementDate] = useState(
    toInputDate(selected?.movement_date),
  );
  const [referenceType, setReferenceType] = useState(
    selected?.reference_type ?? "",
  );
  const [referenceId, setReferenceId] = useState(selected?.reference_id ?? "");
  const [createdBy, setCreatedBy] = useState(selected?.created_by ?? "");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId),
    [items, itemId],
  );
  const stockHint = selectedItem
    ? `${selectedItem.current_stock ?? 0} ${selectedItem.unit ?? ""}`.trim()
    : "--";

  useEffect(() => {
    if (!selected) return;
    setItemId(selected.item_id ?? "");
    setMovementType(selected.movement_type ?? "purchase");
    setQuantity(
      selected.quantity !== null && selected.quantity !== undefined
        ? String(selected.quantity)
        : "",
    );
    setUnitPrice(
      selected.unit_price !== null && selected.unit_price !== undefined
        ? String(selected.unit_price)
        : "",
    );
    setTotalCost(
      selected.total_cost !== null && selected.total_cost !== undefined
        ? String(selected.total_cost)
        : "",
    );
    setMovementDate(toInputDate(selected.movement_date));
    setReferenceType(selected.reference_type ?? "");
    setReferenceId(selected.reference_id ?? "");
    setCreatedBy(selected.created_by ?? "");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(itemId && quantity && movementDate && movementId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !selected) {
      setError("Veuillez renseigner l'article, la quantite et la date.");
      return;
    }

    setSaving(true);
    setError(null);

    const quantityValue = Number(quantity);
    const unitPriceValue = unitPrice ? Number(unitPrice) : null;
    const totalCostValue = totalCost
      ? Number(totalCost)
      : unitPriceValue !== null
        ? quantityValue * unitPriceValue
        : null;

    const payload = {
      item_id: itemId,
      movement_type: movementType,
      quantity: quantityValue,
      unit_price: unitPriceValue,
      total_cost: totalCostValue,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      movement_date: movementDate,
      notes: notes || null,
      created_by: createdBy || null,
    };

    const previousMovement = {
      item_id: selected.item_id,
      movement_type: selected.movement_type,
      quantity: Number(selected.quantity ?? 0),
    };

    const nextMovement = {
      item_id: itemId,
      movement_type: movementType,
      quantity: quantityValue,
    };

    const stockChanged =
      previousMovement.item_id !== nextMovement.item_id ||
      previousMovement.movement_type !== nextMovement.movement_type ||
      Number(previousMovement.quantity ?? 0) !==
        Number(nextMovement.quantity ?? 0);

    if (stockChanged) {
      const stockError = await syncInventoryMovementStock(
        supabase,
        previousMovement,
        nextMovement,
      );
      if (stockError) {
        setError(stockError);
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("inventory_movements")
      .update(payload)
      .eq("id", movementId);

    if (updateError) {
      if (stockChanged) {
        const rollbackError = await syncInventoryMovementStock(
          supabase,
          nextMovement,
          previousMovement,
        );
        setError(
          rollbackError
            ? `${updateError.message} | rollback stock: ${rollbackError}`
            : updateError.message,
        );
      } else {
        setError(updateError.message);
      }
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
      queryValue="movement"
      eyebrow="Edition"
      title="Modifier le mouvement"
      description="Corrigez la quantite, la date ou la reference de stock."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Article" required hint={`Stock actuel: ${stockHint}`}>
          <select
            className={selectClass}
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type" required>
            <select
              className={selectClass}
              value={movementType}
              onChange={(event) => setMovementType(event.target.value)}
            >
              <option value="purchase">achat</option>
              <option value="consumption">consommation</option>
              <option value="loss">perte</option>
              <option value="return">retour</option>
            </select>
          </Field>
          <Field label="Quantite" required>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Prix unitaire">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </Field>
          <Field label="Cout total">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={totalCost}
              onChange={(event) => setTotalCost(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={movementDate}
              onChange={(event) => setMovementDate(event.target.value)}
            />
          </Field>
          <Field label="Responsable">
            <select
              className={selectClass}
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Reference type">
            <input
              className={inputClass}
              value={referenceType}
              onChange={(event) => setReferenceType(event.target.value)}
            />
          </Field>
          <Field label="Reference ID">
            <input
              className={inputClass}
              value={referenceId}
              onChange={(event) => setReferenceId(event.target.value)}
            />
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
