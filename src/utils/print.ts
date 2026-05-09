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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeText = (value: unknown) => escapeHtml(String(value ?? ''));
const safeUpper = (value: unknown) => escapeHtml(String(value ?? '').toUpperCase());

const safeUrl = (value?: string | null) => {
  if (!value) return '';
  try {
    const base = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
    const parsed = new URL(value, base);
    if (parsed.protocol === 'data:') {
      if (value.trim().toLowerCase().startsWith('data:image/')) {
        return value;
      }
      return '';
    }
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
};

const ITF_PATTERNS: Record<string, string> = {
  '0': 'nnwwn',
  '1': 'wnnnw',
  '2': 'nwnnw',
  '3': 'wwnnn',
  '4': 'nnwnw',
  '5': 'wnwnn',
  '6': 'nwwnn',
  '7': 'nnnww',
  '8': 'wnnwn',
  '9': 'nwnwn',
};

const buildItfBarcodeSvg = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
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
  const pushSpace = (width: number) => { x += width; };
  const widthFor = (symbol: string) => (symbol === 'w' ? wide : narrow);

  // Start pattern: n n n n (bar/space/bar/space)
  ['n', 'n', 'n', 'n'].forEach((symbol, idx) => {
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
  ['w', 'n', 'n'].forEach((symbol, idx) => {
    const w = widthFor(symbol);
    if (idx % 2 === 0) pushBar(w);
    else pushSpace(w);
  });

  const svgWidth = x;
  return `<svg class="barcode-svg" xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${height}" viewBox="0 0 ${svgWidth} ${height}" role="img" aria-label="Code barre">${rects.join('')}</svg>`;
};

// ============================================================================
// buildAttestationCoutumiereHTML — Document officiel propre
// NE contient PAS : GPS, limites, témoins (réservés pour l'annexe technique)
// ============================================================================
function buildAttestationCoutumiereHTML(data: AttestationCoutumiereData): string {
  const reference = safeText(data.reference);
  const region = safeText(data.region);
  const departement = safeText(data.departement);
  const commune = safeText(data.commune);
  // FIX: village peut contenir "VILLAGE DE KATADJI" ou juste "KATADJI"
  // On extrait le nom pur pour éviter "Village de VILLAGE DE KATADJI"
  const villageRaw = safeText(data.village);
  const villageNom = villageRaw.replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, '').trim();
  const quartier = safeText(data.quartier);
  const lotissement = safeText(data.lotissement);
  const numeroLot = safeText(data.numero_lot);
  const superficieM2 = Number.isFinite(data.superficie_m2) ? data.superficie_m2 : 0;
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
  const chefNom = safeUpper(data.chef_nom || data.validation_chef_nom || data.chef_village);
  const logoUrl = safeUrl(data.logoUrl);
  const villageLogoUrl = safeUrl(data.village_logo_url);
  const attestationType = String(data.attestation_type || '').toLowerCase();
  const hasCessionPrice = typeof data.prix_cession === 'number' && Number.isFinite(data.prix_cession) && data.prix_cession > 0;
  const hasCedant = Boolean(data.cedant_nom || data.cedant_prenom || data.cedant_cni_numero);
  const hasCessionHint = Boolean(data.date_cession) || hasCessionPrice;
  const isCession = attestationType === 'cession' || hasCedant || hasCessionHint;
  const documentTitle = isCession
    ? 'ATTESTATION DE CESSION DE DROITS COUTUMIERS'
    : 'ATTESTATION DE PROPRIÉTÉ VILLAGEOISE';

  // Cession data
  const cedantNom = safeUpper(data.cedant_nom || '');
  const cedantPrenom = safeUpper(data.cedant_prenom || '');
  const cedantCni = safeText(data.cedant_cni_numero || '');
  const dateCession = safeText(data.date_cession || '');
  // Security elements
  const barcodeSvg = data.code_barre ? buildItfBarcodeSvg(String(data.code_barre).replace(/\s/g, '').toUpperCase()) : '';
  const qrDataUrl = safeUrl(data.qrDataUrl);
  const hashSha256 = safeText(data.hash_sha256);
  const controlNumber = safeText(data.control_number);
  const verificationUrl = safeText(data.verification_url);
  const registreVolume = safeText(data.registre_volume);
  const registrePage = data.registre_page != null ? String(data.registre_page) : '';
  const registreLigne = data.registre_ligne != null ? String(data.registre_ligne) : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} – ${reference}</title>
  ${printBase}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600;700&display=swap');

    @page { size: A4 portrait; margin: 5mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 200mm; height: 287mm;
      margin: 0; padding: 0;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      overflow: hidden;
    }

    .page {
      width: 100%; height: 100%;
      position: relative;
      padding: 6mm 8mm;
      margin: 0;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ——— BORDURE SUBTILE ——— */
    .page::before {
      content: '';
      position: absolute;
      top: 3px; left: 3px; right: 3px; bottom: 3px;
      border: 0.5px solid rgba(184, 134, 11, 0.4);
      pointer-events: none;
    }

    /* Coins discrets */
    .corner { position: absolute; width: 8mm; height: 8mm; z-index: 1; opacity: 0.6; }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 2mm; left: 2mm; }
    .corner-tr { top: 2mm; right: 2mm; transform: scaleX(-1); }
    .corner-bl { bottom: 2mm; left: 2mm; transform: scaleY(-1); }
    .corner-br { bottom: 2mm; right: 2mm; transform: scale(-1, -1); }

    /* ——— FILIGRANE ——— */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: 'Cinzel', serif;
      font-size: 48pt;
      font-weight: 600;
      color: rgba(180, 180, 180, 0.04);
      letter-spacing: 4px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    /* ——— BARRE D'IDENTIFICATION SUBTILE ——— */
    .id-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1.5mm;
      background: linear-gradient(90deg, #f77f00 0%, #f77f00 33%, #009e60 33%, #009e60 66%, #b8860b 66%, #b8860b 100%);
      z-index: 2;
    }

    /* Contenu principal — ajusté pour une page A4 */
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 8px;
      padding: 2mm 0;
    }
    .content-top {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 6px;
    }
    .sections-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      flex: 1;
      align-items: start;
      max-height: 110mm;
    }
    .section-full { 
      grid-column: 1 / -1;
      margin: 4px 0;
    }
    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 110px;
      gap: 10px;
      align-items: start;
      margin-top: 6px;
      max-height: 35mm;
    }

    /* ——— EN-TÊTE ÉQUILIBRÉ ——— */
    .header {
      display: grid;
      grid-template-columns: 1fr 50px 1fr;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      padding-bottom: 4px;
    }
    .hdr {
      font-family: 'EB Garamond', serif;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      line-height: 1.4;
      color: #2a2a2a;
      letter-spacing: 0.2px;
    }
    .hdr .accent {
      color: #006b3f;
      font-size: 11pt;
      letter-spacing: 0.5px;
    }
    .hdr-right { text-align: right; }
    .emblem-wrap {
      width: 50px; height: 50px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
    }
    .emblem-wrap svg { width: 100%; height: 100%; }

    /* ——— FILET SOUS EN-TÊTE ——— */
    .header-rule {
      height: 0.5px;
      background: linear-gradient(90deg, transparent 0%, #b8860b 15%, #b8860b 85%, transparent 100%);
      margin-bottom: 2px;
    }

    /* ——— TITRE PRÉPONDÉRANT ——— */
    .title-section {
      text-align: center;
      margin: 12px 0 16px;
      padding: 12px 0;
    }
    .title {
      font-family: 'Cinzel', serif;
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #0b4b2f;
      padding: 12px 24px 16px;
      display: inline-block;
      position: relative;
      line-height: 1.3;
      background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,240,220,0.85));
      border: 1.5px solid rgba(184, 134, 11, 0.6);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .title::before {
      content: '';
      position: absolute;
      top: 6px; left: 50%; transform: translateX(-50%);
      width: 100px; height: 1px;
      background: #b8860b;
    }
    .title::after {
      content: '';
      position: absolute;
      bottom: 6px; left: 50%; transform: translateX(-50%);
      width: 100px; height: 1px;
      background: #b8860b;
    }

    /* ——— RÉFÉRENCE CENTRÉE ——— */
    .ref-line {
      text-align: center;
      margin: 8px 0 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ref-box {
      font-family: 'Cinzel', serif;
      font-size: 12pt;
      font-weight: 700;
      color: #b8860b;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border: 1.5px solid #b8860b;
      background: rgba(184, 134, 11, 0.1);
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(184, 134, 11, 0.2);
    }
    .ref-meta {
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.6px;
      color: #555;
      text-transform: uppercase;
    }

    /* ——— BASE LÉGALE AGRANDIE ——— */
    .legal {
      font-size: 8pt;
      text-align: center;
      color: #555;
      margin: 6px 0 8px;
      line-height: 1.3;
      padding: 4px 12px;
      border-top: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
      background: rgba(0, 107, 63, 0.03);
      border-radius: 4px;
    }

    /* ——— DÉCLARATION AGRANDIE ——— */
    .declaration {
      font-size: 11pt;
      line-height: 1.5;
      text-align: justify;
      margin: 6px 0 8px;
      padding: 8px 8px 8px 12px;
      border-left: 3px solid #006b3f;
      color: #222;
      background: rgba(0, 107, 63, 0.03);
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }

    /* ——— TABLEAUX DE CHAMPS ——— */
    .section {
      margin: 0;
      padding: 8px 8px 10px;
      border: 0.5px solid #e5e7eb;
      border-radius: 10px;
      background: #fcfcfb;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      padding-bottom: 2px;
      border-bottom: 0.75px solid #006b3f;
    }
    .section-numeral {
      font-family: 'Cinzel', serif;
      font-size: 8pt;
      font-weight: 700;
      color: #b8860b;
    }
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #006b3f;
    }

    /* Tableau structuré */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .data-table td {
      padding: 2.5px 4px;
      vertical-align: middle;
    }
    .data-table .label {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      width: 35%;
      border: 0.5px solid #d4d4d4;
      background: rgba(0, 107, 63, 0.03);
    }
    .data-table .value {
      color: #111;
      border: 0.5px solid #d4d4d4;
      border-left: none;
    }

    /* ——— CODE-BARRES ——— */
    .barcode-section {
      text-align: center;
      margin: 3px 0;
    }
    .barcode-section svg { height: 30px; }

    /* ——— ZONE DE SIGNATURE AGRANDIE ——— */
    .signature-zone {
      display: flex;
      justify-content: center;
      align-items: stretch;
      gap: 8px;
      margin: 0;
      min-height: 100px;
    }
    .sig-frame {
      border: 1.5px solid #b8860b;
      padding: 10px 10px 12px;
      background: rgba(184, 134, 11, 0.08);
      min-width: 160px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      justify-content: space-between;
      width: 100%;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(184, 134, 11, 0.15);
    }
    .sig-frame-title {
      font-family: 'Cinzel', serif;
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #b8860b;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e0d5b5;
      width: 100%;
    }
    .sig-frame-name {
      font-size: 9pt;
      font-weight: 600;
      color: #006b3f;
      text-transform: uppercase;
      margin-bottom: 8px;
      flex-shrink: 0;
      line-height: 1.2;
      width: 100%;
    }
    .sig-frame-line {
      border-top: 1px solid #999;
      margin-top: auto;
      padding-top: 4px;
      font-size: 6pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      flex-shrink: 0;
      width: 100%;
    }

    /* ——— ZONE DE SÉCURITÉ AGRANDIE ——— */
    .validation-area {
      display: block;
      margin: 0;
    }
    .security-footer {
      position: relative;
      margin: 0;
      border: 1.5px solid #d4d4d4;
      padding: 8px 8px 8px;
      background: rgba(0, 107, 63, 0.06);
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      border-radius: 8px;
      font-size: 7pt;
      min-height: 100px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .sec-qr {
      width: 80px; height: 80px;
      border: 2px solid #ccc;
      padding: 3px;
      background: #fff;
      border-radius: 4px;
      margin-bottom: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .sec-qr img { width: 100%; height: 100%; object-fit: contain; }
    .sec-left {
      display: flex;
      flex-direction: column;
      gap: 3px;
      text-align: center;
      width: 100%;
    }
    .sec-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .sec-control-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #006b3f;
      flex-shrink: 0;
    }
    .sec-control-value {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      font-weight: 700;
      color: #006b3f;
      letter-spacing: 0.4px;
    }
    .sec-hash {
      font-size: 6pt;
      color: #666;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      line-height: 1.2;
      margin-top: 2px;
    }
    .sec-url {
      font-size: 6pt;
      color: #006b3f;
      margin-top: 2px;
    }
    .sec-url a {
      color: #006b3f;
      text-decoration: none;
    }

    /* ——— MENTIONS LÉGALES ——— */
    .legal-notice {
      position: relative;
      margin-top: 4px;
      font-size: 7pt;
      color: #777;
      text-align: center;
      font-style: italic;
      letter-spacing: 0.2px;
      line-height: 1.2;
      padding: 4px 8px;
      border-top: 1px solid #eee;
      background: rgba(0,0,0,0.01);
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Barre d'identification -->
  <div class="id-bar"></div>

  <!-- Coins discrets -->
  <div class="corner corner-tl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M3 27 L3 3 L27 3" stroke="#b8860b" stroke-width="1" fill="none" opacity="0.6"/><circle cx="3" cy="3" r="2" fill="#b8860b" opacity="0.6"/></svg></div>
  <div class="corner corner-tr"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M3 27 L3 3 L27 3" stroke="#b8860b" stroke-width="1" fill="none" opacity="0.6"/><circle cx="3" cy="3" r="2" fill="#b8860b" opacity="0.6"/></svg></div>
  <div class="corner corner-bl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M3 27 L3 3 L27 3" stroke="#b8860b" stroke-width="1" fill="none" opacity="0.6"/><circle cx="3" cy="3" r="2" fill="#b8860b" opacity="0.6"/></svg></div>
  <div class="corner corner-br"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path d="M3 27 L3 3 L27 3" stroke="#b8860b" stroke-width="1" fill="none" opacity="0.6"/><circle cx="3" cy="3" r="2" fill="#b8860b" opacity="0.6"/></svg></div>

  <!-- Filigrane -->
  <div class="watermark">GNAMBA</div>

  <!-- Contenu principal -->
  <div class="content">
    <div class="content-top">

    <!-- EN-TÊTE -->
    <div class="header">
      <div class="hdr">
        ${region ? `<span class="accent">RÉGION ${region.toUpperCase()}</span><br>` : 'RÉGION<br>'}
        Département de ${departement || '—'}<br>
        Commune de ${commune || '—'}<br>
        <strong>VILLAGE ${villageNom.toUpperCase()}</strong>
      </div>
      <div class="emblem-wrap">
        ${villageLogoUrl
          ? `<img src="${villageLogoUrl}" alt="" style="width:100%;height:100%;object-fit:contain;" />`
          : logoUrl
            ? `<img src="${logoUrl}" alt="" style="width:100%;height:100%;object-fit:contain;" />`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#b8860b" stroke-width="2"/>
                <rect x="15" y="20" width="22" height="35" fill="#f77f00" rx="1"/>
                <rect x="39" y="20" width="22" height="35" fill="#fff" rx="1"/>
                <rect x="63" y="20" width="22" height="35" fill="#009e60" rx="1"/>
                <text x="50" y="72" text-anchor="middle" font-family="serif" font-size="9" fill="#006b3f" font-weight="bold">RÉPUBLIQUE</text>
                <text x="50" y="83" text-anchor="middle" font-family="serif" font-size="6" fill="#666">CÔTE D'IVOIRE</text>
               </svg>`
        }
      </div>
      <div class="hdr hdr-right">
        RÉPUBLIQUE DE CÔTE D'IVOIRE<br>
        <span style="color:#006b3f; font-size:8.5pt;">Union – Discipline – Travail</span>
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- TITRE -->
    <div class="title-section">
      <div class="title">${documentTitle}</div>
    </div>

    <!-- RÉFÉRENCE -->
    <div class="ref-line">
      <span class="ref-box">N° ${reference}</span>
    </div>

    <!-- BASE LÉGALE -->
    <div class="legal">
      Loi n° 98-750 du 23 décembre 1998 relative au domaine foncier rural —
      Décret n° 2019-361 du 15 mai 2019 relatif à la constatation des droits fonciers coutumiers
    </div>

    <!-- DÉCLARATION -->
    <div class="declaration">
      Nous, soussigné, <strong>${chefNom}</strong>, Chef Coutumier du Village de <strong>${villageNom.toUpperCase()}</strong>,
      attestons solennellement que les droits fonciers coutumiers afférents à la parcelle désignée ci-après sont détenus par :
    </div>

    </div><!-- fin .content-top -->

    <div class="sections-group">

    <!-- I. IDENTITÉ DU DÉTENTEUR -->
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">I.</span>
        <span class="section-title">Identité du détenteur</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Nom & Prénoms</td>
          <td class="value">${proprietairePrenom} ${proprietaireNom}</td>
        </tr>
        <tr>
          <td class="label">Date & Lieu de naissance</td>
          <td class="value">${naissanceDate || '—'} à ${naissanceLieu || '—'}</td>
        </tr>
        ${proprietaireProfession ? `<tr>
          <td class="label">Profession</td>
          <td class="value">${proprietaireProfession}</td>
        </tr>` : ''}
        <tr>
          <td class="label">CNI N°</td>
          <td class="value">${cniNumero || '—'}${cniDate ? ` — Délivrée le ${cniDate} à ${cniLieu}` : ''}</td>
        </tr>
        <tr>
          <td class="label">Domicile</td>
          <td class="value">${proprietaireDomicile || '—'}</td>
        </tr>
        ${telephone ? `<tr>
          <td class="label">Téléphone</td>
          <td class="value">${telephone}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- II. CESSION (si applicable) -->
    ${isCession ? `
    <div class="section section-full">
      <div class="section-header">
        <span class="section-numeral">II.</span>
        <span class="section-title">Informations de cession</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Cédant</td>
          <td class="value">${cedantPrenom} ${cedantNom}${cedantCni ? ` — CNI ${cedantCni}` : ''}</td>
        </tr>
        ${dateCession ? `<tr>
          <td class="label">Date de cession</td>
          <td class="value">${dateCession}</td>
        </tr>` : ''}
      </table>
    </div>
    ` : ''}

    <!-- III. DESCRIPTION DE LA PARCELLE -->
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">${isCession ? 'III' : 'II'}.</span>
        <span class="section-title">Description de la parcelle</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Lot N°</td>
          <td class="value">${numeroLot}</td>
          <td class="label" style="width:25%;">Superficie</td>
          <td class="value">${superficie} m²</td>
        </tr>
        ${quartier ? `<tr>
          <td class="label">Quartier</td>
          <td class="value">${quartier}</td>
          <td class="label">Lotissement</td>
          <td class="value">${lotissement || '—'}</td>
        </tr>` : `<tr>
          <td class="label">Lotissement</td>
          <td class="value" colspan="3">${lotissement || '—'}</td>
        </tr>`}
        <tr>
          <td class="label">Village</td>
          <td class="value" colspan="3">${villageNom.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <!-- CODE-BARRES -->
    ${barcodeSvg ? `<div class="barcode-section section-full">${barcodeSvg}</div>` : ''}

    </div><!-- fin .sections-group -->

    <!-- IV. SIGNATURE & DATE -->
    <div class="bottom-row">
      <div class="section">
        <div class="section-header">
          <span class="section-numeral">${isCession ? 'IV' : 'III'}.</span>
          <span class="section-title">Validation</span>
        </div>
        <div class="signature-zone">
          <div class="sig-frame">
            <div class="sig-frame-title">Chef du Village</div>
            <div class="sig-frame-name">${chefNom || '—'}</div>
            <div class="sig-frame-line">Signature & Cachet</div>
          </div>
        </div>
      </div>

      <div class="security-footer">
        ${qrDataUrl ? `<div class="sec-qr"><img src="${qrDataUrl}" alt="QR Code de vérification" /></div>` : ''}
        <div class="sec-left">
          ${controlNumber ? `<div class="sec-control">
            <span class="sec-control-label">N°</span>
            <span class="sec-control-value">${controlNumber}</span>
          </div>` : ''}
          ${hashSha256 ? `<div class="sec-hash">${hashSha256.substring(0, 24)}...</div>` : ''}
          ${verificationUrl ? `<div class="sec-url"><a href="${verificationUrl}">Vérifier en ligne</a></div>` : ''}
        </div>
      </div>
    </div>

    <div class="legal-notice">
      La présente attestation ne vaut pas titre de propriété foncier —
      Elle constitue une présomption simple de possession coutumière
    </div>

  </div><!-- fin .content -->
</div>
</body>
</html>`;

  return html;
}


export function printAttestationCoutumiere(data: AttestationCoutumiereData) {
  const html = buildAttestationCoutumiereHTML(data);
  openPrintWindow(html);
}

/**
 * Impression de l'ANNEXE TECHNIQUE d'une attestation
 * Contient : GPS, limites, témoins — données facultatives exclues du document officiel
 * À imprimer séparément, au besoin, si les données existent.
 */
export function printAttestationAnnex(data: AttestationCoutumiereData) {
  const hasLimites = data.limites && (data.limites.nord || data.limites.sud || data.limites.est || data.limites.ouest);
  const hasGps = data.coordonnees_gps && (data.coordonnees_gps.lat != null || data.coordonnees_gps.lng != null);
  const hasGpsPoints = data.gps_points && data.gps_points.length > 0;
  const temoins = (data.temoins || []).filter(t => t.nom || t.prenom);
  const hasTemoins = temoins.length > 0;

  if (!hasLimites && !hasGps && !hasGpsPoints && !hasTemoins) {
    alert('Aucune donnée technique (GPS, limites, témoins) disponible pour cette attestation.');
    return;
  }

  const reference = safeText(data.reference);
  const numeroEnregistrement = safeText(data.numero_enregistrement);
  const proprietairePrenom = safeUpper(data.proprietaire_prenom);
  const proprietaireNom = safeUpper(data.proprietaire_nom);
  const villageRaw = safeText(data.village);
  const villageNom = villageRaw.replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, '').trim();
  const numeroLot = safeText(data.numero_lot);
  const lotissement = safeText(data.lotissement);
  const superficieM2 = Number.isFinite(data.superficie_m2) ? data.superficie_m2 : 0;
  const dateEtablissement = safeText(data.date_etablissement);

  const limites = data.limites || { nord: '', sud: '', est: '', ouest: '' };
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
  ${hasLimites ? `
  <div class="section">
    <div class="section-title">Limites de la parcelle</div>
    ${limites.nord ? `<div class="field-row"><span class="field-label">Nord :</span><span class="field-value">${safeText(limites.nord)}</span></div>` : ''}
    ${limites.sud ? `<div class="field-row"><span class="field-label">Sud :</span><span class="field-value">${safeText(limites.sud)}</span></div>` : ''}
    ${limites.est ? `<div class="field-row"><span class="field-label">Est :</span><span class="field-value">${safeText(limites.est)}</span></div>` : ''}
    ${limites.ouest ? `<div class="field-row"><span class="field-label">Ouest :</span><span class="field-value">${safeText(limites.ouest)}</span></div>` : ''}
  </div>
  ` : ''}

  <!-- COORDONNÉES GPS -->
  ${hasGps ? `
  <div class="section">
    <div class="section-title">Coordonnées GPS centrales</div>
    <div class="field-row"><span class="field-label">Latitude :</span><span class="field-value">${gps?.lat ?? '—'}</span></div>
    <div class="field-row"><span class="field-label">Longitude :</span><span class="field-value">${gps?.lng ?? '—'}</span></div>
    ${gps?.precision ? `<div class="field-row"><span class="field-label">Précision :</span><span class="field-value">${gps.precision} m</span></div>` : ''}
  </div>
  ` : ''}

  <!-- GPS DES LIMITES -->
  ${hasGpsPoints ? `
  <div class="section">
    <div class="section-title">Coordonnées GPS des sommets</div>
    <table>
      <thead>
        <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
      </thead>
      <tbody>
        ${(data.gps_points || []).map((p, i) => `
          <tr>
            <td>${safeText(p.label || `Point ${i + 1}`)}</td>
            <td>${p.lat}</td>
            <td>${p.lng}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- PRIX DE CESSION (confidentiel — uniquement en annexe) -->
  ${typeof data.prix_cession === 'number' && data.prix_cession > 0 ? `
  <div class="section">
    <div class="section-title">Prix de cession (confidentiel)</div>
    <div class="field-row"><span class="field-label">Montant :</span><span class="field-value">${data.prix_cession.toLocaleString('fr-FR')} FCFA</span></div>
    <div class="text" style="font-size:7.5pt;color:#999;font-style:italic;margin-top:4px;">Ce montant est strictement confidentiel et ne figure pas sur l'attestation officielle.</div>
  </div>
  ` : ''}

  <!-- TÉMOINS -->
  ${hasTemoins ? `
  <div class="section">
    <div class="section-title">Témoins (${temoins.length})</div>
    <table>
      <thead>
        <tr><th>#</th><th>Nom & Prénoms</th><th>Profession</th><th>Téléphone</th><th>CNI</th></tr>
      </thead>
      <tbody>
        ${temoins.map((t, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${safeUpper(t.prenom)} ${safeUpper(t.nom)}</td>
            <td>${safeText(t.profession || '—')}</td>
            <td>${safeText(t.telephone || '—')}</td>
            <td>${safeText(t.cni || '—')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="notice">
    Cette annexe technique est un document complémentaire à l'attestation officielle.
    Elle ne peut pas être utilisée seule comme preuve de propriété coutumière.
    Générée le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
  </div>

</div>
</body>
</html>`;

  openPrintWindow(html);
}

export function printQuittance(data: QuittanceData) {
  const modeLabels: Record<string, string> = {
    virement: 'Virement bancaire', especes: 'Espèces',
    mobile_money: 'Mobile Money', cheque: 'Chèque',
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const locatairePrenom = safeText(data.locataire_prenom);
  const locataireNom = safeText(data.locataire_nom);
  const bienAdresse = safeText(data.bien_adresse);
  const moisConcerne = safeText(data.mois_concerne);
  const modePaiement = safeText(modeLabels[data.mode_paiement] || data.mode_paiement);
  const datePaiement = safeText(data.date_paiement);
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString('fr-FR'));

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
    virement: 'Virement bancaire', especes: 'Espèces',
    mobile_money: 'Mobile Money', cheque: 'Chèque',
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const locatairePrenom = safeText(data.locataire_prenom);
  const locataireNom = safeText(data.locataire_nom);
  const bienAdresse = safeText(data.bien_adresse);
  const moisConcerne = safeText(data.mois_concerne);
  const modePaiement = safeText(modeLabels[data.mode_paiement] || data.mode_paiement);
  const datePaiement = safeText(data.date_paiement);
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString('fr-FR'));

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
    virement: 'Virement bancaire', especes: 'Espèces',
    mobile_money: 'Mobile Money', cheque: 'Chèque',
  };
  const reference = safeText(data.reference);
  const appName = safeText(data.appName);
  const appCompany = safeText(data.appCompany);
  const logoUrl = safeUrl(data.logoUrl);
  const dateTransaction = safeText(data.date_transaction);
  const clientNom = safeText(data.client_nom);
  const description = safeText(data.description || data.categorie);
  const categorie = safeText(data.categorie);
  const modePaiement = safeText(modeLabels[data.mode_paiement] || data.mode_paiement);
  const montantValue = Number.isFinite(data.montant) ? data.montant : 0;
  const montantLabel = safeText(montantValue.toLocaleString('fr-FR'));

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
  const rows = (data.rows || []).map(row => ({
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
      ${logoUrl ? `<img src="${logoUrl}" style="width:50px;height:50px;object-fit:contain;" />` : ''}
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
        ${rows.map(row => `
          <tr>
            <td>${row.date}</td>
            <td>${row.action}</td>
            <td>${row.user}</td>
            <td>${row.reference}</td>
            <td>${row.village}</td>
            <td>${row.details}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

function openPrintWindow(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Veuillez autoriser les fenêtres popup pour imprimer.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 800);
}

