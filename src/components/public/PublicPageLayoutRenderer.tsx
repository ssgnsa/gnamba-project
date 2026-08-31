import { FormEvent, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Shield,
  Zap,
  Globe,
  Target,
  Award,
  Users,
  CheckCircle2,
  Star,
  HardHat,
  Ruler,
  Tag,
} from "lucide-react";
import type {
  CTAProps,
  ContactProps,
  FAQProps,
  FooterProps,
  GalleryProps,
  HeroProps,
  PageSection,
  ServicesProps,
  TestimonialsProps,
  TextProps,
  AdvantagesProps,
  CTABandProps,
  ContactFormProps,
  FeaturedLotsProps,
  SiteRealisationsProps,
  StatsBarProps,
  TrustSignalsProps,
} from "../page-builder/types";
import { useSettings } from "../../context/SettingsContext";
import { apiClient } from "../../api/client";
import BrandLogo from "../BrandLogo";
import type { PublicPage } from "../../lib/publicRoutes";
import { getPublicPageFromHref } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT } from "../../lib/officialContact";
import { useSiteContentOverrides } from "../../hooks/useSiteContentOverrides";
import { useContentVersion } from "../../hooks/useContentVersion";

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedFetch<T>(url: string, version: string): Promise<T | null> {
  const cacheKey = `${url}:v${version}`;
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  const { data, error } = await apiClient.request<T>(url);
  if (!error && data) {
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
  return null;
}

const textAlignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function LinkAction({
  href,
  label,
  className,
  style,
  onNavigate,
}: {
  href: string;
  label: string;
  className: string;
  style?: CSSProperties;
  onNavigate: (page: PublicPage) => void;
}) {
  const internalPage = getPublicPageFromHref(href);
  if (internalPage) {
    return (
      <a
        href={href}
        onClick={(event) => {
          if (event.defaultPrevented) return;
          if (event.button !== 0) return;
          if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
            return;
          event.preventDefault();
          onNavigate(internalPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={className}
        style={style}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={className}
      style={style}
      target={
        href.startsWith("http://") || href.startsWith("https://")
          ? "_blank"
          : undefined
      }
      rel={
        href.startsWith("http://") || href.startsWith("https://")
          ? "noreferrer noopener"
          : undefined
      }
    >
      {label}
    </a>
  );
}

function HeroSection({
  props,
  onNavigate,
}: {
  props: HeroProps;
  onNavigate: (page: PublicPage) => void;
}) {
  const { settings } = useSettings();
  const primaryColor = settings.primary_color || "#1e40af";
  const companyName = OFFICIAL_CONTACT.companyName;

  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] flex items-center overflow-hidden"
      style={
        !props.bg_image_url
          ? {
              background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)`,
            }
          : undefined
      }
    >
      {props.bg_image_url && (
        <img
          src={props.bg_image_url}
          alt={props.title}
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(15, 23, 42, ${(props.overlay_opacity || 60) / 100})`,
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
            {companyName}
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
              {props.subtitle}
            </p>
          )}
          {props.cta_text && props.cta_url && (
            <div className="mt-8">
              <LinkAction
                href={props.cta_url}
                label={props.cta_text}
                onNavigate={onNavigate}
                className="inline-flex items-center justify-center rounded-2xl px-7 py-4 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TextSection({ props }: { props: TextProps }) {
  const alignClass =
    textAlignClass[props.align || "left"] || textAlignClass.left;

  return (
    <section className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={alignClass}>
          <h2 className="text-3xl font-bold text-slate-900">{props.title}</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
            {props.content}
          </p>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ props }: { props: ServicesProps }) {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900">{props.title}</h2>
          {props.subtitle && (
            <p className="mt-4 text-slate-600">{props.subtitle}</p>
          )}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(props.items || []).map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="text-3xl">{item.icon || "•"}</div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ props }: { props: GalleryProps }) {
  const columns = Math.min(Math.max(props.columns || 3, 2), 4);

  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900">{props.title}</h2>
        </div>
        <div
          className="mt-12 grid gap-5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {(props.images || []).map((image, index) => (
            <figure
              key={`${image.caption}-${index}`}
              className="overflow-hidden rounded-3xl bg-slate-100"
            >
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.caption || `Galerie ${index + 1}`}
                  crossOrigin="anonymous"
                  className="h-64 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  Image indisponible
                </div>
              )}
              {image.caption && (
                <figcaption className="px-5 py-4 text-sm text-slate-600">
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ props }: { props: TestimonialsProps }) {
  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold">{props.title}</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {(props.items || []).map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
            >
              <p className="text-lg leading-8 text-white/85">"{item.text}"</p>
              <div className="mt-6 flex items-center gap-4">
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt={item.name}
                    crossOrigin="anonymous"
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                    {item.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-white/60">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ props }: { props: ContactProps }) {
  const { settings } = useSettings();
  const primaryColor = settings.primary_color || "#1e40af";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const contactDetails = [
    { icon: MapPin, label: "Adresse", value: props.address },
    { icon: Phone, label: "Téléphone", value: props.phone },
    { icon: Mail, label: "Email", value: props.email },
  ].filter((item) => item.value);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Nom, email et message sont requis.");
      return;
    }

    setSending(true);
    setError("");

    const { error: insertError } = await apiClient.request("/tables/contact_messages", {
      method: "POST",
      body: JSON.stringify({
        nom: form.name,
        telephone: form.phone,
        email: form.email,
        sujet: props.title || "Contact site vitrine",
        message: form.message,
        statut: "nouveau",
      }),
    });

    setSending(false);

    if (insertError) {
      setError(insertError);
      return;
    }

    setSent(true);
    setForm({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <h2 className="text-3xl font-bold">{props.title}</h2>
            {props.subtitle && (
              <p className="mt-4 text-white/75">{props.subtitle}</p>
            )}
            <div className="mt-8 space-y-5">
              {contactDetails.map((detail) => {
                const Icon = detail.icon;
                return (
                  <div key={detail.label} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/10 p-2">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                        {detail.label}
                      </p>
                      <p className="mt-1 text-sm text-white/85">
                        {detail.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {props.show_form && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                Envoyer un message
              </h3>
              {sent ? (
                <p className="mt-4 text-sm text-emerald-700">
                  Votre message a bien ete envoye.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {error && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Nom complet"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      placeholder="Telephone"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      placeholder="Email"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
                    />
                  </div>
                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      setForm({ ...form, message: event.target.value })
                    }
                    placeholder="Votre message"
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send size={16} />
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CTASection({
  props,
  onNavigate,
}: {
  props: CTAProps;
  onNavigate: (page: PublicPage) => void;
}) {
  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[2rem] px-8 py-14 text-center text-white shadow-xl"
          style={{ backgroundColor: props.bg_color || "#0f766e" }}
        >
          <h2 className="text-3xl font-bold">{props.title}</h2>
          {props.subtitle && (
            <p className="mt-4 text-white/80">{props.subtitle}</p>
          )}
          {props.button_text && props.button_url && (
            <div className="mt-8">
              <LinkAction
                href={props.button_url}
                label={props.button_text}
                onNavigate={onNavigate}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ props }: { props: FAQProps }) {
  return (
    <section className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">{props.title}</h2>
        </div>
        <div className="mt-10 space-y-4">
          {(props.items || []).map((item, index) => (
            <article
              key={`${item.question}-${index}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection({
  props,
  onNavigate,
}: {
  props: FooterProps;
  onNavigate: (page: PublicPage) => void;
}) {
  const links = props.links || [];

  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              {props.logo_url ? (
                <img
                  src={props.logo_url}
                  alt={`Logo ${OFFICIAL_CONTACT.companyName} - BTP Immobilier Foncier`}
                  crossOrigin="anonymous"
                  className="h-12 w-12 rounded-2xl object-cover bg-white"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <BrandLogo
                    tone="dark"
                    alt={`Logo ${OFFICIAL_CONTACT.companyName} - BTP Immobilier Foncier`}
                    className="h-full w-full object-cover"
                    fallback={
                      <span className="text-sm font-bold text-slate-900">
                        GS
                      </span>
                    }
                  />
                </div>
              )}
              <div>
                <p className="font-semibold">{OFFICIAL_CONTACT.companyName}</p>
                {props.tagline && (
                  <p className="text-sm text-white/60">{props.tagline}</p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            {links.map((link, index) => (
              <LinkAction
                key={`${link.label}-${index}`}
                href={link.url}
                label={link.label}
                onNavigate={onNavigate}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
              />
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/50">
          {props.copyright}
        </div>
      </div>
    </footer>
  );
}

function FeaturedLotsSection({ props, onNavigate }: { props: FeaturedLotsProps; onNavigate: (page: PublicPage) => void }) {
  useSettings();
  const contentVersion = useContentVersion();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const limit = props.limit || 3;
    cachedFetch<any[]>(`/tables/vitrine_lots?publier_sur_vitrine=eq.true&order=ordre_affichage.asc,created_at.desc&limit=${limit}`, contentVersion)
      .then((data) => {
        if (!cancelled) {
          setLots(data || []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [props.limit, contentVersion]);

  const categoryLabels: Record<string, string> = {
    btp: "BTP", immobilier: "Immobilier", foncier: "Foncier", fournitures: "Fournitures",
  };
  const getCategoryLabel = (cat: string) => categoryLabels[cat] || cat;

  if (loading) {
    return (
      <section className="bg-neutral-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse grid gap-6 md:grid-cols-3">
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (lots.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">Opportunités actuelles</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">{props.title}</h2>
          {props.subtitle && <p className="mt-3 text-slate-500 text-lg">{props.subtitle}</p>}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lots.slice(0, props.limit).map((lot) => (
            <article key={lot.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div className="relative h-56 bg-gradient-to-br from-primary-100 to-emerald-100">
                {lot.image_url ? (
                  <img src={lot.image_url} alt={lot.image_alt || lot.titre} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><MapPin className="w-14 h-14 text-primary-300" /></div>
                )}
                {props.show_category && lot.type_bien && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded">{getCategoryLabel(lot.type_bien)}</span>
                )}
                {props.show_status && lot.statut && (
                  <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded ${lot.statut === 'disponible' ? 'bg-emerald-500 text-white' : lot.statut === 'reserve' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'}`}>
                    {lot.statut === 'disponible' ? 'Disponible' : lot.statut === 'reserve' ? 'Réservé' : 'Vendu'}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900">{lot.titre}</h3>
                {lot.reference && <p className="text-sm text-slate-500 mt-1">{lot.reference}</p>}
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{lot.description}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  {props.show_surface && lot.superficie && <div className="flex items-center gap-2"><Ruler size={15} className="text-slate-400" /> <span>{Number(lot.superficie)} m²</span></div>}
                  {props.show_price && lot.prix_vente && <div className="flex items-center gap-2"><Tag size={15} className="text-slate-400" /> <span className="font-semibold text-slate-900">{Number(lot.prix_vente).toLocaleString()} FCFA</span></div>}
                  {props.show_location && lot.village && <div className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" /> <span className="font-medium">{lot.village}</span></div>}
                </div>
                <div className="mt-6 flex gap-3">
                  <LinkAction href={props.cta_url} label={props.cta_text} onNavigate={onNavigate} className="flex-1 text-center px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition" />
                  {lot.contact_phone && <a href={`tel:${lot.contact_phone.replace(/\s+/g, "")}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"><Phone size={15} /> Appeler</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {props.cta_text && props.cta_url && (
          <div className="mt-10 text-center">
            <LinkAction href={props.cta_url} label={props.cta_text} onNavigate={onNavigate} className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-2xl font-semibold hover:bg-primary-50 transition" />
          </div>
        )}
      </div>
    </section>
  );
}

function SiteRealisationsSection({ props, onNavigate }: { props: SiteRealisationsProps; onNavigate: (page: PublicPage) => void }) {
  useSettings();
  const contentVersion = useContentVersion();
  const [realisations, setRealisations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const limit = props.limit || 3;
    cachedFetch<any[]>(`/tables/site_realisations?publier_vitrine=eq.true&order=ordre_affichage.asc&limit=${limit}`, contentVersion)
      .then((data) => {
        if (!cancelled) { setRealisations(data || []); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [props.limit, contentVersion]);

  const categoryLabels: Record<string, string> = { btp: "BTP", immobilier: "Immobilier", foncier: "Foncier", fournitures: "Fournitures" };
  const serviceColors = {
    btp: { gradient: 'from-slate-700/20 to-slate-900/40', badge: 'bg-slate-600' },
    immobilier: { gradient: 'from-sky-700/20 to-sky-900/40', badge: 'bg-sky-600' },
    foncier: { gradient: 'from-emerald-700/20 to-emerald-900/40', badge: 'bg-emerald-600' },
    fournitures: { gradient: 'from-amber-700/20 to-amber-900/40', badge: 'bg-amber-600' },
  };

  if (loading) {
    return (
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse grid gap-6 md:grid-cols-3">
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
            <div className="h-80 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }
  if (realisations.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">Notre portfolio</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">{props.title}</h2>
            {props.subtitle && <p className="mt-3 text-slate-500 text-lg">{props.subtitle}</p>}
          </div>
          {props.cta_text && props.cta_url && (
            <LinkAction href={props.cta_url} label={props.cta_text} onNavigate={onNavigate} className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition" />
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {realisations.map((r) => {
            const c = serviceColors[r.category as keyof typeof serviceColors] || serviceColors.btp;
            return (
              <article key={r.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className={`relative h-56 ${c.gradient} flex items-center justify-center`}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="relative z-10 text-white/60 text-7xl">🏗️</div>
                  )}
                  {props.show_category && <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded">{categoryLabels[r.category] || r.category}</span>}
                  {props.show_year && r.annee && <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/40 text-white text-xs font-semibold rounded">{r.annee}</span>}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900">{r.titre}</h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{r.description}</p>
                  {props.show_location && r.localisation && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><MapPin size={12} /> {r.localisation}</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustSignalsSection({ props }: { props: TrustSignalsProps }) {
  const iconMap: Record<string, any> = { shield: Shield, zap: Zap, globe: Globe, target: Target };
  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(props.title || props.subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            {props.title && <h2 className="text-3xl font-extrabold text-slate-900">{props.title}</h2>}
            {props.subtitle && <p className="mt-3 text-slate-500 text-lg">{props.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {props.items?.map((signal, i) => {
            const Icon = iconMap[signal.icon] || Shield;
            return (
              <div key={i} className="group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={28} />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{signal.label}</p>
                <p className="text-slate-500 text-xs mt-1">{signal.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdvantagesSection({ props }: { props: AdvantagesProps }) {
  const iconMap: Record<string, any> = { award: Award, users: Users, 'check-circle': CheckCircle2, star: Star };
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">Nos atouts</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">{props.title}</h2>
          {props.subtitle && <p className="mt-3 text-slate-500 text-lg">{props.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {props.items?.map((adv, i) => {
            const Icon = iconMap[adv.icon] || Award;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-shadow text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-5 mx-auto">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{adv.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{adv.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsBarSection({ props }: { props: StatsBarProps }) {
  const iconMap: Record<string, any> = { 'hard-hat': HardHat, users: Users, award: Award, globe: Globe };
  return (
    <section className="py-8 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {props.items?.map((stat, i) => {
            const Icon = iconMap[stat.icon] || HardHat;
            return (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-3 mx-auto"><Icon size={24} /></div>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTABandSection({ props, onNavigate }: { props: CTABandProps; onNavigate: (page: PublicPage) => void }) {
  return (
    <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden text-white" style={{ backgroundColor: props.bg_color }}>
      <div className="absolute inset-0 opacity-5 bg-white" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">{props.title}</h2>
        {props.subtitle && <p className="mt-4 text-lg opacity-85 max-w-2xl mx-auto leading-relaxed">{props.subtitle}</p>}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {props.primary_button_text && props.primary_button_url && (
            <LinkAction href={props.primary_button_url} label={props.primary_button_text} onNavigate={onNavigate} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold text-base shadow-lg hover:bg-slate-100 transition" />
          )}
          {props.secondary_button_text && props.secondary_button_url && (
            <LinkAction href={props.secondary_button_url} label={props.secondary_button_text} onNavigate={onNavigate} className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-semibold text-base hover:bg-white/10 hover:border-white/50 transition" />
          )}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection({ props }: { props: ContactFormProps }) {
  const { settings } = useSettings();
  const primaryColor = settings.primary_color || "#1e40af";
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) { setError("Nom, email et message sont requis."); return; }
    setSending(true); setError("");
    const { error: insertError } = await apiClient.request("/tables/contact_messages", { method: "POST", body: JSON.stringify({ nom: form.name, telephone: form.phone, email: form.email, sujet: props.title || "Contact site vitrine", message: form.message, statut: "nouveau" }) });
    setSending(false);
    if (insertError) { setError(insertError); return; }
    setSent(true); setForm({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-900 p-8 sm:p-10 text-white">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full mb-4">Contactez-nous</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold">{props.title}</h2>
            {props.subtitle && <p className="mt-4 text-white/75">{props.subtitle}</p>}
            <div className="mt-8 space-y-6">
              {props.show_phone && props.phone && <div className="flex items-start gap-4"><div className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><Phone size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Téléphone</p><p className="mt-1 text-sm text-white/85"><a href={`tel:${props.phone.replace(/\s+/g, "")}`} className="hover:text-primary-300 transition">{props.phone}</a></p></div></div>}
              {props.show_email && props.email && <div className="flex items-start gap-4"><div className="mt-0.5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><Mail size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Email</p><p className="mt-1 text-sm text-white/85"><a href={`mailto:${props.email}`} className="hover:text-primary-300 transition">{props.email}</a></p></div></div>}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Envoyez-nous un message</h3>
            {sent ? (
              <div className="mt-6 text-center"><div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle2 size={32} className="text-emerald-600" /></div><p className="text-lg font-semibold text-emerald-700">Message envoyé !</p><p className="mt-2 text-slate-500">Nous vous répondrons dans les plus brefs délais.</p></div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" required />
                </div>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Votre message..." rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none" required />
                <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: primaryColor }}><Send size={16} /> {sending ? "Envoi..." : "Envoyer"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PublicPageLayoutRenderer({
  sections,
  onNavigate,
}: {
  sections: PageSection[];
  onNavigate: (page: PublicPage) => void;
}) {
  const { getOverride } = useSiteContentOverrides();

  // Helper to merge section props with site_content overrides
  const mergeOverrides = <T extends Record<string, any>>(sectionType: string, props: T): T => {
    const merged: Record<string, any> = { ...props };

    // Override common string props from site_content
    for (const key of Object.keys(merged)) {
      if (typeof merged[key] === "string") {
        const override = getOverride(sectionType, key);
        if (override) merged[key] = override;
      }
    }

    // Special handling for nested arrays (items) - check if stored as JSON string
    if (merged.items && Array.isArray(merged.items)) {
      const itemsOverride = getOverride(sectionType, "items");
      if (itemsOverride) {
        try {
          const parsedItems = JSON.parse(itemsOverride);
          if (Array.isArray(parsedItems)) {
            merged.items = parsedItems;
          }
        } catch {
          // Invalid JSON, ignore override
        }
      }
    }

    // Special handling for nested objects (e.g., services, advantages, trust signals items)
    // These override via individual keys like "item.0.title", "item.0.description" or JSON in "items"
    for (const key of Object.keys(merged)) {
      if (Array.isArray(merged[key])) {
        const arrayOverride = getOverride(sectionType, key);
        if (arrayOverride) {
          try {
            const parsed = JSON.parse(arrayOverride);
            if (Array.isArray(parsed)) {
              merged[key] = parsed;
            }
          } catch {
            // Invalid JSON, ignore
          }
        }
      }
    }

    // Special handling for links array in footer
    if (sectionType === "footer" && merged.links && Array.isArray(merged.links)) {
      const linksOverride = getOverride(sectionType, "links");
      if (linksOverride) {
        try {
          const parsedLinks = JSON.parse(linksOverride);
          if (Array.isArray(parsedLinks)) {
            merged.links = parsedLinks;
          }
        } catch {
          // Invalid JSON, ignore override
        }
      }
    }

    return merged as T;
  };

  const orderedSections = [...sections].sort(
    (left, right) => left.order - right.order,
  );

  return (
    <div className="pt-16 lg:pt-20">
      {orderedSections.map((section) => {
        const propsWithOverrides = mergeOverrides(section.type, section.props as Record<string, any>);
        switch (section.type) {
          case "hero":
            return (
              <HeroSection
                key={section.id}
                props={propsWithOverrides as HeroProps}
                onNavigate={onNavigate}
              />
            );
          case "text":
            return (
              <TextSection
                key={section.id}
                props={propsWithOverrides as TextProps}
              />
            );
          case "services":
            return (
              <ServicesSection
                key={section.id}
                props={propsWithOverrides as ServicesProps}
              />
            );
          case "gallery":
            return (
              <GallerySection
                key={section.id}
                props={propsWithOverrides as GalleryProps}
              />
            );
          case "testimonials":
            return (
              <TestimonialsSection
                key={section.id}
                props={propsWithOverrides as TestimonialsProps}
              />
            );
          case "contact":
            return (
              <ContactSection
                key={section.id}
                props={propsWithOverrides as ContactProps}
              />
            );
          case "cta":
            return (
              <CTASection
                key={section.id}
                props={propsWithOverrides as CTAProps}
                onNavigate={onNavigate}
              />
            );
          case "faq":
            return (
              <FAQSection key={section.id} props={propsWithOverrides as FAQProps} />
            );
          case "footer":
            return (
              <FooterSection
                key={section.id}
                props={propsWithOverrides as FooterProps}
                onNavigate={onNavigate}
              />
            );
          case "featured-lots":
            return (
              <FeaturedLotsSection
                key={section.id}
                props={propsWithOverrides as FeaturedLotsProps}
                onNavigate={onNavigate}
              />
            );
          case "site-realisations":
            return (
              <SiteRealisationsSection
                key={section.id}
                props={propsWithOverrides as SiteRealisationsProps}
                onNavigate={onNavigate}
              />
            );
          case "trust-signals":
            return (
              <TrustSignalsSection
                key={section.id}
                props={propsWithOverrides as TrustSignalsProps}
              />
            );
          case "advantages":
            return (
              <AdvantagesSection
                key={section.id}
                props={propsWithOverrides as AdvantagesProps}
              />
            );
          case "stats-bar":
            return (
              <StatsBarSection
                key={section.id}
                props={propsWithOverrides as StatsBarProps}
              />
            );
          case "cta-band":
            return (
              <CTABandSection
                key={section.id}
                props={propsWithOverrides as CTABandProps}
                onNavigate={onNavigate}
              />
            );
          case "contact-form":
            return (
              <ContactFormSection
                key={section.id}
                props={propsWithOverrides as ContactFormProps}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
