"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import { Field, inputClass, textareaClass } from "@/components/forms/Field";

export default function CreateCustomerForm() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length > 0;

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

    const { error: insertError } = await supabase
      .from("customers")
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
      queryValue="customer"
      title="Nouveau client"
      description="Coordonnees commerciales et conditions de paiement."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom" required>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cooperative San Pedro"
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
            placeholder="30 jours"
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
