"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import {
  Field,
  inputClass,
  textareaClass,
  selectClass,
} from "@/components/forms/Field";

export default function CreateBlogPostForm() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const resolveTenantId = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return null;
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    return profile?.tenant_id ?? null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Veuillez renseigner le titre et le contenu.");
      return;
    }
    setSaving(true);
    setError(null);

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      setError("Tenant introuvable.");
      setSaving(false);
      return;
    }

    const payload = {
      tenant_id: tenantId,
      title: title.trim(),
      slug: slug.trim() || null,
      excerpt: excerpt || null,
      content: content.trim(),
      cover_url: coverUrl || null,
      published_at: publishedAt || null,
      is_published: status === "published",
    };

    const { error: insertError } = await supabase
      .from("site_blog_posts")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  return (
    <QueryDrawer
      queryKey="create"
      queryValue="post"
      title="Nouvel article"
      description="Publier un article pour le blog vitrine."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Titre" required>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Journal de bord..."
          />
        </Field>
        <Field label="Slug">
          <input
            className={inputClass}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="journal-2026"
          />
        </Field>
        <Field label="Extrait">
          <textarea
            className={textareaClass}
            rows={2}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
        </Field>
        <Field label="Contenu" required>
          <textarea
            className={textareaClass}
            rows={6}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>
        <Field label="Image couverture">
          <input
            className={inputClass}
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            placeholder="https://..."
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Publication">
            <input
              className={inputClass}
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
          </Field>
          <Field label="Statut">
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">brouillon</option>
              <option value="published">publie</option>
            </select>
          </Field>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
