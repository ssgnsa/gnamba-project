import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Filter,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Tag,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import dbClient from "../../data/tableClient";
import type { VitrineLot } from "../../types";
import { formatMontant } from "../../utils/reference";
import { captureLead } from "../../lib/lead-capture";
import { clientsRepository } from "../../data/clients.repository";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Skeleton,
  Input,
  Textarea,
  Select,
  Tooltip,
} from "../../components/ui";

interface LeadFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
}

const emptyLeadForm: LeadFormData = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  message: "",
};

type PublicLotCard = {
  id: string;
  reference: string;
  titre: string;
  village: string;
  quartier: string;
  superficie: number;
  prixVente: number;
  statut: VitrineLot["statut"] | "exemple";
  documents: string;
  caracteristiques: string[];
  imageUrl: string;
  imageAlt: string;
  contactPhone: string;
  sourceLot?: VitrineLot;
  isExample?: boolean;
};

const fallbackLotCards: PublicLotCard[] = [
  {
    id: "example-sikensi-1",
    reference: "GS-LOT-DEMO-001",
    titre: "Lot résidentiel Sikensi - 1",
    village: "Sikensi",
    quartier: "Zone résidentielle",
    superficie: 300,
    prixVente: 5000000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Terrain plat", "Accès facile", "Lot libre"],
    imageUrl: "",
    imageAlt: "Lot à vendre à Sikensi",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
  {
    id: "example-sikensi-2",
    reference: "GS-LOT-DEMO-002",
    titre: "Lot résidentiel Sikensi - 2",
    village: "Sikensi",
    quartier: "Extension nord",
    superficie: 400,
    prixVente: 5000000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Quartier en développement", "Bonne visibilité", "Lot libre"],
    imageUrl: "",
    imageAlt: "Lot à vendre à Sikensi",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
  {
    id: "example-sikensi-3",
    reference: "GS-LOT-DEMO-003",
    titre: "Lot résidentiel Sikensi - 3",
    village: "Sikensi",
    quartier: "Route principale",
    superficie: 500,
    prixVente: 5000000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Surface généreuse", "Accès route", "Potentiel commercial"],
    imageUrl: "",
    imageAlt: "Lot à vendre à Sikensi",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
  {
    id: "example-katadji-1",
    reference: "GS-LOT-DEMO-004",
    titre: "Lot à vendre Katadji",
    village: "Katadji",
    quartier: "Secteur calme",
    superficie: 350,
    prixVente: 2500000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Bon accès", "Prix accessible", "Zone en progression"],
    imageUrl: "",
    imageAlt: "Lot à vendre à Katadji",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
  {
    id: "example-quartier-lycee-1",
    reference: "GS-LOT-DEMO-005",
    titre: "Lot à vendre Quartier Lycée",
    village: "Quartier Lycée",
    quartier: "Zone résidentielle",
    superficie: 300,
    prixVente: 3000000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Quartier recherché", "Investissement accessible", "Lot libre"],
    imageUrl: "",
    imageAlt: "Lot à vendre au Quartier Lycée",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
  {
    id: "example-braffoueby-1",
    reference: "GS-LOT-DEMO-006",
    titre: "Lot à vendre Braffouéby",
    village: "Braffouéby",
    quartier: "Secteur résidentiel",
    superficie: 320,
    prixVente: 2500000,
    statut: "exemple",
    documents: "Dossier commercial à compléter",
    caracteristiques: ["Prix attractif", "Bonne accessibilité", "Potentiel de revente"],
    imageUrl: "",
    imageAlt: "Lot à vendre à Braffouéby",
    contactPhone: OFFICIAL_CONTACT.phone,
    isExample: true,
  },
];

const formatPrice = (price?: number | string) => {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return "Prix sur demande";
  return `${formatMontant(amount)} FCFA`;
};

const formatSurface = (surface?: number | string) => {
  const amount = Number(surface);
  if (!Number.isFinite(amount) || amount <= 0) return "Surface non précisée";
  return `${amount} m²`;
};

const getStatutBadge = (statut: string, isExample = false) => {
  if (isExample || statut === "exemple") {
    return { variant: "warning" as const, label: "Exemple" };
  }
  switch (statut) {
    case "disponible":
      return { variant: "success" as const, label: "Disponible" };
    case "reserve":
      return { variant: "secondary" as const, label: "Réservé" };
    case "vendu":
      return { variant: "default" as const, label: "Vendu" };
    default:
      return { variant: "default" as const, label: statut };
  }
};

const villageOptions = [
  { value: "", label: "Tous les villages" },
  { value: "Sikensi", label: "Sikensi" },
  { value: "Katadji", label: "Katadji" },
  { value: "Quartier Lycée", label: "Quartier Lycée" },
  { value: "Braffouéby", label: "Braffouéby" },
];

export default function PublicLots() {
  const [lots, setLots] = useState<VitrineLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<PublicLotCard | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLeadForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [leadBridgeError, setLeadBridgeError] = useState<string | null>(null);
  const [filterVillage, setFilterVillage] = useState<string>("");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterMinSurface, setFilterMinSurface] = useState<string>("");
  const [filterMaxSurface, setFilterMaxSurface] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  async function loadPublishedLots() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await dbClient
      .from("vitrine_lots")
      .select("*")
      .eq("publier_sur_vitrine", true)
      .order("ordre_affichage", { ascending: true })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Impossible de charger les lots disponibles.");
      setLots([]);
      setLoading(false);
      return;
    }

    setLots((data as VitrineLot[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadPublishedLots();
  }, []);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (filterVillage && lot.village !== filterVillage) return false;

      if (filterMinPrice && lot.prix_vente < Number(filterMinPrice)) return false;
      if (filterMaxPrice && lot.prix_vente > Number(filterMaxPrice)) return false;

      if (filterMinSurface && lot.superficie < Number(filterMinSurface)) return false;
      if (filterMaxSurface && lot.superficie > Number(filterMaxSurface)) return false;

      return true;
    });
  }, [
    lots,
    filterVillage,
    filterMinPrice,
    filterMaxPrice,
    filterMinSurface,
    filterMaxSurface,
  ]);

  const hasActiveFilters = Boolean(
    filterVillage ||
    filterMinPrice ||
    filterMaxPrice ||
    filterMinSurface ||
    filterMaxSurface,
  );

  const displayLots = useMemo<PublicLotCard[]>(() => {
    const realCards: PublicLotCard[] = filteredLots.map((lot) => ({
      id: lot.id,
      reference: lot.reference,
      titre: lot.titre,
      village: lot.village,
      quartier: lot.quartier || lot.commune || "Secteur résidentiel",
      superficie: Number(lot.superficie),
      prixVente: Number(lot.prix_vente),
      statut: lot.statut,
      documents: lot.documents || "Dossier à confirmer avec notre équipe",
      caracteristiques: lot.caracteristiques || [],
      imageUrl: lot.image_url || "",
      imageAlt: lot.image_alt || lot.titre,
      contactPhone: lot.contact_phone || OFFICIAL_CONTACT.phone,
      sourceLot: lot,
      isExample: false,
    }));

    if (hasActiveFilters) return realCards;
    if (realCards.length > 0) return realCards.slice(0, 5);
    return fallbackLotCards;
  }, [filteredLots, hasActiveFilters]);

  const handleOpenLeadForm = (lot: PublicLotCard) => {
    setSelectedLot(lot);
    setShowLeadForm(true);
    setSubmitSuccess(false);
    setLeadBridgeError(null);
    setLeadForm({
      ...emptyLeadForm,
      message: lot.isExample
        ? `Bonjour, je souhaite en savoir plus sur cet exemple de lot (${lot.reference}) et sur vos disponibilités actuelles. Pouvez-vous me contacter ?`
        : `Bonjour, je suis intéressé(e) par le lot ${lot.reference} à ${lot.village}. Pouvez-vous me contacter pour plus d'informations ?`,
    });
  };

  const handleSubmitLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    setSubmitting(true);
    setError(null);
    setLeadBridgeError(null);

    try {
      const client = await clientsRepository.create({
        nom: leadForm.nom,
        prenom: leadForm.prenom,
        email: leadForm.email,
        telephone: leadForm.telephone,
        adresse: "",
        type_client: "particulier",
        notes: "Demande via vitrine lots",
      });

      const { data: opportunity, error: oppError } = await dbClient
        .from("opportunites")
        .insert({
          client_id: client.data?.id,
          titre: selectedLot.isExample
            ? `Intérêt lot représentatif ${selectedLot.reference}`
            : `Intérêt lot ${selectedLot.reference}`,
          description: leadForm.message,
          statut: "nouveau",
          priorite: "normale",
          valeur_potentielle: Number(selectedLot.prixVente),
          source: "vitrine_lots",
        })
        .select()
        .single();

      if (oppError) throw oppError;

      await dbClient.from("taches").insert({
        titre: `Suivi demande lot: ${leadForm.prenom} ${leadForm.nom}`,
        description: selectedLot.isExample
          ? `Nouvelle demande pour un exemple de lot (${selectedLot.reference}) à ${selectedLot.village}.\n\nMessage: ${leadForm.message}\n\nTél: ${leadForm.telephone}\nEmail: ${leadForm.email}`
          : `Nouvelle demande pour le lot ${selectedLot.reference} à ${selectedLot.village}.\n\nMessage: ${leadForm.message}\n\nTél: ${leadForm.telephone}\nEmail: ${leadForm.email}`,
        categorie: "commercial",
        priorite: "haute",
        opportunite_id: opportunity.id,
        echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const bridgeResult = await captureLead({
        phone: leadForm.telephone,
        first_name: leadForm.prenom,
        last_name: leadForm.nom,
        email: leadForm.email,
        source: "vitrine_lots",
        source_page: "/lots-disponibles",
        source_form: "public_lots",
        consent_text: selectedLot.isExample
          ? "J'accepte d'être recontacté par GNAMBA SERVICES au sujet d'un exemple de lot à vendre."
          : "J'accepte d'être recontacté par GNAMBA SERVICES pour ce lot à vendre.",
        channels_optin: {
          sms: true,
          whatsapp: true,
          email: true,
          telegram: false,
        },
      });

      if (!bridgeResult.success) {
        setLeadBridgeError(
          "La demande est enregistrée, mais sa transmission à notre équipe a rencontré un souci. La fiche reste bien enregistrée.",
        );
      }

      setSubmitSuccess(true);
      setLeadForm(emptyLeadForm);
      setTimeout(() => {
        setShowLeadForm(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowLeadForm(false);
    setSelectedLot(null);
    setLeadForm(emptyLeadForm);
  };

  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

  if (loading) {
    return (
      <section className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Container size="sm">
          <Grid cols={3} gap="md">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="default" padding="none" className="overflow-hidden animate-pulse">
                <Skeleton variant="rectangular" className="h-48 w-full" />
                <CardContent padding="lg">
                  <Skeleton variant="text" width="3/4" className="mb-3" />
                  <Skeleton variant="text" width="full" className="mb-2" />
                  <Skeleton variant="text" width="1/2" />
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <Container size="xl">
          <Flex align="center" gap="3" className="py-4">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={18} />}
              onClick={() => window.history.back()}
              className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            >
              Retour
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">Lots à Vendre</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {displayLots.length} fiche{displayLots.length > 1 ? "s" : ""} affichée{displayLots.length > 1 ? "s" : ""} pour achat, investissement ou revente.
              </p>
            </div>
          </Flex>
        </Container>
      </header>

      {/* Info Bar */}
      <div className="bg-primary-50 border-b border-primary-100">
        <Container size="xl" className="py-3">
          <Flex align="center" justify="between" wrap gap="3" className="text-sm">
            <span className="text-primary-900">
              Le catalogue des lots est séparé de la gestion foncière pour vous proposer des annonces claires et faciles à consulter.
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <MessageCircle size={16} />
              WhatsApp {OFFICIAL_CONTACT.phone}
            </a>
          </Flex>
        </Container>
      </div>

      {/* Filters & Grid */}
      <main className="py-8 sm:py-12">
        <Container size="xl">
          {/* Filters Toggle */}
          <Flex align="center" justify="between" wrap gap="4" className="mb-6">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary-50 border-primary-300 text-primary-700" : ""}
            >
              Filtres {showFilters && <ChevronDown size={16} className="rotate-180" />}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<X size={14} />}
                onClick={() => {
                  setFilterVillage("");
                  setFilterMinPrice("");
                  setFilterMaxPrice("");
                  setFilterMinSurface("");
                  setFilterMaxSurface("");
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </Flex>

          {/* Filters Panel */}
          {showFilters && (
            <Card variant="bordered" padding="lg" className="mb-6 animate-in slide-in-from-top-2 duration-200">
              <Grid cols={{ base: 1, sm: 2, lg: 5 }} gap="md">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Village</label>
                  <Select
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                    options={villageOptions}
                    placeholder="Tous les villages"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Prix min (FCFA)</label>
                  <Input
                    type="number"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    placeholder="0"
                    iconLeft={<Tag size={16} />}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Prix max (FCFA)</label>
                  <Input
                    type="number"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    placeholder="Max"
                    iconLeft={<Tag size={16} />}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Surface min (m²)</label>
                  <Input
                    type="number"
                    value={filterMinSurface}
                    onChange={(e) => setFilterMinSurface(e.target.value)}
                    placeholder="0"
                    iconLeft={<Ruler size={16} />}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Surface max (m²)</label>
                  <Input
                    type="number"
                    value={filterMaxSurface}
                    onChange={(e) => setFilterMaxSurface(e.target.value)}
                    placeholder="Max"
                    iconLeft={<Ruler size={16} />}
                  />
                </div>
              </Grid>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {/* Lots Grid */}
          {displayLots.length === 0 ? (
            <Card variant="bordered" padding="xl" className="text-center py-16">
              <IconWrapper size="xl" variant="ghost" shape="circle" className="mx-auto mb-4">
                <MapPin size={28} className="text-neutral-400" />
              </IconWrapper>
              <CardTitle className="text-lg font-semibold text-neutral-900">Aucun lot disponible</CardTitle>
              <CardDescription className="mt-1">Aucun lot ne correspond à vos critères actuellement.</CardDescription>
            </Card>
          ) : (
            <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap="lg">
              {displayLots.map((lot) => (
                <Card key={lot.id} variant="elevated" padding="none" className="overflow-hidden h-full flex flex-col group">
                  <div className="relative h-56 bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                    {lot.imageUrl ? (
                      <img
                        src={lot.imageUrl}
                        alt={lot.imageAlt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-center px-6">
                        <MapPin className="w-14 h-14 text-primary-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-neutral-500">{lot.imageAlt}</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="primary" size="sm">Lot</Badge>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <Badge size="sm" variant={getStatutBadge(lot.statut, lot.isExample).variant}>
                        {getStatutBadge(lot.statut, lot.isExample).label}
                      </Badge>
                    </div>
                    {lot.isExample && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <Badge variant="warning" size="sm" className="bg-amber-500/90 text-white">Exemple</Badge>
                      </div>
                    )}
                  </div>

                  <CardContent padding="lg" className="flex-1 flex flex-col">
                    <Flex justify="between" align="start" gap="3" className="mb-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-neutral-900 line-clamp-1">{lot.titre}</CardTitle>
                        <CardDescription className="mt-0.5 text-xs">{lot.reference}</CardDescription>
                      </div>
                    </Flex>

                    <div className="space-y-2.5 mb-4 flex-1">
                      <Flex align="center" gap="2" className="text-sm text-neutral-600">
                        <IconWrapper size="sm" variant="ghost" shape="circle">
                          <Ruler size={14} className="text-neutral-400" />
                        </IconWrapper>
                        <span className="font-medium text-neutral-900">{formatSurface(lot.superficie)}</span>
                      </Flex>
                      <Flex align="center" gap="2" className="text-sm text-neutral-600">
                        <IconWrapper size="sm" variant="ghost" shape="circle">
                          <Tag size={14} className="text-neutral-400" />
                        </IconWrapper>
                        <span className="font-semibold text-neutral-900">{formatPrice(lot.prixVente)}</span>
                      </Flex>
                      <Flex align="center" gap="2" className="text-sm text-neutral-600">
                        <IconWrapper size="sm" variant="ghost" shape="circle">
                          <MapPin size={14} className="text-neutral-400" />
                        </IconWrapper>
                        <span className="font-medium text-neutral-900 truncate">{lot.quartier}</span>
                      </Flex>
                      <Flex align="center" gap="2" className="text-xs text-neutral-500">
                        <IconWrapper size="sm" variant="ghost" shape="circle">
                          <MapPin size={12} className="text-neutral-400" />
                        </IconWrapper>
                        <span className="font-medium text-neutral-700">{lot.village}</span>
                      </Flex>
                      <p className="text-xs text-neutral-500 italic">{lot.documents}</p>

                      {lot.caracteristiques.length > 0 && (
                        <Flex wrap gap="1.5" className="pt-1">
                          {lot.caracteristiques.slice(0, 4).map((feature) => (
                            <Badge key={feature} variant="outline" size="sm">{feature}</Badge>
                          ))}
                        </Flex>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleOpenLeadForm(lot)}
                      className="w-full min-h-[48px] group"
                    >
                      {lot.isExample ? "Demander un exemple similaire" : "Demander des informations"}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          )}
        </Container>
      </main>

      {/* Lead Form Modal */}
      {showLeadForm && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={handleCloseModal} role="dialog" aria-modal="true" aria-labelledby="lead-form-title">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
            <CardHeader padding="lg" className="border-b border-neutral-100 p-6" style={{ borderRadius: '1rem 1rem 0 0' }}>
              <Flex justify="between" align="center">
                <div>
                  <h2 id="lead-form-title" className="text-xl font-semibold text-neutral-900">Intéressé(e) par ce lot ?</h2>
                  <p className="text-sm text-neutral-500 mt-1">{selectedLot.reference} à {selectedLot.village}</p>
                </div>
                <Tooltip content="Fermer">
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    aria-label="Fermer le formulaire"
                  >
                    <X size={20} />
                  </button>
                </Tooltip>
              </Flex>
            </CardHeader>

            {submitSuccess ? (
              <CardContent padding="lg" className="text-center py-12">
                <IconWrapper size="xl" variant="success" shape="circle" className="mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </IconWrapper>
                <CardTitle className="text-lg">Demande envoyée !</CardTitle>
                <CardDescription className="mt-1 max-w-sm mx-auto">Notre équipe vous contactera très prochainement par téléphone ou WhatsApp pour qualifier votre besoin.</CardDescription>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmitLead} className="p-6 space-y-4">
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                  </div>
                )}
                {leadBridgeError && (
                  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {leadBridgeError}
                  </div>
                )}

                <Grid cols={2} gap="md">
                  <Input
                    label="Prénom *"
                    value={leadForm.prenom}
                    onChange={(e) => setLeadForm({ ...leadForm, prenom: e.target.value })}
                    placeholder="Votre prénom"
                    required
                  />
                  <Input
                    label="Nom *"
                    value={leadForm.nom}
                    onChange={(e) => setLeadForm({ ...leadForm, nom: e.target.value })}
                    placeholder="Votre nom"
                    required
                  />
                </Grid>

                <Input
                  label="Email *"
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="votre@email.com"
                  required
                />

                <div className="relative">
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={leadForm.telephone}
                      onChange={(e) => setLeadForm({ ...leadForm, telephone: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 border border-neutral-200 rounded-xl text-base focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition placeholder:text-neutral-400"
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                </div>

                <Textarea
                  label="Message"
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  placeholder="Décrivez votre besoin..."
                  rows={3}
                />

                <Flex gap="3" className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleCloseModal}
                    className="flex-1 min-h-[48px]"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={submitting}
                    loading={submitting}
                    className="flex-1 min-h-[48px]"
                  >
                    Envoyer ma demande
                  </Button>
                </Flex>

                <p className="text-xs text-neutral-500 text-center">
                  En envoyant cette demande, vous acceptez d'être contacté(e) par notre équipe pour ce lot.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}