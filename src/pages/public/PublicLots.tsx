import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { FoncierLot } from "../../types";
import { MapPin, Ruler, Tag, Phone, Mail, ArrowLeft, Filter } from "lucide-react";
import { formatMontant } from "../../utils/reference";

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

export default function PublicLots() {
  const [lots, setLots] = useState<FoncierLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<FoncierLot | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLeadForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filtres
  const [filterVillage, setFilterVillage] = useState<string>("");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterMinSurface, setFilterMinSurface] = useState<string>("");
  const [filterMaxSurface, setFilterMaxSurface] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPublishedLots();
  }, []);

  const loadPublishedLots = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("foncier_lots")
      .select("*")
      .eq("publier_sur_vitrine", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Impossible de charger les lots disponibles.");
      setLots([]);
    } else {
      setLots((data as FoncierLot[]) || []);
    }

    setLoading(false);
  };

  const villages = useMemo(() => {
    const allVillages = lots.map((l) => l.village).filter(Boolean);
    return [...new Set(allVillages)];
  }, [lots]);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      if (filterVillage && lot.village !== filterVillage) return false;

      const price = lot.prix_cession || 0;
      if (filterMinPrice && price < Number(filterMinPrice)) return false;
      if (filterMaxPrice && price > Number(filterMaxPrice)) return false;

      const surface = lot.superficie || 0;
      if (filterMinSurface && surface < Number(filterMinSurface)) return false;
      if (filterMaxSurface && surface > Number(filterMaxSurface)) return false;

      return true;
    });
  }, [lots, filterVillage, filterMinPrice, filterMaxPrice, filterMinSurface, filterMaxSurface]);

  const handleOpenLeadForm = (lot: FoncierLot) => {
    setSelectedLot(lot);
    setShowLeadForm(true);
    setSubmitSuccess(false);
    setLeadForm({
      ...emptyLeadForm,
      message: `Bonjour, je suis intéressé(e) par le lot ${lot.numero_lot} (${lot.village}). Pouvez-vous me contacter pour plus d'informations ?`,
    });
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Créer le client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          nom: leadForm.nom,
          prenom: leadForm.prenom,
          email: leadForm.email,
          telephone: leadForm.telephone,
          categorie: "prospect",
          source: "vitrine_foncier",
          statut: "actif",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Créer l'opportunité
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunites")
        .insert({
          client_id: client.id,
          titre: `Intérêt lot foncier ${selectedLot.numero_lot}`,
          description: leadForm.message,
          statut: "nouveau",
          priorite: "normale",
          valeur_potentielle: selectedLot.prix_cession,
          source: "vitrine_foncier",
        })
        .select()
        .single();

      if (oppError) throw oppError;

      // 3. Créer la tâche pour le commercial
      await supabase.from("taches").insert({
        titre: `Suivre lead vitrine: ${leadForm.prenom} ${leadForm.nom}`,
        description: `Nouveau lead intéressé par le lot ${selectedLot.numero_lot} à ${selectedLot.village}.\n\nMessage: ${leadForm.message}\n\nTél: ${leadForm.telephone}\nEmail: ${leadForm.email}`,
        categorie: "commercial",
        priorite: "haute",
        opportunite_id: opportunity.id,
        echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +24h
      });

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

  const formatPrice = (price?: number) => {
    if (!price || price <= 0) return "Prix sur demande";
    return `${formatMontant(price)} FCFA`;
  };

  const formatSurface = (surface?: number) => {
    if (!surface || surface <= 0) return "Surface non précisée";
    return `${surface} m²`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                Lots fonciers disponibles
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredLots.length} lot{filteredLots.length > 1 ? "s" : ""} disponible
                {filteredLots.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
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
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
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

      {/* Grille de lots */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredLots.length === 0 ? (
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
            {filteredLots.map((lot) => (
              <div
                key={lot.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-blue-300" />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Lot {lot.numero_lot}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Îlot {lot.numero_ilot}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {lot.village}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ruler className="w-4 h-4" />
                      {formatSurface(lot.superficie)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag className="w-4 h-4" />
                      {formatPrice(lot.prix_cession)}
                    </div>
                    {lot.nom_lotissement && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {lot.nom_lotissement}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenLeadForm(lot)}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Demander des informations
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Formulaire Lead */}
      {showLeadForm && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Intéressé(e) par ce lot ?
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Lot {selectedLot.numero_lot} à {selectedLot.village}
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
                  Notre équipe vous contactera très prochainement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
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
                  En envoyant cette demande, vous acceptez d'être contacté(e) par
                  notre équipe commerciale.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
