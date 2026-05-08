"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, selectClass } from "@/components/forms/Field";

type CategoryOption = { id: string; name: string; unit?: string | null };

type CreateInventoryItemFormProps = {
  categories: CategoryOption[];
};

export default function CreateInventoryItemForm({
  categories,
}: CreateInventoryItemFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [location, setLocation] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  useEffect(() => {
    if (!unit && selectedCategory?.unit) {
      setUnit(selectedCategory.unit);
    }
  }, [selectedCategory, unit]);

  const canSubmit = name.trim().length > 0 && unit.trim().length > 0;

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

    const { error: insertError } = await supabase
      .from("inventory_items")
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
      queryValue="item"
      title="Nouvel article"
      description="Reference, stock initial et seuils d'alerte."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aliment croissance"
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
              placeholder="ALIM-2026"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Unite" required>
            <input
              className={inputClass}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="kg, sac"
            />
          </Field>
          <Field label="Stock initial">
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
              placeholder="Magasin principal"
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
