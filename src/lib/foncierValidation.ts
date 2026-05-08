import { z } from "zod";

/**
 * Schéma de validation pour un lot foncier
 * Utilisé pour la validation côté client avant soumission
 */

// Validation helpers - Champs obligatoires et optionnels
const requiredString = z.string().min(1, "Ce champ est requis");
const optionalString = z.string().optional().nullable();

// Numéro de lot/îlot: OBLIGATOIRE
const lotNumberSchema = z
  .string()
  .min(1, "Ce champ est requis")
  .regex(/^[\w/-]+$/, "Format invalide (lettres, chiffres, - et / autorisés)");

// Superficie: OBLIGATOIRE (nombre positif)
const superficieSchema = z
  .string()
  .min(1, "La superficie est requise")
  .transform((v) => parseFloat(v.replace(",", ".")))
  .refine(
    (v) => v !== null && !isNaN(v) && v > 0,
    "La superficie doit être un nombre positif",
  )
  .refine(
    (v) => v <= 1000000,
    "La superficie doit être inférieure à 1 000 000 m²",
  );

// Prix: nombre positif ou nul (0 autorisé pour les tests/dons)
const prixSchema = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? parseFloat(v.replace(",", ".")) : 0))
  .refine(
    (v) => !isNaN(v!) && v! >= 0,
    "Le prix doit être un nombre positif ou nul",
  );

// Date française (JJ/MM/AAAA) ou ISO (YYYY-MM-DD)
const frenchDateSchema = z
  .string()
  .optional()
  .nullable()
  .refine((v) => {
    if (!v) return true;
    const trimmed = v.trim();
    const frPattern = /^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/;
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    return frPattern.test(trimmed) || isoPattern.test(trimmed);
  }, "Format JJ/MM/AAAA ou AAAA-MM-JJ requis (ex: 29/12/1967)")
  .transform((v) => {
    if (!v) return "";
    const trimmed = v.trim();
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(trimmed)) {
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return "";
      return trimmed;
    }
    const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(trimmed);
    if (!match) return "";
    const [, d, m, y] = match;
    const date = new Date(`${y}-${m}-${d}`);
    if (isNaN(date.getTime())) return "";
    return `${y}-${m}-${d}`;
  });

// Téléphone ivoirien
const phoneSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (v) => !v || /^(\+225|00225)?\s*\d{10}$/.test(v.replace(/\s/g, "")),
    "Format invalide (10 chiffres, ex: 0707084041)",
  );

// CNI: format CI + chiffres
const cniSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (v) => !v || /^(CI|ci)\s*\d{8,11}$/.test(v.replace(/\s/g, "")),
    "Format CNI invalide (ex: CI 005274109)",
  );

const gpsCoordSchema = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), "Coordonnée GPS invalide")
  .refine((v) => {
    if (!v) return true;
    const num = parseFloat(v);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, "Latitude invalide (doit être entre -90 et 90)");

const gpsLngSchema = z
  .string()
  .optional()
  .nullable()
  .refine((v) => !v || /^-?\d+(\.\d+)?$/.test(v), "Coordonnée GPS invalide")
  .refine((v) => {
    if (!v) return true;
    const num = parseFloat(v);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, "Longitude invalide (doit être entre -180 et 180)");

// Statut du lot
const statutSchema = z.enum(["actif", "vendu", "litige", "reserve", "annule"]);

/**
 * Schéma principal pour le formulaire de lot foncier
 */
export const foncierLotFormSchema = z
  .object({
    // Section: Informations lot (OBLIGATOIRES)
    numero_lot: lotNumberSchema,
    numero_ilot: lotNumberSchema,
    nom_lotissement: requiredString.max(100, "Maximum 100 caractères"),
    village: requiredString.max(100, "Village requis"),

    // Section: Localisation (optionnel)
    quartier: optionalString,
    commune: optionalString,
    departement: optionalString,
    region: optionalString,
    ilot: optionalString, // Code court îlot

    // Section: Caractéristiques (OBLIGATOIRE)
    superficie: superficieSchema,

    // Section: Propriétaire (OBLIGATOIRE - nom uniquement)
    proprietaire_nom: requiredString.max(100, "Nom du propriétaire requis"),
    proprietaire_prenom: optionalString,
    proprietaire_naissance_date: frenchDateSchema,
    proprietaire_naissance_lieu: optionalString,
    proprietaire_cni_numero: cniSchema,
    proprietaire_cni_date: frenchDateSchema,
    proprietaire_cni_lieu: optionalString,
    proprietaire_profession: optionalString,
    proprietaire_telephone: phoneSchema,

    // Section: Administratif (optionnel)
    chef_village: optionalString,
    arrete_prefectoral: optionalString,
    arrete_date: frenchDateSchema,

    // Section: Cession
    statut: statutSchema.default("actif"),
    date_cession: z.string().optional(),
    prix_cession: prixSchema.optional(),

    // Section: GPS (optionnel)
    latitude: optionalString,
    longitude: optionalString,
    gps_precision: optionalString,
    limite_nord_lat: optionalString,
    limite_nord_lng: optionalString,
    limite_sud_lat: optionalString,
    limite_sud_lng: optionalString,
    limite_est_lat: optionalString,
    limite_est_lng: optionalString,
    limite_ouest_lat: optionalString,
    limite_ouest_lng: optionalString,

    // Section: Divers
    code_barre: optionalString,
    notes: z.string().max(1000, "Maximum 1000 caractères").optional(),
  })
  .superRefine((data, ctx) => {
    const today = new Date();
    if (data.proprietaire_naissance_date) {
      const birth = new Date(data.proprietaire_naissance_date);
      if (!isNaN(birth.getTime()) && birth > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["proprietaire_naissance_date"],
          message: "La date de naissance ne peut pas être dans le futur",
        });
      }
      if (data.date_cession) {
        const cession = new Date(data.date_cession);
        if (!isNaN(cession.getTime()) && cession < birth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["date_cession"],
            message:
              "La date de cession ne peut pas être antérieure à la naissance",
          });
        }
      }
    }
  });

