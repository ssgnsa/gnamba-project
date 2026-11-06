import { ShieldCheck, Mail } from "lucide-react";
import { OFFICIAL_CONTACT } from "../../lib/officialContact";

/**
 * Politique de confidentialité — stub.
 * TODO: remplacer par le texte définitif validé par le DPO / juridique.
 */
export default function PublicConfidentiality() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary-600" aria-hidden />
        <h1 className="text-3xl font-bold text-neutral-900">
          Politique de confidentialité
        </h1>
      </header>

      <section className="space-y-6 text-neutral-700">
        <p>
          GNAMBA SERVICES s'engage à protéger la confidentialité des données
          personnelles de ses utilisateurs, conformément à la loi ivoirienne
          n° 2013-450 relative à la protection des données à caractère
          personnel.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900">
          Données collectées
        </h2>
        <p>
          Les données collectées via nos formulaires (nom, email, téléphone,
          message) sont utilisées uniquement pour répondre à vos demandes et ne
          sont jamais cédées à des tiers.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900">
          Vos droits
        </h2>
        <p>
          Vous disposez d'un droit d'accès, de rectification et de suppression
          de vos données. Pour l'exercer, contactez-nous à l'adresse ci-dessous.
        </p>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="mb-2 flex items-center gap-2 font-semibold text-neutral-900">
            <Mail className="h-5 w-5 text-primary-600" aria-hidden />
            Contact — Protection des données
          </p>
          <p>
            <a
              href={`mailto:${OFFICIAL_CONTACT.email}`}
              className="text-primary-600 underline hover:text-primary-700"
            >
              {OFFICIAL_CONTACT.email}
            </a>
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {OFFICIAL_CONTACT.address}
          </p>
        </div>

        <p className="text-sm italic text-neutral-500">
          Cette page est en cours de rédaction. Le texte définitif sera publié
          prochainement.
        </p>
      </section>
    </main>
  );
}
