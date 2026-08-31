import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  MessageCircle,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import dbClient from "../../data/tableClient";
import { useSiteContent } from "../../context/SiteContentContext";
import DOMPurify from "dompurify";
import {
  OFFICIAL_CONTACT,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  buildWhatsAppUrl,
} from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Input,
  Textarea,
  Select,
  Divider,
} from "../../components/ui";

const subjects = [
  "BTP & Construction",
  "Immobilier",
  "Foncier",
  "Fournitures professionnelles",
  "Devis rapide",
  "Partenariat / Réseaux sociaux",
  "Autre",
];

export default function PublicContact() {
  const { get } = useSiteContent();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Anti-abus - Rate limiting (max 5 messages par heure)
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure

  const checkRateLimit = (): {
    allowed: boolean;
    remaining?: number;
    resetIn?: number;
  } => {
    if (typeof window === "undefined") return { allowed: true };

    const now = Date.now();
    const storageKey = "egs:contact_rate_limit";
    const data = JSON.parse(
      localStorage.getItem(storageKey) || '{"count": 0, "windowStart": 0}',
    );

    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      return { allowed: true };
    }

    if (data.count >= RATE_LIMIT_MAX) {
      const resetIn = Math.ceil(
        (data.windowStart + RATE_LIMIT_WINDOW_MS - now) / 60000,
      );
      return { allowed: false, resetIn };
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX - data.count };
  };

  const incrementRateLimit = () => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const storageKey = "egs:contact_rate_limit";
    const data = JSON.parse(
      localStorage.getItem(storageKey) || '{"count": 0, "windowStart": 0}',
    );

    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ count: 1, windowStart: now }),
      );
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          count: data.count + 1,
          windowStart: data.windowStart,
        }),
      );
    }
  };

  const address = OFFICIAL_CONTACT.address;
  const phone = OFFICIAL_CONTACT.phone;
  const email = OFFICIAL_CONTACT.email;
  const hours = OFFICIAL_CONTACT.hours;
  const mapsEmbed = get("contact", "maps_embed", "");
  const defaultMapsEmbed = buildGoogleMapsEmbedUrl(
    OFFICIAL_CONTACT.physicalAddress || OFFICIAL_CONTACT.address,
  );
  const mapsDirectionsUrl = buildGoogleMapsDirectionsUrl(
    OFFICIAL_CONTACT.physicalAddress || OFFICIAL_CONTACT.address,
  );
  const whatsappLink = buildWhatsAppUrl(phone);
  const quoteEmail = OFFICIAL_CONTACT.quoteEmail;

  const [sanitizedMapsEmbed, setSanitizedMapsEmbed] = useState<string>("");

  useEffect(() => {
    if (mapsEmbed) {
      const clean = DOMPurify.sanitize(mapsEmbed, {
        ALLOWED_TAGS: ["iframe"],
        ALLOWED_ATTR: [
          "src",
          "width",
          "height",
          "style",
          "frameborder",
          "loading",
          "referrerpolicy",
          "allow",
          "allowfullscreen",
          "title",
        ],
        ALLOWED_URI_REGEXP:
          /^(https?:\/\/(www\.)?(google\.com|maps\.google\.com)|about:blank)/i,
      });
      setSanitizedMapsEmbed(clean);
    } else {
      setSanitizedMapsEmbed("");
    }
  }, [mapsEmbed]);

  const extractIframeSrc = (iframeHtml: string): string => {
    const match = iframeHtml.match(/src=["']([^"']+)["']/i);
    return match?.[1] || "";
  };

  const mapsSrc = sanitizedMapsEmbed
    ? extractIframeSrc(sanitizedMapsEmbed) || defaultMapsEmbed
    : defaultMapsEmbed;

  const contactInfo = [
    { icon: MapPin, label: "Adresse", value: address },
    ...(phone ? [{ icon: Phone, label: "Téléphone", value: phone }] : []),
    { icon: Mail, label: "Email", value: email },
    { icon: Clock, label: "Horaires", value: hours },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setError(
        `Trop de tentatives. Veuillez réessayer dans ${rateLimit.resetIn} minute(s).`,
      );
      return;
    }

    setSending(true);
    setError("");
    const { error: err } = await dbClient
      .from("contact_messages")
      .insert({
        nom: form.name,
        telephone: form.phone,
        email: form.email,
        sujet: form.subject || "Contact via formulaire",
        message: form.message,
        statut: "nouveau",
      })
      .select();

    if (!err) {
      incrementRateLimit();
    }

    setSending(false);
    if (err) {
      setError(
        `Erreur: ${err.message}${err.details ? " - " + err.details : ""}`,
      );
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
              Contactez-nous
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Parlons de votre <span className="bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent">projet</span>
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Notre équipe vous répond vite, vous oriente clairement et vous
              accompagne jusqu'à la prochaine étape de votre projet.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Shield size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Réponse sous 24h</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Zap size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Devis gratuit</span>
              <IconWrapper size="md" variant="ghost" shape="circle" className="bg-white/10 text-white border-white/20">
                <Sparkles size={20} />
              </IconWrapper>
              <span className="text-primary-200 text-sm font-medium">Accompagnement complet</span>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Main content */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Grid cols={{ base: 1, lg: 3 }} gap="xl" gapY="md">
            {/* Contact info */}
            <div className="space-y-6 lg:col-span-1" id="contact-info">
              <Card variant="elevated" padding="lg" className="sticky top-24">
                <Flex direction="col" gap="4" className="mb-6">
                  <Badge variant="primary" size="sm" className="w-fit">Réponse rapide</Badge>
                  <CardTitle className="text-xl font-bold text-neutral-900">Contact & Devis gratuit</CardTitle>
                  <CardDescription className="">Notre équipe répond sous {OFFICIAL_CONTACT.responseTime} par téléphone, WhatsApp ou email selon votre besoin.</CardDescription>
                </Flex>

                <Flex direction="col" gap="3" className="mb-6">
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 min-h-[48px]"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 min-h-[48px]"
                  >
                    <Phone size={18} />
                    Appeler maintenant
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 min-h-[48px]"
                  >
                    <Mail size={18} />
                    Envoyer un email
                  </a>
                  <a
                    href="#formulaire-devis"
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 min-h-[48px]"
                  >
                    <Send size={18} />
                    Demander un devis
                  </a>
                </Flex>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Pour un devis écrit, vous pouvez aussi écrire à{" "}
                  <a
                    href={`mailto:${quoteEmail}`}
                    className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    {quoteEmail}
                  </a>
                  .
                </p>

                <Divider className="my-6" />

                <CardTitle className="text-lg font-bold text-neutral-900 mb-4">Nos coordonnées</CardTitle>
                <Flex direction="col" gap="4">
                  {contactInfo.map((info) => {
                    const Icon = info.icon;
                    return (
                      <Flex key={info.label} align="center" gap="4" className="group">
                        <IconWrapper size="md" variant="primary" shape="circle">
                          <Icon size={20} className="text-primary-600 group-hover:text-primary-700 transition-colors" />
                        </IconWrapper>
                        <Flex direction="col" gap="0.5">
                          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{info.label}</span>
                          {info.label === "Téléphone" ? (
                            <a href={`tel:${info.value.replace(/\s+/g, "")}`} className="text-neutral-700 font-medium text-sm hover:text-primary-600 transition-colors">{info.value}</a>
                          ) : info.label === "Email" ? (
                            <a href={`mailto:${info.value}`} className="text-neutral-700 font-medium text-sm hover:text-primary-600 transition-colors">{info.value}</a>
                          ) : (
                            <span className="text-neutral-700 font-medium text-sm">{info.value}</span>
                          )}
                        </Flex>
                      </Flex>
                    );
                  })}
                </Flex>
              </Card>

              <Card variant="primary" padding="xl" className="text-white">
                <Flex direction="col" align="start" gap="4">
                  <IconWrapper size="lg" variant="secondary" shape="circle" className="bg-amber-500/20 text-amber-300">
                    <MessageSquare size={24} />
                  </IconWrapper>
                  <CardTitle className="text-xl font-bold">Réponse rapide garantie</CardTitle>
                  <CardDescription className="text-primary-100">
                    Nous nous engageons à répondre à toutes les demandes dans un
                    délai de {OFFICIAL_CONTACT.responseTime}, avec un retour
                    orienté devis ou rendez-vous selon votre besoin.
                  </CardDescription>
                </Flex>
              </Card>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-emerald-600 hover:bg-emerald-700 rounded-2xl p-5 text-white flex items-center justify-between gap-4 shadow-lg transition-all duration-200 group"
                >
                  <div>
                    <h3 className="font-bold mb-1">Échangez sur WhatsApp</h3>
                    <p className="text-emerald-100 text-sm leading-relaxed">Pour une réponse plus rapide, écrivez-nous directement.</p>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap group-hover:underline">
                    Ouvrir WhatsApp
                    <ArrowRight size={16} className="inline-block ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              )}

              <Card variant="elevated" padding="lg" className="overflow-hidden">
                <CardTitle className="font-bold text-neutral-900 mb-4">Localisation</CardTitle>
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <iframe
                    title="Google Maps GNAMBA SERVICES"
                    src={mapsSrc}
                    className="h-64 w-full border-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <Flex wrap gap="3" className="mt-4">
                  <a
                    href={mapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 min-h-[44px]"
                  >
                    <MapPin size={16} />
                    Ouvrir Google Maps
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(OFFICIAL_CONTACT.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-primary-300 hover:text-primary-600 min-h-[44px]"
                  >
                    Itinéraire
                  </a>
                </Flex>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <Card variant="elevated" padding="xl" id="formulaire-devis">
                {sent ? (
                  <Flex direction="col" align="center" gap="4" className="py-16 text-center">
                    <IconWrapper size="xl" variant="success" shape="circle" className="mb-2">
                      <CheckCircle2 size={40} className="text-emerald-600" />
                    </IconWrapper>
                    <CardTitle className="text-2xl font-bold text-neutral-900">Message envoyé avec succès !</CardTitle>
                    <CardDescription className="max-w-md">Merci pour votre message, <span className="font-semibold text-neutral-700">{form.name}</span>.</CardDescription>
                    <CardDescription className="max-w-md">Notre équipe vous contactera rapidement pour préciser votre besoin et proposer la meilleure suite.</CardDescription>
                    <Button variant="primary" size="lg" onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", subject: "", message: "" }); }} iconLeft={<Sparkles size={18} />}>
                      Envoyer un autre message
                    </Button>
                  </Flex>
                ) : (
                  <>
                    <CardHeader className="mb-6">
                      <CardTitle className="text-xl font-bold text-neutral-900">Formulaire de contact</CardTitle>
                    </CardHeader>
                    {error && (
                      <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <Grid cols={{ base: 1, sm: 2 }} gap="md">
                        <Input
                          label="Nom complet *"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Votre nom complet"
                          required
                        />
                        <Input
                          label="Téléphone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+225 XX XX XX XX XX"
                          iconLeft={<Phone size={18} />}
                        />
                      </Grid>

                      <Input
                        label="Email *"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="votre@email.com"
                        required
                        iconLeft={<Mail size={18} />}
                      />

                      <Select
                        label="Sujet"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Sélectionner un sujet"
                        options={subjects.map(s => ({ value: s, label: s }))}
                      />

                      <Textarea
                        label="Message *"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Décrivez votre besoin, votre budget ou votre zone d'intérêt..."
                        rows={6}
                        required
                      />

                      <Button
                        type="submit"
                        disabled={sending}
                        loading={sending}
                        size="lg"
                        className="w-full min-h-[52px]"
                        iconLeft={<Send size={20} />}
                      >
                        Envoyer le message
                      </Button>
                    </form>
                  </>
                )}
              </Card>
            </div>
          </Grid>
        </Container>
      </section>
    </div>
  );
}