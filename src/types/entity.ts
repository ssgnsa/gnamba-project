// TypeScript Entity Type - Synchronisé avec le schéma Pydantic EntityResponse du backend
// Ce type doit rester exactement synchronisé avec backend/app/schemas/entity.py:EntityResponse

export interface EntityResponse {
  id: string; // UUID en chaîne de caractères
  type: 'client' | 'employee' | 'supplier' | 'partner' | 'lead' | 'visitor' | 'user';
  subtype?: string | null;
  status: 'active' | 'inactive' | 'archived' | 'pending' | 'onboarding';
  display_name?: string | null;

  // Identité
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;

  // Documents
  id_document_type?: string | null;
  id_document_number?: string | null;
  id_document_date?: string | null; // ISO date string
  id_document_place?: string | null;

  // Contact
  phone?: string | null;
  email?: string | null;
  address?: string | null;

  // Professionnel
  profession?: string | null;
  employer?: string | null;

  // Personnel
  birth_date?: string | null; // ISO date string
  birth_place?: string | null;
  nationality?: string | null;

  // Métadonnées
  metadata: Record<string, any>;

  // Audit
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  created_by?: string | null; // UUID
  updated_by?: string | null; // UUID
  deleted_at?: string | null; // ISO datetime string
  deleted_by?: string | null; // UUID

  // Propriétés calculées (non stockées en DB)
  computed_display_name?: string | null;
  primary_contact?: {
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  identity_document?: {
    type?: string | null;
    number?: string | null;
    date?: string | null; // ISO date string
    place?: string | null;
  } | null;
}

// Type pour les réponses paginées
export interface PaginatedEntityResponse {
  items: EntityResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Type pour les paramètres de recherche
export interface EntitySearchParams {
  search?: string; // Recherche texte (nom, prénom, entreprise, téléphone, email)
  type?: 'client' | 'employee' | 'supplier' | 'partner' | 'lead' | 'visitor' | 'user';
  subtype?: string;
  status?: 'active' | 'inactive' | 'archived' | 'pending' | 'onboarding';
  has_phone?: boolean;
  has_email?: boolean;
  has_company?: boolean;
  id_document_type?: string;
  id_document_number?: string;
  limit?: number; // défaut: 50, min: 1, max: 200
  offset?: number; // défaut: 0, min: 0
  order_by?: string; // défaut: "created_at"
  descending?: boolean; // défaut: true
}

// Type léger pour les listes et références
export interface EntitySummary {
  id: string; // UUID
  type: 'client' | 'employee' | 'supplier' | 'partner' | 'lead' | 'visitor' | 'user';
  subtype?: string | null;
  status: 'active' | 'inactive' | 'archived' | 'pending' | 'onboarding';
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
}

// Types pour les opérations en masse
export interface EntityCreate {
  type: 'client' | 'employee' | 'supplier' | 'partner' | 'lead' | 'visitor' | 'user';
  subtype?: string | null;
  status?: 'active' | 'inactive' | 'archived' | 'pending' | 'onboarding';
  display_name?: string | null;

  // Identité
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;

  // Documents
  id_document_type?: string | null;
  id_document_number?: string | null;
  id_document_date?: string | null; // ISO date string
  id_document_place?: string | null;

  // Contact
  phone?: string | null;
  email?: string | null;
  address?: string | null;

  // Professionnel
  profession?: string | null;
  employer?: string | null;

  // Personnel
  birth_date?: string | null; // ISO date string
  birth_place?: string | null;
  nationality?: string | null;

  // Métadonnées extensibles
  metadata?: Record<string, any>;
}

export type EntityUpdate = Partial<Omit<EntityCreate, 'type'>>;