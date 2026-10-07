export interface Mapper<Domain, Api> {
  toDomain(api: Api): Domain;
  toApi(domain: Domain): Api;
}

export type ApiProject = {
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
};

export type ApiTask = {
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
};

export type ApiEmployee = {
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
};
