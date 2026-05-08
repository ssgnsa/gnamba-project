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

type AlbumPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  taken_at: string | null;
  is_public: boolean | null;
};

type UpdateAlbumPhotoFormProps = {
  photos: AlbumPhoto[];
};

export default function UpdateAlbumPhotoForm({
  photos,
}: UpdateAlbumPhotoFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const photoId = searchParams.get("id") ?? "";
  const selected = useMemo(
    () => photos.find((photo) => photo.id === photoId) ?? null,
    [photos, photoId],
  );

  const [title, setTitle] = useState(selected?.title ?? "");
  const [caption, setCaption] = useState(selected?.caption ?? "");
  const [imageUrl, setImageUrl] = useState(selected?.image_url ?? "");
  const [takenAt, setTakenAt] = useState(selected?.taken_at ?? "");
  const [visibility, setVisibility] = useState(
    selected?.is_public ? "public" : "private",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title ?? "");
    setCaption(selected.caption ?? "");
    setImageUrl(selected.image_url ?? "");
    setTakenAt(selected.taken_at ?? "");
    setVisibility(selected.is_public ? "public" : "private");
  }, [selected]);

  const canSubmit = imageUrl.trim().length > 0 && !!photoId;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Veuillez renseigner l'URL de la photo et selectionner une ligne.",
      );
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: title || null,
      caption: caption || null,
      image_url: imageUrl.trim(),
      taken_at: takenAt || null,
      is_public: visibility === "public",
    };

    const { error: updateError } = await supabase
      .from("site_album_photos")
      .update(payload)
      .eq("id", photoId);

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
      queryValue="photo"
      eyebrow="Edition"
      title="Modifier la photo"
      description="Mettre a jour une photo de l'album vitrine."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Titre">
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="URL photo" required>
          <input
            className={inputClass}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Legende">
          <textarea
            className={textareaClass}
            rows={2}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date">
            <input
              className={inputClass}
              type="date"
              value={takenAt}
              onChange={(event) => setTakenAt(event.target.value)}
            />
          </Field>
          <Field label="Visibilite">
            <select
              className={selectClass}
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
            >
              <option value="public">publique</option>
              <option value="private">privee</option>
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
