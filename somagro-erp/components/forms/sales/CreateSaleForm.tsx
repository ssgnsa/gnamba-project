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

type Option = { id: string; name: string };

type CreateSaleFormProps = {
  customers: Option[];
};

export default function CreateSaleForm({ customers }: CreateSaleFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = saleDate && totalAmount;

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

    const { error: insertError } = await supabase.from("sales").insert(payload);

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
      queryValue="sale"
      title="Nouveau devis / facture"
      description="Enregistrer une vente et son statut."
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
              placeholder="FAC-2026-001"
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
