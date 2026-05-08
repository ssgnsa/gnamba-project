import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteContext } from "@/lib/site";

const FALLBACK_POSTS = [
  {
    title: "Journal de bord: campagne mais 2026",
    category: "Production",
    date: "02 Avr 2026",
    excerpt:
      "Bilan mi-saison, points d eau critiques, plan d irrigation optimise.",
  },
  {
    title: "Qualite sanitaire: controle et retrait",
    category: "Elevage",
    date: "28 Mar 2026",
    excerpt:
      "Nouveaux protocoles de vaccination et suivi des delais de retrait.",
  },
  {
    title: "Stocks intelligents: seuils et alertes",
    category: "Supply",
    date: "18 Mar 2026",
    excerpt: "Mise en place des seuils min/max pour eviter les ruptures.",
  },
];

const FALLBACK_PHOTOS = [
  {
    title: "Parcelle C2 - Tomates",
    tone: "from-emerald-200 via-emerald-400 to-emerald-700",
  },
  {
    title: "Elevage - Couvoir",
    tone: "from-amber-200 via-orange-400 to-orange-700",
  },
  { title: "Hangar stockage", tone: "from-sky-200 via-sky-400 to-sky-700" },
  {
    title: "Equipe terrain",
    tone: "from-indigo-200 via-indigo-400 to-indigo-700",
  },
  {
    title: "Irrigation goutte a goutte",
    tone: "from-lime-200 via-lime-400 to-lime-700",
  },
  {
    title: "Transformation et conditionnement",
    tone: "from-rose-200 via-rose-400 to-rose-700",
  },
];

export default async function HomePage() {
  const { tenantId, settings } = await getSiteContext();
  const supabase = createServerSupabase();

  const { data: postsData } = tenantId
    ? await supabase
        .from("site_blog_posts")
        .select("id, title, excerpt, published_at")
        .eq("tenant_id", tenantId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3)
    : { data: [] };

  const { data: photosData } = tenantId
    ? await supabase
        .from("site_album_photos")
        .select("id, title, image_url")
        .eq("tenant_id", tenantId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

  const primary = settings.primary_color || "#34d399";
  const secondary = settings.secondary_color || "#0f172a";

  const posts = postsData?.length
    ? postsData.map((post) => ({
        title: post.title,
        category: "SomAgro",
        date: post.published_at
          ? new Date(post.published_at).toLocaleDateString("fr-FR")
          : "",
        excerpt: post.excerpt ?? "",
      }))
    : FALLBACK_POSTS;

  const photos = photosData?.length
    ? photosData.map((photo) => ({
        title: photo.title ?? "Photo SomAgro",
        image_url: photo.image_url,
      }))
    : FALLBACK_PHOTOS;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at top, ${primary}55, transparent 60%)`,
          }}
        />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em]">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="h-10 w-10 rounded-2xl bg-white/10 object-cover"
              />
            ) : null}
            <span style={{ color: primary }}>{settings.site_name}</span>
          </div>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/70">
            <a href="/blog" className="transition hover:text-white">
              Blog
            </a>
            <a href="/album" className="transition hover:text-white">
              Album
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:border-white"
            >
              Connexion
            </a>
          </nav>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 pt-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p
              className="text-xs uppercase tracking-[0.4em]"
              style={{ color: primary }}
            >
              {settings.tagline}
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              {settings.hero_title}
            </h1>
            <p className="text-base text-white/70">{settings.hero_subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <span
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: primary }}
              >
                Tracabilite totale
              </span>
              <span
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: primary }}
              >
                IA temps reel
              </span>
              <span
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: primary }}
              >
                Offline ready
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={settings.cta_url}
                className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950 transition"
                style={{ backgroundColor: primary }}
              >
                {settings.cta_label}
              </a>
              <a
                href="/dashboard"
                className="rounded-full border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white"
              >
                Voir le dashboard
              </a>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div
              className="absolute -top-10 right-0 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${primary}33` }}
            />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Apercu operations
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Elevation multi-especes",
                  "Parcelles connectees",
                  "Stocks predictifs",
                  "Alertes IA",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white py-16 text-slate-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              title: "Elevage multi-especes",
              desc: "Lots, animaux, sante, mortalite, vente et trace sanitaire.",
            },
            {
              title: "Production vegetale",
              desc: "Parcelles, cycles, interventions et recoltes en temps reel.",
            },
            {
              title: "Construction & maintenance",
              desc: "Batiments, equipements, audits et planning previsionnel.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: primary }}
              >
                Blog
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Dernieres actualites {settings.site_name}
              </h2>
            </div>
            <a
              href="/blog"
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              Voir tout
            </a>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80"
              >
                <p
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{ color: primary }}
                >
                  {post.category}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm text-white/70">{post.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>{post.date}</span>
                  <span style={{ color: primary }}>Lire</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: primary }}
              >
                Album photo
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Moments de terrain
              </h2>
            </div>
            <a
              href="/album"
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              Voir l album
            </a>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm"
              >
                {"image_url" in photo ? (
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-44 w-full bg-gradient-to-br ${photo.tone}`}
                  />
                )}
                <div className="absolute inset-0 flex items-end justify-between p-4 text-white">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                      Album
                    </p>
                    <p className="mt-1 text-sm font-semibold">{photo.title}</p>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                    Voir
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-70" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: secondary }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: primary }}
            >
              Contact
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Passez en mode {settings.site_name} Premium
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Discutez avec notre equipe pour configurer votre exploitation et
              activer les tableaux de bord intelligents.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">Email</p>
            <p className="mt-2 text-lg font-semibold text-white">
              contact@somagro.ci
            </p>
            <p className="mt-4 text-sm text-white/70">Telephone</p>
            <p className="mt-2 text-lg font-semibold text-white">
              +225 07 00 00 00 00
            </p>
            <a
              href={settings.cta_url}
              className="mt-6 inline-flex rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950"
              style={{ backgroundColor: primary }}
            >
              {settings.cta_label}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
