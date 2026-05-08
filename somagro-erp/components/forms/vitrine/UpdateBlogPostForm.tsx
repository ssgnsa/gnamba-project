"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QueryDrawer from "@/components/forms/QueryDrawer";
import {
  Field,
  inputClass,
  textareaClass,
  selectClass,
} from "@/components/forms/Field";

type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  published_at: string | null;
  is_published: boolean | null;
};

type UpdateBlogPostFormProps = {
  posts: BlogPost[];
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

export default function UpdateBlogPostForm({ posts }: UpdateBlogPostFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const postId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => posts.find((post) => post.id === postId) ?? null,
    [posts, postId],
  );

  const [title, setTitle] = useState(selected?.title ?? "");
  const [slug, setSlug] = useState(selected?.slug ?? "");
  const [excerpt, setExcerpt] = useState(selected?.excerpt ?? "");
  const [content, setContent] = useState(selected?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(selected?.cover_url ?? "");
  const [publishedAt, setPublishedAt] = useState(
    toInputDateTime(selected?.published_at),
  );
  const [status, setStatus] = useState(
    selected?.is_published ? "published" : "draft",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title ?? "");
    setSlug(selected.slug ?? "");
    setExcerpt(selected.excerpt ?? "");
    setContent(selected.content ?? "");
    setCoverUrl(selected.cover_url ?? "");
    setPublishedAt(toInputDateTime(selected.published_at));
    setStatus(selected.is_published ? "published" : "draft");
  }, [selected]);

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !!postId;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Veuillez renseigner le titre, le contenu et selectionner un article.",
      );
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || null,
      excerpt: excerpt || null,
      content: content.trim(),
      cover_url: coverUrl || null,
      published_at: publishedAt || null,
      is_published: status === "published",
    };

    const { error: updateError } = await supabase
      .from("site_blog_posts")
      .update(payload)
      .eq("id", postId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  if (!selected) return null;

  return (
    <QueryDrawer
      queryKey="edit"
      queryValue="post"
      eyebrow="Edition"
      title="Modifier l article"
      description="Mettre a jour le contenu du blog vitrine."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Titre" required>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
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
            {saving ? "Mise a jour..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
