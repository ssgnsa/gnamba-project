import { FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
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
} from "../page-builder/types";
import { useSettings } from "../../context/SettingsContext";
import { supabase } from "../../lib/supabase";
import BrandLogo from "../BrandLogo";
import type { PublicPage } from "../../lib/publicRoutes";
import { getPublicPageFromHref } from "../../lib/publicRoutes";

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
  const companyName = settings.app_company || "Gnamba Services";

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

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        subject: props.title || "Contact site vitrine",
        message: form.message,
      });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
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
  const { settings } = useSettings();
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
                  alt={`Logo ${settings.app_company || "Gnamba Services"} - BTP Immobilier Foncier`}
                  className="h-12 w-12 rounded-2xl object-cover bg-white"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  <BrandLogo
                    tone="dark"
                    alt={`Logo ${settings.app_company || "Gnamba Services"} - BTP Immobilier Foncier`}
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
                <p className="font-semibold">
                  {settings.app_company || "Gnamba Services"}
                </p>
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

export default function PublicPageLayoutRenderer({
  sections,
  onNavigate,
}: {
  sections: PageSection[];
  onNavigate: (page: PublicPage) => void;
}) {
  const orderedSections = [...sections].sort(
    (left, right) => left.order - right.order,
  );

  return (
    <div className="pt-16 lg:pt-20">
      {orderedSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <HeroSection
                key={section.id}
                props={section.props as HeroProps}
                onNavigate={onNavigate}
              />
            );
          case "text":
            return (
              <TextSection
                key={section.id}
                props={section.props as TextProps}
              />
            );
          case "services":
            return (
              <ServicesSection
                key={section.id}
                props={section.props as ServicesProps}
              />
            );
          case "gallery":
            return (
              <GallerySection
                key={section.id}
                props={section.props as GalleryProps}
              />
            );
          case "testimonials":
            return (
              <TestimonialsSection
                key={section.id}
                props={section.props as TestimonialsProps}
              />
            );
          case "contact":
            return (
              <ContactSection
                key={section.id}
                props={section.props as ContactProps}
              />
            );
          case "cta":
            return (
              <CTASection
                key={section.id}
                props={section.props as CTAProps}
                onNavigate={onNavigate}
              />
            );
          case "faq":
            return (
              <FAQSection key={section.id} props={section.props as FAQProps} />
            );
          case "footer":
            return (
              <FooterSection
                key={section.id}
                props={section.props as FooterProps}
                onNavigate={onNavigate}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
