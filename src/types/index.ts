export interface AppSettings {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  type_client:
    | "particulier"
    | "entreprise"
    | "promoteur_immobilier"
    | "institution";
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  nom: string;
  client_id: string | null;
  localisation: string;
  type_projet: string;
  budget: number;
  date_debut: string | null;
  date_fin: string | null;
  statut: "devis" | "valide" | "en_cours" | "termine" | "facture";
  description: string;
  notes: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "nom" | "prenom">;
}

export interface Property {
  id: string;
  type_bien:
    | "appartement"
    | "villa"
    | "bureau"
    | "commerce"
    | "terrain"
    | "autre";
  adresse: string;
  proprietaire: string | null;
  valeur: number;
  loyer_mensuel: number;
  statut: "disponible" | "loue" | "en_vente" | "vendu";
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  property_id: string | null;
  date_debut_contrat: string | null;
  date_fin_contrat: string | null;
  loyer: number;
  depot_garantie: number;
  statut: "actif" | "inactif";
  created_at: string;
  updated_at: string;
  properties?: Pick<Property, "adresse">;
}

export interface RentPayment {
  id: string;
  locataire_id: string | null;
  property_id: string | null;
  contract_id: string | null;
  montant: number;
  date_paiement: string;
  date_echeance?: string | null;
  date_paiement_effectif?: string | null;
  mois_concerne: string;
  mois_concerne_date?: string | null;
  mode_paiement: "virement" | "especes" | "mobile_money" | "cheque";
  statut: "paye" | "en_attente" | "retard" | "partiel";
  notes: string | null;
  reference: string;
  last_document_type?: "quittance" | "recu" | null;
  last_document_at?: string | null;
  last_document_by?: string | null;
  created_at: string;
  locataires?: Pick<Tenant, "nom" | "prenom">;
  properties?: Pick<Property, "adresse">;
  lease_contracts?: Pick<LeaseContract, "reference">;
}

export interface LeaseContract {
  id: string;
  reference: string | null;
  property_id: string;
  locataire_id: string;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  charges: number;
  depot_garantie: number;
  statut: "actif" | "termine" | "resilie" | "renouvele";
  notes: string | null;
  created_at: string;
  updated_at: string;
  properties?: Pick<Property, "adresse" | "type_bien">;
  locataires?: Pick<Tenant, "nom" | "prenom" | "telephone">;
}

export interface LandFile {
  id: string;
  client_id: string | null;
  reference: string;
  localisation: string;
  superficie: number;
  statut_administratif: "etude" | "en_cours" | "valide" | "termine";
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "nom" | "prenom">;
}

export interface Product {
  id: string;
  nom: string;
  categorie:
    | "fournitures_bureau"
    | "materiel_informatique"
    | "mobilier"
    | "autre";
  prix_unitaire: number;
  stock_actuel: number;
  stock_minimum: number;
  unite: string;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  type_ordre: "vente" | "commande";
  client_id: string | null;
  product_id: string | null;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  statut: "en_cours" | "livre" | "annule";
  date_ordre: string;
  notes: string;
  created_at: string;
  clients?: Pick<Client, "nom" | "prenom">;
  products?: Pick<Product, "nom">;
}

export interface Finance {
  id: string;
  type_transaction: "recette" | "depense";
  categorie: string;
  montant: number;
  date_transaction: string;
  mode_paiement: "virement" | "especes" | "mobile_money" | "cheque";
  reference: string;
  description: string;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "nom" | "prenom">;
  projects?: Pick<Project, "nom">;
}

export interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  department: string;
  telephone: string;
  email: string;
  salaire: number;
  date_embauche: string;
  statut: "actif" | "inactif" | "conge";
  notes: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  produits_fournis: string;
  statut: "actif" | "inactif";
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  nom: string;
  type_document:
    | "contrat"
    | "devis"
    | "facture"
    | "photo_chantier"
    | "dossier_foncier"
    | "autre";
  url: string;
  taille_fichier: number;
  client_id: string | null;
  project_id: string | null;
  description: string;
  created_at: string;
  clients?: Pick<Client, "nom" | "prenom">;
  projects?: Pick<Project, "nom">;
}

