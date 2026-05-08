import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../../components/BrandLogo";

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: Props) {
  const { resetPassword } = useAuth();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const companyName = settings.app_company || "Gnamba Services";
  const appTitle = settings.app_title || "EGS";
  const logoInitials = companyName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    const { error: err } = await resetPassword(email);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
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
            <div className="text-xs text-blue-600">{appTitle}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Mail size={22} className="text-blue-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mot de passe oublié
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Entrez votre email pour réinitialiser votre mot de passe
            </p>
          </div>

          {success ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle
                size={20}
                className="text-green-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-green-800">Email envoyé !</p>
                <p className="text-sm text-green-700 mt-1">
                  Consultez votre boîte mail. Vous recevrez un lien pour
                  réinitialiser votre mot de passe.
                </p>
              </div>
            </div>
          ) : (
            <>
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

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm text-sm mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {loading
                    ? "Envoi en cours..."
                    : "Envoyer le lien de réinitialisation"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <button
                    onClick={onBack}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
