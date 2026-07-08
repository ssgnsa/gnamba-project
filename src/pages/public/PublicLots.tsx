import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Filter,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Tag,
} from "lucide-react";
import dbClient from "../../data/tableClient";
import type { VitrineLot } from "../../types";
import { formatMontant } from "../../utils/reference";
import { captureLead } from "../../lib/lead-capture";
import { clientsRepository } from "../../data/clients.repository";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

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
    caracteristiques: [
      "Quartier en développement",
      "Bonne visibilité",
      "Lot libre",
    ],
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
    caracteristiques: [
      "Surface généreuse",
      "Accès route",
      "Potentiel commercial",
    ],
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
    caracteristiques: [
      "Quartier recherché",
      "Investissement accessible",
      "Lot libre",
    ],
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
    caracteristiques: [
      "Prix attractif",
      "Bonne accessibilité",
      "Potentiel de revente",
    ],
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

  const villages = useMemo(() => {
    const allVillages = lots.map((lot) => lot.village).filter(Boolean);
    return [...new Set(allVillages)];
  }, [lots]);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (filterVillage && lot.village !== filterVillage) return false;

      if (filterMinPrice && lot.prix_vente < Number(filterMinPrice))
        return false;
      if (filterMaxPrice && lot.prix_vente > Number(filterMaxPrice))
        return false;

      if (filterMinSurface && lot.superficie < Number(filterMinSurface))
        return false;
      if (filterMaxSurface && lot.superficie > Number(filterMaxSurface))
        return false;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lots à vendre
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {displayLots.length} fiche
                {displayLots.length > 1 ? "s" : ""} affichée
                {displayLots.length > 1 ? "s" : ""} pour achat, investissement
                ou revente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span>
            Le catalogue des lots est séparé de la gestion foncière pour vous
            proposer des annonces claires et faciles à consulter.
          </span>
          <a
            href={buildWhatsAppUrl(OFFICIAL_CONTACT.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <MessageCircle size={15} />
            WhatsApp {OFFICIAL_CONTACT.phone}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Village
              </label>
              <select
                value={filterVillage}
                onChange={(e) => setFilterVillage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les villages</option>
                {villages.map((village) => (
                  <option key={village} value={village}>
                    {village}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prix min (FCFA)
              </label>
              <input
                type="number"
                value={filterMinPrice}
                onChange={(e) => setFilterMinPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prix max (FCFA)
              </label>
              <input
                type="number"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Max"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Surface min (m²)
              </label>
              <input
                type="number"
                value={filterMinSurface}
                onChange={(e) => setFilterMinSurface(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Surface max (m²)
              </label>
              <input
                type="number"
                value={filterMaxSurface}
                onChange={(e) => setFilterMaxSurface(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {displayLots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Aucun lot disponible
            </h3>
            <p className="text-gray-600 mt-2">
              Aucun lot ne correspond à vos critères actuellement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayLots.map((lot) => (
              <div
                key={lot.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  {lot.imageUrl ? (
                    <img
                      src={lot.imageUrl}
                      alt={lot.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <MapPin className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                      <p className="text-xs font-medium text-slate-600">
                        {lot.imageAlt}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {lot.titre}
                      </h3>
                      <p className="text-sm text-gray-600">{lot.reference}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lot.isExample || lot.statut === "exemple"
                          ? "bg-amber-50 text-amber-700"
                          : lot.statut === "disponible"
                            ? "bg-emerald-50 text-emerald-700"
                            : lot.statut === "reserve"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lot.isExample || lot.statut === "exemple"
                        ? "Exemple"
                        : lot.statut === "disponible"
                          ? "Disponible"
                          : lot.statut === "reserve"
                            ? "Réservé"
                            : "Vendu"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ruler className="w-4 h-4" />
                      {formatSurface(lot.superficie)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag className="w-4 h-4" />
                      {formatPrice(lot.prixVente)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {lot.quartier}
                    </div>
                    <div className="text-xs text-gray-500">{lot.village}</div>
                    <div className="text-xs text-gray-500">{lot.documents}</div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lot.caracteristiques.slice(0, 4).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenLeadForm(lot)}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {lot.isExample
                      ? "Demander un exemple similaire"
                      : "Demander des informations"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLeadForm && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Intéressé(e) par ce lot ?
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLot.reference} à {selectedLot.village}
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Demande envoyée !
                </h3>
                <p className="text-gray-600 mt-2">
                  Notre équipe vous contactera très prochainement par téléphone
                  ou WhatsApp pour qualifier votre besoin.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                {leadBridgeError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    {leadBridgeError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadForm.prenom}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, prenom: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadForm.nom}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, nom: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={leadForm.telephone}
                      onChange={(e) =>
                        setLeadForm({ ...leadForm, telephone: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={leadForm.message}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, message: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Envoi..." : "Envoyer ma demande"}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  En envoyant cette demande, vous acceptez d'être contacté(e)
                  par notre équipe pour ce lot.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