export interface Task {
  id: string;
  titre: string;
  description: string;
  assignee_id: string | null;
  priorite: "basse" | "normale" | "haute" | "urgente";
  statut: "a_faire" | "en_cours" | "termine" | "annule";
  date_echeance: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  employees?: Pick<Employee, "nom" | "prenom">;
  projects?: Pick<Project, "nom">;
}

export interface FoncierLot {
  id: string;
  reference: string;
  numero_lot: string;
  numero_ilot: string;
  ilot?: string | null; // Code court îlot
  nom_lotissement: string;
  quartier: string;
  village: string;
  lotissement_id?: string | null;
  ilot_id?: string | null;
  commune: string;
  departement: string;
  region: string;
  superficie: number;
  code_barre: string;
  // Coordonnées GPS (ajoutées migration 20260324)
  latitude?: number | null;
  longitude?: number | null;
  gps_precision?: number | null;
  limite_nord_lat?: number | null;
  limite_nord_lng?: number | null;
  limite_sud_lat?: number | null;
  limite_sud_lng?: number | null;
  limite_est_lat?: number | null;
  limite_est_lng?: number | null;
  limite_ouest_lat?: number | null;
  limite_ouest_lng?: number | null;
  // Propriétaire
  proprietaire_nom: string;
  proprietaire_prenom: string;
  proprietaire_naissance_date: string;
  proprietaire_naissance_lieu: string;
  proprietaire_cni_numero: string;
  proprietaire_cni_date: string;
  proprietaire_cni_lieu: string;
  proprietaire_profession: string;
  proprietaire_telephone: string;
  // Administratif
  chef_village: string;
  arrete_prefectoral: string;
  arrete_date: string;
  // Transaction
  statut: "actif" | "vendu" | "litige" | "reserve" | "annule";
  date_cession: string; // Format ISO "YYYY-MM-DD"
  prix_cession: number;
  notes: string;
  // Audit & synchronisation
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  deleted_reason?: string | null;
  client_updated_at?: string | null;
  last_modified_device_id?: string | null;
  row_version?: number | null;
  retention_until?: string | null;
  total_count?: number;
}

export interface FoncierGpsPoint {
  label: string;
  lat: number;
  lng: number;
}

export interface FoncierAttestation {
  id: string;
  lot_id: string | null;
  reference: string;
  version?: number | null;
  type: string;
  statut: string;
  date_etablissement?: string | null;
  date_expiration?: string | null; // Date d'expiration (6 mois après émission)
  mode_acquisition?: string | null;
  historique_possession?: string | null;
  domicile?: string | null;
  cedant_nom?: string | null;
  cedant_prenom?: string | null;
  cedant_cni_numero?: string | null;
  cedant_telephone?: string | null;
  cedant_domicile?: string | null;
  limites_nord?: string | null;
  limites_sud?: string | null;
  limites_est?: string | null;
  limites_ouest?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_precision?: number | null;
  gps_points?: FoncierGpsPoint[] | null;
  registre_volume?: string | null;
  registre_page: number | null;
  registre_ligne: number | null;
  numero_enregistrement?: string | null;
  qr_payload?: string | null;
  signature_numerique?: string | null;
  hash_sha256?: string | null;
  control_number?: string | null;
  signature_nonce?: string | null;
  signature_issued_at?: string | null;
  validation_agent_nom?: string | null;
  validation_agent_id?: string | null;
  validation_agent_date?: string | null;
  validation_chef_nom?: string | null;
  validation_chef_id?: string | null;
  validation_chef_date?: string | null;
  // Champs pour signature physique et biométrie
  proprietaire_photo_url?: string | null; // Photo d'identité du propriétaire
  proprietaire_empreinte_url?: string | null; // Empreinte digitale propriétaire
  chef_signature_manuscrite_requise?: boolean | null; // Flag: signature physique requise
  chef_empreinte_url?: string | null; // Empreinte digitale Chef (pour cachet)
  temoin_empreinte_urls?: string[] | null; // URLs des empreintes des témoins
  // Révocation
  revoke_reason?: string | null; // Motif de révocation
  revoked_at?: string | null; // Date de révocation
  revoked_by?: string | null; // ID utilisateur révocation
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  client_updated_at?: string | null;
  last_modified_device_id?: string | null;
  deleted_at?: string | null;
}

