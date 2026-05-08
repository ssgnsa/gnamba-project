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

export type SiteSettingsInput = {
  site_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  cta_label: string;
  cta_url: string;
  is_public: boolean;
};

type UpdateSiteSettingsFormProps = {
  initialSettings: SiteSettingsInput;
};

export default function UpdateSiteSettingsForm({
  initialSettings,
}: UpdateSiteSettingsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [siteName, setSiteName] = useState(initialSettings.site_name ?? "");
  const [tagline, setTagline] = useState(initialSettings.tagline ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    initialSettings.primary_color ?? "",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialSettings.secondary_color ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url ?? "");
  const [heroTitle, setHeroTitle] = useState(initialSettings.hero_title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialSettings.hero_subtitle ?? "",
  );
  const [ctaLabel, setCtaLabel] = useState(initialSettings.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(initialSettings.cta_url ?? "");
  const [visibility, setVisibility] = useState(
    initialSettings.is_public ? "public" : "private",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = siteName.trim().length > 0;

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
      setError("Veuillez renseigner le nom du site.");
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
      site_name: siteName.trim(),
      tagline: tagline || null,
      primary_color: primaryColor || null,
      secondary_color: secondaryColor || null,
      logo_url: logoUrl || null,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      is_public: visibility === "public",
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("site_settings")
      .upsert(payload, { onConflict: "tenant_id" });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    router.replace(pathname, { scroll: false });
    router.refresh();
    setSaving(false);
  };

  return (
    <QueryDrawer
      queryKey="edit"
      queryValue="site"
      eyebrow="Edition"
      title="Parametres vitrine"
      description="Personnaliser le site vitrine et la page d'accueil."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Nom du site" required>
          <input
            className={inputClass}
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
          />
        </Field>
        <Field label="Tagline">
          <input
            className={inputClass}
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Couleur primaire">
            <input
              className={inputClass}
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              placeholder="#34d399"
            />
          </Field>
          <Field label="Couleur secondaire">
            <input
              className={inputClass}
              value={secondaryColor}
              onChange={(event) => setSecondaryColor(event.target.value)}
              placeholder="#0f172a"
            />
          </Field>
        </div>
        <Field label="Logo URL">
          <input
            className={inputClass}
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Titre hero">
          <textarea
            className={textareaClass}
            rows={2}
            value={heroTitle}
            onChange={(event) => setHeroTitle(event.target.value)}
          />
        </Field>
        <Field label="Sous-titre hero">
          <textarea
            className={textareaClass}
            rows={3}
            value={heroSubtitle}
            onChange={(event) => setHeroSubtitle(event.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="CTA label">
            <input
              className={inputClass}
              value={ctaLabel}
              onChange={(event) => setCtaLabel(event.target.value)}
            />
          </Field>
          <Field label="CTA URL">
            <input
              className={inputClass}
              value={ctaUrl}
              onChange={(event) => setCtaUrl(event.target.value)}
              placeholder="/register"
            />
          </Field>
        </div>
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
