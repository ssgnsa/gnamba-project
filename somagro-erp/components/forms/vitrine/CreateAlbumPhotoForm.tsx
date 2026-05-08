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

export default function CreateAlbumPhotoForm() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = imageUrl.trim().length > 0;

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
      setError("Veuillez renseigner l'URL de la photo.");
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
      title: title || null,
      caption: caption || null,
      image_url: imageUrl.trim(),
      taken_at: takenAt || null,
      is_public: visibility === "public",
    };

    const { error: insertError } = await supabase
      .from("site_album_photos")
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
      queryValue="photo"
      title="Nouvelle photo"
      description="Ajouter une image dans l'album vitrine."
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
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </QueryDrawer>
  );
}