/**
 * Schéma pour l'attestation coutumière
 */
export const attestationFormSchema = z.object({
  // Enregistrement
  registre_volume: optionalString,
  registre_page: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d+$/.test(v), "Numéro de page invalide"),
  registre_ligne: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d+$/.test(v), "Numéro de ligne invalide"),
  numero_enregistrement: optionalString,
  attestation_type: z.enum(["standard", "cession"]).default("standard"),

  // Mode d'acquisition (optionnel)
  mode_acquisition: z
    .enum(["Héritage", "Donation", "Vente coutumière", "Autre"])
    .optional(),
  historique_possession: optionalString,
  domicile: optionalString,
  cedant_nom: optionalString,
  cedant_prenom: optionalString,
  cedant_cni_numero: cniSchema,
  cedant_telephone: phoneSchema,
  cedant_domicile: optionalString,

  // Limites (optionnel pour les tests)
  limites_nord: optionalString,
  limites_sud: optionalString,
  limites_est: optionalString,
  limites_ouest: optionalString,

  // GPS (optionnel)
  gps_lat: gpsCoordSchema,
  gps_lng: gpsLngSchema,
  gps_precision: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Précision invalide"),
  gps_nord_lat: gpsCoordSchema,
  gps_nord_lng: gpsLngSchema,
  gps_sud_lat: gpsCoordSchema,
  gps_sud_lng: gpsLngSchema,
  gps_est_lat: gpsCoordSchema,
  gps_est_lng: gpsLngSchema,
  gps_ouest_lat: gpsCoordSchema,
  gps_ouest_lng: gpsLngSchema,

  // Témoins — facultatifs (imprimés uniquement en annexe si renseignés)
  temoins: z
    .array(
      z.object({
        nom: optionalString,
        prenom: optionalString,
        profession: optionalString,
        telephone: phoneSchema,
        cni: optionalString,
      }),
    )
    .optional()
    .nullable()
    .default([]),

  // Workflow validation
  validation_agent_nom: optionalString,
  validation_chef_nom: optionalString,

  // État du document
  original: z.boolean().default(true),
});

/**
 * Types inférés depuis les schémas
 */
export type FoncierLotFormInput = z.infer<typeof foncierLotFormSchema>;
export type AttestationFormInput = z.infer<typeof attestationFormSchema>;

/**
 * Fonction de validation utilitaire
 * Retourne les erreurs formatées pour affichage inline
 */
export function validateFoncierForm(data: unknown): {
  success: boolean;
  errors: Record<string, string> | null;
  parsedData?: FoncierLotFormInput;
} {
  const result = foncierLotFormSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    });
    return { success: false, errors };
  }

  return { success: true, errors: null, parsedData: result.data };
}

export function validateAttestationForm(data: unknown): {
  success: boolean;
  errors: Record<string, string> | null;
  parsedData?: AttestationFormInput;
} {
  const result = attestationFormSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    });
    return { success: false, errors };
  }

  return { success: true, errors: null, parsedData: result.data };
}
