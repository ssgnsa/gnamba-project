/**
 * Utilitaires de validation pour les paramètres de l'application
 */

// ============================================
// EXPRESSIONS RÉGULIÈRES
// ============================================

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_CI_REGEX =
  /^\+225\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}$/;
const URL_REGEX = /^https?:\/\/.+/i;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// ============================================
// TYPES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  type: "format" | "required" | "length" | "contrast";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================
// FONCTIONS DE VALIDATION
// ============================================

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email) return null; // Champ vide, pas une erreur si optionnel
  if (!EMAIL_REGEX.test(email)) {
    return {
      field: "email",
      message: "Format d'email invalide (ex: contact@exemple.com)",
      type: "format",
    };
  }
  return null;
}

/**
 * Valide un numéro de téléphone (format Côte d'Ivoire)
 */
export function validatePhone(phone: string): ValidationError | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, "");
  if (!PHONE_CI_REGEX.test(phone) && !/^\+225[0-9]{9}$/.test(cleaned)) {
    return {
      field: "phone",
      message: "Format invalide. Utilisez: +225 XX XX XX XX XX",
      type: "format",
    };
  }
  return null;
}

/**
 * Valide une URL
 */
export function validateUrl(
  url: string,
  fieldName: string = "URL",
): ValidationError | null {
  if (!url) return null;
  if (!URL_REGEX.test(url)) {
    return {
      field: fieldName,
      message: `URL invalide. Doit commencer par http:// ou https://`,
      type: "format",
    };
  }
  return null;
}

/**
 * Valide une couleur hexadécimale
 */
export function validateColor(color: string): ValidationError | null {
  if (!color) return null;
  if (!HEX_COLOR_REGEX.test(color)) {
    return {
      field: "color",
      message: "Format de couleur invalide. Utilisez: #RRVVBB",
      type: "format",
    };
  }
  return null;
}

/**
 * Calcule le contraste entre deux couleurs
 * Retourne le ratio de contraste (4.45:1 minimum pour AA)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Valide le contraste entre une couleur de texte et de fond
 */
export function validateContrast(
  textColor: string,
  backgroundColor: string,
  minRatio: number = 4.5,
): ValidationError | null {
  const ratio = calculateContrastRatio(textColor, backgroundColor);

  if (ratio < minRatio) {
    return {
      field: "contrast",
      message: `Contraste insuffisant (${ratio.toFixed(2)}:1, minimum ${minRatio}:1 recommandé)`,
      type: "contrast",
    };
  }

  return null;
}

/**
 * Valide la longueur d'une chaîne
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string,
): ValidationError | null {
  if (value.length < min) {
    return {
      field: fieldName,
      message: `Minimum ${min} caractères requis`,
      type: "length",
    };
  }

  if (value.length > max) {
    return {
      field: fieldName,
      message: `Maximum ${max} caractères autorisés`,
      type: "length",
    };
  }

  return null;
}

/**
 * Valide tous les paramètres
 */
export function validateSettings(form: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Champs requis
  if (!form.app_title || form.app_title.trim() === "") {
    errors.push({
      field: "app_title",
      message: "Le titre est requis",
      type: "required",
    });
  }

  if (!form.app_company || form.app_company.trim() === "") {
    errors.push({
      field: "app_company",
      message: "Le nom de l'entreprise est requis",
      type: "required",
    });
  }

  // Couleurs
  const colorError = validateColor(form.primary_color);
  if (colorError) errors.push({ ...colorError, field: "primary_color" });

  const secondaryColorError = validateColor(form.secondary_color);
  if (secondaryColorError)
    errors.push({ ...secondaryColorError, field: "secondary_color" });

  // Email
  const emailError = validateEmail(form.contact_email);
  if (emailError) errors.push(emailError);

  // Téléphone
  const phoneError = validatePhone(form.contact_phone);
  if (phoneError) errors.push(phoneError);

  // URLs des réseaux sociaux
  const socialFields = [
    "social_facebook",
    "social_youtube",
    "social_linkedin",
    "social_twitter",
    "social_instagram",
    "social_tiktok",
  ];
  for (const field of socialFields) {
    if (form[field]) {
      const urlError = validateUrl(form[field], field);
      if (urlError) errors.push(urlError);
    }
  }

  // URLs des logos
  const logoFields = [
    "logo_url",
    "brand_logo_dark",
    "brand_favicon_url",
    "brand_watermark_url",
    "hero_background_url",
  ];
  for (const field of logoFields) {
    if (form[field]) {
      // Les URLs des logos peuvent venir de media_files, donc on ne valide pas strictement
      // Mais on peut vérifier si c'est une URL valide
      const urlError = validateUrl(form[field], field);
      if (urlError) {
        // Ce n'est pas bloquant, on ne l'ajoute pas aux erreurs
        if (import.meta.env.DEV)
          console.warn(`Avertissement: ${field} n'est pas une URL valide`);
      }
    }
  }

  // SEO Description length
  if (form.seo_description) {
    if (form.seo_description.length > 160) {
      errors.push({
        field: "seo_description",
        message: `La description SEO est trop longue (${form.seo_description.length} caractères, maximum 160 recommandé)`,
        type: "length",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtient le texte d'erreur pour un champ spécifique
 */
export function getFieldError(
  errors: ValidationError[],
  field: string,
): string | null {
  const error = errors.find((e) => e.field === field);
  return error ? error.message : null;
}

/**
 * Vérifie si un champ a une erreur
 */
export function hasFieldError(
  errors: ValidationError[],
  field: string,
): boolean {
  return errors.some((e) => e.field === field);
}
