import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../../components/BrandLogo";
import type { PublicPage } from "../../lib/publicRoutes";
import {
  fetchAttestationVerification,
  type VerificationLookup,
  type VerificationResult,
} from "../../lib/attestationVerification";

interface PublicVerificationProps {
  onNavigate?: (page: PublicPage) => void;
}

const getLookupFromUrl = (): VerificationLookup => {
  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/verify\/([^/]+)/);
  const pathHash = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  return {
    ref: params.get("ref"),
    control: params.get("control") || params.get("control_number"),
    hash: params.get("hash") || params.get("hash_sha256") || pathHash,
  };
};

const hasLookupValue = (lookup: VerificationLookup) =>
  Boolean(lookup.ref || lookup.control || lookup.hash);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatCoords = (lat?: number, lng?: number, precision?: number) => {
  if (lat == null || lng == null) return "—";
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  return precision != null ? `${coords} (± ${precision} m)` : coords;
};

const formatSurface = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("fr-FR")} m²`;
};

const isNotFoundMessage = (message: string) =>
  /introuvable|non reconnu|not found/i.test(message);

const StatBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
      {value || "—"}
    </div>
  </div>
);

export default function PublicVerification({
  onNavigate,
}: PublicVerificationProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<VerificationResult | null>(null);

  const logoInitials = (settings.app_company || settings.app_title || "EG")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("home");
    } else {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    const lookup = getLookupFromUrl();
    if (!hasLookupValue(lookup)) {
      setError("Référence, numéro de contrôle ou hash manquant dans l’URL.");
      setLoading(false);
      return;
    }

    fetchAttestationVerification(lookup)
      .then((payload) => {
        setData(payload as VerificationResult);
        setError("");
        setNotFound(false);
      })
      .catch((err: Error) => {
        const message = err.message || "Erreur lors de la vérification.";
        setError(message);
        setNotFound(isNotFoundMessage(message));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const authenticity = useMemo(() => {
    if (!data) return false;
    return Boolean(
      data.document_authentic || data.signature_valid || data.hash_valid,
    );
  }, [data]);

  const primary = settings.primary_color || "#166534";
  const holderName =
    [data?.titulaire?.prenom, data?.titulaire?.nom].filter(Boolean).join(" ") ||
    [data?.lot?.proprietaire_prenom, data?.lot?.proprietaire_nom]
      .filter(Boolean)
      .join(" ") ||
    "—";
  const villageName = data?.village_info?.village || data?.lot?.village || "—";
  const lotissementName =
    data?.village_info?.lotissement || data?.lot?.nom_lotissement || "—";
  const lotNumber =
    data?.village_info?.numero_lot || data?.lot?.numero_lot || "—";
  const surface = data?.parcelle?.superficie_m2 ?? data?.lot?.superficie;
  const gps = data?.parcelle?.coordonnees_gps;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f0_48%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft size={16} />
          Retour accueil
        </button>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(21,128,61,0.92))] px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 overflow-hidden">
                  <BrandLogo
                    tone="light"
                    alt={settings.app_company || "Logo"}
                    className="h-full w-full object-contain"
                    fallback={
                      <span className="text-lg font-bold text-white">
                        {logoInitials}
                      </span>
                    }
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/90">
                    Vérification publique
                  </div>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                    Attestation de propriété villageoise
                  </h1>
                  <p className="mt-1 text-sm text-emerald-50/90">
                    Contrôle d’authenticité en ligne
                  </p>
                </div>
              </div>

              <div
                className="inline-flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm font-semibold"
                style={{
                  borderColor: authenticity
                    ? "rgba(255,255,255,0.24)"
                    : "rgba(255,255,255,0.18)",
                  backgroundColor: authenticity
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(127,29,29,0.32)",
                }}
              >
                {loading ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : authenticity ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-100" />
                ) : notFound ? (
                  <ShieldX className="h-5 w-5 text-red-100" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-100" />
                )}
                <span>
                  {loading
                    ? "Vérification en cours"
                    : authenticity
                      ? "DOCUMENT AUTHENTIQUE"
                      : notFound
                        ? "DOCUMENT NON RECONNU"
                        : "VÉRIFICATION INCOMPLÈTE"}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {loading && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Vérification du document en cours...
              </div>
            )}

            {!loading && notFound && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                    <ShieldX className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-900">
                      Document non reconnu
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-red-800">
                      Cette référence, ce numéro de contrôle ou ce hash ne
                      correspond à aucune attestation officielle enregistrée.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !notFound && error && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-amber-950">
                      Vérification indisponible
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-amber-900">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && data && (
              <div className="space-y-6">
                <div
                  className={`rounded-[26px] border px-5 py-5 sm:px-6 ${
                    authenticity
                      ? "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f7fee7)]"
                      : "border-amber-200 bg-[linear-gradient(135deg,#fff7ed,#fffbeb)]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div
                        className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                          authenticity ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        Résultat du contrôle
                      </div>
                      <div
                        className={`mt-2 text-2xl font-semibold ${
                          authenticity ? "text-emerald-950" : "text-amber-950"
                        }`}
                      >
                        {authenticity
                          ? "Document authentique"
                          : "Authenticité à confirmer"}
                      </div>
                      <p
                        className={`mt-2 max-w-2xl text-sm leading-6 ${
                          authenticity
                            ? "text-emerald-900/85"
                            : "text-amber-900/85"
                        }`}
                      >
                        {authenticity
                          ? "Les éléments de sécurité du document correspondent aux données enregistrées."
                          : "Le document existe mais la preuve cryptographique ou la signature n’a pas pu être validée complètement."}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 ${
                          data.signature_valid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white/70 text-slate-700"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Signature{" "}
                        {data.signature_valid ? "vérifiée" : "non vérifiée"}
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-2 ${
                          data.hash_valid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white/70 text-slate-700"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Hash {data.hash_valid ? "vérifié" : "non vérifié"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatBlock label="Référence" value={data.reference || "—"} />
                  <StatBlock
                    label="Contrôle"
                    value={data.control_number || "—"}
                  />
                  <StatBlock
                    label="Date"
                    value={formatDate(data.date_etablissement)}
                  />
                  <StatBlock
                    label="Statut"
                    value={String(data.statut || "—").toUpperCase()}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <section className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Identité du bénéficiaire
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <StatBlock label="Nom complet" value={holderName} />
                      <StatBlock
                        label="Téléphone"
                        value={data.titulaire?.telephone || "—"}
                      />
                      <StatBlock
                        label="Profession"
                        value={data.titulaire?.profession || "—"}
                      />
                      <StatBlock
                        label="CNI"
                        value={data.titulaire?.cni_numero || "—"}
                      />
                      <div className="sm:col-span-2">
                        <StatBlock
                          label="Domicile"
                          value={data.titulaire?.domicile || "—"}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Validation coutumière
                    </div>
                    <div className="mt-4 space-y-3">
                      <StatBlock
                        label="Chef du village"
                        value={data.validation?.chef_nom || "—"}
                      />
                      <StatBlock
                        label="Agent"
                        value={data.validation?.agent_nom || "—"}
                      />
                      <StatBlock
                        label="N° enregistrement"
                        value={data.numero_enregistrement || "—"}
                      />
                    </div>
                  </section>
                </div>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <MapPin className="h-4 w-4" />
                    Informations sur la parcelle
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatBlock label="Village" value={villageName} />
                    <StatBlock label="Lotissement" value={lotissementName} />
                    <StatBlock label="Lot" value={lotNumber} />
                    <StatBlock
                      label="Superficie"
                      value={formatSurface(surface)}
                    />
                    <StatBlock
                      label="Quartier"
                      value={
                        data.village_info?.quartier || data.lot?.quartier || "—"
                      }
                    />
                    <StatBlock
                      label="GPS principal"
                      value={formatCoords(gps?.lat, gps?.lng, gps?.precision)}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Limites déclarées
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div>
                          Nord:{" "}
                          <strong>{data.parcelle?.limites?.nord || "—"}</strong>
                        </div>
                        <div>
                          Sud:{" "}
                          <strong>{data.parcelle?.limites?.sud || "—"}</strong>
                        </div>
                        <div>
                          Est:{" "}
                          <strong>{data.parcelle?.limites?.est || "—"}</strong>
                        </div>
                        <div>
                          Ouest:{" "}
                          <strong>
                            {data.parcelle?.limites?.ouest || "—"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Points GPS complémentaires
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        {data.parcelle?.gps_points &&
                        data.parcelle.gps_points.length > 0 ? (
                          data.parcelle.gps_points.map((point, index) => (
                            <div
                              key={`${point.label || "gps"}-${index}`}
                              className="rounded-xl bg-white px-3 py-2"
                            >
                              <strong>
                                {point.label || `Point ${index + 1}`}
                              </strong>{" "}
                              : {formatCoords(point.lat, point.lng)}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl bg-white px-3 py-2 text-slate-500">
                            Aucun point GPS complémentaire renseigné.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Témoins et empreinte de sécurité
                  </div>
                  <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-3">
                      {data.temoins && data.temoins.length > 0 ? (
                        data.temoins.map((temoin, index) => (
                          <div
                            key={`${temoin.nom || "temoin"}-${index}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="font-semibold text-slate-900">
                              {[temoin.prenom, temoin.nom]
                                .filter(Boolean)
                                .join(" ") || `Témoin ${index + 1}`}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {[temoin.profession, temoin.telephone, temoin.cni]
                                .filter(Boolean)
                                .join(" • ") ||
                                "Informations complémentaires non renseignées"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          Aucun témoin publié dans le dossier de vérification.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Empreinte SHA-256
                      </div>
                      <div className="mt-3 rounded-2xl bg-white px-4 py-4 font-mono text-[11px] leading-6 text-slate-700 break-all">
                        {data.hash_sha256 || "—"}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-500 sm:px-8">
            Contrôle en ligne opéré via la plateforme{" "}
            {settings.app_company || settings.app_title || "EGS"}. Pour tout
            doute, rapprochez la référence affichée du registre administratif
            physique.
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --verify-primary: ${primary};
        }
      `}</style>
    </div>
  );
}
