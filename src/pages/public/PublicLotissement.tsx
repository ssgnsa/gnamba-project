import { ArrowRight, CheckCircle2, Layers3, MessageCircle, Phone } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const points = [
  "Viabilisation et découpage de terrains",
  "Mise en valeur des lots",
  "Suivi de la cohérence des références",
  "Préparation des fiches à vendre",
];

const stages = [
  "Étude du site et définition du plan",
  "Organisation des parcelles et des accès",
  "Préparation des lots",
  "Publication et suivi des demandes",
];

export default function PublicLotissement({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.3),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Lotissement
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Lotissement et mise en marché des parcelles
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Une page dédiée au lotissement et à la mise en marché des parcelles,
            pensée pour présenter les terrains à vendre de façon claire.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("lots")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Voir les lots
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
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              <Layers3 size={14} />
              Présentation
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Des parcelles prêtes à être présentées
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Les informations peuvent évoluer avec le terrain et les documents
              disponibles. La page lotissement sert à montrer l'offre, la
              disponibilité et la logique de présentation.
            </p>
            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="mt-0.5 text-blue-600" />
                  <span className="text-sm text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Déroulé
            </div>
            <h2 className="mt-3 text-2xl font-bold">Étapes de lotissement</h2>
            <div className="mt-6 space-y-3">
              {stages.map((stage, index) => (
                <div
                  key={stage}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-white/80">{stage}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("contact")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <Phone size={16} />
                Contact
              </button>
              <button
                onClick={() => onNavigate("faq")}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Questions fréquentes
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
