import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const faqs = [
  {
    question: "Comment réserver un lot à vendre ?",
    answer:
      "Après votre prise de contact, nous confirmons la disponibilité, les documents et les conditions commerciales avant toute réservation.",
  },
  {
    question: "Les lots publiés sont-ils vérifiés ?",
    answer:
      "Oui. Chaque fiche publique est contrôlée avant publication et accompagnée des éléments disponibles.",
  },
  {
    question: "Puis-je demander un lot avec peu d’informations ?",
    answer:
      "Oui, vous pouvez commencer avec les informations essentielles puis compléter la fiche plus tard.",
  },
  {
    question: "Quel est le délai de réponse ?",
    answer:
      "Notre engagement est une réponse sous 48h ouvrées maximum, par téléphone, WhatsApp ou email.",
  },
  {
    question: "À quoi sert l’espace foncier ?",
    answer:
      "L’espace foncier reste dédié au suivi administratif des lots après achat, vente ou régularisation. Le catalogue des lots à vendre est séparé.",
  },
  {
    question: "Quels documents sont généralement demandés ?",
    answer:
      "Attestation coutumière, plan de bornage, référence de lotissement et toute pièce utile à la sécurisation de la transaction.",
  },
];

export default function PublicFAQ({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="pt-20">
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.45),_transparent_35%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            <ShieldCheck size={14} />
            FAQ
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">
            Questions fréquentes
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
            Des réponses claires sur les lots à vendre, la réservation, les
            documents et notre façon de travailler.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
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

      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const open = openIndex === index;
              return (
                <button
                  key={faq.question}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      {faq.question}
                    </h2>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                  {open && (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {faq.answer}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                  Besoin d'aide
                </div>
                <h2 className="mt-2 text-2xl font-bold">
                  Nous répondons sous 48h ouvrées
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Appelez-nous au {OFFICIAL_CONTACT.phone}, écrivez à{" "}
                  {OFFICIAL_CONTACT.email} ou utilisez WhatsApp pour une réponse
                  plus rapide.
                </p>
              </div>
              <a
                href={`tel:${OFFICIAL_CONTACT.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <Phone size={16} />
                Appeler maintenant
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
