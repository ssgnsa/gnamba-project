import { ArrowRight, MessageCircle, Quote, Star, UserRound } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const testimonials = [
  {
    name: "Client particulier",
    role: "Achat de terrain",
    text: "L'équipe a clarifié les étapes et les documents dès le premier échange. Le suivi a été simple et direct.",
  },
  {
    name: "Promoteur local",
    role: "Lotissement",
    text: "Nous avons apprécié la structure commerciale et la qualité de l'information sur les lots publiés.",
  },
  {
    name: "Entreprise BTP",
    role: "Suivi de chantier",
    text: "Les échanges ont été simples et rapides, avec des réponses claires à chaque étape.",
  },
];

export default function PublicTestimonials({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.55),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.3),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Témoignages
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Ce que disent nos clients
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Une vitrine simple pour mettre en avant les retours clients avec
            transparence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("contact")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Laisser un message
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <Quote size={22} className="text-blue-700" />
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {item.role}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-amber-500">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                  Et après ?
                </div>
                <h2 className="mt-2 text-2xl font-bold">
                  Les retours nous aident à mieux vous accompagner
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Pour une nouvelle demande, contactez GNAMBA SERVICES au{" "}
                  {OFFICIAL_CONTACT.phone} ou utilisez le formulaire de contact.
                </p>
              </div>
              <button
                onClick={() => onNavigate("contact")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Contact
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
