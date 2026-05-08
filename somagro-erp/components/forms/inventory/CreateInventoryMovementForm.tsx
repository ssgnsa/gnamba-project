"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

type CreateInventoryMovementFormProps = {
  items: ItemOption[];
  users: UserOption[];
};

export default function CreateInventoryMovementForm({
  items,
  users,
}: CreateInventoryMovementFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [itemId, setItemId] = useState("");
  const [movementType, setMovementType] = useState("purchase");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [movementDate, setMovementDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId),
    [items, itemId],
  );
  const stockHint = selectedItem
    ? `${selectedItem.current_stock ?? 0} ${selectedItem.unit ?? ""}`.trim()
    : "--";

  const canSubmit = itemId && quantity && movementDate;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
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

    const { data: createdMovement, error: insertError } = await supabase
      .from("inventory_movements")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const stockError = await syncInventoryMovementStock(supabase, null, {
      item_id: itemId,
      movement_type: movementType,
      quantity: quantityValue,
    });

    if (stockError) {
      if (createdMovement?.id) {
        await supabase
          .from("inventory_movements")
          .delete()
          .eq("id", createdMovement.id);
      }
      setError(stockError);
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
      queryValue="movement"
      title="Mouvement de stock"
      description="Entrees, consommations, pertes et retours."
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
              placeholder="lot, parcelle..."
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
