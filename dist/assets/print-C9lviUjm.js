import{t as I}from"./rolldown-runtime-2JzG8er9.js";function F(e){const i=new Date;return`${e}-${i.getFullYear()}${String(i.getMonth()+1).padStart(2,"0")}${String(i.getDate()).padStart(2,"0")}-${Math.floor(1e3+Math.random()*9e3)}`}function B(){const e=new Date;return`FONC-${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}-${Math.floor(1e4+Math.random()*9e4)}`}function O(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}):""}function G(e){return e?new Date(e).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}):new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}function V(e){return e.toLocaleString("fr-FR")}function Y(e){const i=e.trim();if(!i)return!0;const s=/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(i);if(!s)return!1;const[,n,a,o]=s,d=`${o}-${a}-${n}`,r=new Date(d);return Number.isNaN(r.getTime())?!1:r.getUTCFullYear()===Number(o)&&r.getUTCMonth()+1===Number(a)&&r.getUTCDate()===Number(n)}function Q(e){const i=e.replace(/\s/g,"").replace(",",".");if(!i)return null;const s=Number(i);return Number.isFinite(s)?s:null}function H(e){return e.trim()}function W(){if(typeof crypto<"u"&&"randomUUID"in crypto)try{return crypto.randomUUID()}catch{}const e="0123456789abcdef";let i="";for(let s=0;s<36;s++)s===8||s===13||s===18||s===23?i+="-":s===14?i+="4":s===19?i+=e[Math.floor(Math.random()*4)+8]:i+=e[Math.floor(Math.random()*16)];return i}async function J(e){if(typeof crypto>"u"||!crypto.subtle)return"";const i=new TextEncoder().encode(e),s=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(s)).map(n=>n.toString(16).padStart(2,"0")).join("")}var P=I(((e,i)=>{i.exports={}})),K=P();function j(e){const i=(e.replace(/\D/g,"")+Date.now().toString()).slice(-16);let s=0,n=!1;for(let a=i.length-1;a>=0;a-=1){let o=Number(i[a]);n&&(o*=2,o>9&&(o-=9)),s+=o,n=!n}return`${i}${(10-s%10)%10}`.slice(-8)}var z=`
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', 'Liberation Serif', Georgia, serif;
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
`,S=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),t=e=>S(String(e??"")),x=e=>S(String(e??"").toUpperCase()),c=e=>{if(!e)return"";try{const i=typeof window<"u"&&window.location?window.location.origin:"http://localhost",s=new URL(e,i);if(s.protocol==="data:")return e.trim().toLowerCase().startsWith("data:image/")?e:"";if(["http:","https:"].includes(s.protocol))return s.toString()}catch{return e.trim()}return""};function q(e){const i=e.reference||F("ATT"),s=t(e.control_number||j(i)),n=c(e.filigraneUrl||""),a=c(e.textureUrl||""),o=c(e.carteUrl||""),d=c(e.blasonUrl||""),r=c(e.qrDataUrl||""),f=c(e.signatureUrl||""),p=c(e.cachetUrl||""),u=t(e.verification_url||""),b=t(e.hash_sha256||""),m=t((e.hash_sha256||"").slice(0,16)),v=t(e.village||""),_=t([e.proprietaire_nom,e.proprietaire_prenom].filter(Boolean).join(" ")),k=t([e.proprietaire_naissance_date,e.proprietaire_naissance_lieu].filter(Boolean).join(" ")),L=t(e.proprietaire_profession||""),C=t(e.proprietaire_telephone||""),N=t(e.proprietaire_cni_numero||""),R=t(e.proprietaire_domicile||""),$=t(e.numero_lot||""),D=t(Number.isFinite(e.superficie_m2)?`${e.superficie_m2} m²`:""),E=t([e.commune,e.village].filter(Boolean).join(" / ")),U=t([e.lotissement,e.quartier].filter(Boolean).join(" / ")),T=t(e.mode_acquisition||""),A=t(e.historique_possession||""),g=t(e.remarques||""),h=t(e.date_etablissement||""),l=t(e.numero_enregistrement||i),w=t(e.registre_volume||"");return`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
@page { size: A4; margin: 0; }

/* --- FONTS (intégrer des .woff2 locaux) --- */
@font-face {
  font-family: "EBGaramond";
  src: url("./assets/fonts/EBGaramond-Regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "EBGaramond";
  src: url("./assets/fonts/EBGaramond-Bold.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "LibreBaskerville";
  src: url("./assets/fonts/LibreBaskerville-Regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}

:root{
  --green-900:#1F5E3B;
  --green-700:#2E7D4F;
  --ink:#111;
  --muted:#666;
  --paper:#F4F1E8;
  --line:#D7D2C4;
}

html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);}
body{font-family:"LibreBaskerville","EBGaramond","Times New Roman",serif;}

.page{
  position:relative;
  width:210mm; height:297mm;
  box-sizing:border-box;
  padding:18mm 18mm 22mm 22mm;
  background:
    url("${n}") center 54%/62% no-repeat,
    url("${a}") center/cover no-repeat,
    var(--paper);
  border:3px solid var(--green-900);
}

.page::before{
  content:"";
  position:absolute; inset:10mm;
  border:1px solid var(--green-900);
  pointer-events:none;
}
.corner{
  position:absolute; width:14mm; height:14mm;
  border:2px solid var(--green-900);
}
.corner.tl{top:4mm;left:4mm;border-right:none;border-bottom:none;}
.corner.tr{top:4mm;right:4mm;border-left:none;border-bottom:none;}
.corner.bl{bottom:4mm;left:4mm;border-right:none;border-top:none;}
.corner.br{bottom:4mm;right:4mm;border-left:none;border-top:none;}

.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8mm;}
.h-left,.h-right{width:36%;font-size:10.5pt;line-height:1.25;}
.h-right{text-align:right;}
.h-center{width:28%;text-align:center;opacity:.14;}
.h-center img{height:32mm;}
.h-right img{height:16mm;margin-top:2mm;}

.title-wrap{
  border:2px solid var(--green-900);
  padding:3mm;
  margin:6mm 0 4mm 0;
}
.title-inner{
  border:1px solid var(--green-900);
  padding:4mm 6mm;
  text-align:center;
}
.title-main{
  font-family:"EBGaramond";
  font-weight:700;
  font-size:26pt;
  letter-spacing:.8pt;
}
.title-sub{
  font-family:"EBGaramond";
  font-size:15pt;
  letter-spacing:.6pt;
}

.ref-line{
  margin-top:4px;
  font-size:10pt;
  color:var(--muted);
}

.intro{
  text-align:center;
  font-size:11.5pt;
  margin:4mm 8mm 6mm 8mm;
}

.section{margin-top:6mm;}
.section-title{
  display:inline-block;
  background:var(--green-900);
  color:#fff;
  padding:2.5mm 5mm;
  border-radius:999px;
  font-size:10.5pt;
  letter-spacing:.3pt;
}
.grid{display:flex;gap:10mm;margin-top:3mm;}
.col{width:50%;}
.row{
  display:grid;
  grid-template-columns: 44% 56%;
  border-bottom:1px dotted var(--line);
  padding:1.6mm 0;
  font-size:11pt;
}
.label{color:#222;}
.value{font-weight:700; font-size:11.2pt;}

.validation{
  margin-top:6mm;
  font-size:11pt;
  font-style:italic;
}

.signature{
  position:relative;
  margin-top:10mm;
  display:flex;
  justify-content:flex-end;
}
.sign-box{
  width:60%;
  text-align:right;
  font-size:11pt;
}
.sign-img{height:20mm;margin:2mm 0;}
.stamp{
  position:absolute;
  right:22mm; bottom:-6mm;
  height:26mm; opacity:.85;
}

.footer{
  position:absolute;
  left:18mm; right:18mm; bottom:12mm;
  border:1px solid var(--green-900);
  display:flex; gap:6mm;
  padding:3.5mm 4mm;
  font-size:9pt;
}
.f-col{width:50%;}
.kv{display:flex;gap:2mm;}
.kv span:first-child{width:46%;color:#222;}
.hash{
  font-family:monospace;
  font-size:8.2pt;
  word-break:break-all;
  color:#333;
}
.qr{width:22mm;height:22mm;float:right;}
.verify{margin-top:1.5mm;}
.small-note{
  position:absolute;
  left:18mm; right:18mm; bottom:5mm;
  font-size:8.5pt; color:#333; text-align:center;
}
.verify-panel{
  position:absolute;
  top:46mm;
  right:22mm;
  width:44mm;
  border:1px solid var(--line);
  background:rgba(255,255,255,0.92);
  padding:6px;
  text-align:center;
  box-sizing:border-box;
}
.verify-panel .qr{width:36mm;height:36mm;margin:0 auto;display:block}
.verify-panel .verify-url{font-size:8.5pt;margin-top:6px;word-break:break-all;color:var(--muted)}
.verify-panel .hash{font-family:monospace;font-size:8pt;margin-top:6px;display:block;color:#333}
.micro{
  position:absolute;
  left:22mm; top:140mm;
  font-size:6.8pt; color:#777; opacity:.6;
  letter-spacing:.3pt;
}
</style>
</head>

<body>
<div class="page">

  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="header">
    <div class="h-left">
      RÉGION AGNEBY-TIASSA<br>
      DÉPARTEMENT DE SIKENSI<br>
      SOUS-PRÉFECTURE DE SIKENSI<br>
      <b>VILLAGE ${v}</b>
    </div>
    <div class="h-center">
      <img src="${o}" alt="" />
    </div>
    <div class="h-right">
      <b>RÉPUBLIQUE DE CÔTE D’IVOIRE</b><br>
      UNION - DISCIPLINE - TRAVAIL<br>
      <img src="${d}" alt="" />
    </div>
  </div>

  <div class="title-wrap">
    <div class="title-inner">
      <div class="title-main">ATTESTATION</div>
      <div class="title-sub">DE PROPRIÉTÉ VILLAGEOISE</div>
        <div class="ref-line">Réf : ${i} &nbsp; • &nbsp; N° contrôle : ${s}</div>
    </div>
  </div>

    <div class="verify-panel">
      <img class="qr" src="${r}" alt="QR code de vérification" />
      <div class="verify-url">${u}</div>
      <div class="hash">${b}</div>
    </div>

  <div class="intro">
    Nous, autorité coutumière du village de ${v}, attestons que la personne ci-dessous
    est reconnue détentrice des droits fonciers coutumiers sur la parcelle décrite ci-après.
  </div>

  <div class="section">
    <span class="section-title">1. IDENTITÉ DU BÉNÉFICIAIRE</span>
    <div class="grid">
      <div class="col">
        <div class="row"><span class="label">Nom et Prénoms</span><span class="value">${_}</span></div>
        <div class="row"><span class="label">Date et lieu de naissance</span><span class="value">${k}</span></div>
        <div class="row"><span class="label">Profession</span><span class="value">${L}</span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value">${C}</span></div>
        <div class="row"><span class="label">Pièce d’identité (CNI)</span><span class="value">${N}</span></div>
        <div class="row"><span class="label">Domicile</span><span class="value">${R}</span></div>
      </div>
      <div class="col">
        <span class="section-title">2. INFORMATIONS SUR LA PARCELLE</span>
        <div class="row"><span class="label">Numéro de lot</span><span class="value">${$}</span></div>
        <div class="row"><span class="label">Superficie</span><span class="value">${D}</span></div>
        <div class="row"><span class="label">Localisation</span><span class="value">${E}</span></div>
        <div class="row"><span class="label">Lotissement / Quartier</span><span class="value">${U}</span></div>
        <div class="row"><span class="label">Mode d’acquisition</span><span class="value">${T}</span></div>
        <div class="row"><span class="label">Historique de possession</span><span class="value">${A}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <span class="section-title">3. VALIDATION COUTUMIÈRE</span>
    <div class="validation">
      Cette attestation est délivrée pour servir et valoir ce que de droit.
      Elle ne vaut pas titre foncier et demeure valable sous réserve de vérification administrative.
    </div>
  </div>

  <div class="section">
    <span class="section-title">4. REMARQUES</span>
    <div class="validation">
      ${g}
    </div>
  </div>

  <div class="signature">
    <div class="sign-box">
      Fait à ${v}, le ${h}<br><br>
      <b>Le Chef du Village</b><br>
      <img class="sign-img" src="${f}" alt="" /><br>
      <b>${t(e.chef_nom||e.chef_village||"")}</b>
    </div>
    <img class="stamp" src="${p}" alt="" />
  </div>

  <div class="footer">
    <div class="f-col">
      <div class="kv"><span>Référence attestation</span><span>${i}</span></div>
      <div class="kv"><span>N° d’enregistrement</span><span>${l}</span></div>
      <div class="kv"><span>Date d’établissement</span><span>${h}</span></div>
      <div class="kv"><span>Nature du document</span><span>ORIGINAL</span></div>
      <div class="kv"><span>Lieu de signature</span><span>${v}</span></div>
      <div class="kv"><span>Registre officiel</span><span>${w}</span></div>
    </div>
    <div class="f-col">
      <div class="kv"><span>N° de contrôle</span><span>${s}</span></div>
      <div class="kv"><span>Hash (abrégé)</span><span class="hash">${m}</span></div>
    </div>
  </div>

  <div class="small-note">
    La présente attestation constitue une présomption simple de droits coutumiers sous réserve de vérification administrative et ne vaut pas titre foncier.
  </div>

  <div class="micro">
    ${i} • ${s} • ${m}
  </div>

</div>
</body>
</html>`}function X(e){y(q(e))}function Z(e){const i=e.limites&&(e.limites.nord||e.limites.sud||e.limites.est||e.limites.ouest),s=e.coordonnees_gps&&(e.coordonnees_gps.lat!=null||e.coordonnees_gps.lng!=null),n=e.gps_points&&e.gps_points.length>0,a=(e.temoins||[]).filter(l=>l.nom||l.prenom),o=a.length>0;if(!i&&!s&&!n&&!o){alert("Aucune donnée technique (GPS, limites, témoins) disponible pour cette attestation.");return}const d=t(e.reference),r=t(e.numero_enregistrement),f=x(e.proprietaire_prenom),p=x(e.proprietaire_nom),u=t(e.region),b=t(e.departement),m=t(e.commune),v=t(e.village).replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i,"").trim(),_=t(e.numero_lot),k=t(e.lotissement),L=Number.isFinite(e.superficie_m2)?e.superficie_m2:0,C=t(e.date_etablissement),N=t(e.control_number||""),R=t(e.hash_sha256||""),$=t(e.verification_url||""),D=c(e.qrDataUrl),E=c(e.logoUrl),U=c(e.village_logo_url)||E,T=v.split(/\s+/).filter(Boolean).map(l=>l[0]).slice(0,2).join("").toUpperCase()||"VL",A="UNION • DISCIPLINE • TRAVAIL",g=e.limites||{nord:"",sud:"",est:"",ouest:""},h=e.coordonnees_gps;y(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Annexe Technique – ${d}</title>
  ${z}
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', Georgia, serif;
      color: #1f2937;
      background: #fff;
    }
    .sheet {
      width: 210mm;
      height: 297mm;
      padding: 11mm 12mm 10mm;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .model-bg {
      position: absolute;
      inset: 0;
      background-image: url('/attestation%20model.png');
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 100% 100%;
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }
    .header-row {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6mm;
      margin-bottom: 5mm;
      z-index: 1;
    }
    .header-col {
      display: flex;
      flex-direction: column;
      gap: 1mm;
      z-index: 1;
    }
    .header-col.left,
    .header-col.right {
      width: 33%;
      font-size: 8.8pt;
      color: #1b3127;
    }
    .header-col.center {
      width: 34%;
      align-items: center;
      text-align: center;
    }
    .header-label {
      font-size: 7.2pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #556c62;
      font-weight: 700;
    }
    .header-text {
      font-size: 9pt;
      font-weight: 700;
      color: #1b3127;
      line-height: 1.3;
    }
    .logo-frame {
      width: 38mm;
      height: 38mm;
      border-radius: 18px;
      background: #ffffff;
      border: 1px solid rgba(31, 67, 49, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin: 0 auto;
    }
    .logo-frame img,
    .logo-frame svg {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .logo-placeholder {
      width: 32mm;
      height: 32mm;
      border-radius: 14px;
      border: 1px solid #166534;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13pt;
      font-weight: 700;
      color: #166534;
      background: linear-gradient(180deg, #f8fdf7, #eff7ef);
    }
    .village-name {
      margin-top: 2mm;
      font-size: 8.6pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #164f2c;
    }
    .header-center .header-title-text {
      font-size: 9.8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #1a1a1a;
    }
    .header-center .devise {
      font-size: 8pt;
      color: #556c62;
      font-style: italic;
      letter-spacing: 0.16em;
    }
    .sheet::before {
      content: '';
      position: absolute;
      inset: 6mm;
      border: 1.1px solid #0f172a;
      pointer-events: none;
    }
    .sheet::after {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4px solid #94a3b8;
      pointer-events: none;
    }
    .head {
      position: relative;
      z-index: 1;
      border-bottom: 1.2px solid #0f172a;
      padding-bottom: 2.6mm;
      margin-bottom: 3mm;
      text-align: center;
    }
    .head h1 {
      margin: 0;
      font-size: 12.5pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .head .sub {
      margin-top: 1.1mm;
      font-size: 7.8pt;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 2mm;
      margin-bottom: 2.6mm;
    }
    .meta {
      border: 1px solid #d1d5db;
      background: #f8fafc;
      padding: 1.8mm 2.1mm;
      min-height: 12.5mm;
    }
    .meta .k {
      font-size: 6.3pt;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.3px;
      margin-bottom: 0.6mm;
    }
    .meta .v {
      font-size: 8.3pt;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.35;
    }
    .main {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow: hidden;
    }
    .section {
      border: 1px solid #d1d5db;
      margin-bottom: 2.2mm;
    }
    .section-title {
      background: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      padding: 1.8mm 2.2mm;
    }
    .field-row {
      display: grid;
      grid-template-columns: 36mm 1fr;
      gap: 1.4mm;
      padding: 1.5mm 2.2mm;
      border-top: 1px solid #e5e7eb;
      font-size: 8.4pt;
    }
    .field-row:first-of-type {
      border-top: none;
    }
    .field-label {
      color: #6b7280;
      text-transform: uppercase;
      font-size: 6.7pt;
      letter-spacing: 0.3px;
      font-weight: 600;
    }
    .field-value {
      color: #0f172a;
      font-weight: 500;
      line-height: 1.35;
      word-break: break-word;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.2pt;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 1.5mm 1.8mm;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      font-size: 6.6pt;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      color: #475569;
    }
    .security {
      position: relative;
      z-index: 1;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      margin-top: 2.4mm;
      padding: 2mm 2.4mm;
      display: grid;
      grid-template-columns: 1fr 54px;
      gap: 2.3mm;
      align-items: center;
    }
    .sec-line {
      display: flex;
      gap: 1mm;
      align-items: center;
      font-size: 7.4pt;
      margin-bottom: 0.8mm;
    }
    .sec-line:last-child {
      margin-bottom: 0;
    }
    .sec-k {
      text-transform: uppercase;
      font-size: 6.5pt;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.3px;
      flex-shrink: 0;
    }
    .sec-v {
      font-weight: 700;
      color: #0f172a;
      word-break: break-all;
    }
    .sec-hash, .sec-url {
      font-size: 6pt;
      color: #64748b;
      word-break: break-all;
      line-height: 1.25;
    }
    .sec-url a {
      color: #334155;
      text-decoration: none;
    }
    .sec-qr {
      width: 54px;
      height: 54px;
      border: 1px solid #cbd5e1;
      background: #fff;
      padding: 2px;
    }
    .sec-qr img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .notice {
      position: relative;
      z-index: 1;
      margin-top: 1.4mm;
      text-align: center;
      font-size: 6.4pt;
      color: #6b7280;
      font-style: italic;
      line-height: 1.28;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }    
  </style>
</head>
<body>
<div class="sheet">
  <div class="model-bg" aria-hidden="true"></div>
  <div class="header-row">
    <div class="header-col left">
      <div class="header-label">Région</div>
      <div class="header-text">${u||"—"}</div>
      <div class="header-label" style="margin-top:4px;">Département</div>
      <div class="header-text">${b||"—"}</div>
      <div class="header-label" style="margin-top:4px;">Commune</div>
      <div class="header-text">${m||"—"}</div>
      <div class="header-label" style="margin-top:4px;">Village</div>
      <div class="header-text">${x(v||"—")}</div>
    </div>
    <div class="header-col center">
      <div class="header-title-text">République de Côte d'Ivoire</div>
      <div class="devise">${A}</div>
    </div>
    <div class="header-col right">
      <div class="logo-frame">
        ${U?`<img src="${U}" alt="Logo du village" />`:`<div class="logo-placeholder">${T}</div>`}
      </div>
      <div class="village-name">${x(v||m||"VILLAGE")}</div>
    </div>
  </div>
  <div class="head">
    <h1>Annexe technique — Attestation foncière</h1>
    <div class="sub">Données complémentaires de géoréférencement et de constatation</div>
  </div>

  <div class="meta-grid">
    <div class="meta"><div class="k">Référence</div><div class="v">${d}</div></div>
    <div class="meta"><div class="k">Enregistrement</div><div class="v">${r}</div></div>
    <div class="meta"><div class="k">Date</div><div class="v">${C}</div></div>
    <div class="meta"><div class="k">Parcelle</div><div class="v">Lot ${_||"—"}</div></div>
    <div class="meta"><div class="k">Village</div><div class="v">${v.toUpperCase()}</div></div>
    <div class="meta"><div class="k">Lotissement</div><div class="v">${k||"—"}</div></div>
    <div class="meta"><div class="k">Superficie</div><div class="v">${L} m²</div></div>
    <div class="meta"><div class="k">Contrôle</div><div class="v">${N||"—"}</div></div>
  </div>

  <div class="main">
    <div class="section">
      <div class="section-title">Identité synthétique</div>
      <div class="field-row"><span class="field-label">Détenteur</span><span class="field-value">${f} ${p}</span></div>
      <div class="field-row"><span class="field-label">Description parcelle</span><span class="field-value">Lot ${_||"—"}, ${k||v} — ${L} m²</span></div>
    </div>

    ${i?`
    <div class="section">
      <div class="section-title">Limites de la parcelle</div>
      ${g.nord?`<div class="field-row"><span class="field-label">Nord</span><span class="field-value">${t(g.nord)}</span></div>`:""}
      ${g.sud?`<div class="field-row"><span class="field-label">Sud</span><span class="field-value">${t(g.sud)}</span></div>`:""}
      ${g.est?`<div class="field-row"><span class="field-label">Est</span><span class="field-value">${t(g.est)}</span></div>`:""}
      ${g.ouest?`<div class="field-row"><span class="field-label">Ouest</span><span class="field-value">${t(g.ouest)}</span></div>`:""}
    </div>
    `:""}

    ${s?`
    <div class="section">
      <div class="section-title">Coordonnées GPS centrales</div>
      <div class="field-row"><span class="field-label">Latitude</span><span class="field-value">${h?.lat??"—"}</span></div>
      <div class="field-row"><span class="field-label">Longitude</span><span class="field-value">${h?.lng??"—"}</span></div>
      ${h?.precision?`<div class="field-row"><span class="field-label">Précision</span><span class="field-value">${h.precision} m</span></div>`:""}
    </div>
    `:""}

    ${n?`
    <div class="section">
      <div class="section-title">Points GPS des limites</div>
      <table>
        <thead>
          <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
        </thead>
        <tbody>
          ${(e.gps_points||[]).map((l,w)=>`
            <tr>
              <td>${t(l.label||`Point ${w+1}`)}</td>
              <td>${l.lat}</td>
              <td>${l.lng}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    `:""}

    ${typeof e.prix_cession=="number"&&e.prix_cession>0?`
    <div class="section">
      <div class="section-title">Prix de cession (confidentiel)</div>
      <div class="field-row">
        <span class="field-label">Montant</span>
        <span class="field-value">${e.prix_cession.toLocaleString("fr-FR")} FCFA</span>
      </div>
    </div>
    `:""}

    ${o?`
    <div class="section">
      <div class="section-title">Témoins (${a.length})</div>
      <table>
        <thead>
          <tr><th>#</th><th>Nom & Prénoms</th><th>Profession</th><th>Téléphone</th><th>CNI</th></tr>
        </thead>
        <tbody>
          ${a.map((l,w)=>`
            <tr>
              <td>${w+1}</td>
              <td>${x(l.prenom)} ${x(l.nom)}</td>
              <td>${t(l.profession||"—")}</td>
              <td>${t(l.telephone||"—")}</td>
              <td>${t(l.cni||"—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    `:""}
  </div>

  <div class="security">
    <div>
      <div class="sec-line">
        <span class="sec-k">N° contrôle</span>
        <span class="sec-v">${N||"—"}</span>
      </div>
      ${R?`<div class="sec-hash">SHA-256 : ${R}</div>`:""}
      ${$?`<div class="sec-url">Vérification : <a href="${$}">${$}</a></div>`:""}
    </div>
    ${D?`<div class="sec-qr"><img src="${D}" alt="QR Code de vérification" /></div>`:""}
  </div>

  <div class="notice">
    Cette annexe technique complète l'attestation officielle et reste soumise aux mêmes règles de vérification.
    Générée le ${new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
    à ${new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}.
  </div>
</div>
</body>
</html>`)}function ee(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},s=t(e.reference),n=t(e.appName),a=t(e.appCompany),o=c(e.logoUrl),d=t(e.locataire_prenom),r=t(e.locataire_nom),f=t(e.bien_adresse),p=t(e.mois_concerne),u=t(i[e.mode_paiement]||e.mode_paiement),b=t(e.date_paiement),m=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));y(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Quittance de Loyer – ${s}</title>
  ${z}
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
      ${o?`<img src="${o}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${n}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${s}</strong></div>
      <div>Date: ${b}</div>
    </div>
  </div>

  <div class="doc-title">Quittance de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${d} ${r}</div>
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
      <div class="value">${u}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant du Loyer Réglé</div>
    <div class="amount-value">${m} FCFA</div>
  </div>

  <div class="footer-text">
    Je soussigné, bailleur ou mandataire, reconnais avoir reçu la somme de
    <strong>${m} francs CFA</strong>
    de <strong>${d} ${r}</strong>
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
</html>`)}function te(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},s=t(e.reference),n=t(e.appName),a=t(e.appCompany),o=c(e.logoUrl),d=t(e.locataire_prenom),r=t(e.locataire_nom),f=t(e.bien_adresse),p=t(e.mois_concerne),u=t(i[e.mode_paiement]||e.mode_paiement),b=t(e.date_paiement),m=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));y(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement de Loyer – ${s}</title>
  ${z}
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
      ${o?`<img src="${o}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${n}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${s}</strong></div>
      <div>Date: ${b}</div>
    </div>
  </div>

  <div class="doc-title">Reçu de Paiement de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${d} ${r}</div>
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
      <div class="value">${u}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant Reçu</div>
    <div class="amount-value">${m} FCFA</div>
  </div>

  <div class="footer-text">
    Reçu établi pour la somme de <strong>${m} francs CFA</strong>
    versée par <strong>${d} ${r}</strong>
    au titre du loyer du mois de <strong>${p}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Signature</div>
    </div>
  </div>
</div>
</body>
</html>`)}function ie(e){const i={virement:"Virement bancaire",especes:"Espèces",mobile_money:"Mobile Money",cheque:"Chèque"},s=t(e.reference),n=t(e.appName),a=t(e.appCompany),o=c(e.logoUrl),d=t(e.date_transaction),r=t(e.client_nom),f=t(e.description||e.categorie),p=t(e.categorie),u=t(i[e.mode_paiement]||e.mode_paiement),b=t((Number.isFinite(e.montant)?e.montant:0).toLocaleString("fr-FR"));y(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement – ${s}</title>
  ${z}
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
      ${o?`<img src="${o}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`:`<img src="/default-logo.svg" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${n}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;"><div class="doc-title">Reçu de Paiement</div></div>

  <div class="ref-line">
    <span>Réf: <strong>${s}</strong></span>
    <span>Date: ${d}</span>
  </div>

  <div class="info-row"><span class="info-label">Client/Bénéficiaire</span><span class="info-value">${r}</span></div>
  <div class="info-row"><span class="info-label">Objet</span><span class="info-value">${f}</span></div>
  <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${p}</span></div>
  <div class="info-row"><span class="info-label">Mode de paiement</span><span class="info-value">${u}</span></div>

  <div class="amount-row">
    <span class="amount-label">Montant Reçu</span>
    <span class="amount-value">${b} FCFA</span>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line">Signature</div>
    </div>
  </div>

  <div class="footer">Ce reçu est généré automatiquement par ${n} – ${a}</div>
</div>
</body>
</html>`)}function se(e){const i=t(e.title),s=t(e.generated_at),n=c(e.logoUrl),a=(e.rows||[]).map(o=>({date:t(o.date_action),action:t(o.action),user:t(o.utilisateur_nom),reference:t(o.parcelle_reference),village:t(o.village),details:t(o.details)}));y(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${i}</title>
  ${z}
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
        <div class="meta">Généré le ${s}</div>
      </div>
      ${n?`<img src="${n}" style="width:50px;height:50px;object-fit:contain;" />`:""}
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
        ${a.map(o=>`
          <tr>
            <td>${o.date}</td>
            <td>${o.action}</td>
            <td>${o.user}</td>
            <td>${o.reference}</td>
            <td>${o.village}</td>
            <td>${o.details}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`)}function y(e){const i=new Blob([e],{type:"text/html;charset=utf-8"}),s=URL.createObjectURL(i),n=window.open(s,"_blank");if(!n){alert("Veuillez autoriser les fenêtres popup pour imprimer."),URL.revokeObjectURL(s);return}n.addEventListener("load",()=>{n.print()}),setTimeout(()=>{n&&!n.closed&&n.print()},500)}export{ie as a,O as c,B as d,F as f,J as g,Q as h,ee as i,G as l,Y as m,X as n,te as o,W as p,se as r,H as s,Z as t,V as u};
