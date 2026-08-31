import {
  Target,
  Eye,
  Users,
  HardHat,
  Building2,
  CheckCircle2,
  Award,
  Shield,
  Sparkles,
  TrendingUp,
  Package,
  Map,
} from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";

// Premium UI Components
import {
  Card,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
} from "../../components/ui";

const milestones = [
  { year: "2021", event: "Création de GNAMBA SERVICES SARLU" },
  { year: "2022", event: "Structuration des offres immobilières, foncières et BTP" },
  { year: "2023", event: "Renforcement du suivi client et du conseil terrain" },
  { year: "2024", event: "Mise en avant de l'offre auprès des clients" },
  { year: "2025", event: "Renforcement des services fonciers et immobiliers" },
  { year: "2026", event: "Visibilité en ligne renforcée et site enrichi" },
];

export default function PublicAbout() {
  const { get } = useSiteContent();

  const title = get("about", "title", "À propos de GNAMBA SERVICES");
  const history = get(
    "about",
    "history",
    "Fondée le 1er septembre 2021, GNAMBA SERVICES accompagne particuliers et entreprises dans leurs projets fonciers, immobiliers, BTP et de fournitures professionnelles.",
  );
  const mission = get(
    "about",
    "mission",
    "Notre mission est d'offrir des solutions fiables en BTP, immobilier, foncier sécurisé et lotissement, avec un accompagnement réactif et orienté résultat.",
  );
  const vision = get(
    "about",
    "vision",
    "Devenir la référence de confiance pour sécuriser les transactions, exécuter les chantiers et faire progresser les projets patrimoniaux en Côte d'Ivoire.",
  );
  const valuesStr = get(
    "about",
    "values",
    "Excellence · Intégrité · Innovation · Proximité",
  );
  const teamDescription = get(
    "about",
    "team_description",
    "Notre équipe réunit des profils terrain, administratif et conseil pour vous répondre vite, vous orienter correctement et faire avancer votre dossier sans friction.",
  );

  const statsProjects = get("about", "stats_projects", "50+");
  const statsClients = get("about", "stats_clients", "100+");
  const statsYears = get("about", "stats_years", "5+");
  const statsEmployees = get("about", "stats_employees", "21+");

  const valueLabels = valuesStr.split("·").map((v) => v.trim()).filter(Boolean);
  const valueDescs = [
    "Nous visons l'excellence dans chaque projet, sans compromis sur la qualité.",
    "Transparence et honnêteté sont les piliers de chaque relation client.",
    "Nous adoptons les meilleures pratiques et technologies pour vos projets.",
    "Un accompagnement personnalisé et une présence constante à vos côtés.",
  ];
  const valueIcons = [Award, Shield, Sparkles, Users];


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
              Notre histoire
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              {title}
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Nous aidons particuliers, investisseurs et entreprises à avancer
              plus vite sur leurs projets immobiliers, de construction et de
              gestion foncière en Côte d'Ivoire.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Shield size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Depuis 2021</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <TrendingUp size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Croissance ivoirienne</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Award size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Expertise certifiée</span>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Histoire / Mission / Vision */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white">
        <Container size="xl">
          <Grid cols={{ base: 1, lg: 2 }} gap="xl" gapY="md" align="center">
            <div>
              <Badge variant="primary" size="sm" className="mb-4">Notre histoire</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight mb-5">
                Une vision, une mission, un engagement
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">{history}</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: "Notre Mission",
                  color: "primary",
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
                const colorStyles: Record<string, { bg: string; icon: string; border: string }> = {
                  primary: { bg: 'bg-primary-100', icon: 'text-primary-600', border: 'border-primary-200' },
                  sky: { bg: 'bg-sky-100', icon: 'text-sky-600', border: 'border-sky-200' },
                };
                const cs = colorStyles[item.color] ?? colorStyles.primary;

                return (
                  <Card key={item.title} variant="bordered" padding="lg" className="group">
                    <Flex align="start" gap="4">
                      <IconWrapper size="md" variant={item.color === 'primary' ? 'primary' : 'secondary'} shape="circle" className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon size={22} className={cs.icon} />
                      </IconWrapper>
                      <Flex direction="col" gap="1">
                        <CardTitle className="font-bold text-neutral-900">{item.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">{item.text}</CardDescription>
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </div>
          </Grid>
        </Container>
      </section>

      {/* Stats */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10">
          <Grid cols={{ base: 2, lg: 4 }} gap="md" className="text-center">
            {[
              { n: statsProjects, l: "Projets réalisés", icon: HardHat },
              { n: statsClients, l: "Clients satisfaits", icon: Users },
              { n: statsYears, l: "Années d'expérience", icon: Building2 },
              { n: statsEmployees, l: "Experts qualifiés", icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="group">
                  <IconWrapper size="xl" variant="ghost" shape="circle" className="mx-auto mb-4 bg-white/10 text-white border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                    <Icon size={28} />
                  </IconWrapper>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white leading-none mb-1">{s.n}</div>
                  <div className="text-primary-200 text-sm font-medium">{s.l}</div>
                </div>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Ce qui nous définit</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Nos Valeurs</h2>
            <p className="text-neutral-500 text-lg leading-relaxed">Ces valeurs fondamentales guident chacune de nos décisions et chaque interaction avec nos clients.</p>
          </Flex>

          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
            {valueLabels.map((label, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
                <Card
                  key={label}
                  variant="default"
                  padding="xl"
                  interactive
                  className="text-center h-full group"
                >
                  <IconWrapper size="xl" variant="primary" shape="circle" className="mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary-600 transition-all duration-300">
                    <Icon size={28} className="text-primary-600 group-hover:text-white transition-colors duration-300" />
                  </IconWrapper>
                  <CardTitle className="text-lg font-bold text-neutral-900 mb-2">{label}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{valueDescs[i] || ""}</CardDescription>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white">
        <Container size="lg">
          <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Notre parcours</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Jalons Importants</h2>
          </Flex>

          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-neutral-200" />
            {milestones.map((m, i) => (
              <Flex key={m.year} align="start" gap="6" className="mb-10 relative">
                <Flex direction="col" align="center" gap="2" className="flex-shrink-0 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs font-bold text-center leading-tight">{m.year}</span>
                  </div>
                  {i < milestones.length - 1 && <div className="w-0.5 h-16 bg-neutral-200" />}
                </Flex>
                <Card variant="muted" padding="lg" className="flex-1 group border-l-4 border-primary-100 group:border-primary-400 transition-colors">
                  <p className="text-neutral-700 font-medium text-sm">{m.event}</p>
                </Card>
              </Flex>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Les experts</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Notre Équipe</h2>
            <p className="text-neutral-500 text-lg leading-relaxed">{teamDescription}</p>
          </Flex>

          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
            {[
              { initials: "DG", name: "Direction Générale", role: "Directeur Général", dept: "Direction", color: 'primary' },
              { initials: "BT", name: "Département BTP", role: "Directeur des Travaux", dept: "BTP", color: 'primary' },
              { initials: "IM", name: "Département Immobilier", role: "Responsable Immobilier", dept: "Immobilier", color: 'sky' },
              { initials: "FO", name: "Département Foncier", role: "Juriste Foncier", dept: "Foncier", color: 'emerald' },
            ].map((member) => {
              const colorStyles: Record<string, { bg: string; light: string; text: string }> = {
                primary: { bg: 'from-primary-600 to-primary-800', light: 'bg-primary-100', text: 'text-primary-600' },
                sky: { bg: 'from-sky-600 to-sky-800', light: 'bg-sky-100', text: 'text-sky-600' },
                emerald: { bg: 'from-emerald-600 to-emerald-800', light: 'bg-emerald-100', text: 'text-emerald-600' },
                amber: { bg: 'from-amber-600 to-amber-800', light: 'bg-amber-100', text: 'text-amber-600' },
              };
              const cs = colorStyles[member.color] ?? colorStyles.primary;

              return (
                <Card
                  key={member.dept}
                  variant="default"
                  padding="xl"
                  interactive
                  className="text-center h-full group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${cs.bg} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-white font-bold text-xl">{member.initials}</span>
                  </div>
                  <CardTitle className="text-base font-bold text-neutral-900 mb-0.5">{member.name}</CardTitle>
                  <p className={`text-sm font-medium ${cs.text} mb-1`}>{member.role}</p>
                  <Badge variant="outline" size="sm" className={cs.light + ' ' + cs.text}>{member.dept}</Badge>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Domains */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-neutral-100">
        <Container size="xl">
          <Flex direction="col" align="center" gap="2" className="mb-12 text-center">
            <CardTitle className="text-xl font-bold text-neutral-900">Nos Domaines d'Activité</CardTitle>
          </Flex>

          <Grid cols={{ base: 2, lg: 4 }} gap="md">
            {[
              { icon: HardHat, label: "BTP & Construction", color: 'primary' },
              { icon: Building2, label: "Immobilier", color: 'sky' },
              { icon: Map, label: "Foncier", color: 'emerald' },
              { icon: Package, label: "Fournitures", color: 'amber' },
            ].map((d) => {
              const Icon = d.icon;
              const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
                primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
                sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
                emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
              };
              const cs = colorStyles[d.color] ?? colorStyles.primary;

              return (
                <Card
                  key={d.label}
                  variant="bordered"
                  padding="lg"
                  interactive
                  className="text-center group"
                >
                  <IconWrapper size="xl" variant={d.color as any} shape="circle" className="mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={28} className={cs.text} />
                  </IconWrapper>
                  <p className={`text-sm font-semibold ${cs.text}`}>{d.label}</p>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>
    </div>
  );
}