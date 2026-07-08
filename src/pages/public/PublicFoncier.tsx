import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const items = [
  "Régularisation et sécurisation foncière",
  "Bornage, délimitation et repérage terrain",
  "Préparation des pièces foncières",
  "Accompagnement après achat ou vente",
];

const processSteps = [
  "Analyse du terrain et des pièces disponibles",
  "Vérification des pièces et des informations",
  "Mise en ordre et suivi administratif",
  "Accompagnement jusqu'à la mise au point finale",
];

export default function PublicFoncier({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.5),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.35),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Foncier
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Sécurisation et suivi des dossiers fonciers
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Notre accompagnement foncier intervient après l'achat, la vente ou
            la régularisation. Nous gardons le cap sur la clarté, le suivi et
            les prochaines étapes.
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
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <MapPin size={14} />
              Terrain & foncier
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Une approche claire et rigoureuse
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Nous évitons les promesses vagues. Cette page présente notre
              accompagnement foncier avec des étapes concrètes et des
              informations faciles à comprendre.
            </p>
            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="mt-0.5 text-emerald-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Étapes
            </div>
            <h2 className="mt-3 text-2xl font-bold">Étapes de travail</h2>
            <div className="mt-6 space-y-3">
              {processSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-white/80">{step}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("lots")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Lots disponibles
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate("contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
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
