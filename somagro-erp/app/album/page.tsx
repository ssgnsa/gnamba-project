import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteContext } from "@/lib/site";

export default async function AlbumPage() {
  const { tenantId, settings } = await getSiteContext();
  const supabase = createServerSupabase();

  const { data } = tenantId
    ? await supabase
        .from("site_album_photos")
        .select("id, title, caption, image_url, taken_at")
        .eq("tenant_id", tenantId)
        .eq("is_public", true)
        .order("taken_at", { ascending: false })
        .limit(24)
    : { data: [] };

  const photos = data ?? [];
  const primary = settings.primary_color || "#34d399";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: primary }}
            >
              {settings.site_name}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Galerie terrain</h1>
            <p className="mt-2 text-sm text-slate-600">{settings.tagline}</p>
          </div>
          <a
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Retour vitrine
          </a>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Aucune photo disponible pour le moment.
            </div>
          ) : (
            photos.map((photo) => (
              <figure
                key={photo.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm"
              >
                <div
                  className="h-48 w-full"
                  style={{ backgroundColor: `${primary}22` }}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title ?? "Photo SomAgro"}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <figcaption className="p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {photo.title ?? "Moment SomAgro"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {photo.caption ?? ""}
                  </p>
                  <p
                    className="mt-2 text-xs uppercase tracking-[0.2em]"
                    style={{ color: primary }}
                  >
                    {photo.taken_at
                      ? new Date(photo.taken_at).toLocaleDateString("fr-FR")
                      : ""}
                  </p>
                </figcaption>
              </figure>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
