function J(e){const i=new Date;return`${e}-${i.getFullYear()}${String(i.getMonth()+1).padStart(2,"0")}${String(i.getDate()).padStart(2,"0")}-${Math.floor(1e3+Math.random()*9e3)}`}function Z(){const e=new Date;return`FONC-${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}-${Math.floor(1e4+Math.random()*9e4)}`}function K(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}):""}function ee(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}):new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}function te(e){return e.toLocaleString("fr-FR")}function ie(e){const i=e.trim();if(!i)return!0;const o=/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(i);if(!o)return!1;const[,r,d,n]=o,a=`${n}-${d}-${r}`,l=new Date(a);return Number.isNaN(l.getTime())?!1:l.getUTCFullYear()===Number(n)&&l.getUTCMonth()+1===Number(d)&&l.getUTCDate()===Number(r)}function oe(e){const i=e.replace(/\s/g,"").replace(",",".");if(!i)return null;const o=Number(i);return Number.isFinite(o)?o:null}function ne(e){return e.trim()}function se(){if(typeof crypto<"u"&&"randomUUID"in crypto)try{return crypto.randomUUID()}catch{}const e="0123456789abcdef";let i="";for(let o=0;o<36;o++)o===8||o===13||o===18||o===23?i+="-":o===14?i+="4":o===19?i+=e[Math.floor(Math.random()*4)+8]:i+=e[Math.floor(Math.random()*16)];return i}async function re(e){if(typeof crypto>"u"||!crypto.subtle)return"";const i=new TextEncoder().encode(e),o=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(o)).map(r=>r.toString(16).padStart(2,"0")).join("")}var $=`
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
`,V=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),t=e=>V(String(e??"")),h=e=>V(String(e??"").toUpperCase()),x=e=>{if(!e)return"";try{const i=typeof window<"u"&&window.location?window.location.origin:"http://localhost",o=new URL(e,i);if(o.protocol==="data:")return e.trim().toLowerCase().startsWith("data:image/")?e:"";if(["http:","https:"].includes(o.protocol))return o.toString()}catch{return""}return""},G={0:"nnwwn",1:"wnnnw",2:"nwnnw",3:"wwnnn",4:"nnwnw",5:"wnwnn",6:"nwwnn",7:"nnnww",8:"wnnwn",9:"nwnwn"},X=e=>{const i=String(e||"").replace(/\D/g,"");if(!i)return"";const o=i.length%2===0?i:`0${i}`,r=2,d=6,n=46;let a=0;const l=[],f=s=>{l.push(`<rect x="${a}" y="0" width="${s}" height="${n}" />`),a+=s},p=s=>{a+=s},g=s=>s==="w"?d:r;["n","n","n","n"].forEach((s,u)=>{const v=g(s);u%2===0?f(v):p(v)});for(let s=0;s<o.length;s+=2){const u=G[o[s]],v=G[o[s+1]];for(let c=0;c<5;c+=1)f(g(u[c])),p(g(v[c]))}["w","n","n"].forEach((s,u)=>{const v=g(s);u%2===0?f(v):p(v)});const b=a;return`<svg class="barcode-svg" xmlns="http://www.w3.org/2000/svg" width="${b}" height="${n}" viewBox="0 0 ${b} ${n}" role="img" aria-label="Code barre">${l.join("")}</svg>`};function W(e){const i=t(e.reference),o=t(e.region),r=t(e.departement),d=t(e.commune),n=t(e.village).replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i,"").trim(),a=t(e.quartier),l=t(e.lotissement),f=t(e.numero_lot),p=t(Number.isFinite(e.superficie_m2)?e.superficie_m2:0),g=h(e.proprietaire_nom),b=h(e.proprietaire_prenom),s=t(e.proprietaire_naissance_date),u=t(e.proprietaire_naissance_lieu),v=t(e.proprietaire_domicile),c=t(e.proprietaire_profession),w=t(e.proprietaire_cni_numero),m=t(e.proprietaire_cni_date),L=t(e.proprietaire_cni_lieu),T=t(e.proprietaire_telephone),N=h(e.chef_nom||e.validation_chef_nom||e.chef_village),I=x(e.logoUrl),R=x(e.village_logo_url),q=String(e.attestation_type||"").toLowerCase(),Y=typeof e.prix_cession=="number"&&Number.isFinite(e.prix_cession)&&e.prix_cession>0,H=!!(e.cedant_nom||e.cedant_prenom||e.cedant_cni_numero),Q=!!e.date_cession||Y,y=q==="cession"||H||Q,D=y?"ATTESTATION DE CESSION DE DROITS COUTUMIERS":"ATTESTATION DE PROPRIÉTÉ VILLAGEOISE",C=h(e.cedant_nom||""),z=h(e.cedant_prenom||""),S=t(e.cedant_cni_numero||""),A=t(e.date_cession||""),k=e.code_barre?X(String(e.code_barre).replace(/\s/g,"").toUpperCase()):"",P=x(e.qrDataUrl),U=t(e.hash_sha256),F=t(e.control_number),_=t(e.verification_url),M=t(e.registre_volume),O=e.registre_page!=null?String(e.registre_page):"",j=e.registre_ligne!=null?String(e.registre_ligne):"",B=e.original?"ORIGINAL":"COPIE";return`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${D} – ${i}</title>
  ${$}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600;700&display=swap');

    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 210mm; height: 297mm;
      margin: 0; padding: 0;
      font-family: 'EB Garamond', 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      color: #1a1a1a;
      background: #fff;
      overflow: hidden;
    }

    .page {
      width: 210mm; height: 297mm;
      position: relative;
      padding: 12mm 18mm 14mm 18mm;
      background: #fff;
    }

    /* ——— DOUBLE BORDURE AVEC ORNEMENTS ——— */
    .page::before {
      content: '';
      position: absolute;
      top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
      border: 2px solid #b8860b;
      pointer-events: none;
    }
    .page::after {
      content: '';
      position: absolute;
      top: 7mm; left: 7mm; right: 7mm; bottom: 7mm;
      border: 0.75px solid #8a8a8a;
      pointer-events: none;
    }

    /* Coins ornements */
    .corner { position: absolute; width: 12mm; height: 12mm; z-index: 1; }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 4mm; left: 4mm; }
    .corner-tr { top: 4mm; right: 4mm; transform: scaleX(-1); }
    .corner-bl { bottom: 4mm; left: 4mm; transform: scaleY(-1); }
    .corner-br { bottom: 4mm; right: 4mm; transform: scale(-1, -1); }

    /* ——— FILIGRANE ——— */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-family: 'Cinzel', serif;
      font-size: 72pt;
      font-weight: 700;
      color: rgba(180, 180, 180, 0.06);
      letter-spacing: 8px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    /* ——— BARRE TRICOLORE HAUT ——— */
    .tricolor-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4mm;
      display: flex;
      z-index: 2;
    }
    .tricolor-bar .stripe { flex: 1; }
    .tricolor-bar .orange { background: #f77f00; }
    .tricolor-bar .white { background: #fff; }
    .tricolor-bar .green { background: #009e60; }

    /* ——— BARRE TRICOLORE BAS ——— */
    .tricolor-bar-bottom {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3mm;
      display: flex;
      z-index: 2;
    }
    .tricolor-bar-bottom .stripe { flex: 1; }
    .tricolor-bar-bottom .orange { background: #f77f00; }
    .tricolor-bar-bottom .white { background: #fff; }
    .tricolor-bar-bottom .green { background: #009e60; }

    /* Contenu principal — au-dessus du filigrane */
    .content { position: relative; z-index: 1; }

    /* ——— EN-TÊTE ——— */
    .header {
      display: grid;
      grid-template-columns: 1fr 60px 1fr;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      padding-bottom: 4px;
    }
    .hdr {
      font-family: 'EB Garamond', serif;
      font-size: 10.5pt;
      font-weight: 600;
      text-transform: uppercase;
      line-height: 1.6;
      color: #2a2a2a;
      letter-spacing: 0.3px;
    }
    .hdr .accent {
      color: #006b3f;
      font-size: 10pt;
      letter-spacing: 0.6px;
    }
    .hdr-right { text-align: right; }
    .emblem-wrap {
      width: 60px; height: 60px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
    }
    .emblem-wrap svg { width: 100%; height: 100%; }

    /* ——— FILET SOUS EN-TÊTE ——— */
    .header-rule {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #b8860b 15%, #b8860b 85%, transparent 100%);
      margin-bottom: 4px;
    }

    /* ——— TITRE ——— */
    .title-section {
      text-align: center;
      margin: 6px 0 6px;
    }
    .title {
      font-family: 'Cinzel', serif;
      font-size: 17.5pt;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #006b3f;
      padding: 4px 20px 6px;
      display: inline-block;
      position: relative;
    }
    .title::before {
      content: '';
      position: absolute;
      top: 0; left: 50%; transform: translateX(-50%);
      width: 80px; height: 2px;
      background: #b8860b;
    }
    .title::after {
      content: '';
      position: absolute;
      bottom: 0; left: 50%; transform: translateX(-50%);
      width: 80px; height: 2px;
      background: #b8860b;
    }

    /* ——— RÉFÉRENCE ——— */
    .ref-line {
      text-align: center;
      margin: 4px 0 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
    }
    .ref-box {
      font-family: 'Cinzel', serif;
      font-size: 12pt;
      font-weight: 600;
      color: #b8860b;
      letter-spacing: 0.8px;
      padding: 2px 16px;
      border: 1px solid #b8860b;
      background: rgba(184, 134, 11, 0.04);
    }
    .original-badge {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 1px 6px;
      border: 1px solid #006b3f;
      color: #006b3f;
      background: rgba(0, 107, 63, 0.05);
    }

    /* ——— BASE LÉGALE ——— */
    .legal {
      font-size: 8.5pt;
      text-align: center;
      color: #555;
      margin: 4px 0 6px;
      line-height: 1.5;
      padding: 3px 20px;
      border-top: 0.5px solid #e0e0e0;
      border-bottom: 0.5px solid #e0e0e0;
      background: rgba(0, 107, 63, 0.02);
    }

    /* ——— DÉCLARATION ——— */
    .declaration {
      font-size: 11.5pt;
      line-height: 1.7;
      text-align: justify;
      margin: 6px 0;
      padding: 4px 0 4px 10px;
      border-left: 2.5px solid #006b3f;
      color: #2a2a2a;
    }

    /* ——— TABLEAUX DE CHAMPS ——— */
    .section {
      margin: 5px 0;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
      padding-bottom: 2px;
      border-bottom: 1px solid #006b3f;
    }
    .section-numeral {
      font-family: 'Cinzel', serif;
      font-size: 9pt;
      font-weight: 700;
      color: #b8860b;
    }
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #006b3f;
    }

    /* Tableau structuré */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11pt;
    }
    .data-table td {
      padding: 3px 6px;
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
      margin: 4px 0;
    }
    .barcode-section svg { height: 30px; }

    /* ——— ZONE DE SIGNATURE ENCADRÉE ——— */
    .signature-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8px 0 6px;
    }
    .sig-frame {
      border: 1px solid #b8860b;
      padding: 6px 8px;
      background: rgba(184, 134, 11, 0.02);
      min-height: 70px;
    }
    .sig-frame-title {
      font-family: 'Cinzel', serif;
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #b8860b;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 0.5px solid #e0d5b5;
    }
    .sig-frame-name {
      font-size: 11pt;
      font-weight: 600;
      color: #006b3f;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sig-frame-line {
      border-top: 0.5px solid #999;
      margin-top: 28px;
      padding-top: 2px;
      font-size: 7.5pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .date-frame {
      border: 1px solid #8a8a8a;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .date-frame-label {
      font-size: 8.5pt;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .date-frame-value {
      font-size: 11.5pt;
      font-weight: 600;
      color: #1a1a1a;
    }
    .date-frame-mention {
      font-size: 8pt;
      color: #888;
      font-style: italic;
      margin-top: 4px;
      line-height: 1.4;
    }

    /* ——— PIED DE PAGE SÉCURITÉ ——— */
    .security-footer {
      position: absolute;
      bottom: 14mm;
      left: 18mm; right: 18mm;
      border: 0.5px solid #d4d4d4;
      padding: 4px 6px;
      background: rgba(0, 107, 63, 0.015);
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .sec-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sec-control {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sec-control-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #006b3f;
    }
    .sec-control-value {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      font-weight: 700;
      color: #006b3f;
      letter-spacing: 0.6px;
    }
    .sec-hash {
      font-size: 6.5pt;
      color: #999;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      line-height: 1.3;
    }
    .sec-url {
      font-size: 7pt;
      color: #006b3f;
    }
    .sec-url a {
      color: #006b3f;
      text-decoration: none;
    }
    .sec-qr {
      width: 52px; height: 52px;
      border: 1px solid #ccc;
      padding: 2px;
      background: #fafafa;
    }
    .sec-qr img { width: 100%; height: 100%; object-fit: contain; }

    /* ——— MENTIONS LÉGALES ——— */
    .legal-notice {
      position: absolute;
      bottom: 10mm;
      left: 18mm; right: 18mm;
      font-size: 7.5pt;
      color: #888;
      text-align: center;
      font-style: italic;
      letter-spacing: 0.2px;
      line-height: 1.3;
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Barres tricolores -->
  <div class="tricolor-bar">
    <div class="stripe orange"></div>
    <div class="stripe white"></div>
    <div class="stripe green"></div>
  </div>
  <div class="tricolor-bar-bottom">
    <div class="stripe orange"></div>
    <div class="stripe white"></div>
    <div class="stripe green"></div>
  </div>

  <!-- Coins ornements -->
  <div class="corner corner-tl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M5 45 L5 5 L45 5" stroke="#b8860b" stroke-width="2" fill="none"/><circle cx="5" cy="5" r="3" fill="#b8860b"/><path d="M10 40 L10 10 L40 10" stroke="#b8860b" stroke-width="0.75" fill="none" opacity="0.5"/></svg></div>
  <div class="corner corner-tr"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M5 45 L5 5 L45 5" stroke="#b8860b" stroke-width="2" fill="none"/><circle cx="5" cy="5" r="3" fill="#b8860b"/><path d="M10 40 L10 10 L40 10" stroke="#b8860b" stroke-width="0.75" fill="none" opacity="0.5"/></svg></div>
  <div class="corner corner-bl"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M5 45 L5 5 L45 5" stroke="#b8860b" stroke-width="2" fill="none"/><circle cx="5" cy="5" r="3" fill="#b8860b"/><path d="M10 40 L10 10 L40 10" stroke="#b8860b" stroke-width="0.75" fill="none" opacity="0.5"/></svg></div>
  <div class="corner corner-br"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M5 45 L5 5 L45 5" stroke="#b8860b" stroke-width="2" fill="none"/><circle cx="5" cy="5" r="3" fill="#b8860b"/><path d="M10 40 L10 10 L40 10" stroke="#b8860b" stroke-width="0.75" fill="none" opacity="0.5"/></svg></div>

  <!-- Filigrane -->
  <div class="watermark">GNAMBA</div>

  <!-- Contenu principal -->
  <div class="content">

    <!-- EN-TÊTE -->
    <div class="header">
      <div class="hdr">
        ${o?`<span class="accent">RÉGION ${o.toUpperCase()}</span><br>`:"RÉGION<br>"}
        Département de ${r||"—"}<br>
        Commune de ${d||"—"}<br>
        <strong>VILLAGE ${n.toUpperCase()}</strong>
      </div>
      <div class="emblem-wrap">
        ${R?`<img src="${R}" alt="" style="width:100%;height:100%;object-fit:contain;" />`:I?`<img src="${I}" alt="" style="width:100%;height:100%;object-fit:contain;" />`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#b8860b" stroke-width="2"/>
                <rect x="15" y="20" width="22" height="35" fill="#f77f00" rx="1"/>
                <rect x="39" y="20" width="22" height="35" fill="#fff" rx="1"/>
                <rect x="63" y="20" width="22" height="35" fill="#009e60" rx="1"/>
                <text x="50" y="72" text-anchor="middle" font-family="serif" font-size="9" fill="#006b3f" font-weight="bold">RÉPUBLIQUE</text>
                <text x="50" y="83" text-anchor="middle" font-family="serif" font-size="6" fill="#666">CÔTE D'IVOIRE</text>
               </svg>`}
      </div>
      <div class="hdr hdr-right">
        RÉPUBLIQUE DE CÔTE D'IVOIRE<br>
        <span style="color:#006b3f; font-size:8.5pt;">Union – Discipline – Travail</span>
      </div>
    </div>

    <div class="header-rule"></div>

    <!-- TITRE -->
    <div class="title-section">
      <div class="title">${D}</div>
    </div>

    <!-- RÉFÉRENCE -->
    <div class="ref-line">
      <span class="ref-box">N° ${i}</span>
      ${B==="ORIGINAL"?`<span class="original-badge">${B}</span>`:""}
    </div>

    <!-- BASE LÉGALE -->
    <div class="legal">
      Loi n° 98-750 du 23 décembre 1998 relative au domaine foncier rural —
      Décret n° 2019-361 du 15 mai 2019 relatif à la constatation des droits fonciers coutumiers
    </div>

    <!-- DÉCLARATION -->
    <div class="declaration">
      Nous, soussigné, <strong>${N}</strong>, Chef Coutumier du Village de <strong>${n.toUpperCase()}</strong>,
      attestons solennellement que les droits fonciers coutumiers afférents à la parcelle désignée ci-après sont détenus par :
    </div>

    <!-- I. IDENTITÉ DU DÉTENTEUR -->
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">I.</span>
        <span class="section-title">Identité du détenteur</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Nom & Prénoms</td>
          <td class="value">${b} ${g}</td>
        </tr>
        <tr>
          <td class="label">Date & Lieu de naissance</td>
          <td class="value">${s||"—"} à ${u||"—"}</td>
        </tr>
        ${c?`<tr>
          <td class="label">Profession</td>
          <td class="value">${c}</td>
        </tr>`:""}
        <tr>
          <td class="label">CNI N°</td>
          <td class="value">${w||"—"}${m?` — Délivrée le ${m} à ${L}`:""}</td>
        </tr>
        <tr>
          <td class="label">Domicile</td>
          <td class="value">${v||"—"}</td>
        </tr>
        ${T?`<tr>
          <td class="label">Téléphone</td>
          <td class="value">${T}</td>
        </tr>`:""}
      </table>
    </div>

    <!-- II. CESSION (si applicable) -->
    ${y?`
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">II.</span>
        <span class="section-title">Informations de cession</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Cédant</td>
          <td class="value">${z} ${C}${S?` — CNI ${S}`:""}</td>
        </tr>
        ${A?`<tr>
          <td class="label">Date de cession</td>
          <td class="value">${A}</td>
        </tr>`:""}
      </table>
    </div>
    `:""}

    <!-- III. DESCRIPTION DE LA PARCELLE -->
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">${y?"III":"II"}.</span>
        <span class="section-title">Description de la parcelle</span>
      </div>
      <table class="data-table">
        <tr>
          <td class="label">Lot N°</td>
          <td class="value">${f}</td>
          <td class="label" style="width:25%;">Superficie</td>
          <td class="value">${p} m²</td>
        </tr>
        ${a?`<tr>
          <td class="label">Quartier</td>
          <td class="value">${a}</td>
          <td class="label">Lotissement</td>
          <td class="value">${l||"—"}</td>
        </tr>`:`<tr>
          <td class="label">Lotissement</td>
          <td class="value" colspan="3">${l||"—"}</td>
        </tr>`}
        <tr>
          <td class="label">Village</td>
          <td class="value" colspan="3">${n.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <!-- CODE-BARRES -->
    ${k?`<div class="barcode-section">${k}</div>`:""}

    <!-- IV. SIGNATURE & DATE -->
    <div class="section">
      <div class="section-header">
        <span class="section-numeral">${y?"IV":"III"}.</span>
        <span class="section-title">Validation</span>
      </div>
      <div class="signature-zone">
        <div class="sig-frame">
          <div class="sig-frame-title">${y?"Le Cédant":"Chef du Village"}</div>
          <div class="sig-frame-name">${y?z&&C?`${z} ${C}`:"—":N||"—"}</div>
          <div class="sig-frame-line">Signature & Cachet</div>
        </div>
        <div class="date-frame">
          <div>
            <div class="date-frame-label">Fait à</div>
            <div class="date-frame-value">${e.lieu_signature||n}</div>
          </div>
          <div>
            <div class="date-frame-label">Le</div>
            <div class="date-frame-value">${e.date_etablissement||"—"}</div>
          </div>
          <div class="date-frame-mention">
            ${M?`Registre Vol. ${M}`:""}
            ${O?` — Page ${O}`:""}
            ${j?` — Ligne ${j}`:""}
          </div>
        </div>
      </div>
    </div>

  </div><!-- fin .content -->

  <!-- PIED DE PAGE SÉCURITÉ -->
  <div class="security-footer">
    <div class="sec-left">
      ${F?`<div class="sec-control">
        <span class="sec-control-label">N° Contrôle :</span>
        <span class="sec-control-value">${F}</span>
      </div>`:""}
      ${U?`<div class="sec-hash">SHA-256 : ${U}</div>`:""}
      ${_?`<div class="sec-url">Vérification : <a href="${_}">${_}</a></div>`:""}
    </div>
    ${P?`<div class="sec-qr"><img src="${P}" alt="QR Code de vérification" /></div>`:""}
  </div>

  <!-- MENTIONS LÉGALES -->
  <div class="legal-notice">
    La présente attestation ne vaut pas titre de propriété foncier —
    Elle constitue une présomption simple de possession coutumière
  </div>

</div>
</body>
</html>`}function ae(e){E(W(e))}function le(e){const i=e.limites&&(e.limites.nord||e.limites.sud||e.limites.est||e.limites.ouest),o=e.coordonnees_gps&&(e.coordonnees_gps.lat!=null||e.coordonnees_gps.lng!=null),r=e.gps_points&&e.gps_points.length>0,d=(e.temoins||[]).filter(m=>m.nom||m.prenom),n=d.length>0;if(!i&&!o&&!r&&!n){alert("Aucune donnée technique (GPS, limites, témoins) disponible pour cette attestation.");return}const a=t(e.reference),l=t(e.numero_enregistrement),f=h(e.proprietaire_prenom),p=h(e.proprietaire_nom),g=t(e.village).replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i,"").trim(),b=t(e.numero_lot),s=t(e.lotissement),u=Number.isFinite(e.superficie_m2)?e.superficie_m2:0,v=t(e.date_etablissement),c=e.limites||{nord:"",sud:"",est:"",ouest:""},w=e.coordonnees_gps;E(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Annexe Technique – ${a}</title>
  ${$}
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
    <span>Réf : ${a}</span>
    <span>Enreg. : ${l}</span>
    <span>Date : ${v}</span>
  </div>

  <div class="field-row">
    <span class="field-label">Détenteur :</span>
    <span class="field-value">${f} ${p}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Parcelle :</span>
    <span class="field-value">Lot ${b}, ${s||g} — ${u} m²</span>
  </div>

  <!-- LIMITES -->
  ${i?`
  <div class="section">
    <div class="section-title">Limites de la parcelle</div>
    ${c.nord?`<div class="field-row"><span class="field-label">Nord :</span><span class="field-value">${t(c.nord)}</span></div>`:""}
    ${c.sud?`<div class="field-row"><span class="field-label">Sud :</span><span class="field-value">${t(c.sud)}</span></div>`:""}
    ${c.est?`<div class="field-row"><span class="field-label">Est :</span><span class="field-value">${t(c.est)}</span></div>`:""}
    ${c.ouest?`<div class="field-row"><span class="field-label">Ouest :</span><span class="field-value">${t(c.ouest)}</span></div>`:""}
  </div>
  `:""}

  <!-- COORDONNÉES GPS -->
  ${o?`
  <div class="section">
    <div class="section-title">Coordonnées GPS centrales</div>
    <div class="field-row"><span class="field-label">Latitude :</span><span class="field-value">${w?.lat??"—"}</span></div>
    <div class="field-row"><span class="field-label">Longitude :</span><span class="field-value">${w?.lng??"—"}</span></div>
    ${w?.precision?`<div class="field-row"><span class="field-label">Précision :</span><span class="field-value">${w.precision} m</span></div>`:""}
  </div>
  `:""}

  <!-- GPS DES LIMITES -->
  ${r?`
  <div class="section">
    <div class="section-title">Coordonnées GPS des sommets</div>
    <table>
      <thead>
        <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
      </thead>
      <tbody>
        ${(e.gps_points||[]).map((m,L)=>`
          <tr>
            <td>${t(m.label||`Point ${L+1}`)}</td>
            <td>${m.lat}</td>
            <td>${m.lng}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  `:""}

  <!-- PRIX DE CESSION (confidentiel — uniquement en annexe) -->
  ${typeof e.prix_cession=="number"&&e.prix_cession>0?`
  <div class="section">
    <div class="section-title">Prix de cession (confidentiel)</div>
    <div class="field-row"><span class="field-label">Montant :</span><span class="field-value">${e.prix_cession.toLocaleString("fr-FR")} FCFA</span></div>
    <div class="text" style="font-size:7.5pt;color:#999;font-style:italic;margin-top:4px;">Ce montant est strictement confidentiel et ne figure pas sur l'attestation officielle.</div>
  </div>
  `:""}

  <!-- TÉMOINS -->
  ${n?`
  <div class="section">
    <div class="section-title">Témoins (${d.length})</div>
    <table>
      <thead>
        <tr><th>#</th><th>Nom & Prénoms</th><th>Profession</th><th>Téléphone</th><th>CNI</th></tr>
      </thead>
      <tbody>
        ${d.map((m,L)=>`
          <tr>
            <td>${L+1}</td>
            <td>${h(m.prenom)} ${h(m.nom)}</td>
            <td>${t(m.profession||"—")}</td>
            <td>${t(m.telephone||"—")}</td>
            <td>${t(m.cni||"—")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  `:""}

  <div class="notice">
    Cette annexe technique est un document complémentaire à l'attestation officielle.
    Elle ne peut pas être utilisée seule comme preuve de propriété coutumière.
    Générée le ${new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})} à ${new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}.
  </div>

</div>
</body>
</html>`)}function de(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},o=t(e.reference),r=t(e.appName),d=t(e.appCompany),n=x(e.logoUrl),a=t(e.locataire_prenom),l=t(e.locataire_nom),f=t(e.bien_adresse),p=t(e.mois_concerne),g=t(i[e.mode_paiement]||e.mode_paiement),b=t(e.date_paiement),s=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));E(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Quittance de Loyer – ${o}</title>
  ${$}
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
      ${n?`<img src="${n}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${d}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${o}</strong></div>
      <div>Date: ${b}</div>
    </div>
  </div>

  <div class="doc-title">Quittance de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${a} ${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${f}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${p}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${g}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant du Loyer Réglé</div>
    <div class="amount-value">${s} FCFA</div>
  </div>

  <div class="footer-text">
    Je soussigné, bailleur ou mandataire, reconnais avoir reçu la somme de
    <strong>${s} francs CFA</strong>
    de <strong>${a} ${l}</strong>
    au titre du loyer du mois de <strong>${p}</strong>
    pour le bien situé à <strong>${f}</strong>.
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
</html>`)}function ce(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},o=t(e.reference),r=t(e.appName),d=t(e.appCompany),n=x(e.logoUrl),a=t(e.locataire_prenom),l=t(e.locataire_nom),f=t(e.bien_adresse),p=t(e.mois_concerne),g=t(i[e.mode_paiement]||e.mode_paiement),b=t(e.date_paiement),s=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));E(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement de Loyer – ${o}</title>
  ${$}
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
      ${n?`<img src="${n}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${d}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${o}</strong></div>
      <div>Date: ${b}</div>
    </div>
  </div>

  <div class="doc-title">Reçu de Paiement de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${a} ${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${f}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${p}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${g}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant Reçu</div>
    <div class="amount-value">${s} FCFA</div>
  </div>

  <div class="footer-text">
    Reçu établi pour la somme de <strong>${s} francs CFA</strong>
    versée par <strong>${a} ${l}</strong>
    au titre du loyer du mois de <strong>${p}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Signature</div>
    </div>
  </div>
</div>
</body>
</html>`)}function pe(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},o=t(e.reference),r=t(e.appName),d=t(e.appCompany),n=x(e.logoUrl),a=t(e.date_transaction),l=t(e.client_nom),f=t(e.description||e.categorie),p=t(e.categorie),g=t(i[e.mode_paiement]||e.mode_paiement),b=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));E(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement – ${o}</title>
  ${$}
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
      ${n?`<img src="${n}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${r}</div>
        <div class="company-sub">${d}</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;"><div class="doc-title">Reçu de Paiement</div></div>

  <div class="ref-line">
    <span>Réf: <strong>${o}</strong></span>
    <span>Date: ${a}</span>
  </div>

  <div class="info-row"><span class="info-label">Client/Bénéficiaire</span><span class="info-value">${l}</span></div>
  <div class="info-row"><span class="info-label">Objet</span><span class="info-value">${f}</span></div>
  <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${p}</span></div>
  <div class="info-row"><span class="info-label">Mode de paiement</span><span class="info-value">${g}</span></div>

  <div class="amount-row">
    <span class="amount-label">Montant Reçu</span>
    <span class="amount-value">${b} FCFA</span>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line">Signature</div>
    </div>
  </div>

  <div class="footer">Ce reçu est généré automatiquement par ${r} – ${d}</div>
</div>
</body>
</html>`)}function me(e){const i=t(e.title),o=t(e.generated_at),r=x(e.logoUrl),d=(e.rows||[]).map(n=>({date:t(n.date_action),action:t(n.action),user:t(n.utilisateur_nom),reference:t(n.parcelle_reference),village:t(n.village),details:t(n.details)}));E(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${i}</title>
  ${$}
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
        <div class="title">${i}</div>
        <div class="meta">Généré le ${o}</div>
      </div>
      ${r?`<img src="${r}" style="width:50px;height:50px;object-fit:contain;" />`:""}
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
        ${d.map(n=>`
          <tr>
            <td>${n.date}</td>
            <td>${n.action}</td>
            <td>${n.user}</td>
            <td>${n.reference}</td>
            <td>${n.village}</td>
            <td>${n.details}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`)}function E(e){const i=window.open("","_blank","width=900,height=700");if(!i){alert("Veuillez autoriser les fenêtres popup pour imprimer.");return}i.document.write(e),i.document.close(),i.focus(),setTimeout(()=>{i.print()},800)}export{pe as a,K as c,Z as d,J as f,re as g,oe as h,de as i,ee as l,ie as m,ae as n,ce as o,se as p,me as r,ne as s,le as t,te as u};