export interface FoncierAttestationTemoin {
  id: string;
  attestation_id: string | null;
  nom: string;
  prenom: string;
  profession?: string | null;
  telephone?: string | null;
  cni?: string | null;
  empreinte_url?: string | null;
  created_at: string;
}

export interface FoncierConfig {
  key: string;
  value: string;
}

export interface FoncierVillage {
  name: string;
  code: string;
  region: string;
  departement: string;
  commune: string;
}

export interface UserVillageAccess {
  id: string;
  user_id: string;
  village: string;
  created_at: string;
}

export type MediaCategory =
  | "brand_assets"
  | "site_vitrine"
  | "hero_backgrounds"
  | "realisations"
  | "projets_btp"
  | "immobilier"
  | "services"
  | "equipe"
  | "documents"
  | "autre";

export type BrandAssetType =
  | "logo_principal"
  | "logo_secondaire"
  | "favicon"
  | "watermark";

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  category: MediaCategory;
  uploaded_by: string | null;
  upload_date: string;
  size: number;
  type: string;
  alt_text: string;
  description: string;
  tags: string[];
  is_brand_asset: boolean;
  brand_asset_type: BrandAssetType | null;
  created_at: string;
  updated_at: string;
}

export interface MediaUsage {
  id: string;
  media_id: string;
  entity_type: string;
  entity_id: string | null;
  usage_type: string;
  label: string;
  created_at: string;
  media_files?: Pick<MediaFile, "id" | "url" | "original_name">;
}

export interface MediaVersion {
  id: string;
  media_id: string;
  version_number: number;
  old_url: string;
  old_filename: string;
  replaced_at: string;
  replaced_by: string | null;
}

export interface BrandSettings {
  app_title: string;
  app_subtitle: string;
  app_company: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  // Contact information
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  contact_hours: string;
  // Social media
  social_facebook: string;
  social_youtube: string;
  social_linkedin: string;
  social_twitter: string;
  social_instagram: string;
  social_tiktok: string;
  // SEO
  seo_description: string;
  seo_keywords: string;
  // Brand assets
  brand_logo_dark: string;
  brand_favicon_url: string;
  brand_watermark_url: string;
  // Site vitrine backgrounds
  hero_background_url: string;
}

// UserProfile pour la compatibilité
export type UserRole = "admin" | "gestionnaire" | "employe";
export type AccessLevel =
  | "admin"
  | "gerant"
  | "secretaire"
  | "ouvrier"
  | "visiteur"
  | "gestionnaire"
  | "employe";

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  access_level?: AccessLevel;
  poste?: string;
  department: string;
  avatar_url: string;
  phone: string;
  email?: string;
}

// ============================================
// REGISTRE VISITEUR TYPES
// ============================================

export type VisiteurTypePiece = "CNI" | "PASSEPORT" | "PERMIS" | "AUTRE";
export type VisiteStatut = "EN_COURS" | "TERMINEE" | "ANNULEE";
export type VisiteType = "PHYSIQUE" | "TELEPHONE";
export type EmployeStatut =
  | "EN_LIGNE"
  | "EN_REUNION"
  | "ABSENT"
  | "PAUSE"
  | "TELETRAVAIL";
