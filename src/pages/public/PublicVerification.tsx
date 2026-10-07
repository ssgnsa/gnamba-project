import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Hash,
  User,
  Phone,
  Briefcase,
  CreditCard,
  Home,
  Building2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import BrandLogo from "../../components/BrandLogo";
import type { PublicPage } from "../../lib/publicRoutes";
import {
  fetchAttestationVerification,
  type VerificationLookup,
  type VerificationResult,
} from "../../lib/attestationVerification";

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
  Divider,
} from "../../components/ui";

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

// Premium Stat Block Component
const StatBlock = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <Card variant="bordered" padding="md" className="text-center">
    {icon && (
      <IconWrapper size="sm" variant="primary" shape="circle" className="mx-auto mb-3">
        {icon}
      </IconWrapper>
    )}
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-1">
      {label}
    </div>
    <div className="text-sm font-semibold text-neutral-900 break-words">
      {value || "—"}
    </div>
  </Card>
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
      setError("Référence, numéro de contrôle ou hash manquant dans l'URL.");
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
    "—";
  const villageName = data?.village_info?.village || data?.lot?.village || "—";
  const lotissementName =
    data?.village_info?.lotissement || data?.lot?.nom_lotissement || "—";
  const lotNumber =
    data?.village_info?.numero_lot || data?.lot?.numero_lot || "—";
  const surface = data?.parcelle?.superficie_m2 ?? data?.lot?.superficie;
  const gps = data?.parcelle?.coordonnees_gps;
  const hasPrivateDetails = Boolean(
    data?.titulaire || (data?.temoins && data.temoins.length > 0),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Flex direction="col" align="center" gap="4" className="px-4">
          <IconWrapper size="xl" variant="primary" shape="circle">
            <Search size={32} className="text-primary-600 animate-pulse" />
          </IconWrapper>
          <CardTitle className="text-xl font-bold text-neutral-900">Vérification en cours...</CardTitle>
          <p className="text-neutral-500">Veuillez patienter pendant la recherche du document.</p>
        </Flex>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_50%,#f8fafc_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <Container size="2xl">
        {/* Back Button */}
        <Flex className="mb-6" onClick={handleBack}>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<ChevronLeft size={16} />}
            className="text-neutral-500 hover:text-neutral-900 transition-colors p-2"
          >
            Retour accueil
          </Button>
        </Flex>

        {/* Main Verification Card */}
        <Card variant="elevated" padding="none" className="overflow-hidden">
          {/* Header */}
          <div className="border-b border-neutral-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(21,128,61,0.92))] px-6 py-7 sm:px-8">
            <Flex direction="col" smDirection="row" smAlign="center" smJustify="between" gap="5">
              <Flex align="center" gap="4">
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
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                    Attestation de propriété villageoise
                  </h1>
                  <p className="mt-1 text-sm text-emerald-50/90">
                    Contrôle d'authenticité en ligne
                  </p>
                </div>
              </Flex>

              {/* Status Badge */}
              <div
                className="inline-flex items-center gap-3 self-start rounded-full border px-4 py-2 text-sm font-semibold"
                style={{
                  borderColor: authenticity
                    ? "rgba(255,255,255,0.24)"
                    : notFound
                    ? "rgba(255,255,255,0.18)"
                    : error
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.18)",
                  backgroundColor: authenticity
                    ? "rgba(16, 185, 129, 0.2)"
                    : notFound
                    ? "rgba(239, 68, 68, 0.2)"
                    : error
                    ? "rgba(245, 158, 11, 0.2)"
                    : "rgba(245, 158, 11, 0.2)",
                }}
              >
                {authenticity ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-100" />
                    <span className="text-emerald-100">DOCUMENT AUTHENTIQUE</span>
                  </>
                ) : notFound ? (
                  <>
                    <ShieldX className="h-5 w-5 text-red-100" />
                    <span className="text-red-100">DOCUMENT NON RECONNU</span>
                  </>
                ) : error ? (
                  <>
                    <ShieldAlert className="h-5 w-5 text-amber-100" />
                    <span className="text-amber-100">VÉRIFICATION INDISPONIBLE</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-5 w-5 text-amber-100" />
                    <span className="text-amber-100">VÉRIFICATION INCOMPLÈTE</span>
                  </>
                )}
              </div>
            </Flex>
          </div>

          <div className="p-6 sm:p-8">
            {/* Not Found State */}
            {notFound && (
              <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }} className="border-red-200">
                <Flex align="start" gap="4">
                  <IconWrapper size="lg" variant="danger" shape="circle" className="flex-shrink-0">
                    <ShieldX size={28} className="text-red-600" />
                  </IconWrapper>
                  <Flex direction="col" gap="1" flex-1>
                    <CardTitle className="text-lg font-bold text-red-900">Document non reconnu</CardTitle>
                    <CardDescription className="text-red-800">
                      Cette référence, ce numéro de contrôle ou ce hash ne correspond à aucune attestation officielle enregistrée.
                    </CardDescription>
                  </Flex>
                </Flex>
              </Card>
            )}

            {/* Error State */}
            {error && !notFound && (
              <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }} className="border-amber-200">
                <Flex align="start" gap="4">
                  <IconWrapper size="lg" variant="warning" shape="circle" className="flex-shrink-0">
                    <ShieldAlert size={28} className="text-amber-600" />
                  </IconWrapper>
                  <Flex direction="col" gap="1" flex-1>
                    <CardTitle className="text-lg font-bold text-amber-950">Vérification indisponible</CardTitle>
                    <CardDescription className="text-amber-900">{error}</CardDescription>
                  </Flex>
                </Flex>
              </Card>
            )}

            {/* Success State - Full Verification Details */}
            {!loading && !notFound && !error && data && (
              <div className="space-y-6">
                {/* Authenticity Result Card */}
                <Card
                  variant="default"
                  padding="lg"
                  className={
                    authenticity
                      ? "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f7fee7)]"
                      : "border-amber-200 bg-[linear-gradient(135deg,#fff7ed,#fffbeb)]"
                  }
                >
                  <Flex direction="col" smDirection="row" smAlign="center" smJustify="between" gap="4">
                    <Flex direction="col" gap="2">
                      <Badge
                        variant={authenticity ? "success" : "warning"}
                        size="sm"
                        className="text-xs"
                      >
                        Résultat du contrôle
                      </Badge>
                      <CardTitle
                        className={`text-2xl font-bold ${
                          authenticity ? "text-emerald-950" : "text-amber-950"
                        }`}
                      >
                        {authenticity ? "Document authentique" : "Authenticité à confirmer"}
                      </CardTitle>
                      <CardDescription
                        className={`text-sm leading-6 ${
                          authenticity
                            ? "text-emerald-900/85"
                            : "text-amber-900/85"
                        }`}
                      >
                        {authenticity
                          ? "Les éléments de sécurité du document correspondent aux données enregistrées."
                          : "Le document existe mais la preuve cryptographique ou la signature n'a pas pu être validée complètement."}
                      </CardDescription>
                    </Flex>

                    <Flex wrap gap="2" className="text-sm">
                      <Badge
                        variant={data.signature_valid ? "success" : "outline"}
                        size="sm"
                        className="gap-1.5"
                      >
                        <ShieldCheck size={12} />
                        Signature {data.signature_valid ? "vérifiée" : "non vérifiée"}
                      </Badge>
                      <Badge
                        variant={data.hash_valid ? "success" : "outline"}
                        size="sm"
                        className="gap-1.5"
                      >
                        <Hash size={12} />
                        Hash {data.hash_valid ? "vérifié" : "non vérifié"}
                      </Badge>
                    </Flex>
                  </Flex>
                </Card>

                {/* Key Stats Grid */}
                <Grid cols={{ base: 2, md: 4 }} gap="md">
                  <StatBlock
                    label="Référence"
                    value={data.reference || "—"}
                    icon={<FileText size={16} className="text-primary-600" />}
                  />
                  <StatBlock
                    label="N° Contrôle"
                    value={data.control_number || "—"}
                    icon={<ShieldCheck size={16} className="text-primary-600" />}
                  />
                  <StatBlock
                    label="Date établissement"
                    value={formatDate(data.date_etablissement)}
                    icon={<CheckCircle size={16} className="text-primary-600" />}
                  />
                  <StatBlock
                    label="Statut"
                    value={String(data.statut || "—").toUpperCase()}
                    icon={<CheckCircle size={16} className="text-primary-600" />}
                  />
                </Grid>

                {/* Main Content Grid */}
                <Grid cols={{ base: 1, lg: 12 }} gap="lg">
                  {/* Left Column - Personal Details & Validation */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Personal Details */}
                    <Card variant="bordered" padding="lg">
                      <CardHeader className="mb-5">
                        <Flex align="center" gap="2" className="mb-3" style={{ width: 'fit-content' }}>
                          <IconWrapper size="sm" variant="primary" shape="circle">
                            <User size={14} className="text-primary-600" />
                          </IconWrapper>
                          <Badge variant="primary" size="sm">Données personnelles</Badge>
                        </Flex>
                        <CardTitle className="text-lg font-bold text-neutral-900">Titulaire de l'attestation</CardTitle>
                      </CardHeader>

                      {hasPrivateDetails ? (
                        <Grid cols={{ base: 1, sm: 2 }} gap="md">
                          <StatBlock
                            label="Nom complet"
                            value={holderName}
                            icon={<User size={16} className="text-primary-600" />}
                          />
                          <StatBlock
                            label="Téléphone"
                            value={data.titulaire?.telephone || "—"}
                            icon={<Phone size={16} className="text-primary-600" />}
                          />
                          <StatBlock
                            label="Profession"
                            value={data.titulaire?.profession || "—"}
                            icon={<Briefcase size={16} className="text-primary-600" />}
                          />
                          <StatBlock
                            label="N° CNI"
                            value={data.titulaire?.cni_numero || "—"}
                            icon={<CreditCard size={16} className="text-primary-600" />}
                          />
                          <StatBlock label="Domicile" value={data.titulaire?.domicile || "—"} icon={<Home size={16} className="text-primary-600" />} />
                        </Grid>
                      ) : (
                        <Card variant="default" padding="md" className="border-dashed border-neutral-200 bg-neutral-50">
                          <Flex align="center" gap="3">
                            <IconWrapper size="md" variant="ghost" shape="circle">
                              <AlertTriangle size={20} className="text-neutral-400" />
                            </IconWrapper>
                            <CardDescription className="text-sm text-neutral-600">
                              Les données personnelles détaillées ne sont pas publiées dans cette vue de vérification.
                            </CardDescription>
                          </Flex>
                        </Card>
                      )}
                    </Card>

                    {/* Customary Validation */}
                    <Card variant="bordered" padding="lg">
                      <CardHeader className="mb-5">
                        <Flex align="center" gap="2" className="mb-3" style={{ width: 'fit-content' }}>
                          <IconWrapper size="sm" variant="primary" shape="circle">
                            <CheckCircle size={14} className="text-primary-600" />
                          </IconWrapper>
                          <Badge variant="primary" size="sm">Validation coutumière</Badge>
                        </Flex>
                        <CardTitle className="text-lg font-bold text-neutral-900">Autorités administratives</CardTitle>
                      </CardHeader>

                      <Grid cols={{ base: 1, sm: 3 }} gap="md">
                        <StatBlock
                          label="Chef du village"
                          value={data.validation?.chef_nom || "—"}
                          icon={<User size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="Agent"
                          value={data.validation?.agent_nom || "—"}
                          icon={<User size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="N° Enregistrement"
                          value={data.numero_enregistrement || "—"}
                          icon={<FileText size={16} className="text-primary-600" />}
                        />
                      </Grid>
                    </Card>
                  </div>

                  {/* Right Column - Parcel Info */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Parcel Info */}
                    <Card variant="bordered" padding="lg">
                      <CardHeader className="mb-5">
                        <Flex align="center" gap="2" className="mb-3" style={{ width: 'fit-content' }}>
                          <IconWrapper size="sm" variant="primary" shape="circle">
                            <MapPin size={14} className="text-primary-600" />
                          </IconWrapper>
                          <Badge variant="primary" size="sm">Informations parcelle</Badge>
                        </Flex>
                        <CardTitle className="text-lg font-bold text-neutral-900">Localisation et superficie</CardTitle>
                      </CardHeader>

                      <Grid cols={{ base: 1, sm: 2 }} gap="md">
                        <StatBlock
                          label="Village"
                          value={villageName}
                          icon={<Building2 size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="Lotissement"
                          value={lotissementName}
                          icon={<Building2 size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="Lot"
                          value={lotNumber}
                          icon={<Hash size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="Superficie"
                          value={formatSurface(surface)}
                          icon={<MapPin size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="Quartier"
                          value={data.village_info?.quartier || data.lot?.quartier || "—"}
                          icon={<MapPin size={16} className="text-primary-600" />}
                        />
                        <StatBlock
                          label="GPS Principal"
                          value={formatCoords(gps?.lat, gps?.lng, gps?.precision)}
                          icon={<MapPin size={16} className="text-primary-600" />}
                        />
                      </Grid>

                      {/* Boundaries */}
                      <Divider className="my-5" />
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                        Limites déclarées
                      </div>
                      <Grid cols={{ base: 2, sm: 4 }} gap="md">
                        <Card variant="bordered" padding="md" className="text-center">
                          <div className="text-[11px] font-semibold text-neutral-400 mb-1">Nord</div>
                          <div className="text-sm font-semibold text-neutral-900 break-words">
                            {data.parcelle?.limites?.nord || "—"}
                          </div>
                        </Card>
                        <Card variant="bordered" padding="md" className="text-center">
                          <div className="text-[11px] font-semibold text-neutral-400 mb-1">Sud</div>
                          <div className="text-sm font-semibold text-neutral-900 break-words">
                            {data.parcelle?.limites?.sud || "—"}
                          </div>
                        </Card>
                        <Card variant="bordered" padding="md" className="text-center">
                          <div className="text-[11px] font-semibold text-neutral-400 mb-1">Est</div>
                          <div className="text-sm font-semibold text-neutral-900 break-words">
                            {data.parcelle?.limites?.est || "—"}
                          </div>
                        </Card>
                        <Card variant="bordered" padding="md" className="text-center">
                          <div className="text-[11px] font-semibold text-neutral-400 mb-1">Ouest</div>
                          <div className="text-sm font-semibold text-neutral-900 break-words">
                            {data.parcelle?.limites?.ouest || "—"}
                          </div>
                        </Card>
                      </Grid>

                      {/* GPS Points */}
                      {data.parcelle?.gps_points && data.parcelle.gps_points.length > 0 && (
                        <>
                          <Divider className="my-5" />
                          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                            Points GPS complémentaires
                          </div>
                          <div className="space-y-2">
                            {data.parcelle.gps_points.map((point, index) => (
                              <Card key={`${point.label || "gps"}-${index}`} variant="default" padding="sm" className="bg-neutral-50">
                                <Flex align="center" justify="between">
                                  <span className="font-semibold text-sm text-neutral-900">
                                    {point.label || `Point ${index + 1}`}
                                  </span>
                                  <span className="font-mono text-[11px] text-neutral-700">
                                    {formatCoords(point.lat, point.lng)}
                                  </span>
                                </Flex>
                              </Card>
                            ))}
                          </div>
                        </>
                      )}
                    </Card>
                  </div>
                </Grid>

                {/* Witnesses & Hash Section */}
                <Card variant="bordered" padding="lg">
                  <CardHeader className="mb-5">
                    <Flex align="center" gap="2" className="mb-3" style={{ width: 'fit-content' }}>
                      <IconWrapper size="sm" variant="primary" shape="circle">
                        <Hash size={14} className="text-primary-600" />
                      </IconWrapper>
                      <Badge variant="primary" size="sm">Sécurité et témoins</Badge>
                    </Flex>
                    <CardTitle className="text-lg font-bold text-neutral-900">Sécurité et témoins</CardTitle>
                  </CardHeader>
                  <div>
                    <Grid cols={{ base: 1, lg: 2 }} gap="lg">
                      {/* Witnesses */}
                      <div className="space-y-3">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
                          Témoins
                        </div>
                        {data.temoins && data.temoins.length > 0 ? (
                          data.temoins.map((temoin, index) => (
                            <Card key={`${temoin.nom || "temoin"}-${index}`} variant="default" padding="md" className="bg-neutral-50">
                              <Flex align="start" gap="3">
                                <IconWrapper size="md" variant="secondary" shape="circle" className="flex-shrink-0">
                                  <CheckCircle size={18} className="text-success-600" />
                                </IconWrapper>
                                <Flex direction="col" gap="1" flex-1>
                                  <div className="font-semibold text-sm text-neutral-900">
                                    {[temoin.prenom, temoin.nom].filter(Boolean).join(" ") || `Témoin ${index + 1}`}
                                  </div>
                                  <div className="text-sm text-neutral-600">
                                    {[temoin.profession, temoin.telephone, temoin.cni].filter(Boolean).join(" • ") || "Informations complémentaires non renseignées"}
                                  </div>
                                </Flex>
                              </Flex>
                            </Card>
                          ))
                        ) : (
                          <Card variant="default" padding="md" className="border-dashed border-neutral-200 bg-neutral-50">
                            <Flex align="center" gap="3">
                              <IconWrapper size="md" variant="ghost" shape="circle">
                                <AlertTriangle size={20} className="text-neutral-400" />
                              </IconWrapper>
                              <CardDescription className="text-sm text-neutral-600">
                                Les témoins détaillés restent visibles dans le dossier interne.
                              </CardDescription>
                            </Flex>
                          </Card>
                        )}
                      </div>

                      {/* SHA-256 Hash */}
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-3">
                          Empreinte SHA-256
                        </div>
                        <Card variant="default" padding="md" style={{ background: '#0f172a' }} className="font-mono text-[11px] leading-6 text-emerald-200 break-all">
                          {data.hash_sha256 || "—"}
                        </Card>
                      </div>
                    </Grid>
                  </div>
                </Card>
                </div>
              )}

              </div>

              {/* Footer Disclaimer */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-xs text-neutral-500 sm:px-8 text-center">
            Contrôle en ligne opéré via la plateforme{" "}
            <span className="font-semibold text-neutral-900">
              {settings.app_company || settings.app_title || "EGS"}
            </span>{" "}
            . Pour tout doute, rapprochez la référence affichée du registre administratif physique.
          </div>
        </Card>
      </Container>

      <style>{`
        :root {
          --verify-primary: ${primary};
        }
      `}</style>
    </div>
  );
}