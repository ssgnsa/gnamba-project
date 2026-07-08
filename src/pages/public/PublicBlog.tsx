import { ArrowRight, BookOpen, CalendarDays, MessageCircle, Tag } from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const articles = [
  {
    title: "Comment sécuriser un terrain avant achat",
    category: "Foncier",
    date: "Conseil pratique",
    summary:
      "Les bons réflexes pour vérifier les pièces, poser les bonnes questions et éviter les zones d'ombre.",
  },
  {
    title: "Préparer un lot à la vente avec une fiche claire",
    category: "Lotissement",
    date: "Vitrine commerciale",
    summary:
      "Quelques règles simples pour publier une fiche claire, lisible et facile à consulter.",
  },
  {
    title: "BTP : garder le cap sur un chantier",
    category: "Construction",
    date: "Suivi chantier",
    summary:
      "Un chantier avance mieux quand les délais, le budget et la communication restent bien suivis.",
  },
];

export default function PublicBlog({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.45),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.3),_transparent_35%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Blog
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            Conseils, bonnes pratiques et actualités
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            Une page éditoriale simple pour publier des contenus utiles autour
            du foncier, de l'immobilier et du BTP.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("contact")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Nous écrire
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
            {articles.map((article) => (
              <article
                key={article.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  <Tag size={12} />
                  {article.category}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {article.title}
                </h2>
                <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <CalendarDays size={13} />
                  {article.date}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {article.summary}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <BookOpen size={16} />
                  Article bientôt disponible
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                  Publication
                </div>
                <h2 className="mt-2 text-2xl font-bold">
                  Espace éditorial prêt à accueillir vos conseils et actualités
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/70">
                  Le blog peut accueillir des conseils, des annonces et des
                  mises en avant de projets selon vos priorités de communication.
                </p>
              </div>
              <button
                onClick={() => onNavigate("services")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Nos services
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
