import {
  Building2,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

const legalPoints = [
  {
    icon: Building2,
    label: "Raison sociale",
    value: OFFICIAL_CONTACT.legalName,
  },
  {
    icon: FileText,
    label: "Forme juridique",
    value: OFFICIAL_CONTACT.legalForm,
  },
  {
    icon: ClipboardList,
    label: "RCCM",
    value: OFFICIAL_CONTACT.rccm,
  },
  {
    icon: FileText,
    label: "NCC",
    value: OFFICIAL_CONTACT.ncc,
  },
  {
    icon: UserRound,
    label: "Dirigeant",
    value: OFFICIAL_CONTACT.director,
  },
  {
    icon: ShieldCheck,
    label: "Capital social",
    value: OFFICIAL_CONTACT.capitalSocial,
  },
];

export default function PublicLegal() {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.45),_transparent_35%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Mentions légales
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">
            Informations légales et contacts officiels
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
            Les données officielles de l’entreprise et les informations utiles
            pour nous contacter ou vérifier l’identité de GNAMBA SERVICES.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {legalPoints.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {item.label}
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {item.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Coordonnées
              </div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Nous joindre
              </h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 text-blue-700" />
                  <div>
                    <div className="font-semibold text-slate-900">Adresse</div>
                    <div>{OFFICIAL_CONTACT.address}</div>
                    <div className="text-slate-500">
                      {OFFICIAL_CONTACT.physicalAddress}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={18} className="mt-0.5 text-blue-700" />
                  <div>
                    <div className="font-semibold text-slate-900">Téléphone</div>
                    <a
                      href={`tel:${OFFICIAL_CONTACT.phone.replace(/\s+/g, "")}`}
                      className="hover:text-blue-700"
                    >
                      {OFFICIAL_CONTACT.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 text-blue-700" />
                  <div>
                    <div className="font-semibold text-slate-900">Email</div>
                    <div>{OFFICIAL_CONTACT.email}</div>
                    <div>{OFFICIAL_CONTACT.quoteEmail}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Protection des données
              </div>
              <h2 className="mt-2 text-2xl font-bold">
                Protection des données
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-white/75">
                <p>
                  Les informations que vous transmettez via nos formulaires sont
                  utilisées uniquement pour traiter votre demande, qualifier
                  votre besoin et vous recontacter.
                </p>
                <p>
                  Les lots publiés sur la vitrine peuvent être retirés,
                  réservés ou modifiés selon leur disponibilité et les mises à
                  jour commerciales.
                </p>
                <p>
                  Pour toute demande relative à la protection des données ou à la
                  suppression d’une fiche, contactez-nous à{" "}
                  {OFFICIAL_CONTACT.email}.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:${OFFICIAL_CONTACT.email}`}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Envoyer un email
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Horaires</h2>
            <p className="mt-2 text-sm text-slate-600">
              {OFFICIAL_CONTACT.hours}. Délai de réponse:{" "}
              {OFFICIAL_CONTACT.responseTime}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
