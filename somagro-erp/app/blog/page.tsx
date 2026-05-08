import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteContext } from "@/lib/site";

export default async function BlogPage() {
  const { tenantId, settings } = await getSiteContext();
  const supabase = createServerSupabase();

  const { data } = tenantId
    ? await supabase
        .from("site_blog_posts")
        .select("id, title, slug, excerpt, cover_url, published_at")
        .eq("tenant_id", tenantId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(12)
    : { data: [] };

  const posts = data ?? [];
  const primary = settings.primary_color || "#34d399";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: primary }}
            >
              {settings.site_name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Actualites et bonnes pratiques
            </h1>
            <p className="mt-2 text-sm text-white/70">{settings.tagline}</p>
          </div>
          <a
            href="/"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Retour vitrine
          </a>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Aucun article publie pour le moment.
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                <div
                  className="h-40 w-full"
                  style={{ backgroundColor: `${primary}33` }}
                >
                  {post.cover_url ? (
                    <img
                      src={post.cover_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <p
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{ color: primary }}
                  >
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("fr-FR")
                      : "Brouillon"}
                  </p>
                  <h2 className="mt-3 text-lg font-semibold text-white">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm text-white/70">
                    {post.excerpt ?? "Nouvel article SomAgro."}
                  </p>
                  <div
                    className="mt-4 text-xs uppercase tracking-[0.2em]"
                    style={{ color: primary }}
                  >
                    {post.slug ?? "article"}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
