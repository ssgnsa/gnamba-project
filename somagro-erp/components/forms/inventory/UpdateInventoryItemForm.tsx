"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type CategoryOption = { id: string; name: string; unit?: string | null };

type ItemRecord = {
  id: string;
  name: string | null;
  category_id: string | null;
  sku: string | null;
  unit: string | null;
  current_stock: number | null;
  min_stock_threshold: number | null;
  max_stock_threshold: number | null;
  unit_price: number | null;
  location: string | null;
  expiry_date: string | null;
  supplier: string | null;
};

type UpdateInventoryItemFormProps = {
  categories: CategoryOption[];
  items: ItemRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateInventoryItemForm({
  categories,
  items,
}: UpdateInventoryItemFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const itemId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => items.find((item) => item.id === itemId) ?? null,
    [itemId, items],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [categoryId, setCategoryId] = useState(selected?.category_id ?? "");
  const [sku, setSku] = useState(selected?.sku ?? "");
  const [unit, setUnit] = useState(selected?.unit ?? "");
  const [currentStock, setCurrentStock] = useState(
    selected?.current_stock !== null && selected?.current_stock !== undefined
      ? String(selected.current_stock)
      : "0",
  );
  const [minStock, setMinStock] = useState(
    selected?.min_stock_threshold !== null &&
      selected?.min_stock_threshold !== undefined
      ? String(selected.min_stock_threshold)
      : "",
  );
  const [maxStock, setMaxStock] = useState(
    selected?.max_stock_threshold !== null &&
      selected?.max_stock_threshold !== undefined
      ? String(selected.max_stock_threshold)
      : "",
  );
  const [unitPrice, setUnitPrice] = useState(
    selected?.unit_price !== null && selected?.unit_price !== undefined
      ? String(selected.unit_price)
      : "",
  );
  const [location, setLocation] = useState(selected?.location ?? "");
  const [expiryDate, setExpiryDate] = useState(
    toInputDate(selected?.expiry_date),
  );
  const [supplier, setSupplier] = useState(selected?.supplier ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setCategoryId(selected.category_id ?? "");
    setSku(selected.sku ?? "");
    setUnit(selected.unit ?? "");
    setCurrentStock(
      selected.current_stock !== null && selected.current_stock !== undefined
        ? String(selected.current_stock)
        : "0",
    );
    setMinStock(
      selected.min_stock_threshold !== null &&
        selected.min_stock_threshold !== undefined
        ? String(selected.min_stock_threshold)
        : "",
    );
    setMaxStock(
      selected.max_stock_threshold !== null &&
        selected.max_stock_threshold !== undefined
        ? String(selected.max_stock_threshold)
        : "",
    );
    setUnitPrice(
      selected.unit_price !== null && selected.unit_price !== undefined
        ? String(selected.unit_price)
        : "",
    );
    setLocation(selected.location ?? "");
    setExpiryDate(toInputDate(selected.expiry_date));
    setSupplier(selected.supplier ?? "");
  }, [selected]);

  useEffect(() => {
    if (!unit && selectedCategory?.unit) {
      setUnit(selectedCategory.unit);
    }
  }, [selectedCategory, unit]);

  const canSubmit = Boolean(name.trim() && unit.trim() && itemId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez remplir le nom et l'unite.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      sku: sku || null,
      unit: unit.trim(),
      current_stock: currentStock ? Number(currentStock) : 0,
      min_stock_threshold: minStock ? Number(minStock) : null,
      max_stock_threshold: maxStock ? Number(maxStock) : null,
      unit_price: unitPrice ? Number(unitPrice) : null,
      location: location || null,
      expiry_date: expiryDate || null,
      supplier: supplier || null,
    };

    const { error: updateError } = await supabase
      .from("inventory_items")
      .update(payload)
      .eq("id", itemId);

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
      queryValue="item"
      eyebrow="Edition"
      title="Modifier l'article"
      description="Ajustez le stock, les seuils et les informations logistiques."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categorie">
            <select
              className={selectClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Selectionner</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <input
              className={inputClass}
              value={sku}
              onChange={(event) => setSku(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Unite" required>
            <input
              className={inputClass}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </Field>
          <Field label="Stock courant">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={currentStock}
              onChange={(event) => setCurrentStock(event.target.value)}
            />
          </Field>
          <Field label="Prix unitaire">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Seuil minimum">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={minStock}
              onChange={(event) => setMinStock(event.target.value)}
            />
          </Field>
          <Field label="Seuil maximum">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={maxStock}
              onChange={(event) => setMaxStock(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Emplacement">
            <input
              className={inputClass}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </Field>
          <Field label="Date expiration">
            <input
              className={inputClass}
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Fournisseur">
          <input
            className={inputClass}
            value={supplier}
            onChange={(event) => setSupplier(event.target.value)}
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
