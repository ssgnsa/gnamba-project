import DOMPurify from "dompurify";

export interface AttestationCoutumiereData {
  reference: string;
  numero_enregistrement: string;
  date_etablissement: string;
  date_expiration?: string;
  original: boolean;
  draft?: boolean;
  region: string;
  departement: string;
  commune: string;
  village: string;
  quartier: string;
  lotissement: string;
  numero_lot: string;
  superficie_m2: number;
  // Limites et GPS — facultatifs, imprimés uniquement en annexe
  limites?: { nord: string; sud: string; est: string; ouest: string };
  coordonnees_gps?: { lat: number; lng: number; precision?: number };
  gps_points?: Array<{ label: string; lat: number; lng: number }>;
  mode_acquisition: string;
  historique_possession: string;
  proprietaire_nom: string;
  proprietaire_prenom: string;
  proprietaire_naissance_date: string;
  proprietaire_naissance_lieu: string;
  proprietaire_domicile: string;
  proprietaire_profession: string;
  proprietaire_cni_numero: string;
  proprietaire_cni_date: string;
  proprietaire_cni_lieu: string;
  proprietaire_telephone: string;
  proprietaire_photo_url?: string;
  proprietaire_empreinte_url?: string;
  cedant_nom?: string;
  cedant_prenom?: string;
  cedant_cni_numero?: string;
  cedant_telephone?: string;
  cedant_domicile?: string;
  // Témoins — facultatifs, imprimés uniquement en annexe
  temoins?: Array<{
    nom: string;
    prenom: string;
    profession: string;
    telephone: string;
    cni: string;
    empreinte_url?: string;
  }>;
  chef_village: string;
  chef_nom?: string;
  lieu_signature: string;
  registre_volume: string;
  registre_page?: number | null;
  registre_ligne?: number | null;
  control_number: string;
  code_barre?: string;
  verification_url?: string;
  qrDataUrl?: string;
  hash_sha256?: string;
  validation_agent_nom?: string;
  validation_chef_nom?: string;
  logoUrl?: string;
  village_logo_url?: string;
  attestation_type?: string;
  statut?: string;
  lot_statut?: string;
  date_cession?: string;
  prix_cession?: number;
  chef_signature_manuscrite_requise?: boolean;
  chef_empreinte_url?: string;
  revoke_reason?: string;
  revoked_at?: string;
}

export interface QuittanceData {
  reference: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  mois_concerne: string;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  appName: string;
  appCompany: string;
  logoUrl?: string;
}

export interface RecuData {
  reference: string;
  client_nom: string;
  description: string;
  montant: number;
  date_transaction: string;
  mode_paiement: string;
  categorie: string;
  appName: string;
  appCompany: string;
  logoUrl?: string;
}

export interface AuditReportRow {
  date_action: string;
  action: string;
  utilisateur_nom: string;
  parcelle_reference: string;
  village: string;
  details: string;
}

export interface AuditReportData {
  title: string;
  generated_at: string;
  rows: AuditReportRow[];
  logoUrl?: string;
}

const printBase = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
    }
    @page {
      size: A4;
      margin: 10mm;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeText = (value: unknown) => escapeHtml(String(value ?? ""));
const safeUpper = (value: unknown) =>
  escapeHtml(String(value ?? "").toUpperCase());

async function fetchAsDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const resp = await fetch(url, { cache: "force-cache", mode: "cors" });
    console.log(
      "[PRINT] fetch",
      url.substring(0, 80),
      "→ status",
      resp.status,
      resp.ok,
    );
    if (!resp.ok) return url;
    const blob = await resp.blob();
    console.log("[PRINT] blob type:", blob.type, "size:", blob.size);
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => {
        console.error("[PRINT] FileReader error");
        resolve(url);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("[PRINT] fetchAsDataUrl error:", e);
    return url;
  }
}

const safeUrl = (value?: string | null) => {
  if (!value) return "";
  try {
    const base =
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : require("../lib/selfHosted").getLocalApiBaseUrl();
    const parsed = new URL(value, base);
    if (parsed.protocol === "data:") {
      if (value.trim().toLowerCase().startsWith("data:image/")) {
        return value;
      }
      return "";
    }
    if (["http:", "https:"].includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    return "";
  }
  return "";
};

const ITF_PATTERNS: Record<string, string> = {
  "0": "nnwwn",
  "1": "wnnnw",
  "2": "nwnnw",
  "3": "wwnnn",
  "4": "nnwnw",
  "5": "wnwnn",
  "6": "nwwnn",
  "7": "nnnww",
  "8": "wnnwn",
  "9": "nwnwn",
};

const buildItfBarcodeSvg = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const padded = digits.length % 2 === 0 ? digits : `0${digits}`;
  const narrow = 2;
  const wide = 6;
  const height = 46;

  let x = 0;
  const rects: string[] = [];
  const pushBar = (width: number) => {
    rects.push(`<rect x="${x}" y="0" width="${width}" height="${height}" />`);
    x += width;
  };
  const pushSpace = (width: number) => {
    x += width;
  };
  const widthFor = (symbol: string) => (symbol === "w" ? wide : narrow);

  // Start pattern: n n n n (bar/space/bar/space)
  ["n", "n", "n", "n"].forEach((symbol, idx) => {
    const w = widthFor(symbol);
    if (idx % 2 === 0) pushBar(w);
    else pushSpace(w);
  });

  for (let i = 0; i < padded.length; i += 2) {
    const left = ITF_PATTERNS[padded[i]];
    const right = ITF_PATTERNS[padded[i + 1]];
    for (let j = 0; j < 5; j += 1) {
      pushBar(widthFor(left[j]));
      pushSpace(widthFor(right[j]));
    }
  }

  // Stop pattern: w n n (bar/space/bar)
  ["w", "n", "n"].forEach((symbol, idx) => {
    const w = widthFor(symbol);
    if (idx % 2 === 0) pushBar(w);
    else pushSpace(w);
  });

  const svgWidth = x;
  return `<svg class="barcode-svg" xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" role="img" aria-label="Code barre">${rects.join("")}</svg>`;
};

