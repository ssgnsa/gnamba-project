import { ArrowRight, CheckCircle2, HardHat, MessageCircle, Phone } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const items = [
  "Construction de villas et bâtiments",
  "Rénovation et réhabilitation",
  "Suivi de chantier et coordination",
  "Études et préparation du projet",
];

const promises = [
  "Des délais annoncés clairement",
  "Un suivi lisible pour le client",
  "Une exécution adaptée au contexte local",
  "Une équipe mobilisée sur vos objectifs",
];

export default function PublicBtpConstruction({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-slate-900 to-slate-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.45),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.35),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            BTP & Construction
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Construction, rénovation et suivi de chantier
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Une page dédiée à l'activité BTP pour présenter les prestations et
            faciliter la prise de contact.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("contact")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Demander un devis
              <ArrowRight size={16} />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              <HardHat size={14} />
              Chantier
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Des prestations concrètes
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Cette page présente nos services, nos engagements et les projets
              que nous accompagnons.
            </p>
            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="mt-0.5 text-orange-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Engagements
            </div>
            <h2 className="mt-3 text-2xl font-bold">Ce que nous garantissons</h2>
            <div className="mt-6 space-y-3">
              {promises.map((promise) => (
                <div key={promise} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/80">
                  {promise}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("realisations")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Réalisations
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate("contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-400"
              >
                <Phone size={16} />
                Contact
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
