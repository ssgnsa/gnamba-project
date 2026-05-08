import type { createClient } from "@/lib/supabase/client";

export type InventoryMovementType =
  | "purchase"
  | "consumption"
  | "loss"
  | "return";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

type InventoryMovementSnapshot = {
  item_id?: string | null;
  movement_type?: string | null;
  quantity?: number | null;
};

export function getInventoryMovementDelta(
  type: string | null | undefined,
  quantity: number | null | undefined,
) {
  const safeQuantity = Math.abs(Number(quantity ?? 0));
  if (safeQuantity === 0) return 0;
  return type === "purchase" || type === "return"
    ? safeQuantity
    : -safeQuantity;
}

export async function adjustInventoryStock(
  supabase: SupabaseBrowserClient,
  itemId: string,
  adjustment: number,
) {
  if (!itemId || adjustment === 0) return null;

  const { data: itemData, error: readError } = await supabase
    .from("inventory_items")
    .select("current_stock")
    .eq("id", itemId)
    .maybeSingle();

  if (readError) {
    return readError.message;
  }

  const currentStock = Number(itemData?.current_stock ?? 0);
  const { error: updateError } = await supabase
    .from("inventory_items")
    .update({ current_stock: currentStock + adjustment })
    .eq("id", itemId);

  return updateError?.message ?? null;
}

export async function syncInventoryMovementStock(
  supabase: SupabaseBrowserClient,
  previousMovement: InventoryMovementSnapshot | null,
  nextMovement: InventoryMovementSnapshot | null,
) {
  if (previousMovement?.item_id) {
    const previousDelta = getInventoryMovementDelta(
      previousMovement.movement_type,
      previousMovement.quantity,
    );
    const revertError = await adjustInventoryStock(
      supabase,
      previousMovement.item_id,
      -previousDelta,
    );
    if (revertError) return revertError;
  }

  if (nextMovement?.item_id) {
    const nextDelta = getInventoryMovementDelta(
      nextMovement.movement_type,
      nextMovement.quantity,
    );
    const applyError = await adjustInventoryStock(
      supabase,
      nextMovement.item_id,
      nextDelta,
    );
    if (applyError) return applyError;
  }

  return null;
}