// ============================================================================
// buildAttestationCoutumiereHTML — Document officiel propre
// NE contient PAS : GPS, limites, témoins (réservés pour l'annexe technique)
// ============================================================================
function buildAttestationCoutumiereHTML(
  data: AttestationCoutumiereData,
): string {
  const reference = safeText(data.reference);
  const region = safeText(data.region);
  const departement = safeText(data.departement);
  const commune = safeText(data.commune);
  // FIX: village peut contenir "VILLAGE DE KATADJI" ou juste "KATADJI"
  // On extrait le nom pur pour éviter "Village de VILLAGE DE KATADJI"
  const villageRaw = safeText(data.village);
  const villageNom = villageRaw
    .replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "")
    .trim();
  const quartier = safeText(data.quartier);
  const lotissement = safeText(data.lotissement);
  const numeroLot = safeText(data.numero_lot);
  const superficieM2 = Number.isFinite(data.superficie_m2)
    ? data.superficie_m2
    : 0;
  const superficie = safeText(superficieM2);
  const proprietaireNom = safeUpper(data.proprietaire_nom);
  const proprietairePrenom = safeUpper(data.proprietaire_prenom);
  const naissanceDate = safeText(data.proprietaire_naissance_date);
  const naissanceLieu = safeText(data.proprietaire_naissance_lieu);
  const proprietaireDomicile = safeText(data.proprietaire_domicile);
  const proprietaireProfession = safeText(data.proprietaire_profession);
  const cniNumero = safeText(data.proprietaire_cni_numero);
  const cniDate = safeText(data.proprietaire_cni_date);
  const cniLieu = safeText(data.proprietaire_cni_lieu);
  const telephone = safeText(data.proprietaire_telephone);
  const chefNom = safeUpper(
    data.chef_nom || data.validation_chef_nom || data.chef_village,
  );
  const villageLogoUrl = safeUrl(data.village_logo_url);
  const attestationType = String(data.attestation_type || "").toLowerCase();
  const hasCessionPrice =
    typeof data.prix_cession === "number" &&
    Number.isFinite(data.prix_cession) &&
    data.prix_cession > 0;
  const hasCedant = Boolean(
    data.cedant_nom || data.cedant_prenom || data.cedant_cni_numero,
  );
  const hasCessionHint = Boolean(data.date_cession) || hasCessionPrice;
  const isCession =
    attestationType === "cession" || hasCedant || hasCessionHint;
  const documentTitle = isCession
    ? "ATTESTATION DE CESSION DE DROITS COUTUMIERS"
    : "ATTESTATION DE PROPRIÉTÉ VILLAGEOISE";

  // Cession data
  const cedantNom = safeUpper(data.cedant_nom || "");
  const cedantPrenom = safeUpper(data.cedant_prenom || "");
  const cedantCni = safeText(data.cedant_cni_numero || "");
  const dateCession = safeText(data.date_cession || "");
  // Security elements
  const barcodeSvg = data.code_barre
    ? buildItfBarcodeSvg(
        String(data.code_barre).replace(/\s/g, "").toUpperCase(),
      )
    : "";
  const qrDataUrl = safeUrl(data.qrDataUrl);
  const hashSha256 = safeText(data.hash_sha256);
  const controlNumber = safeText(data.control_number);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 210mm; height: 297mm;
      background: #FAFAF9;
      color: #1A1A1A;
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      overflow: hidden;
    }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { width: 210mm; height: 297mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }

    /* ══ PAGE : occupe exactement 210×297mm ══ */
    .page {
      width: 210mm; height: 297mm;
      position: relative;
      background: #FAFAF9;
      display: flex;
      flex-direction: column;
    }

    /* ══ BANDES LATÉRALES DÉCORATIVES (4mm chaque côté) ══ */
    .page::before, .page::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 4mm;
      background: repeating-linear-gradient(
        180deg,
        rgba(197,164,103,0.18) 0px, rgba(197,164,103,0.18) 4px,
        transparent 4px, transparent 9px,
        rgba(197,164,103,0.08) 9px, rgba(197,164,103,0.08) 11px,
        transparent 11px, transparent 18px
      );
      pointer-events: none;
      z-index: 2;
    }
    .page::before { left: 0; }
    .page::after  { right: 0; }

    /* ══ FILIGRANE ══ */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-family: 'Playfair Display', serif;
      font-size: 62pt;
      font-weight: 700;
      color: rgba(197, 164, 103, 0.042);
      letter-spacing: 6px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    /* ══ CONTENU : flex-column sur 100% hauteur ══ */
    .inner {
      position: relative;
      z-index: 1;
      margin: 0 6mm;
      padding: 5mm 3mm 4mm;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* ══ BANDE TRICOLORE ══ */
    .tricolor-bar {
      height: 3px;
      background: linear-gradient(90deg, #F77F00 0% 33.3%, #ffffff 33.3% 66.6%, #009E60 66.6% 100%);
      border: 0.5px solid rgba(197,164,103,0.3);
      margin-bottom: 6px;
      flex-shrink: 0;
    }

    /* ══ EN-TÊTE : grille 3 col → 4 | 2.5 | 4 ══ */
    .header {
      display: grid;
      grid-template-columns: 4fr 58px 4fr;
      align-items: start;
      gap: 7px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #C5A467;
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .hdr-col {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #2C2C2C;
      line-height: 1.5;
    }
    .hdr-col .accent { color: #006B3F; font-weight: 600; font-size: 9pt; }
    .hdr-right { text-align: right; }
    .hdr-right .devise { font-style: italic; font-size: 7.5pt; color: #555; font-weight: 300; }
    /* Logo village — aligné sous nom village, hauteur 22mm */
    .village-logo-wrap {
      width: 58px; height: 58px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
      border: 1px solid rgba(197,164,103,0.45);
      background: transparent;
      overflow: hidden;
    }
    .village-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }

    /* ══ CADRE DU TITRE ══ */
    .title-frame {
      position: relative;
      text-align: center;
      margin: 6px 0 4px;
      padding: 8px 20px 10px;
      background: linear-gradient(180deg, rgba(197,164,103,0.09) 0%, rgba(250,250,249,0.5) 100%);
      flex-shrink: 0;
    }
    .title-frame::before, .title-frame::after {
      content: '';
      position: absolute;
      left: 0; right: 0;
      height: 6px;
    }
    .title-frame::before { top: 0;    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='6'%3E%3Cpolygon points='9,1 17,5 1,5' fill='none' stroke='%23C5A467' stroke-width='0.7' opacity='0.7'/%3E%3C/svg%3E") repeat-x center; }
    .title-frame::after  { bottom: 0; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='6'%3E%3Cpolygon points='9,5 17,1 1,1' fill='none' stroke='%23C5A467' stroke-width='0.7' opacity='0.7'/%3E%3C/svg%3E") repeat-x center; }
    .doc-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 19pt;
      font-weight: 700;
      color: #2C2C2C;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.25;
      display: block;
    }
    .doc-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      font-weight: 400;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 5px;
      display: block;
    }

    /* ══ FILET ORNÉ SOUS TITRE ══ */
    .ornament-rule {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0 6px;
      flex-shrink: 0;
    }
    .ornament-rule .line { flex: 1; height: 0.75px; background: linear-gradient(90deg, transparent, #C5A467 30%, #C5A467 70%, transparent); }
    .ornament-rule .diamond {
      width: 8px; height: 8px;
      background: #C5A467;
      transform: rotate(45deg);
      flex-shrink: 0;
      opacity: 0.85;
    }

    /* ══ BASE LÉGALE ══ */
    .legal-base {
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      font-style: italic;
      color: #555;
      text-align: center;
      line-height: 1.35;
      padding: 4px 16px;
      background: rgba(0,107,63,0.03);
      border-top: 0.5px solid #e0d9cc;
      border-bottom: 0.5px solid #e0d9cc;
      margin-bottom: 6px;
      flex-shrink: 0;
    }

    /* ══ DÉCLARATION SOLENNELLE ══ */
    .declaration {
      font-family: 'Playfair Display', serif;
      font-size: 10pt;
      font-style: italic;
      line-height: 1.5;
      text-align: justify;
      color: #1A1A1A;
      padding: 7px 10px 7px 14px;
      border-left: 3px solid #C5A467;
      background: rgba(197,164,103,0.05);
      margin-bottom: 7px;
      flex-shrink: 0;
    }
    .declaration strong { font-style: normal; font-weight: 700; color: #2C2C2C; }

    /* ══ GRILLE DE SECTIONS : 12 colonnes, s'étire pour occuper tout l'espace restant ══ */
    .sections-wrap {
      flex: 1 1 0;
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: 1fr;
      gap: 6px;
      align-content: stretch;
    }
    /* alias pour la transition grille → wrap */
    .sections-grid {
      display: contents;
    }
    .col-6 { grid-column: span 6; }
    .col-12 { grid-column: span 12; }
    .section-full { grid-column: 1 / -1; }

    /* ══ SECTION CARD — compactée ══ */
    .section-card {
      border: 0.75px solid #E0E0D8;
      background: #fff;
      padding: 6px 8px 8px;
      display: flex;
      flex-direction: column;
    }
    .section-card .dtable { flex: 1; }
    .section-head {
      display: flex;
      align-items: baseline;
      gap: 6px;
      border-bottom: 0.75px solid #C5A467;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .section-num {
      font-family: 'Playfair Display', serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #C5A467;
    }
    .section-label {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #006B3F;
    }

    /* ══ TABLE DE DONNÉES — compactée ══ */
    .dtable { width: 100%; border-collapse: collapse; font-size: 8pt; }
    .dtable td { padding: 2px 5px; vertical-align: top; line-height: 1.25; }
    .dtable .lbl {
      font-weight: 500;
      color: #444;
      white-space: nowrap;
      width: 38%;
      border-bottom: 0.5px dotted #d0c9bc;
    }
    .dtable .val {
      color: #1A1A1A;
      font-weight: 400;
      border-bottom: 0.5px dotted #d0c9bc;
    }
    .dtable .lbl.fill, .dtable .val.fill {
      background: rgba(197,164,103,0.05);
    }

    /* ══ CODE-BARRES ══ */
    .barcode-wrap {
      text-align: center;
      padding: 3px 0 2px;
      border-top: 0.5px solid #e0d9cc;
      border-bottom: 0.5px solid #e0d9cc;
      margin: 5px 0;
      flex-shrink: 0;
    }
    .barcode-wrap svg { height: 26px; }

    /* ══ BAS DE PAGE : stretch + 135px QR ══ */
    .footer-row {
      display: grid;
      grid-template-columns: 1fr 135px;
      gap: 6px;
      margin-top: 6px;
      flex-shrink: 0;
    }

    /* ══ SIGNATURE — hauteur 18mm, filet pointillé ══ */
    .sig-box {
      border: 0.75px solid #C5A467;
      padding: 8px 10px 10px;
      background: rgba(197,164,103,0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100px;
    }
    .sig-box-title {
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #C5A467;
      border-bottom: 0.5px solid #e0d9cc;
      padding-bottom: 3px;
      margin-bottom: 5px;
      width: 100%;
      text-align: center;
    }
    .sig-box-name {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 600;
      color: #006B3F;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.3;
      margin-bottom: auto;
    }
    .sig-box-line {
      width: 100%;
      border-top: 1.5px dashed #888;
      margin-top: 18mm;
      padding-top: 5px;
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      color: #777;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* ══ SÉCURITÉ — QR 32×32mm ══ */
    .security-box {
      border: 0.75px solid #ddd5c4;
      padding: 6px 7px;
      background: rgba(0,107,63,0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 7pt;
    }
    .sec-qr {
      width: 121px; height: 121px;
      border: 1px solid #ccc;
      padding: 4px;
      background: #fff;
    }
    .sec-qr img { width: 100%; height: 100%; object-fit: contain; }
    .sec-ctrl {
      font-family: 'Courier New', monospace;
      font-size: 7pt;
      font-weight: 700;
      color: #006B3F;
      letter-spacing: 0.3px;
      text-align: center;
    }
    .sec-hash {
      font-family: 'Courier New', monospace;
      font-size: 5.5pt;
      color: #888;
      word-break: break-all;
      text-align: center;
      line-height: 1.2;
    }

    /* ══ PIED DE PAGE FINAL ══ */
    .page-footer {
      margin-top: 5px;
      border-top: 1px solid #C5A467;
      padding-top: 4px;
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-mention {
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      font-style: italic;
      color: #777;
      line-height: 1.3;
    }
    .footer-date {
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      color: #777;
      text-align: right;
      font-style: italic;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Filigrane institutionnel -->
  <div class="watermark">GNAMBA</div>

  <!-- Contenu principal -->
  <div class="inner">

    <!-- Bande tricolore Côte d'Ivoire -->
    <div class="tricolor-bar"></div>

    <!-- ══ EN-TÊTE : 4 colonnes — Localisation | Logo village | Emblème CI | République ══ -->
    <div class="header">
      <!-- Col 1 : Localisation administrative -->
      <div class="hdr-col">
        <span class="accent">RÉGION ${region ? region.toUpperCase() : "—"}</span><br>
        Département de ${departement || "—"}<br>
        Commune de ${commune || "—"}<br>
        <strong>Village de ${villageNom.toUpperCase()}</strong>
      </div>

      <!-- Col 2 : Logo villageois officiel -->
      <div class="village-logo-wrap">
        ${
          villageLogoUrl && villageLogoUrl !== ""
            ? `<img src="${villageLogoUrl}" alt="Logo ${villageNom}" onerror="this.outerHTML='<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 58 58' width='54' height='54'><circle cx='29' cy='29' r='27' fill='none' stroke='%23C5A467' stroke-width='1.2'/>  <text x='29' y='33' text-anchor='middle' font-family='serif' font-size='14' font-weight='bold' fill='%23C5A467'>${villageNom.charAt(0).toUpperCase()}</text></svg>'"/>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 58" width="54" height="54">
               <circle cx="29" cy="29" r="27" fill="none" stroke="#C5A467" stroke-width="1.2"/>
               <text x="29" y="34" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#C5A467">${villageNom.charAt(0).toUpperCase()}</text>
             </svg>`
        }
      </div>

      <!-- Col 3 : République -->
      <div class="hdr-col hdr-right">
        RÉPUBLIQUE DE CÔTE D'IVOIRE<br>
        <span class="devise">Union — Discipline — Travail</span><br>
        <span style="font-size:7.5pt;color:#444;">Enreg. N° ${safeText(data.numero_enregistrement || reference)}</span>
      </div>
    </div>

    <!-- ══ TITRE CENTRAL ══ -->
    <div class="title-frame">
      <span class="doc-title">${documentTitle}</span>
      <span class="doc-subtitle">Droits Fonciers Coutumiers — Territoire Villageois</span>
    </div>

    <!-- ══ FILET ORNÉ ══ -->
    <div class="ornament-rule">
      <div class="line"></div>
      <div class="diamond"></div>
      <div class="line"></div>
      <div class="diamond"></div>
      <div class="line"></div>
    </div>

    <!-- ══ BASE LÉGALE ══ -->
    <div class="legal-base">
      Loi n° 98-750 du 23 décembre 1998 relative au domaine foncier rural &mdash;
      Décret n° 2019-361 du 15 mai 2019 relatif à la constatation des droits fonciers coutumiers
    </div>

    <!-- ══ DÉCLARATION SOLENNELLE ══ -->
    <div class="declaration">
      Nous, soussigné, <strong>${chefNom}</strong>, Chef Coutumier du Village de
      <strong>${villageNom.toUpperCase()}</strong>, attestons solennellement que les droits
      fonciers coutumiers afférents à la parcelle désignée ci-après appartiennent de plein
      droit coutumier à la personne dont l'identité suit, et ce en vertu d'une possession
      paisible, publique et ininterrompue, reconnue par les autorités villageoises compétentes.
    </div>

    <!-- ══ SECTIONS DONNÉES : grille 12 colonnes, remplissage vertical ══ -->
    <div class="sections-wrap">

      <!-- I. IDENTITÉ DU TITULAIRE — 6 col -->
      <div class="section-card col-6">
        <div class="section-head">
          <span class="section-num">I.</span>
          <span class="section-label">Identité du Titulaire</span>
        </div>
        <table class="dtable">
          <tr><td class="lbl fill">Nom &amp; Prénoms</td><td class="val fill"><strong>${proprietairePrenom} ${proprietaireNom}</strong></td></tr>
          <tr><td class="lbl">Né(e) le</td><td class="val">${naissanceDate || "—"} à ${naissanceLieu || "—"}</td></tr>
          ${proprietaireProfession ? `<tr><td class="lbl">Profession</td><td class="val">${proprietaireProfession}</td></tr>` : '<tr><td class="lbl">Profession</td><td class="val">—</td></tr>'}
          <tr><td class="lbl">CNI N°</td><td class="val">${cniNumero || "—"}${cniDate ? ` — délivrée le ${cniDate}${cniLieu ? " à " + cniLieu : ""}` : ""}</td></tr>
          <tr><td class="lbl">Domicile</td><td class="val">${proprietaireDomicile || "—"}</td></tr>
          <tr><td class="lbl">Téléphone</td><td class="val">${telephone || "—"}</td></tr>
        </table>
      </div>

      <!-- II/III. DESCRIPTION DE LA PARCELLE — 6 col -->
      <div class="section-card col-6">
        <div class="section-head">
          <span class="section-num">${isCession ? "III." : "II."}</span>
          <span class="section-label">Description Parcellaire</span>
        </div>
        <table class="dtable">
          <tr><td class="lbl fill">Lot N°</td><td class="val fill"><strong>${numeroLot || "—"}</strong></td></tr>
          <tr><td class="lbl">Superficie</td><td class="val">${superficie} m²</td></tr>
          <tr><td class="lbl">Quartier</td><td class="val">${quartier || "—"}</td></tr>
          <tr><td class="lbl">Lotissement</td><td class="val">${lotissement || "—"}</td></tr>
          <tr><td class="lbl">Village</td><td class="val">${villageNom.toUpperCase()}</td></tr>
          <tr><td class="lbl">Mode d'acquisition</td><td class="val">${safeText(data.mode_acquisition) || "—"}</td></tr>
        </table>
      </div>

      <!-- CESSION (si applicable) — 12 col -->
      ${
        isCession
          ? `
      <div class="section-card col-12">
        <div class="section-head">
          <span class="section-num">II.</span>
          <span class="section-label">Acte de Cession de Droits Coutumiers</span>
        </div>
        <table class="dtable">
          <tr>
            <td class="lbl fill" style="width:20%;">Cédant</td>
            <td class="val fill"><strong>${cedantPrenom} ${cedantNom}</strong>${cedantCni ? " &mdash; CNI&nbsp;" + cedantCni : ""}</td>
            <td class="lbl" style="width:20%;">Date de cession</td>
            <td class="val">${dateCession || "—"}</td>
          </tr>
        </table>
      </div>`
          : ""
      }

    </div><!-- fin .sections-wrap -->

    <!-- CODE-BARRES pleine largeur -->
    ${barcodeSvg ? `<div class="barcode-wrap" style="margin:5px 0;">${barcodeSvg}</div>` : ""}

    <!-- ══ BAS DE PAGE : VISA + SÉCURITÉ ══ -->
    <div class="footer-row">
      <div class="sig-box">
        <div class="sig-box-title">Chef Coutumier du Village</div>
        <div class="sig-box-name">${chefNom || "—"}</div>
        <div class="sig-box-line">Signature &amp; Sceau</div>
      </div>
      <div class="security-box">
        ${qrDataUrl ? `<div class="sec-qr"><img src="${qrDataUrl}" alt="Code de vérification"/></div>` : ""}
        ${controlNumber ? `<div class="sec-ctrl">N° ${controlNumber}</div>` : ""}
        ${hashSha256 ? `<div class="sec-hash">${hashSha256.substring(0, 32)}</div>` : ""}
      </div>
    </div>

    <!-- ══ PIED DE PAGE FINAL ══ -->
    <div class="page-footer">
      <div class="footer-mention">
        La présente attestation ne vaut pas titre foncier.<br>
        Elle constitue une présomption simple de possession coutumière,<br>
        établie par l'autorité coutumière du Village de <strong>${villageNom.toUpperCase()}</strong>.
      </div>
      <div class="footer-date">
        Délivré à ${safeText(data.lieu_signature) || villageNom.toUpperCase()}<br>
        le ${safeText(data.date_etablissement) || "22/05/2026 — 07:30"}
      </div>
    </div>

  </div><!-- fin .inner -->
</div>
</body>
</html>`;

  return html;
}

export async function printAttestationCoutumiere(
  data: AttestationCoutumiereData,
) {
  console.log(
    "[PRINT] village_logo_url reçu:",
    data.village_logo_url || "(vide)",
  );
  console.log("[PRINT] logoUrl reçu:", data.logoUrl || "(vide)");
  const resolved = { ...data };
  if (resolved.village_logo_url) {
    resolved.village_logo_url = await fetchAsDataUrl(resolved.village_logo_url);
    console.log(
      "[PRINT] village_logo_url après fetch:",
      resolved.village_logo_url?.substring(0, 60),
    );
  }
  if (resolved.logoUrl) {
    resolved.logoUrl = await fetchAsDataUrl(resolved.logoUrl);
    console.log(
      "[PRINT] logoUrl après fetch:",
      resolved.logoUrl?.substring(0, 60),
    );
  }
  const html = buildAttestationCoutumiereHTML(resolved);
  openPrintWindow(html);
}

/**
 * Impression de l'ANNEXE TECHNIQUE d'une attestation
 * Contient : GPS, limites, témoins — données facultatives exclues du document officiel
 * À imprimer séparément, au besoin, si les données existent.
 */
export async function printAttestationAnnex(data: AttestationCoutumiereData) {
  const hasLimites =
    data.limites &&
    (data.limites.nord ||
      data.limites.sud ||
      data.limites.est ||
      data.limites.ouest);
  const hasGps =
    data.coordonnees_gps &&
    (data.coordonnees_gps.lat != null || data.coordonnees_gps.lng != null);
  const hasGpsPoints = data.gps_points && data.gps_points.length > 0;
  const temoins = (data.temoins || []).filter((t) => t.nom || t.prenom);
  const hasTemoins = temoins.length > 0;

  if (!hasLimites && !hasGps && !hasGpsPoints && !hasTemoins) {
    alert(
      "Aucune donnée technique (GPS, limites, témoins) disponible pour cette attestation.",
    );
    return;
  }

  if (data.village_logo_url) {
    data = {
      ...data,
      village_logo_url: await fetchAsDataUrl(data.village_logo_url),
    };
  }
  if (data.logoUrl) {
    data = { ...data, logoUrl: await fetchAsDataUrl(data.logoUrl) };
  }

  const reference = safeText(data.reference);
  const numeroEnregistrement = safeText(data.numero_enregistrement);
  const proprietairePrenom = safeUpper(data.proprietaire_prenom);
  const proprietaireNom = safeUpper(data.proprietaire_nom);
  const villageRaw = safeText(data.village);
  const villageNom = villageRaw
    .replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "")
    .trim();
  const numeroLot = safeText(data.numero_lot);
  const lotissement = safeText(data.lotissement);
  const superficieM2 = Number.isFinite(data.superficie_m2)
    ? data.superficie_m2
    : 0;
  const dateEtablissement = safeText(data.date_etablissement);

  const limites = data.limites || { nord: "", sud: "", est: "", ouest: "" };
  const gps = data.coordonnees_gps;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Annexe Technique – ${reference}</title>
  ${printBase}
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; background: #fff; }
    .page { max-width: 180mm; margin: 0 auto; padding: 10mm; position: relative; }
    .page::before {
      content: '';
      position: absolute;
      inset: 5mm;
      border: 2px solid #0b5a2a;
      pointer-events: none;
    }
    .header-annex {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #0b5a2a;
      margin-bottom: 15px;
    }
    .header-annex h1 {
      font-size: 14pt;
      font-weight: bold;
      color: #0b5a2a;
      margin: 0 0 4px;
    }
    .header-annex .subtitle {
      font-size: 9pt;
      color: #555;
    }
    .ref-info {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      margin: 6px 0 12px;
      color: #666;
    }
    .section { margin: 12px 0; }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #1f2937;
      border-bottom: 1px solid #0b5a2a;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .field-row {
      display: flex;
      gap: 4px;
      margin: 4px 0;
      font-size: 10pt;
      line-height: 1.6;
    }
    .field-label { font-weight: bold; white-space: nowrap; min-width: 120px; }
    .field-value { flex: 1; border-bottom: 1px dotted #999; padding: 0 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 6px; }
    th { background: #f0fdf4; border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-size: 8.5pt; text-transform: uppercase; color: #166534; }
    td { border: 1px solid #e5e7eb; padding: 5px 8px; }
    .notice {
      font-size: 8pt;
      color: #888;
      text-align: center;
      margin-top: 20px;
      font-style: italic;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header-annex">
    <h1>ANNEXE TECHNIQUE</h1>
    <div class="subtitle">Attestation de Propriété Villageoise — Données complémentaires</div>
  </div>

  <div class="ref-info">
    <span>Réf : ${reference}</span>
    <span>Enreg. : ${numeroEnregistrement}</span>
    <span>Date : ${dateEtablissement}</span>
  </div>

  <div class="field-row">
    <span class="field-label">Détenteur :</span>
    <span class="field-value">${proprietairePrenom} ${proprietaireNom}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Parcelle :</span>
    <span class="field-value">Lot ${numeroLot}, ${lotissement || villageNom} — ${superficieM2} m²</span>
  </div>

  <!-- LIMITES -->
  ${
    hasLimites
      ? `
  <div class="section">
    <div class="section-title">Limites de la parcelle</div>
    ${limites.nord ? `<div class="field-row"><span class="field-label">Nord :</span><span class="field-value">${safeText(limites.nord)}</span></div>` : ""}
    ${limites.sud ? `<div class="field-row"><span class="field-label">Sud :</span><span class="field-value">${safeText(limites.sud)}</span></div>` : ""}
    ${limites.est ? `<div class="field-row"><span class="field-label">Est :</span><span class="field-value">${safeText(limites.est)}</span></div>` : ""}
    ${limites.ouest ? `<div class="field-row"><span class="field-label">Ouest :</span><span class="field-value">${safeText(limites.ouest)}</span></div>` : ""}
  </div>
  `
      : ""
  }

  <!-- COORDONNÉES GPS -->
  ${
    hasGps
      ? `
  <div class="section">
    <div class="section-title">Coordonnées GPS centrales</div>
    <div class="field-row"><span class="field-label">Latitude :</span><span class="field-value">${gps?.lat ?? "—"}</span></div>
    <div class="field-row"><span class="field-label">Longitude :</span><span class="field-value">${gps?.lng ?? "—"}</span></div>
    ${gps?.precision ? `<div class="field-row"><span class="field-label">Précision :</span><span class="field-value">${gps.precision} m</span></div>` : ""}
  </div>
  `
      : ""
  }

  <!-- GPS DES LIMITES -->
  ${
    hasGpsPoints
      ? `
  <div class="section">
    <div class="section-title">Coordonnées GPS des sommets</div>
    <table>
      <thead>
        <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
      </thead>
      <tbody>
        ${(data.gps_points || [])
          .map(
            (p, i) => `
          <tr>
            <td>${safeText(p.label || `Point ${i + 1}`)}</td>
            <td>${p.lat}</td>
            <td>${p.lng}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <!-- PRIX DE CESSION (confidentiel — uniquement en annexe) -->
  ${
    typeof data.prix_cession === "number" && data.prix_cession > 0
      ? `
  <div class="section">
    <div class="section-title">Prix de cession (confidentiel)</div>
    <div class="field-row"><span class="field-label">Montant :</span><span class="field-value">${data.prix_cession.toLocaleString("fr-FR")} FCFA</span></div>
    <div class="text" style="font-size:7.5pt;color:#999;font-style:italic;margin-top:4px;">Ce montant est strictement confidentiel et ne figure pas sur l'attestation officielle.</div>
  </div>
  `
      : ""
  }

  <!-- TÉMOINS -->
  ${
    hasTemoins
      ? `
  <div class="section">
    <div class="section-title">Témoins (${temoins.length})</div>
    <table>
      <thead>
        <tr><th>#</th><th>Nom & Prénoms</th><th>Profession</th><th>Téléphone</th><th>CNI</th></tr>
      </thead>
      <tbody>
        ${temoins
          .map(
            (t, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${safeUpper(t.prenom)} ${safeUpper(t.nom)}</td>
            <td>${safeText(t.profession || "—")}</td>
            <td>${safeText(t.telephone || "—")}</td>
            <td>${safeText(t.cni || "—")}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <div class="notice">
    Cette annexe technique est un document complémentaire à l'attestation officielle.
    Elle ne peut pas être utilisée seule comme preuve de propriété coutumière.
    Générée le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
  </div>

</div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printQuittance(data: QuittanceData) {
  const modeLabels: Record<string, string> = {
    virement: "Virement bancaire",
    especes: "Espèces",
    mobile_money: "Mobile Money",
    cheque: "Chèque",
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const locatairePrenom = safeText(data.locataire_prenom);
  const locataireNom = safeText(data.locataire_nom);
  const bienAdresse = safeText(data.bien_adresse);
  const moisConcerne = safeText(data.mois_concerne);
  const modePaiement = safeText(
    modeLabels[data.mode_paiement] || data.mode_paiement,
  );
  const datePaiement = safeText(data.date_paiement);
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString("fr-FR"));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Quittance de Loyer – ${reference}</title>
  ${printBase}
  <style>
    body { font-family: Arial, sans-serif; font-size: 10.5pt; }
    .page { width: 150mm; min-height: 80mm; margin: 0 auto; padding: 5mm; border: 2px solid #1e40af; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #1e40af; padding-bottom: 6px; }
    .company-name { font-size: 13.5pt; font-weight: bold; color: #1e40af; }
    .company-sub { font-size: 8pt; color: #555; margin-top: 1px; }
    .ref-date { text-align: right; font-size: 9pt; color: #555; }
    .doc-title { font-size: 13.5pt; font-weight: bold; text-transform: uppercase; background: #1e40af; color: #fff; padding: 4px 8px; margin: 6px 0; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 6px 0; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 3px; padding: 4px 6px; }
    .info-box .label { font-size: 7pt; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 2px; }
    .info-box .value { font-size: 9pt; font-weight: bold; color: #222; }
    .amount-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 3px; padding: 6px 10px; text-align: center; margin: 6px 0; }
    .amount-label { font-size: 8pt; color: #555; text-transform: uppercase; }
    .amount-value { font-size: 16pt; font-weight: bold; color: #16a34a; margin: 2px 0; }
    .footer-text { font-size: 8pt; color: #555; text-align: center; margin-top: 8px; font-style: italic; }
    .signature-zone { display: flex; justify-content: space-between; margin-top: 10px; }
    .sig-block { text-align: center; width: 80px; }
    .sig-block .line { border-top: 1px solid #000; margin-top: 20px; padding-top: 3px; font-size: 8pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:6px;">
      ${logoUrl ? `<img src="${logoUrl}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${appName}</div>
        <div class="company-sub">${appCompany}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${reference}</strong></div>
      <div>Date: ${datePaiement}</div>
    </div>
  </div>

  <div class="doc-title">Quittance de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${locatairePrenom} ${locataireNom}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${bienAdresse}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${moisConcerne}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${modePaiement}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant du Loyer Réglé</div>
    <div class="amount-value">${montantLabel} FCFA</div>
  </div>

  <div class="footer-text">
    Je soussigné, bailleur ou mandataire, reconnais avoir reçu la somme de
    <strong>${montantLabel} francs CFA</strong>
    de <strong>${locatairePrenom} ${locataireNom}</strong>
    au titre du loyer du mois de <strong>${moisConcerne}</strong>
    pour le bien situé à <strong>${bienAdresse}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Le Locataire</div>
    </div>
    <div class="sig-block">
      <div class="line">Le Bailleur / Mandataire</div>
    </div>
  </div>
</div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printRecuLoyer(data: QuittanceData) {
  const modeLabels: Record<string, string> = {
    virement: "Virement bancaire",
    especes: "Espèces",
    mobile_money: "Mobile Money",
    cheque: "Chèque",
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const locatairePrenom = safeText(data.locataire_prenom);
  const locataireNom = safeText(data.locataire_nom);
  const bienAdresse = safeText(data.bien_adresse);
  const moisConcerne = safeText(data.mois_concerne);
  const modePaiement = safeText(
    modeLabels[data.mode_paiement] || data.mode_paiement,
  );
  const datePaiement = safeText(data.date_paiement);
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString("fr-FR"));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement de Loyer – ${reference}</title>
  ${printBase}
  <style>
    body { font-family: Arial, sans-serif; font-size: 11.5pt; }
    .page { width: 150mm; min-height: 90mm; margin: 0 auto; padding: 6mm; border: 2px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #334155; padding-bottom: 6px; }
    .company-name { font-size: 13.5pt; font-weight: bold; color: #334155; }
    .company-sub { font-size: 8pt; color: #555; margin-top: 1px; }
    .ref-date { text-align: right; font-size: 9pt; color: #555; }
    .doc-title { font-size: 13.5pt; font-weight: bold; text-transform: uppercase; background: #334155; color: #fff; padding: 4px 8px; margin: 6px 0; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 6px 0; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 3px; padding: 4px 6px; }
    .info-box .label { font-size: 7pt; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 2px; }
    .info-box .value { font-size: 9pt; font-weight: bold; color: #222; }
    .amount-box { background: #f8fafc; border: 2px solid #334155; border-radius: 3px; padding: 6px 10px; text-align: center; margin: 6px 0; }
    .amount-label { font-size: 8pt; color: #555; text-transform: uppercase; }
    .amount-value { font-size: 16pt; font-weight: bold; color: #334155; margin: 2px 0; }
    .footer-text { font-size: 8pt; color: #555; text-align: center; margin-top: 8px; font-style: italic; }
    .signature-zone { display: flex; justify-content: flex-end; margin-top: 12px; }
    .sig-block { text-align: center; width: 110px; }
    .sig-block .line { border-top: 1px solid #000; margin-top: 20px; padding-top: 3px; font-size: 8pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:6px;">
      ${logoUrl ? `<img src="${logoUrl}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${appName}</div>
        <div class="company-sub">${appCompany}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${reference}</strong></div>
      <div>Date: ${datePaiement}</div>
    </div>
  </div>

  <div class="doc-title">Reçu de Paiement de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${locatairePrenom} ${locataireNom}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${bienAdresse}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${moisConcerne}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${modePaiement}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant Reçu</div>
    <div class="amount-value">${montantLabel} FCFA</div>
  </div>

  <div class="footer-text">
    Reçu établi pour la somme de <strong>${montantLabel} francs CFA</strong>
    versée par <strong>${locatairePrenom} ${locataireNom}</strong>
    au titre du loyer du mois de <strong>${moisConcerne}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Signature</div>
    </div>
  </div>
</div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printRecu(data: RecuData) {
  const modeLabels: Record<string, string> = {
    virement: "Virement bancaire",
    especes: "Espèces",
    mobile_money: "Mobile Money",
    cheque: "Chèque",
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const dateTransaction = safeText(data.date_transaction);
  const clientNom = safeText(data.client_nom);
  const description = safeText(data.description || data.categorie);
  const categorie = safeText(data.categorie);
  const modePaiement = safeText(
    modeLabels[data.mode_paiement] || data.mode_paiement,
  );
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString("fr-FR"));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement – ${reference}</title>
  ${printBase}
  <style>
    body { font-family: Arial, sans-serif; font-size: 12.5pt; }
    .page { width: 148mm; min-height: 100mm; margin: 0 auto; padding: 8mm 10mm; border: 2px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #334155; }
    .company-name { font-size: 16pt; font-weight: bold; color: #334155; }
    .company-sub { font-size: 9pt; color: #666; }
    .doc-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; border: 1px solid #334155; padding: 5px 20px; margin: 8px auto; width: fit-content; letter-spacing: 2px; }
    .ref-line { display: flex; justify-content: space-between; font-size: 10.5pt; color: #555; margin: 6px 0; }
    .info-row { display: flex; gap: 8px; margin: 6px 0; }
    .info-label { font-size: 10.5pt; color: #666; min-width: 100px; }
    .info-value { font-size: 10.5pt; font-weight: bold; color: #222; }
    .amount-row { background: #f8fafc; border: 1px solid #94a3b8; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
    .amount-label { font-size: 11.5pt; font-weight: bold; }
    .amount-value { font-size: 18.5pt; font-weight: bold; color: #1e40af; }
    .footer { font-size: 9pt; color: #888; text-align: center; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    .sig-row { display: flex; justify-content: flex-end; margin-top: 15px; }
    .sig-block { text-align: center; width: 100px; }
    .sig-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 3px; font-size: 8pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:10px;">
      ${logoUrl ? `<img src="${logoUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${appName}</div>
        <div class="company-sub">${appCompany}</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;"><div class="doc-title">Reçu de Paiement</div></div>

  <div class="ref-line">
    <span>Réf: <strong>${reference}</strong></span>
    <span>Date: ${dateTransaction}</span>
  </div>

  <div class="info-row"><span class="info-label">Client/Bénéficiaire</span><span class="info-value">${clientNom}</span></div>
  <div class="info-row"><span class="info-label">Objet</span><span class="info-value">${description}</span></div>
  <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${categorie}</span></div>
  <div class="info-row"><span class="info-label">Mode de paiement</span><span class="info-value">${modePaiement}</span></div>

  <div class="amount-row">
    <span class="amount-label">Montant Reçu</span>
    <span class="amount-value">${montantLabel} FCFA</span>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line">Signature</div>
    </div>
  </div>

  <div class="footer">Ce reçu est généré automatiquement par ${appName} – ${appCompany}</div>
</div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printAuditReport(data: AuditReportData) {
  const title = safeText(data.title);
  const generatedAt = safeText(data.generated_at);
  const logoUrl = safeUrl(data.logoUrl);
  const rows = (data.rows || []).map((row) => ({
    date: safeText(row.date_action),
    action: safeText(row.action),
    user: safeText(row.utilisateur_nom),
    reference: safeText(row.parcelle_reference),
    village: safeText(row.village),
    details: safeText(row.details),
  }));

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${printBase}
  <style>
    body { font-family: "Times New Roman", Times, serif; font-size: 10pt; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .meta { font-size: 9pt; color: #555; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; text-transform: uppercase; font-size: 8pt; color: #64748b; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">${title}</div>
        <div class="meta">Généré le ${generatedAt}</div>
      </div>
      ${logoUrl ? `<img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;" />` : ""}
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Action</th>
          <th>Utilisateur</th>
          <th>Référence</th>
          <th>Village</th>
          <th>Détails</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.action}</td>
            <td>${row.user}</td>
            <td>${row.reference}</td>
            <td>${row.village}</td>
            <td>${row.details}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

function sanitizePrintHtml(html: string): string {
  if (typeof window === "undefined") return html;
  try {
    return DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      FORCE_BODY: false,
      ADD_TAGS: ["style", "link", "meta", "title", "head", "body", "html"],
      FORBID_TAGS: ["script"],
      FORBID_ATTR: [
        "onerror",
        "onload",
        "onclick",
        "onmouseover",
        "onfocus",
        "onblur",
      ],
    });
  } catch {
    return html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
  }
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Veuillez autoriser les fenêtres popup pour imprimer.");
    return;
  }
  const safeHtml = sanitizePrintHtml(html);
  win.document.write(safeHtml);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 800);
}
