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

  // FIX: Anti-abus - Rate limiting (max 5 messages par heure)
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

    // Si la fenêtre de temps est écoulée, réinitialiser
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      return { allowed: true };
    }

    // Vérifier si la limite est atteinte
    if (data.count >= RATE_LIMIT_MAX) {
      const resetIn = Math.ceil(
        (data.windowStart + RATE_LIMIT_WINDOW_MS - now) / 60000,
      ); // minutes
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

    // Réinitialiser si nouvelle fenêtre
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

  // FIX: Sanitize mapsEmbed HTML to prevent XSS attacks
  // Only allow safe iframe tags from Google Maps
  const [sanitizedMapsEmbed, setSanitizedMapsEmbed] = useState<string>("");

  useEffect(() => {
    if (mapsEmbed) {
      // Configure DOMPurify to only allow iframe with safe attributes
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

    // FIX: Vérifier le rate limit avant envoi
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setError(
        `Trop de tentatives. Veuillez réessayer dans ${rateLimit.resetIn} minute(s).`,
      );
      return;
    }

    setSending(true);
    setError("");
    // FIX: Removed console.log with PII (name, email) for production security
    const { error: err } = await dbClient
      .from("contact_messages")
      .insert({
        name: form.name,
        phone: form.phone,
        email: form.email,
        subject: form.subject,
        message: form.message,
      })
      .select();

    // FIX: Incrémenter le compteur de rate limit après envoi réussi
    if (!err) {
      incrementRateLimit();
    }

    // FIX: Removed console.log with PII - only log errors for debugging
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
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-blue-300 font-semibold text-sm uppercase tracking-widest">
            Contactez-nous
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Parlons de votre projet
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Notre équipe vous répond vite, vous oriente clairement et vous
            accompagne jusqu'à la prochaine étape de votre projet.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact info */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 mb-2">
                  Réponse rapide
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  Contact & Devis gratuit
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Notre équipe répond sous {OFFICIAL_CONTACT.responseTime} par
                  téléphone, WhatsApp ou email selon votre besoin.
                </p>
                <div className="mt-4 grid gap-3">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Phone size={15} />
                    Appeler maintenant
                  </a>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    <Mail size={15} />
                    Envoyer un email
                  </a>
                  <a
                    href="#formulaire-devis"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    <Send size={15} />
                    Demander un devis
                  </a>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Pour un devis écrit, vous pouvez aussi écrire à{" "}
                  <a
                    href={`mailto:${quoteEmail}`}
                    className="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    {quoteEmail}
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Nos coordonnées
                </h2>
                <p className="text-sm text-gray-500">
                  Plusieurs moyens de nous joindre
                </p>
              </div>

              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div
                    key={info.label}
                    className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4 shadow-sm"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                        {info.label}
                      </div>
                      {info.label === "Téléphone" ? (
                        <a
                          href={`tel:${info.value.replace(/\s+/g, "")}`}
                          className="text-gray-700 font-medium text-sm hover:text-blue-700 transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : info.label === "Email" ? (
                        <a
                          href={`mailto:${info.value}`}
                          className="text-gray-700 font-medium text-sm hover:text-blue-700 transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <div className="text-gray-700 font-medium text-sm">
                          {info.value}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="bg-blue-700 rounded-2xl p-6 text-white">
                <MessageSquare size={28} className="text-blue-300 mb-3" />
                <h3 className="font-bold mb-2">Réponse rapide garantie</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Nous nous engageons à répondre à toutes les demandes dans un
                  délai de {OFFICIAL_CONTACT.responseTime}, avec un retour
                  orienté devis ou rendez-vous selon votre besoin.
                </p>
              </div>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl p-5 text-white flex items-center justify-between gap-4 shadow-sm transition-colors"
                >
                  <div>
                    <h3 className="font-bold mb-1">Échangez sur WhatsApp</h3>
                    <p className="text-emerald-100 text-sm leading-relaxed">
                      Pour une réponse plus rapide, écrivez-nous directement.
                    </p>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    Ouvrir WhatsApp
                  </span>
                </a>
              )}

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Localisation</h3>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <iframe
                    title="Google Maps GNAMBA SERVICES"
                    src={mapsSrc}
                    className="h-56 w-full border-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={mapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    <MapPin size={15} />
                    Ouvrir Google Maps
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      OFFICIAL_CONTACT.address,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Itinéraire
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div
                id="formulaire-devis"
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      Message envoyé avec succès !
                    </h2>
                    <p className="text-gray-500 mb-2">
                      Merci pour votre message,{" "}
                      <span className="font-semibold text-gray-700">
                        {form.name}
                      </span>
                      .
                    </p>
                    <p className="text-gray-500 mb-8">
                      Notre équipe vous contactera rapidement pour préciser
                      votre besoin et proposer la meilleure suite.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setForm({
                          name: "",
                          phone: "",
                          email: "",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Formulaire de contact
                    </h2>
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Nom complet *
                          </label>
                          <input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            placeholder="Votre nom complet"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Téléphone
                          </label>
                          <input
                            value={form.phone}
                            onChange={(e) =>
                              setForm({ ...form, phone: e.target.value })
                            }
                            placeholder="+225 XX XX XX XX XX"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          placeholder="votre@email.com"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Sujet
                        </label>
                        <select
                          value={form.subject}
                          onChange={(e) =>
                            setForm({ ...form, subject: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white"
                        >
                          <option value="">Sélectionner un sujet</option>
                          {subjects.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Message *
                        </label>
                        <textarea
                          value={form.message}
                          onChange={(e) =>
                            setForm({ ...form, message: e.target.value })
                          }
                          placeholder="Décrivez votre besoin, votre budget ou votre zone d'intérêt..."
                          rows={6}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-70 text-white rounded-xl font-semibold transition-all shadow-sm text-sm"
                      >
                        <Send size={15} />
                        {sending ? "Envoi en cours..." : "Envoyer le message"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
