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

type UserOption = { id: string; name: string };

type TransactionRecord = {
  id: string;
  transaction_type: string | null;
  category: string | null;
  amount: number | null;
  transaction_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_by: string | null;
};

type UpdateTransactionFormProps = {
  users: UserOption[];
  transactions: TransactionRecord[];
};

const toInputDate = (value?: string | null) =>
  value ? value.slice(0, 10) : "";

export default function UpdateTransactionForm({
  users,
  transactions,
}: UpdateTransactionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const transactionId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () =>
      transactions.find((transaction) => transaction.id === transactionId) ??
      null,
    [transactionId, transactions],
  );

  const [transactionType, setTransactionType] = useState(
    selected?.transaction_type ?? "expense",
  );
  const [category, setCategory] = useState(selected?.category ?? "");
  const [amount, setAmount] = useState(
    selected?.amount ? String(selected.amount) : "",
  );
  const [transactionDate, setTransactionDate] = useState(
    toInputDate(selected?.transaction_date),
  );
  const [referenceType, setReferenceType] = useState(
    selected?.reference_type ?? "",
  );
  const [referenceId, setReferenceId] = useState(selected?.reference_id ?? "");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [createdBy, setCreatedBy] = useState(selected?.created_by ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setTransactionType(selected.transaction_type ?? "expense");
    setCategory(selected.category ?? "");
    setAmount(
      selected.amount !== null && selected.amount !== undefined
        ? String(selected.amount)
        : "",
    );
    setTransactionDate(toInputDate(selected.transaction_date));
    setReferenceType(selected.reference_type ?? "");
    setReferenceId(selected.reference_id ?? "");
    setDescription(selected.description ?? "");
    setCreatedBy(selected.created_by ?? "");
  }, [selected]);

  const canSubmit = Boolean(amount && transactionDate && transactionId);

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

    const { error: updateError } = await supabase
      .from("financial_transactions")
      .update(payload)
      .eq("id", transactionId);

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
      queryValue="transaction"
      eyebrow="Edition"
      title="Modifier la transaction"
      description="Corrigez la categorisation, le montant ou la date."
      clearKeys={["id"]}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
