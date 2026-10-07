import { useEffect, useState, type ComponentType } from "react";
import {
  HardHat,
  Building2,
  Map,
  Package,
  MapPin,
  Calendar,
  Search,
  Shield,
  Award,
  Sparkles,
} from "lucide-react";
import dbClient from "../../data/tableClient";

// Premium UI Components
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Skeleton,
  Input,
} from "../../components/ui";

interface Realisation {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  location: string;
  featured: boolean;
  image_url?: string;
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

export default function PublicRealisations() {
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try {
        const { data, error } = await dbClient
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

  const getCategoryStyles = (category: string) => {
    const styles: Record<string, { bg: string; text: string; light: string; icon: string }> = {
      btp: { bg: 'bg-primary-100', text: 'text-primary-700', light: 'bg-primary-50', icon: 'text-primary-600' },
      immobilier: { bg: 'bg-sky-100', text: 'text-sky-700', light: 'bg-sky-50', icon: 'text-sky-600' },
      foncier: { bg: 'bg-emerald-100', text: 'text-emerald-700', light: 'bg-emerald-50', icon: 'text-emerald-600' },
      fournitures: { bg: 'bg-amber-100', text: 'text-amber-700', light: 'bg-amber-50', icon: 'text-amber-600' },
    };
    return styles[category] || styles.btp;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Notre portfolio
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Nos <span className="bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent">Réalisations</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Découvrez des projets livrés avec méthode, qualité et sens du
              résultat à travers la Côte d'Ivoire.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Shield size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Projets certifiés</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Award size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Qualité garantie</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Sparkles size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Expertise reconnue</span>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Filters - Sticky */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
        <Container size="xl" className="py-4">
          <Flex align="center" justify="between" wrap gap="4">
            <Flex wrap gap="2" className="flex-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="transition-all duration-200"
                >
                  {cat.label}
                </Button>
              ))}
            </Flex>
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par projet, ville ou service..."
                className="pl-10"
                type="search"
              />
            </div>
          </Flex>
        </Container>
      </div>

      {/* Gallery */}
      <section className="py-16 sm:py-20 lg:py-24 bg-neutral-50">
        <Container size="xl">
          {loading ? (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="default" padding="none" className="overflow-hidden animate-pulse">
                  <Skeleton variant="rectangular" className="h-52 w-full" />
                  <CardContent padding="lg">
                    <Skeleton variant="text" width="3/4" className="mb-3" />
                    <Skeleton variant="text" width="full" className="mb-2" />
                    <Skeleton variant="text" width="1/2" />
                  </CardContent>
                </Card>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Flex direction="col" align="center" gap="4" className="py-20 text-center">
              <IconWrapper size="xl" variant="ghost" shape="circle" className="text-neutral-300">
                <HardHat size={32} />
              </IconWrapper>
              <CardTitle className="text-lg font-semibold text-neutral-900">Aucun projet trouvé</CardTitle>
              <CardDescription className="max-w-sm text-center">Essayez une autre catégorie ou revenez plus tard pour voir nos dernières références.</CardDescription>
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setActiveCategory("all"); }}>
                Effacer les filtres
              </Button>
            </Flex>
          ) : (
            <>
              <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
                {filtered.map((r) => {
                  const c = getCategoryStyles(r.category);
                  const Icon = categoryIcons[r.category] || HardHat;

                  return (
                    <Card
                      key={r.id}
                      variant="elevated"
                      padding="none"
                      className="overflow-hidden group h-full flex flex-col"
                    >
                      <div className="relative h-52 bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Icon size={56} className="text-primary-200 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {r.featured && (
                          <div className="absolute top-3 left-3 z-10">
                            <Badge variant="warning" size="sm" className="bg-amber-500/90 text-white">Projet phare</Badge>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 z-10">
                          <Badge size="sm" variant="primary" className={c.bg + ' ' + c.text}>
                            {r.category.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <CardContent padding="lg" className="flex-1 flex flex-col">
                        <Flex align="center" justify="between" className="mb-3">
                          <CardTitle className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1">{r.title}</CardTitle>
                        </Flex>
                        <p className="text-sm text-neutral-500 leading-relaxed mb-4 flex-1 line-clamp-2">{r.description}</p>
                        <Flex align="center" justify="between" className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                          <Flex align="center" gap="1.5">
                            <MapPin size={11} />
                            {r.location}
                          </Flex>
                          <Flex align="center" gap="1.5">
                            <Calendar size={11} />
                            {r.year}
                          </Flex>
                        </Flex>
                      </CardContent>
                    </Card>
                  );
                })}
              </Grid>

              <Flex justify="center" className="mt-8">
                <Badge variant="outline" size="md" className="text-sm">
                  {filtered.length} projet{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
                </Badge>
              </Flex>
            </>
          )}
        </Container>
      </section>
    </div>
  );
}