import { ArrowRight, Building2, CheckCircle2, MessageCircle, Phone } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const benefits = [
  "Gestion locative et suivi des loyers",
  "Vente, achat et estimation de biens",
  "Accompagnement sur les dossiers de location",
  "Conseil pour la valorisation du patrimoine",
];

const services = [
  "Résidentiel",
  "Commercial",
  "Suivi administratif",
  "Mise en relation d'acquéreurs",
];

export default function PublicImmobilier({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.35),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Immobilier
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Gestion, vente et valorisation immobilière
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Un accompagnement clair pour vos biens résidentiels et commerciaux,
            avec une logique simple: sécuriser, valoriser et faire avancer.
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
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              <Building2 size={14} />
              Ce que nous couvrons
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Un espace pensé pour les biens à valoriser
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Immobilier et foncier ne servent pas au même moment de vie d'un
              dossier. Ici, nous nous concentrons sur la gestion, la vente et la
              mise en relation avec des acquéreurs.
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="mt-0.5 text-blue-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Services associés
            </div>
              <h2 className="mt-3 text-2xl font-bold">Immobilier de gestion</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div key={service} className="rounded-2xl bg-white/8 px-4 py-4">
                  <div className="text-sm font-medium text-white/90">{service}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/75">
              Besoin d'une estimation ou d'un suivi de bien? Contactez-nous
              directement pour une réponse rapide et une orientation claire.
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
                onClick={() => onNavigate("realisations")}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Voir les réalisations
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
