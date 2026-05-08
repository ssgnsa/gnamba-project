import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useSiteContent } from "../../context/SiteContentContext";
import { useSettings } from "../../context/SettingsContext";
import DOMPurify from "dompurify";

const subjects = [
  "BTP & Construction",
  "Immobilier",
  "Foncier",
  "Fournitures professionnelles",
  "Partenariat",
  "Autre",
];

export default function PublicContact() {
  const { get } = useSiteContent();
  const { settings } = useSettings();
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

  const address =
    settings.contact_address ||
    get("contact", "address", "Abidjan, Côte d'Ivoire");
  const phone = settings.contact_phone || get("contact", "phone", "");
  const email =
    settings.contact_email ||
    get("contact", "email", "contact@gnambaservices.ci");
  const hours =
    settings.contact_hours ||
    get("contact", "hours", "Lun-Ven : 08h00 - 18h00 | Sam : 09h00 - 13h00");
  const mapsEmbed = get("contact", "maps_embed", "");

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
    }
  }, [mapsEmbed]);

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
    const { error: err } = await supabase
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
            Notre équipe est disponible pour répondre à toutes vos questions et
            vous accompagner dans la concrétisation de vos projets.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact info */}
            <div className="space-y-5">
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
                      <div className="text-gray-700 font-medium text-sm">
                        {info.value}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-blue-700 rounded-2xl p-6 text-white">
                <MessageSquare size={28} className="text-blue-300 mb-3" />
                <h3 className="font-bold mb-2">Réponse rapide garantie</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Nous nous engageons à répondre à toutes les demandes dans un
                  délai de 24h ouvrées.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Localisation</h3>
                {sanitizedMapsEmbed ? (
                  <div
                    className="h-40 rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: sanitizedMapsEmbed }}
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin
                        size={28}
                        className="text-blue-700 mx-auto mb-2"
                      />
                      <p className="text-sm text-blue-700 font-medium">
                        {address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
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
                      Notre équipe vous contactera dans les plus brefs délais.
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
                          placeholder="Décrivez votre projet ou votre question en détail..."
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
