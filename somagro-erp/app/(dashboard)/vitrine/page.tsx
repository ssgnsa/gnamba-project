import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import { requireAccess, getAccessProfile } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import CreateBlogPostForm from "@/components/forms/vitrine/CreateBlogPostForm";
import CreateAlbumPhotoForm from "@/components/forms/vitrine/CreateAlbumPhotoForm";
import UpdateBlogPostForm from "@/components/forms/vitrine/UpdateBlogPostForm";
import UpdateAlbumPhotoForm from "@/components/forms/vitrine/UpdateAlbumPhotoForm";
import UpdateSiteSettingsForm from "@/components/forms/vitrine/UpdateSiteSettingsForm";

const DEFAULT_SETTINGS = {
  site_name: "SomAgro",
  tagline: "ERP agricole intelligent",
  primary_color: "#34d399",
  secondary_color: "#0f172a",
  logo_url: null as string | null,
  hero_title:
    "Pilotage complet des exploitations agricoles, du champ a la vente.",
  hero_subtitle:
    "SomAgro ERP connecte elevage, cultures, infrastructures, stocks et finance dans un meme cockpit. Concu pour fonctionner sur le terrain.",
  cta_label: "Demarrer",
  cta_url: "/register",
  is_public: true,
};

export default async function Page() {
  await requireAccess("vitrine");
  const supabase = createServerSupabase();
  const profile = await getAccessProfile();
  const tenantId = profile?.tenant_id ?? null;

  const { data: tenant } = tenantId
    ? await supabase
        .from("tenants")
        .select("id, name, logo_url")
        .eq("id", tenantId)
        .maybeSingle()
    : { data: null };

  const { data: postsData } = tenantId
    ? await supabase
        .from("site_blog_posts")
        .select(
          "id, title, slug, excerpt, content, cover_url, published_at, is_published, created_at",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(12)
    : { data: [] };

  const { data: photosData } = tenantId
    ? await supabase
        .from("site_album_photos")
        .select(
          "id, title, caption, image_url, taken_at, is_public, created_at",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(12)
    : { data: [] };

  const { data: settingsData } = tenantId
    ? await supabase
        .from("site_settings")
        .select(
          "site_name, tagline, primary_color, secondary_color, logo_url, hero_title, hero_subtitle, cta_label, cta_url, is_public",
        )
        .eq("tenant_id", tenantId)
        .maybeSingle()
    : { data: null };

  const posts = postsData ?? [];
  const photos = photosData ?? [];
  const publishedPosts = posts.filter((post) => post.is_published).length;
  const publicPhotos = photos.filter((photo) => photo.is_public).length;

  const settings = {
    ...DEFAULT_SETTINGS,
    ...settingsData,
    site_name:
      settingsData?.site_name ?? tenant?.name ?? DEFAULT_SETTINGS.site_name,
    logo_url:
      settingsData?.logo_url ?? tenant?.logo_url ?? DEFAULT_SETTINGS.logo_url,
  };

  return (
    <ModuleShell
      title="Vitrine"
      subtitle="Piloter le site vitrine, le blog et l'album photo par tenant."
      tag="Communication"
      tone="from-emerald-900 via-emerald-700 to-lime-500"
      actions={[
        { label: "Parametres vitrine", variant: "primary", href: "?edit=site" },
        { label: "Nouvel article", variant: "ghost", href: "?create=post" },
        { label: "Nouvelle photo", variant: "ghost", href: "?create=photo" },
      ]}
    >
      <AutoRefresh intervalMs={120000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Articles publies"
          value={formatNumber(publishedPosts)}
          change="blog"
          helper="vitrine"
          tone="emerald"
        />
        <MetricCard
          label="Photos publiques"
          value={formatNumber(publicPhotos)}
          change="album"
          helper="vitrine"
          tone="sky"
        />
        <MetricCard
          label="Statut"
          value={settings.is_public ? "public" : "prive"}
          change="site"
          helper="visibilite"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Blog
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Articles recent
              </h2>
            </div>
            <a
              href="/blog"
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
            >
              Voir blog
            </a>
          </div>
          <div className="mt-6 space-y-3">
            {posts.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun article pour ce tenant.
              </p>
            ) : (
              posts.slice(0, 6).map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {post.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {post.excerpt ?? "Sans extrait"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                        {post.is_published ? "publie" : "brouillon"}
                      </span>
                      <a
                        href={`?edit=post&id=${post.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600"
                      >
                        Modifier
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Album
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Photos recentes
          </h2>
          <div className="mt-6 space-y-4">
            {photos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune photo pour ce tenant.
              </p>
            ) : (
              photos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {photo.title ?? "Photo"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {photo.caption ?? "Sans legende"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-700">
                        {photo.is_public ? "public" : "prive"}
                      </span>
                      <a
                        href={`?edit=photo&id=${photo.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600"
                      >
                        Modifier
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Identite
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          Parametres actuels
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Nom
            </p>
            <p className="mt-2 font-medium text-slate-900">
              {settings.site_name}
            </p>
            <p className="mt-2 text-xs text-slate-500">{settings.tagline}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Couleurs
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-slate-200"
                style={{ backgroundColor: settings.primary_color }}
              />
              <span className="text-xs text-slate-500">
                {settings.primary_color}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-slate-200"
                style={{ backgroundColor: settings.secondary_color }}
              />
              <span className="text-xs text-slate-500">
                {settings.secondary_color}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              CTA
            </p>
            <p className="mt-2 font-medium text-slate-900">
              {settings.cta_label}
            </p>
            <p className="mt-2 text-xs text-slate-500">{settings.cta_url}</p>
          </div>
        </div>
      </section>

      <CreateBlogPostForm />
      <CreateAlbumPhotoForm />
      <UpdateBlogPostForm posts={posts} />
      <UpdateAlbumPhotoForm photos={photos} />
      <UpdateSiteSettingsForm initialSettings={settings} />
    </ModuleShell>
  );
}
