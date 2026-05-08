"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, textareaClass } from "@/components/forms/Field";

type CustomerRecord = {
  id: string;
  name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: string | null;
};

type UpdateCustomerFormProps = {
  customers: CustomerRecord[];
};

export default function UpdateCustomerForm({
  customers,
}: UpdateCustomerFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const customerId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customerId, customers],
  );

  const [name, setName] = useState(selected?.name ?? "");
  const [contactPerson, setContactPerson] = useState(
    selected?.contact_person ?? "",
  );
  const [email, setEmail] = useState(selected?.email ?? "");
  const [phone, setPhone] = useState(selected?.phone ?? "");
  const [address, setAddress] = useState(selected?.address ?? "");
  const [taxId, setTaxId] = useState(selected?.tax_id ?? "");
  const [paymentTerms, setPaymentTerms] = useState(
    selected?.payment_terms ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name ?? "");
    setContactPerson(selected.contact_person ?? "");
    setEmail(selected.email ?? "");
    setPhone(selected.phone ?? "");
    setAddress(selected.address ?? "");
    setTaxId(selected.tax_id ?? "");
    setPaymentTerms(selected.payment_terms ?? "");
  }, [selected]);

  const canSubmit = name.trim().length > 0 && customerId.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le nom du client.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      tax_id: taxId || null,
      payment_terms: paymentTerms || null,
    };

    const { error: updateError } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", customerId);

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
      queryValue="customer"
      eyebrow="Edition"
      title="Modifier le client"
      description="Mettez a jour les coordonnees et conditions commerciales."
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
          <Field label="Contact">
            <input
              className={inputClass}
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telephone">
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label="Identifiant fiscal">
            <input
              className={inputClass}
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Adresse">
          <textarea
            className={textareaClass}
            rows={2}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </Field>
        <Field label="Conditions de paiement">
          <input
            className={inputClass}
            value={paymentTerms}
            onChange={(event) => setPaymentTerms(event.target.value)}
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
