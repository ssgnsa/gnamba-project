function e(e){let t=new Date;return`${e}-${t.getFullYear()}${String(t.getMonth()+1).padStart(2,`0`)}${String(t.getDate()).padStart(2,`0`)}-${Math.floor(1e3+Math.random()*9e3)}`}function t(){let e=new Date;return`FONC-${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}-${Math.floor(1e4+Math.random()*9e4)}`}function n(e){return e?new Date(e).toLocaleDateString(`fr-FR`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):``}function r(e){return e?new Date(e).toLocaleDateString(`fr-FR`,{day:`2-digit`,month:`long`,year:`numeric`}):new Date().toLocaleDateString(`fr-FR`,{day:`2-digit`,month:`long`,year:`numeric`})}function i(e){return e.toLocaleString(`fr-FR`)}function a(e){let t=e.trim();if(!t)return!0;let n=/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(t);if(!n)return!1;let[,r,i,a]=n,o=`${a}-${i}-${r}`,s=new Date(o);return Number.isNaN(s.getTime())?!1:s.getUTCFullYear()===Number(a)&&s.getUTCMonth()+1===Number(i)&&s.getUTCDate()===Number(r)}function o(e){let t=e.replace(/\s/g,``).replace(`,`,`.`);if(!t)return null;let n=Number(t);return Number.isFinite(n)?n:null}function s(e){return e.trim()}function c(){if(typeof crypto<`u`&&`randomUUID`in crypto)try{return crypto.randomUUID()}catch{}let e=`0123456789abcdef`,t=``;for(let n=0;n<36;n++)n===8||n===13||n===18||n===23?t+=`-`:n===14?t+=`4`:n===19?t+=e[Math.floor(Math.random()*4)+8]:t+=e[Math.floor(Math.random()*16)];return t}async function l(e){if(typeof crypto>`u`||!crypto.subtle)return``;let t=new TextEncoder().encode(e),n=await crypto.subtle.digest(`SHA-256`,t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}var u=`
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
`,d=e=>e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`),f=e=>d(String(e??``)),p=e=>d(String(e??``).toUpperCase()),m=e=>{if(!e)return``;try{let t=typeof window<`u`&&window.location?window.location.origin:`http://localhost`,n=new URL(e,t);if(n.protocol===`data:`)return e.trim().toLowerCase().startsWith(`data:image/`)?e:``;if([`http:`,`https:`].includes(n.protocol))return n.toString()}catch{return``}return``},h={0:`nnwwn`,1:`wnnnw`,2:`nwnnw`,3:`wwnnn`,4:`nnwnw`,5:`wnwnn`,6:`nwwnn`,7:`nnnww`,8:`wnnwn`,9:`nwnwn`},g=e=>{let t=String(e||``).replace(/\D/g,``);if(!t)return``;let n=t.length%2==0?t:`0${t}`,r=0,i=[],a=e=>{i.push(`<rect x="${r}" y="0" width="${e}" height="46" />`),r+=e},o=e=>{r+=e},s=e=>e===`w`?6:2;[`n`,`n`,`n`,`n`].forEach((e,t)=>{let n=s(e);t%2==0?a(n):o(n)});for(let e=0;e<n.length;e+=2){let t=h[n[e]],r=h[n[e+1]];for(let e=0;e<5;e+=1)a(s(t[e])),o(s(r[e]))}[`w`,`n`,`n`].forEach((e,t)=>{let n=s(e);t%2==0?a(n):o(n)});let c=r;return`<svg class="barcode-svg" xmlns="http://www.w3.org/2000/svg" width="${c}" height="46" viewBox="0 0 ${c} 46" role="img" aria-label="Code barre">${i.join(``)}</svg>`};function _(e){let t=f(e.reference),n=f(e.numero_enregistrement),r=f(e.region),i=f(e.departement),a=f(e.commune),o=f(e.village),s=f(e.quartier),c=f(e.lotissement),l=f(e.numero_lot),d=f(Number.isFinite(e.superficie_m2)?e.superficie_m2:0),h=p(e.proprietaire_nom),_=p(e.proprietaire_prenom),v=f(e.proprietaire_naissance_date),y=f(e.proprietaire_naissance_lieu),b=f(e.proprietaire_domicile),x=f(e.proprietaire_profession),S=f(e.proprietaire_cni_numero),C=f(e.proprietaire_cni_date),w=f(e.proprietaire_cni_lieu),T=f(e.proprietaire_telephone),E=p(e.chef_nom||e.validation_chef_nom||e.chef_village),D=m(e.logoUrl),O=m(e.village_logo_url),k=String(e.attestation_type||``).toLowerCase(),A=typeof e.prix_cession==`number`&&Number.isFinite(e.prix_cession)&&e.prix_cession>0,j=!!(e.cedant_nom||e.cedant_prenom||e.cedant_cni_numero),M=!!e.date_cession||A,N=k===`cession`||j||M,P=N?`ATTESTATION DE CESSION DE DROITS COUTUMIERS`:`ATTESTATION DE PROPRIÉTÉ VILLAGEOISE`,F=p(e.cedant_nom||``),I=p(e.cedant_prenom||``),L=f(e.cedant_cni_numero||``),R=f(e.date_cession||``),z=e.code_barre?g(String(e.code_barre).replace(/\s/g,``).toUpperCase()):``,B=m(e.qrDataUrl),V=f(e.hash_sha256),H=f(e.control_number),U=f(e.verification_url),W=f(e.mode_acquisition),G=f(e.registre_volume),K=e.registre_page==null?``:String(e.registre_page),q=e.registre_ligne==null?``:String(e.registre_ligne),J=e.original?`ORIGINAL`:`COPIE`;return`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${P} – ${t}</title>
  ${u}
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; background: #fff; margin: 0; padding: 0; }
    .page { max-width: 180mm; margin: 0 auto; padding: 10mm; position: relative; }
    /* Border double élégante */
    .page::before {
      content: '';
      position: absolute;
      inset: 5mm;
      border: 2px solid #0b5a2a;
      pointer-events: none;
    }
    .page::after {
      content: '';
      position: absolute;
      inset: 7mm;
      border: 1px solid #d97706;
      pointer-events: none;
    }
    .header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0b5a2a;
      margin-bottom: 12px;
    }
    .header-left { font-size: 9.5pt; font-weight: bold; text-transform: uppercase; line-height: 1.5; }
    .header-center { text-align: center; }
    .header-center img { height: 55px; object-fit: contain; }
    .header-right { text-align: right; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; line-height: 1.5; }
    .title {
      text-align: center;
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #0b5a2a;
      border: 2px double #0b5a2a;
      display: inline-block;
      padding: 6px 18px;
      margin: 10px auto;
    }
    .title-wrap { text-align: center; }
    .ref-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0 12px;
      font-size: 9pt;
    }
    .ref-box {
      border: 1px solid #000;
      padding: 3px 12px;
      font-weight: bold;
    }
    .badge-original {
      border: 1px solid #ef4444;
      color: #ef4444;
      font-size: 8pt;
      font-weight: bold;
      padding: 2px 6px;
    }
    .section { margin: 10px 0; }
    .section-title {
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #1f2937;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 2px;
      margin-bottom: 6px;
    }
    .field-row {
      display: flex;
      gap: 4px;
      margin: 4px 0;
      font-size: 10pt;
      line-height: 1.6;
    }
    .field-label { font-weight: bold; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px dotted #999; padding: 0 4px; }
    .declaration {
      font-size: 10pt;
      line-height: 1.7;
      text-align: justify;
      margin: 12px 0;
      padding: 8px 12px;
      border-left: 3px solid #0b5a2a;
      background: rgba(11, 90, 42, 0.03);
    }
    .legal {
      font-size: 8pt;
      text-align: center;
      color: #555;
      margin: 8px 0;
      line-height: 1.5;
    }
    .signature-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
      font-size: 9pt;
    }
    .sig-block { text-align: center; }
    .sig-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 4px;
      font-size: 8pt;
    }
    .security-footer {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }
    .security-text { font-size: 7pt; color: #666; line-height: 1.4; }
    .security-text code { font-size: 7pt; word-break: break-all; }
    .qr-code { width: 70px; height: 70px; }
    .qr-code img { width: 100%; height: 100%; }
    .barcode-wrap { text-align: center; margin: 4px 0; }
    .barcode-wrap svg { height: 36px; }
    .notice {
      font-size: 8pt;
      color: #666;
      text-align: center;
      margin-top: 15px;
      font-style: italic;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- EN-TÊTE -->
  <div class="header">
    <div class="header-left">
      ${r?`RÉGION ${r.toUpperCase()}`:`RÉGION`}<br>
      Département de ${i||`—`}<br>
      Commune de ${a||`—`}<br>
      Village de ${o.toUpperCase()}
    </div>
    <div class="header-center">
      ${O?`<img src="${O}" alt="Logo village" />`:D?`<img src="${D}" alt="Logo" />`:``}
    </div>
    <div class="header-right">
      RÉPUBLIQUE DE CÔTE D'IVOIRE<br>
      Union – Discipline – Travail
    </div>
  </div>

  <!-- TITRE -->
  <div class="title-wrap">
    <div class="title">${P}</div>
  </div>

  <!-- RÉFÉRENCE -->
  <div class="ref-line">
    <div class="ref-box">N° ${t}</div>
    <div>Enreg. : ${n||`—`}</div>
    <div class="badge-original">${J}</div>
  </div>

  <!-- BASE LÉGALE -->
  <div class="legal">
    Loi n° 98-750 du 23 décembre 1998 relative au domaine foncier rural.<br>
    Décret n° 2019-361 du 15 mai 2019 relatif à la constatation des droits fonciers coutumiers.
  </div>

  <!-- DÉCLARATION -->
  <div class="declaration">
    Nous, soussigné${N?`s`:``},
    ${N?`<strong>${I} ${F}</strong>, détenteur des droits coutumiers,`:`<strong>${E}</strong>, Chef du village de <strong>${o}</strong>,`}
    attestons ${N?`céder`:`que`} les droits coutumiers portant sur la parcelle décrite ci-après
    ${N?`au profit de <strong>${_} ${h}</strong>`.replace(`attestons céder`,`au profit du bénéficiaire`):`sont détenus par <strong>${_} ${h}</strong>`}.
  </div>

  <!-- IDENTITÉ DU BÉNÉFICIAIRE / DÉTENTEUR -->
  <div class="section">
    <div class="section-title">${N?`Bénéficiaire de la cession`:`Identité du détenteur`}</div>
    <div class="field-row"><span class="field-label">Nom & Prénoms :</span><span class="field-value">${_} ${h}</span></div>
    <div class="field-row"><span class="field-label">Né(e) le :</span><span class="field-value">${v} à ${y}</span></div>
    ${b?`<div class="field-row"><span class="field-label">Domicile :</span><span class="field-value">${b}</span></div>`:``}
    ${x?`<div class="field-row"><span class="field-label">Profession :</span><span class="field-value">${x}</span></div>`:``}
    <div class="field-row"><span class="field-label">CNI N° :</span><span class="field-value">${S}${C?` du ${C} à ${w}`:``}</span></div>
    ${T?`<div class="field-row"><span class="field-label">Téléphone :</span><span class="field-value">${T}</span></div>`:``}
  </div>

  <!-- CESSION (uniquement si cession) -->
  ${N?`
  <div class="section">
    <div class="section-title">Informations de cession</div>
    <div class="field-row"><span class="field-label">Cédant :</span><span class="field-value">${I} ${F}${L?` — CNI : ${L}`:``}</span></div>
    ${R?`<div class="field-row"><span class="field-label">Date de cession :</span><span class="field-value">${R}</span></div>`:``}
  </div>
  `:``}

  <!-- PARCELLE -->
  <div class="section">
    <div class="section-title">Description de la parcelle</div>
    <div class="field-row"><span class="field-label">Lotissement :</span><span class="field-value">${c||`—`}</span></div>
    <div class="field-row"><span class="field-label">N° Lot :</span><span class="field-value">${l}</span></div>
    <div class="field-row"><span class="field-label">Superficie :</span><span class="field-value">${d} m²</span></div>
    ${s?`<div class="field-row"><span class="field-label">Quartier :</span><span class="field-value">${s}</span></div>`:``}
    ${W?`<div class="field-row"><span class="field-label">Mode d'acquisition :</span><span class="field-value">${W}</span></div>`:``}
    ${G?`<div class="field-row"><span class="field-label">Registre :</span><span class="field-value">Vol. ${G}${K?`, p. ${K}`:``}${q?`, l. ${q}`:``}</span></div>`:``}
  </div>

  <!-- CODE-BARRES -->
  ${z?`
  <div class="barcode-wrap">${z}</div>
  `:``}

  <!-- SIGNATURES -->
  <div class="signature-zone">
    ${N?`
    <div class="sig-block">
      ${I&&F?`${I} ${F}`:`Le Cédant`}
      <div class="sig-line">Signature du Cédant</div>
    </div>
    `:`
    <div class="sig-block">
      ${E||`Chef du Village`}
      <div class="sig-line">Signature & Cachet du Chef</div>
    </div>
    `}
  </div>

  <!-- SÉCURITÉ -->
  <div class="security-footer">
    <div class="security-text">
      ${V?`<strong>Hash SHA-256 :</strong><br><code>${V}</code>`:``}
      ${H?`<br><strong>N° Contrôle :</strong> ${H}`:``}
      ${U?`<br><strong>Vérification :</strong> ${U}`:``}
    </div>
    ${B?`
    <div class="qr-code">
      <img src="${B}" alt="QR Code de vérification" />
    </div>
    `:``}
  </div>

  <div class="notice">
    La présente attestation ne vaut pas titre de propriété foncier. Elle constitue une présomption de possession coutumière
    et peut être produite devant les autorités compétentes en vue de l'obtention d'un titre foncier.
    ${N?` Document établi en double exemplaire — un original pour chaque partie.`:` Document établi en original.`}
  </div>

</div>
</body>
</html>`}function v(e){C(_(e))}function y(e){let t={virement:`Virement bancaire`,especes:`Espèces`,mobile_money:`Mobile Money`,cheque:`Chèque`},n=f(e.reference),r=f(e.appName),i=f(e.appCompany),a=m(e.logoUrl),o=f(e.locataire_prenom),s=f(e.locataire_nom),c=f(e.bien_adresse),l=f(e.mois_concerne),d=f(t[e.mode_paiement]||e.mode_paiement),p=f(e.date_paiement),h=f((Number.isFinite(e.montant)?e.montant:0).toLocaleString(`fr-FR`));C(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Quittance de Loyer – ${n}</title>
  ${u}
  <style>
    body { font-family: Arial, sans-serif; font-size: 9pt; }
    .page { width: 150mm; min-height: 80mm; margin: 0 auto; padding: 5mm; border: 2px solid #1e40af; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #1e40af; padding-bottom: 6px; }
    .company-name { font-size: 12pt; font-weight: bold; color: #1e40af; }
    .company-sub { font-size: 7pt; color: #555; margin-top: 1px; }
    .ref-date { text-align: right; font-size: 8pt; color: #555; }
    .doc-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; background: #1e40af; color: #fff; padding: 4px 8px; margin: 6px 0; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 6px 0; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 3px; padding: 4px 6px; }
    .info-box .label { font-size: 6pt; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 2px; }
    .info-box .value { font-size: 8pt; font-weight: bold; color: #222; }
    .amount-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 3px; padding: 6px 10px; text-align: center; margin: 6px 0; }
    .amount-label { font-size: 7pt; color: #555; text-transform: uppercase; }
    .amount-value { font-size: 14pt; font-weight: bold; color: #16a34a; margin: 2px 0; }
    .footer-text { font-size: 7pt; color: #555; text-align: center; margin-top: 8px; font-style: italic; }
    .signature-zone { display: flex; justify-content: space-between; margin-top: 10px; }
    .sig-block { text-align: center; width: 80px; }
    .sig-block .line { border-top: 1px solid #000; margin-top: 20px; padding-top: 3px; font-size: 7pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:6px;">
      ${a?`<img src="${a}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${i}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${n}</strong></div>
      <div>Date: ${p}</div>
    </div>
  </div>

  <div class="doc-title">Quittance de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${o} ${s}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${c}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${d}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant du Loyer Réglé</div>
    <div class="amount-value">${h} FCFA</div>
  </div>

  <div class="footer-text">
    Je soussigné, bailleur ou mandataire, reconnais avoir reçu la somme de
    <strong>${h} francs CFA</strong>
    de <strong>${o} ${s}</strong>
    au titre du loyer du mois de <strong>${l}</strong>
    pour le bien situé à <strong>${c}</strong>.
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
</html>`)}function b(e){let t={virement:`Virement bancaire`,especes:`Espèces`,mobile_money:`Mobile Money`,cheque:`Chèque`},n=f(e.reference),r=f(e.appName),i=f(e.appCompany),a=m(e.logoUrl),o=f(e.locataire_prenom),s=f(e.locataire_nom),c=f(e.bien_adresse),l=f(e.mois_concerne),d=f(t[e.mode_paiement]||e.mode_paiement),p=f(e.date_paiement),h=f((Number.isFinite(e.montant)?e.montant:0).toLocaleString(`fr-FR`));C(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement de Loyer – ${n}</title>
  ${u}
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    .page { width: 150mm; min-height: 90mm; margin: 0 auto; padding: 6mm; border: 2px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #334155; padding-bottom: 6px; }
    .company-name { font-size: 12pt; font-weight: bold; color: #334155; }
    .company-sub { font-size: 7pt; color: #555; margin-top: 1px; }
    .ref-date { text-align: right; font-size: 8pt; color: #555; }
    .doc-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; background: #334155; color: #fff; padding: 4px 8px; margin: 6px 0; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 6px 0; }
    .info-box { border: 1px solid #e2e8f0; border-radius: 3px; padding: 4px 6px; }
    .info-box .label { font-size: 6pt; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 2px; }
    .info-box .value { font-size: 8pt; font-weight: bold; color: #222; }
    .amount-box { background: #f8fafc; border: 2px solid #334155; border-radius: 3px; padding: 6px 10px; text-align: center; margin: 6px 0; }
    .amount-label { font-size: 7pt; color: #555; text-transform: uppercase; }
    .amount-value { font-size: 14pt; font-weight: bold; color: #334155; margin: 2px 0; }
    .footer-text { font-size: 7pt; color: #555; text-align: center; margin-top: 8px; font-style: italic; }
    .signature-zone { display: flex; justify-content: flex-end; margin-top: 12px; }
    .sig-block { text-align: center; width: 110px; }
    .sig-block .line { border-top: 1px solid #000; margin-top: 20px; padding-top: 3px; font-size: 7pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:6px;">
      ${a?`<img src="${a}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${i}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${n}</strong></div>
      <div>Date: ${p}</div>
    </div>
  </div>

  <div class="doc-title">Reçu de Paiement de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${o} ${s}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${c}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${d}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant Reçu</div>
    <div class="amount-value">${h} FCFA</div>
  </div>

  <div class="footer-text">
    Reçu établi pour la somme de <strong>${h} francs CFA</strong>
    versée par <strong>${o} ${s}</strong>
    au titre du loyer du mois de <strong>${l}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Signature</div>
    </div>
  </div>
</div>
</body>
</html>`)}function x(e){let t={virement:`Virement bancaire`,especes:`Espèces`,mobile_money:`Mobile Money`,cheque:`Chèque`},n=f(e.reference),r=f(e.appName),i=f(e.appCompany),a=m(e.logoUrl),o=f(e.date_transaction),s=f(e.client_nom),c=f(e.description||e.categorie),l=f(e.categorie),d=f(t[e.mode_paiement]||e.mode_paiement),p=f((Number.isFinite(e.montant)?e.montant:0).toLocaleString(`fr-FR`));C(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement – ${n}</title>
  ${u}
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; }
    .page { width: 148mm; min-height: 100mm; margin: 0 auto; padding: 8mm 10mm; border: 2px solid #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #334155; }
    .company-name { font-size: 14pt; font-weight: bold; color: #334155; }
    .company-sub { font-size: 8pt; color: #666; }
    .doc-title { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; border: 1px solid #334155; padding: 5px 20px; margin: 8px auto; width: fit-content; letter-spacing: 2px; }
    .ref-line { display: flex; justify-content: space-between; font-size: 9pt; color: #555; margin: 6px 0; }
    .info-row { display: flex; gap: 8px; margin: 6px 0; }
    .info-label { font-size: 9pt; color: #666; min-width: 100px; }
    .info-value { font-size: 9pt; font-weight: bold; color: #222; }
    .amount-row { background: #f8fafc; border: 1px solid #94a3b8; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
    .amount-label { font-size: 10pt; font-weight: bold; }
    .amount-value { font-size: 16pt; font-weight: bold; color: #1e40af; }
    .footer { font-size: 8pt; color: #888; text-align: center; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    .sig-row { display: flex; justify-content: flex-end; margin-top: 15px; }
    .sig-block { text-align: center; width: 100px; }
    .sig-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 3px; font-size: 7pt; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:10px;">
      ${a?`<img src="${a}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${i}</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;"><div class="doc-title">Reçu de Paiement</div></div>

  <div class="ref-line">
    <span>Réf: <strong>${n}</strong></span>
    <span>Date: ${o}</span>
  </div>

  <div class="info-row"><span class="info-label">Client/Bénéficiaire</span><span class="info-value">${s}</span></div>
  <div class="info-row"><span class="info-label">Objet</span><span class="info-value">${c}</span></div>
  <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${l}</span></div>
  <div class="info-row"><span class="info-label">Mode de paiement</span><span class="info-value">${d}</span></div>

  <div class="amount-row">
    <span class="amount-label">Montant Reçu</span>
    <span class="amount-value">${p} FCFA</span>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line">Signature</div>
    </div>
  </div>

  <div class="footer">Ce reçu est généré automatiquement par ${r} – ${i}</div>
</div>
</body>
</html>`)}function S(e){let t=f(e.title),n=f(e.generated_at),r=m(e.logoUrl),i=(e.rows||[]).map(e=>({date:f(e.date_action),action:f(e.action),user:f(e.utilisateur_nom),reference:f(e.parcelle_reference),village:f(e.village),details:f(e.details)}));C(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  ${u}
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
        <div class="title">${t}</div>
        <div class="meta">Généré le ${n}</div>
      </div>
      ${r?`<img src="${r}" style="width:50px;height:50px;object-fit:contain;" />`:``}
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
        ${i.map(e=>`
          <tr>
            <td>${e.date}</td>
            <td>${e.action}</td>
            <td>${e.user}</td>
            <td>${e.reference}</td>
            <td>${e.village}</td>
            <td>${e.details}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  </div>
</body>
</html>`)}function C(e){let t=window.open(``,`_blank`,`width=900,height=700`);if(!t){alert(`Veuillez autoriser les fenêtres popup pour imprimer.`);return}t.document.write(e),t.document.close(),t.focus(),setTimeout(()=>{t.print()},800)}export{b as a,r as c,e as d,c as f,l as h,x as i,i as l,o as m,S as n,s as o,a as p,y as r,n as s,v as t,t as u};