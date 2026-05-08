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

type UserOption = { id: string; name: string };

type CreateTransactionFormProps = {
  users: UserOption[];
};

export default function CreateTransactionForm({
  users,
}: CreateTransactionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [transactionType, setTransactionType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = amount && transactionDate;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le montant et la date.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      transaction_type: transactionType,
      category: category || null,
      amount: Number(amount),
      transaction_date: transactionDate,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      description: description || null,
      created_by: createdBy || null,
    };

    const { error: insertError } = await supabase
      .from("financial_transactions")
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
      queryValue="transaction"
      title="Nouvelle transaction"
      description="Recette ou depense avec categorisation."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select
              className={selectClass}
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value)}
            >
              <option value="expense">depense</option>
              <option value="income">recette</option>
            </select>
          </Field>
          <Field label="Categorie">
            <input
              className={inputClass}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="maintenance, vente..."
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Montant" required>
            <input
              className={inputClass}
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label="Date" required>
            <input
              className={inputClass}
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Reference type">
            <input
              className={inputClass}
              value={referenceType}
              onChange={(event) => setReferenceType(event.target.value)}
              placeholder="vente, stock"
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
        <Field label="Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label="Saisi par">
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
