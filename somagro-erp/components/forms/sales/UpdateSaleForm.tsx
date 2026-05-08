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

type SaleRecord = {
  id: string;
  customer_id: string | null;
  sale_date: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  status: string | null;
  notes: string | null;
};

type UpdateSaleFormProps = {
  customers: Option[];
  sales: SaleRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateSaleForm({
  customers,
  sales,
}: UpdateSaleFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const saleId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => sales.find((sale) => sale.id === saleId) ?? null,
    [saleId, sales],
  );

  const [customerId, setCustomerId] = useState(selected?.customer_id ?? "");
  const [saleDate, setSaleDate] = useState(toInputDate(selected?.sale_date));
  const [invoiceNumber, setInvoiceNumber] = useState(
    selected?.invoice_number ?? "",
  );
  const [totalAmount, setTotalAmount] = useState(
    selected?.total_amount ? String(selected.total_amount) : "",
  );
  const [status, setStatus] = useState(selected?.status ?? "draft");
  const [notes, setNotes] = useState(selected?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setCustomerId(selected.customer_id ?? "");
    setSaleDate(toInputDate(selected.sale_date));
    setInvoiceNumber(selected.invoice_number ?? "");
    setTotalAmount(
      selected.total_amount !== null && selected.total_amount !== undefined
        ? String(selected.total_amount)
        : "",
    );
    setStatus(selected.status ?? "draft");
    setNotes(selected.notes ?? "");
  }, [selected]);

  const canSubmit = Boolean(saleDate && totalAmount && saleId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner la date et le montant.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      customer_id: customerId || null,
      sale_date: saleDate,
      invoice_number: invoiceNumber || null,
      total_amount: Number(totalAmount),
      status,
      notes: notes || null,
    };

    const { error: updateError } = await supabase
      .from("sales")
      .update(payload)
      .eq("id", saleId);

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
      queryValue="sale"
      eyebrow="Edition"
      title="Modifier le devis / la facture"
      description="Mettez a jour le client, le montant et le statut."
      clearKeys={["id"]}
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Client">
          <select
            className={selectClass}
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">Selectionner</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={saleDate}
              onChange={(event) => setSaleDate(event.target.value)}
            />
          </Field>
          <Field label="Numero facture">
            <input
              className={inputClass}
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Montant total" required>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value)}
            />
          </Field>
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">brouillon</option>
              <option value="confirmed">confirme</option>
              <option value="paid">paye</option>
              <option value="cancelled">annule</option>
            </select>
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
