export const OFFICIAL_CONTACT = {
  companyName: "GNAMBA SERVICES",
  legalName: "ENTREPRISE GNAMBA SERVICES SARL u",
  legalForm: "SARL Unipersonnelle (OHADA)",
  creationDate: "01 Septembre 2021",
  capitalSocial: "1 000 000 FCFA",
  director: "SAHORE GNAMBA KASSI DAVID-VINCENT",
  rccm: "CI-TIA-2021-B-237",
  ncc: "2506300F",
  email: "contact@gnambaservices.ci",
  quoteEmail: "devis@gnambaservices.ci",
  phone: "+225 07 77 96 01 49",
  phoneIntl: "+2250777960149",
  fixedPhone1: "+225 27 34 75 91 99",
  fixedPhone2: "+225 27 34 75 92 88",
  address: "BP 235 Sikensi, Région Agnéby-Tiassa, Côte d'Ivoire",
  physicalAddress:
    "Sogefia, au bout de la rue entre la Banque Atlantique et la sous-préfecture",
  hours: "Lun–Ven 08h00–17h30 | Sam 09h00–13h00",
  responseTime: "48h ouvrées maximum",
  whatsappUrl: "https://wa.me/2250777960149",
  website: "www.gnambaservices.ci",
} as const;

export const normalizePhoneToIntl = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return OFFICIAL_CONTACT.phoneIntl;
  if (digits.startsWith("225")) return digits;
  if (digits.startsWith("0") && digits.length === 10) {
    return `225${digits.slice(1)}`;
  }
  if (digits.length === 8) {
    return `225${digits}`;
  }
  return digits;
};

export const buildWhatsAppUrl = (phoneOrDigits?: string): string => {
  if (!phoneOrDigits) return OFFICIAL_CONTACT.whatsappUrl;
  return `https://wa.me/${normalizePhoneToIntl(phoneOrDigits)}`;
};

const buildGoogleMapsQuery = (value?: string): string => {
  const source =
    value?.trim() || OFFICIAL_CONTACT.physicalAddress || OFFICIAL_CONTACT.address;
  return source.replace(/\s+/g, " ");
};

export const buildGoogleMapsEmbedUrl = (value?: string): string => {
  const query = buildGoogleMapsQuery(value);
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
};

export const buildGoogleMapsDirectionsUrl = (value?: string): string => {
  const query = buildGoogleMapsQuery(value);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