export type MessageDirectionType =
  | "INFORMATION"
  | "FELICITATION"
  | "ALERTE"
  | "MOTIVATION";
export type MessageDirectionStatut =
  | "BROUILLON"
  | "PROGRAMME"
  | "PUBLIE"
  | "EXPIRE";
export type Priorite = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";
export type ActiviteType =
  | "GENERAL"
  | "VISITEUR"
  | "DOCUMENT"
  | "FINANCE"
  | "IMMOBILIER"
  | "FONCIER"
  | "SYSTEME";
export type AlerteType =
  | "RAPPEL"
  | "ALERTE"
  | "REUNION"
  | "ECHEANCE"
  | "ANNIVERSAIRE";
export type AlerteStatut = "ACTIVE" | "ACQUITTEE" | "EXPIREE";

export interface Visiteur {
  id: string;
  nom_complet: string;
  type_piece: VisiteurTypePiece;
  numero_piece: string;
  telephone: string;
  email: string | null;
  societe: string | null;
  photo_url: string | null;
  photo_base64: string | null;
  nb_visites: number;
  derniere_visite: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
}

export interface Visite {
  id: string;
  visiteur_id: string;
  date_arrivee: string;
  date_depart: string | null;
  motif: string;
  motif_autre: string | null;
  personne_rencontree_id: string | null;
  personne_rencontree_nom: string | null;
  service: string;
  badge_imprime: boolean;
  badge_imprime_at: string | null;
  statut: VisiteStatut;
  observations: string | null;
  signature_numerique: string | null;
  qr_code: string | null;
  type_visite: VisiteType;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined fields
  visiteurs?: Pick<
    Visiteur,
    "nom_complet" | "telephone" | "photo_url" | "photo_base64"
  >;
  user_profiles?: Pick<UserProfile, "full_name" | "avatar_url">;
}

export interface MessageDirection {
  id: string;
  titre: string;
  contenu: string;
  type: MessageDirectionType;
  image_url: string | null;
  date_publication: string;
  date_expiration: string | null;
  priorite: Priorite;
  cibles_tous_employes: boolean;
  cibles_services: string[];
  cibles_employes: string[];
  publie_par: string | null;
  statut: MessageDirectionStatut;
  lu_par: string[];
  created_at: string;
  updated_at: string;
}

export interface EmployePresence {
  id: string;
  employe_id: string;
  statut: EmployeStatut;
  statut_message: string | null;
  date_arrivee: string;
  date_depart: string | null;
  date_naissance: string | null;
  service: string | null;
  poste: string | null;
  avatar_url: string | null;
  last_activity: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  full_name?: string;
  email?: string;
  phone?: string;
  heures_inactivite?: number;
}

export interface ActiviteJournal {
  id: string;
  type: ActiviteType;
  titre: string;
  description: string | null;
  icone: string;
  priorite: Priorite;
  auteur_id: string | null;
  auteur_nom: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface AlerteRappel {
  id: string;
  titre: string;
  description: string | null;
  type: AlerteType;
  date_alerte: string;
  date_expiration: string | null;
  priorite: Priorite;
  cibles_tous: boolean;
  cibles_services: string[];
  cibles_employes: string[];
  statut: AlerteStatut;
  acquittee_par: string[];
  acquittee_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatsJournalieres {
  date: string;
  total_visiteurs: number;
  visiteurs_actuels: number;
  badges_imprimes: number;
  employes_presents: number;
  activites_du_jour: number;
}

// Form types for visitor registration
export interface VisiteurFormData {
  nom_complet: string;
  type_piece: VisiteurTypePiece;
  numero_piece: string;
  telephone: string;
  email: string;
  societe: string;
  photo_base64: string | null;
}

export interface VisiteFormData {
  visiteur_id: string;
  motif: string;
  motif_autre: string;
  personne_rencontree_id: string;
  personne_rencontree_nom: string;
  service: string;
  type_visite: VisiteType;
  observations: string;
}
