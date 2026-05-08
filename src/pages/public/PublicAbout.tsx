import {
  Target,
  Eye,
  Heart,
  Users,
  HardHat,
  Building2,
  Map,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";

const milestones = [
  { year: "2015", event: "Création de Gnamba Services à Abidjan" },
  {
    year: "2017",
    event: "Lancement du département Immobilier et gestion locative",
  },
  { year: "2019", event: "Ouverture du service Foncier villageois" },
  {
    year: "2021",
    event: "Expansion du département Fournitures Professionnelles",
  },
  { year: "2023", event: "Cap des 300 clients et 150 projets réalisés" },
  { year: "2025", event: "Digitalisation complète avec le système EGS" },
];

const valueIcons = [CheckCircle2, Heart, Target, Users];

export default function PublicAbout() {
  const { get } = useSiteContent();

  const title = get("about", "title", "À propos de Gnamba Services");
  const history = get(
    "about",
    "history",
    "Fondée avec la vision de transformer le paysage immobilier et foncier ivoirien, Gnamba Services est une entreprise multiservices qui accompagne particuliers et entreprises dans la réalisation de leurs projets.",
  );
  const mission = get(
    "about",
    "mission",
    "Notre mission est d'offrir des services de qualité supérieure dans le BTP, l'immobilier, la gestion foncière et les fournitures professionnelles.",
  );
  const vision = get(
    "about",
    "vision",
    "Devenir la référence incontournable des services immobiliers et BTP en Afrique de l'Ouest, en offrant des solutions innovantes et durables.",
  );
  const valuesStr = get(
    "about",
    "values",
    "Excellence · Intégrité · Innovation · Proximité",
  );
  const teamDescription = get(
    "about",
    "team_description",
    "Notre équipe est composée d'experts qualifiés dans leurs domaines respectifs, unis par une passion pour l'excellence.",
  );

  const statsProjects = get("about", "stats_projects", "150+");
  const statsClients = get("about", "stats_clients", "300+");
  const statsYears = get("about", "stats_years", "10+");
  const statsEmployees = get("about", "stats_employees", "50+");

  const valueLabels = valuesStr
    .split("·")
    .map((v) => v.trim())
    .filter(Boolean);
  const valueDescs = [
    "Nous visons l'excellence dans chaque projet, sans compromis sur la qualité.",
    "Transparence et honnêteté sont les piliers de chaque relation client.",
    "Nous adoptons les meilleures pratiques et technologies pour vos projets.",
    "Un accompagnement personnalisé et une présence constante à vos côtés.",
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-blue-300 font-semibold text-sm uppercase tracking-widest">
            Notre histoire
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            {title}
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Depuis 2015, nous accompagnons particuliers et entreprises dans la
            réalisation de leurs projets immobiliers, de construction et de
            gestion foncière en Côte d'Ivoire.
          </p>
        </div>
      </section>

      {/* Histoire / Mission / Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
                Notre histoire
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-5">
                Une vision, une mission, un engagement
              </h2>
              <p className="text-gray-600 leading-relaxed">{history}</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: "Notre Mission",
                  color: "blue",
                  text: mission,
                },
                {
                  icon: Eye,
                  title: "Notre Vision",
                  color: "sky",
                  text: vision,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 ${item.color === "blue" ? "bg-blue-100" : "bg-sky-100"} rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon
                          size={20}
                          className={
                            item.color === "blue"
                              ? "text-blue-700"
                              : "text-sky-600"
                          }
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: statsProjects, l: "Projets réalisés", icon: HardHat },
              { n: statsClients, l: "Clients satisfaits", icon: Users },
              { n: statsYears, l: "Années d'expérience", icon: Building2 },
              { n: statsEmployees, l: "Experts qualifiés", icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="text-center">
                  <Icon size={28} className="text-blue-300 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{s.n}</div>
                  <div className="text-blue-200 text-sm mt-1">{s.l}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              Ce qui nous définit
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">
              Nos Valeurs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Ces valeurs fondamentales guident chacune de nos décisions et
              chaque interaction avec nos clients.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueLabels.map((label, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={22} className="text-blue-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {valueDescs[i] || ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              Notre parcours
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Jalons Importants
            </h2>
          </div>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={m.year} className="flex gap-6 items-start">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">
                      {m.year}
                    </span>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 h-6 bg-blue-200 mt-2" />
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex-1 border border-gray-100">
                  <p className="text-gray-700 font-medium text-sm">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team description */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">
              Les experts
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">
              Notre Équipe
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">{teamDescription}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                initials: "DG",
                name: "Direction Générale",
                role: "Directeur Général",
                dept: "Direction",
              },
              {
                initials: "BT",
                name: "Département BTP",
                role: "Directeur des Travaux",
                dept: "BTP",
              },
              {
                initials: "IM",
                name: "Département Immobilier",
                role: "Responsable Immobilier",
                dept: "Immobilier",
              },
              {
                initials: "FO",
                name: "Département Foncier",
                role: "Juriste Foncier",
                dept: "Foncier",
              },
            ].map((member) => (
              <div
                key={member.dept}
                className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white font-bold text-lg">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-0.5 text-sm">
                  {member.name}
                </h3>
                <p className="text-sm text-blue-600 font-medium mb-1">
                  {member.role}
                </p>
                <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                  {member.dept}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center font-bold text-gray-900 text-xl mb-8">
            Nos Domaines d'Activité
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HardHat, label: "BTP & Construction", color: "blue" },
              { icon: Building2, label: "Immobilier", color: "sky" },
              { icon: Map, label: "Foncier", color: "emerald" },
              { icon: Package, label: "Fournitures", color: "amber" },
            ].map((d) => {
              const Icon = d.icon;
              const bg = {
                blue: "bg-blue-50",
                sky: "bg-sky-50",
                emerald: "bg-emerald-50",
                amber: "bg-amber-50",
              }[d.color];
              const text = {
                blue: "text-blue-700",
                sky: "text-sky-600",
                emerald: "text-emerald-600",
                amber: "text-amber-600",
              }[d.color];
              return (
                <div
                  key={d.label}
                  className={`${bg} rounded-xl p-5 text-center`}
                >
                  <Icon size={28} className={`${text} mx-auto mb-2`} />
                  <p className={`text-sm font-semibold ${text}`}>{d.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
