import { useEffect, useState, type ComponentType } from "react";
import {
  HardHat,
  Building2,
  Map,
  Package,
  MapPin,
  Calendar,
  Search,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Realisation {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  location: string;
  featured: boolean;
}

const categories = [
  { id: "all", label: "Tous les projets" },
  { id: "btp", label: "BTP" },
  { id: "immobilier", label: "Immobilier" },
  { id: "foncier", label: "Foncier" },
  { id: "fournitures", label: "Fournitures" },
];

const categoryIcons: Record<
  string,
  ComponentType<{ size?: number | string; className?: string }>
> = {
  btp: HardHat,
  immobilier: Building2,
  foncier: Map,
  fournitures: Package,
};

const categoryColors: Record<
  string,
  { bg: string; text: string; from: string; to: string }
> = {
  btp: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    from: "from-blue-600",
    to: "to-blue-800",
  },
  immobilier: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    from: "from-sky-500",
    to: "to-sky-700",
  },
  foncier: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    from: "from-emerald-600",
    to: "to-emerald-800",
  },
  fournitures: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    from: "from-amber-500",
    to: "to-amber-700",
  },
};

export default function PublicRealisations() {
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("site_realisations")
          .select("*")
          .order("featured", { ascending: false })
          .order("sort_order");

        if (data) setRealisations(data);
        if (error) setRealisations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = realisations.filter((r) => {
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
            Notre portfolio
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Nos Réalisations
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Découvrez quelques-uns de nos projets réalisés avec excellence à
            travers la Côte d'Ivoire.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-gray-100 sticky top-16 lg:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-blue-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 w-60 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <HardHat size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun projet trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r) => {
                const c = categoryColors[r.category] || categoryColors.btp;
                const Icon = categoryIcons[r.category] || HardHat;
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div
                      className={`h-52 bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <Icon
                        size={52}
                        className="text-white/40 relative z-10 group-hover:scale-110 transition-transform duration-300"
                      />
                      {r.featured && (
                        <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full z-10">
                          Projet phare
                        </div>
                      )}
                      <div className={`absolute top-3 right-3 z-10`}>
                        <span
                          className={`${c.bg} ${c.text} text-xs font-semibold px-2.5 py-1 rounded-full`}
                        >
                          {r.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                        {r.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} />
                          {r.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {r.year}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10 text-sm text-gray-400">
            {filtered.length} projet{filtered.length !== 1 ? "s" : ""} affiché
            {filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>
    </div>
  );
}
