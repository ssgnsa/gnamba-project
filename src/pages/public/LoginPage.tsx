import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, AlertCircle, Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../../components/BrandLogo";
import { supabase } from "../../lib/supabase";
import Turnstile from "react-turnstile";

interface Props {
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export default function LoginPage({ onSuccess, onForgotPassword }: Props) {
  const { signIn } = useAuth();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("egs:remember_me") === "true";
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;

  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const RATE_LIMIT_KEY = "egs:login_rate_limit";

  const companyName = settings.app_company || "Gnamba Services";
  const appTitle = settings.app_title || "EGS";
  const appSubtitle = settings.app_subtitle || "Enterprise System";
  const logoInitials = companyName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reason = window.localStorage.getItem("egs:logout_reason");
    if (reason === "idle") {
      setNotice("Votre session a expiré après une période d’inactivité.");
      window.localStorage.removeItem("egs:logout_reason");
    }
  }, []);

  const getRateLimit = () => {
    if (typeof window === "undefined") return { count: 0, windowStart: 0 };
    return JSON.parse(
      localStorage.getItem(RATE_LIMIT_KEY) || '{"count": 0, "windowStart": 0}',
    );
  };

  const checkRateLimit = (): { allowed: boolean; resetIn?: number } => {
    if (typeof window === "undefined") return { allowed: true };
    const now = Date.now();
    const data = getRateLimit();
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      return { allowed: true };
    }
    if (data.count >= RATE_LIMIT_MAX) {
      const resetIn = Math.ceil(
        (data.windowStart + RATE_LIMIT_WINDOW_MS - now) / 60000,
      );
      return { allowed: false, resetIn };
    }
    return { allowed: true };
  };

  const recordFailedAttempt = () => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    const data = getRateLimit();
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      localStorage.setItem(
        RATE_LIMIT_KEY,
        JSON.stringify({ count: 1, windowStart: now }),
      );
    } else {
      localStorage.setItem(
        RATE_LIMIT_KEY,
        JSON.stringify({
          count: data.count + 1,
          windowStart: data.windowStart,
        }),
      );
    }
  };

  const clearRateLimit = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RATE_LIMIT_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setError(
        `Trop de tentatives. Veuillez réessayer dans ${rateLimit.resetIn} minute(s).`,
      );
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");

    if (turnstileSiteKey) {
      if (!turnstileToken) {
        setLoading(false);
        setError("Veuillez confirmer que vous n’êtes pas un robot.");
        return;
      }
      const { data, error: verifyError } = await supabase.functions.invoke(
        "verify-turnstile",
        {
          body: { token: turnstileToken },
        },
      );
      if (verifyError || !data?.success) {
        setLoading(false);
        setError("Vérification anti-bot échouée. Réessayez.");
        return;
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "egs:remember_me",
        rememberMe ? "true" : "false",
      );
    }

    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      recordFailedAttempt();
      setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
      return;
    }
    clearRateLimit();
    onSuccess();
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 px-12 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
              <BrandLogo
                tone="dark"
                alt={companyName}
                className="w-full h-full object-cover"
                fallback={
                  <span className="text-white font-bold text-sm">
                    {logoInitials}
                  </span>
                }
              />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg leading-tight">
                {companyName}
              </div>
              <div className="text-blue-300 text-sm">
                {appTitle} – {appSubtitle}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Bienvenue sur votre espace de travail
          </h2>
          <p className="text-blue-200 leading-relaxed mb-10">
            Accédez à l'ensemble de vos outils de gestion : projets BTP,
            immobilier, foncier, finances et bien plus encore.
          </p>

          <div className="space-y-3">
            {[
              {
                label: "Gestion de projets BTP",
                desc: "Suivi en temps réel de vos chantiers",
              },
              {
                label: "Immobilier & Foncier",
                desc: "Gestion complète de votre portefeuille",
              },
              {
                label: "Finances & Documents",
                desc: "Tableaux de bord et rapports détaillés",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left"
              >
                <div className="w-2 h-2 bg-blue-300 rounded-full flex-shrink-0" />
                <div>
                  <div className="text-white font-medium text-sm">
                    {item.label}
                  </div>
                  <div className="text-blue-300 text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              <BrandLogo
                tone="dark"
                alt={companyName}
                className="w-full h-full object-cover"
                fallback={
                  <span className="text-white font-bold text-xs">
                    {logoInitials}
                  </span>
                }
              />
            </div>
            <div>
              <div className="font-bold text-gray-900">{companyName}</div>
              <div className="text-xs text-blue-600">
                {appTitle} – {appSubtitle}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={22} className="text-blue-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Connexion employés
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Accédez à votre espace de travail {appTitle}
              </p>
            </div>

            {notice && (
              <div className="mb-5 flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <AlertCircle
                  size={16}
                  className="text-blue-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-blue-700 text-sm">{notice}</p>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle
                  size={16}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {turnstileSiteKey && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken("")}
                    onError={() => setTurnstileToken("")}
                    options={{ size: "flexible" }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !email ||
                  !password ||
                  (turnstileSiteKey ? !turnstileToken : false)
                }
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm text-sm mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Accès réservé aux employés et collaborateurs de {companyName}.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Contactez votre administrateur pour obtenir vos identifiants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
