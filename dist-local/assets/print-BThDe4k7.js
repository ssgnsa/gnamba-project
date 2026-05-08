function le(e) {
  const t = new Date();
  return `${e}-${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}-${Math.floor(1e3 + Math.random() * 9e3)}`;
}
function re() {
  const e = new Date();
  return `FONC-${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}-${Math.floor(1e4 + Math.random() * 9e4)}`;
}
function de(e) {
  return e
    ? new Date(e).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
}
function ce(e) {
  return e
    ? new Date(e).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}
function pe(e) {
  return e.toLocaleString("fr-FR");
}
function me(e) {
  const t = e.trim();
  if (!t) return !0;
  const s = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(t);
  if (!s) return !1;
  const [, o, a, n] = s,
    r = `${n}-${a}-${o}`,
    l = new Date(r);
  return Number.isNaN(l.getTime())
    ? !1
    : l.getUTCFullYear() === Number(n) &&
        l.getUTCMonth() + 1 === Number(a) &&
        l.getUTCDate() === Number(o);
}
function fe(e) {
  const t = e.replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const s = Number(t);
  return Number.isFinite(s) ? s : null;
}
function ge(e) {
  return e.trim();
}
function ve() {
  if (typeof crypto < "u" && "randomUUID" in crypto)
    try {
      return crypto.randomUUID();
    } catch {}
  const e = "0123456789abcdef";
  let t = "";
  for (let s = 0; s < 36; s++)
    s === 8 || s === 13 || s === 18 || s === 23
      ? (t += "-")
      : s === 14
        ? (t += "4")
        : s === 19
          ? (t += e[Math.floor(Math.random() * 4) + 8])
          : (t += e[Math.floor(Math.random() * 16)]);
  return t;
}
async function ue(e) {
  if (typeof crypto > "u" || !crypto.subtle) return "";
  const t = new TextEncoder().encode(e),
    s = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(s))
    .map((o) => o.toString(16).padStart(2, "0"))
    .join("");
}
var w = `
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
`,
  I = (e) =>
    e
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"),
  i = (e) => I(String(e ?? "")),
  c = (e) => I(String(e ?? "").toUpperCase()),
  b = (e) => {
    if (!e) return "";
    try {
      const t =
          typeof window < "u" && window.location
            ? window.location.origin
            : "http://localhost",
        s = new URL(e, t);
      if (s.protocol === "data:")
        return e.trim().toLowerCase().startsWith("data:image/") ? e : "";
      if (["http:", "https:"].includes(s.protocol)) return s.toString();
    } catch {
      return "";
    }
    return "";
  };
function ae(e) {
  const t = i(e.reference),
    s = i(e.region),
    o = i(e.departement),
    a = i(e.commune),
    n = i(e.village)
      .replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "")
      .trim(),
    r = i(e.quartier),
    l = i(e.lotissement),
    v = i(e.numero_lot),
    p = `${(Number.isFinite(e.superficie_m2) ? e.superficie_m2 : 0).toLocaleString("fr-FR")} m²`,
    m = c(e.proprietaire_nom),
    f = i(e.proprietaire_prenom),
    g = i(e.proprietaire_naissance_date),
    h = i(e.proprietaire_naissance_lieu),
    N = i(e.proprietaire_domicile),
    k = i(e.proprietaire_profession),
    L = i(e.proprietaire_cni_numero),
    x = i(e.proprietaire_cni_date),
    z = i(e.proprietaire_cni_lieu),
    u = i(e.proprietaire_telephone),
    y = c(e.chef_nom || e.validation_chef_nom || e.chef_village),
    d = i(e.validation_agent_nom || "Agent foncier"),
    $ = b(e.logoUrl),
    S = b(e.village_logo_url),
    j = b(e.signatureUrl),
    R = b(e.cachetUrl || e.chef_empreinte_url),
    V = String(e.attestation_type || "").toLowerCase(),
    T =
      typeof e.prix_cession == "number" &&
      Number.isFinite(e.prix_cession) &&
      e.prix_cession > 0,
    B = !!(e.cedant_nom || e.cedant_prenom || e.cedant_cni_numero),
    O = !!e.date_cession || T,
    D = V === "cession" || B || O,
    P = D
      ? "ATTESTATION DE CESSION DE DROITS COUTUMIERS"
      : "ATTESTATION DE PROPRIÉTÉ VILLAGEOISE",
    G = i(e.cedant_nom || ""),
    Y = i(e.cedant_prenom || ""),
    H = i(e.cedant_cni_numero || ""),
    Q = i(e.date_cession || ""),
    W =
      T && typeof e.prix_cession == "number"
        ? `${e.prix_cession.toLocaleString("fr-FR")} FCFA`
        : "—",
    U = b(e.qrDataUrl),
    J = i(e.hash_sha256),
    F = i(e.control_number),
    A = i(e.verification_url),
    q = i(e.registre_volume),
    E = e.registre_page != null ? String(e.registre_page) : "",
    M = e.registre_ligne != null ? String(e.registre_ligne) : "";
  e.original;
  const K = i(e.date_etablissement || "—"),
    C = String(e.statut || "").toLowerCase(),
    X =
      C === "valide"
        ? "Document validé"
        : C === "soumis"
          ? "En attente de validation"
          : C
            ? i(C)
            : "Non précisé",
    Z = D
      ? `Nous, autorité coutumière du village de ${c(n)}, certifions qu'une cession régulière des droits coutumiers a été constatée au profit du bénéficiaire identifié ci-dessous, après déclaration des parties et vérification de la parcelle concernée.`
      : `Nous, autorité coutumière du village de ${c(n)}, attestons que la personne ci-dessous désignée est reconnue détentrice des droits fonciers coutumiers sur la parcelle décrite, sous réserve des contrôles administratifs et domaniaux requis.`,
    ee = [L || "—", x ? `délivrée le ${x}` : "", z ? `à ${z}` : ""]
      .filter(Boolean)
      .join(" "),
    ie = [q ? `Volume ${q}` : "", E ? `Page ${E}` : "", M ? `Ligne ${M}` : ""]
      .filter(Boolean)
      .join(" • "),
    te = c((e.hash_sha256 || e.reference || "").slice(0, 18)),
    se = [l, r].filter(Boolean).join(" • ") || n || "—",
    ne =
      "La présente attestation constitue une preuve coutumière vérifiable. Elle ne remplace pas le titre foncier et demeure soumise aux vérifications administratives et cadastrales en vigueur.";
  c(
    (e.hash_sha256 || e.reference || "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 12),
  );
  const oe = (e.draft, "");
  return (
    [f, m].filter(Boolean).join(" "),
    [g, h].filter(Boolean).join(" à "),
    i(e.mode_acquisition || "—"),
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${P} – ${t}</title>
  ${w}
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * { box-sizing: border-box; }

    body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: "Times New Roman", "Liberation Serif", Georgia, serif;
      color: #111111;
      background: #f5f5f5;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .sheet {
      position: relative;
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 16mm 15mm 12mm 18mm;
      background: #ffffff;
      overflow: hidden;
    }

    .sheet::before {
      content: '';
      position: absolute;
      inset: 7mm;
      border: 1px solid #171717;
      pointer-events: none;
    }

    .sheet::after {
      content: '';
      position: absolute;
      inset: 9.5mm;
      border: 0.7px solid #7f8c86;
      pointer-events: none;
    }

    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
      z-index: 1;
    }

    .watermark-text {
      transform: rotate(-23deg);
      font-size: 31pt;
      line-height: 1.45;
      letter-spacing: 2px;
      color: rgba(32, 56, 46, 0.05);
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .draft-ribbon {
      position: absolute;
      top: 16mm;
      right: 10mm;
      padding: 3px 11px;
      border: 1px solid #8a2a2a;
      color: #8a2a2a;
      background: rgba(255, 245, 245, 0.92);
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      z-index: 3;
    }

    .content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8mm;
      padding-top: 2mm;
      padding-bottom: 6mm;
      border-bottom: 1px solid #171717;
    }

    .header-col {
      flex: 1 1 0;
      font-size: 10pt;
      line-height: 1.35;
      text-transform: uppercase;
    }

    .header-col strong {
      display: inline;
      font-size: 10.4pt;
      letter-spacing: 0.4px;
    }

    .header-col.left {
      text-align: left;
    }

    .header-col.center {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .header-col.right {
      text-align: right;
    }

    .logo-frame {
      width: 34mm;
      height: 34mm;
      border: 1px solid #7f8c86;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo-frame img,
    .logo-frame svg {
      width: 82%;
      height: 82%;
      object-fit: contain;
    }

    .title-box {
      margin-top: 6mm;
      border: 1.3px solid #111111;
      padding: 4mm 6mm 3.7mm;
      text-align: center;
      background: #f8f8f8;
    }

    .title-box h1 {
      margin: 0;
      font-size: 17.2pt;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .title-meta {
      margin-top: 3.2mm;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2.4mm;
      text-align: left;
    }

    .title-meta-item {
      border: 0.8px solid #d5ddd8;
      background: #ffffff;
      padding: 2.2mm 2.4mm;
      min-height: 13mm;
    }

    .title-meta-label {
      display: block;
      font-size: 7.2pt;
      letter-spacing: 0.45px;
      text-transform: uppercase;
      color: #5f7168;
    }

    .title-meta-value {
      display: block;
      margin-top: 1mm;
      font-size: 9.1pt;
      font-weight: 700;
      color: #132c22;
      word-break: break-word;
    }

    .intro {
      margin-top: 6mm;
      padding: 4mm 4.2mm 0;
      font-size: 11pt;
      line-height: 1.55;
      text-align: justify;
    }

    .section {
      margin-top: 6mm;
    }

    .section-title {
      padding-bottom: 1.8mm;
      border-bottom: 1px solid #b9c3bd;
      font-size: 11.6pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #183d30;
      text-transform: uppercase;
    }

    .section-body {
      padding-top: 3.2mm;
      font-size: 10.4pt;
      line-height: 1.45;
    }

    .two-col {
      display: flex;
      gap: 9mm;
      align-items: flex-start;
    }

    .col {
      flex: 1 1 0;
    }

    .field {
      margin-bottom: 2.7mm;
    }

    .field-label {
      display: inline-block;
      min-width: 33mm;
      font-weight: 700;
      color: #0f2f24;
    }

    .field-value {
      display: inline;
    }

    .field-block {
      display: block;
      margin-top: 0.9mm;
      padding-left: 0;
    }

    .legal-note {
      margin-top: 4.5mm;
      font-size: 10.3pt;
      line-height: 1.5;
      text-align: justify;
      padding: 3.2mm 3.5mm;
      border-left: 1.2px solid #1f6b4f;
      background: rgba(31, 107, 79, 0.035);
    }

    .signature-area {
      margin-top: 8mm;
      display: flex;
      justify-content: flex-end;
    }

    .signature-card {
      width: 83mm;
      text-align: right;
      font-size: 10.5pt;
      line-height: 1.45;
    }

    .signature-title {
      margin-top: 5mm;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .signature-visuals {
      margin-top: 4mm;
      display: flex;
      justify-content: flex-end;
      gap: 5mm;
      align-items: flex-end;
      min-height: 26mm;
    }

    .signature-sign {
      min-width: 38mm;
      text-align: right;
    }

    .signature-sign img {
      max-width: 36mm;
      max-height: 18mm;
      object-fit: contain;
      display: block;
      margin-left: auto;
      margin-bottom: 1.5mm;
    }

    .signature-line {
      border-top: 1px solid #111111;
      padding-top: 1.2mm;
      font-size: 8.7pt;
      text-transform: uppercase;
    }

    .stamp-box {
      width: 22mm;
      height: 22mm;
      border: 1px dashed #5f776d;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(31, 107, 79, 0.025);
      overflow: hidden;
    }

    .stamp-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .signature-name {
      margin-top: 2.2mm;
      font-size: 11.3pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .footer {
      margin-top: auto;
      padding-top: 5mm;
      border-top: 1px solid #cdd6d1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 8mm;
    }

    .footer-meta {
      flex: 1 1 auto;
      padding: 3.5mm 4mm;
      background: #f5f7f6;
      border: 1px solid #d3dbd6;
      font-size: 9pt;
      line-height: 1.5;
    }

    .footer-meta strong {
      display: inline-block;
      min-width: 34mm;
      color: #17382d;
    }

    .footer-hash {
      margin-top: 2mm;
      font-size: 7.5pt;
      line-height: 1.35;
      word-break: break-all;
      font-family: "Courier New", monospace;
      color: #44534d;
    }

    .qr-box {
      width: 38mm;
      text-align: center;
      flex-shrink: 0;
    }

    .qr-frame {
      width: 38mm;
      height: 38mm;
      border: 1px solid #adbab4;
      background: #ffffff;
      padding: 1.8mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .qr-caption {
      margin-top: 1.4mm;
      font-size: 7.8pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #476257;
    }

    .footer-legal {
      margin-top: 3mm;
      font-size: 7.7pt;
      line-height: 1.45;
      text-align: center;
      color: #596760;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="watermark">
      <div class="watermark-text">
        ${c(t)}<br>
        ${te || "DOCUMENT SÉCURISÉ"}
      </div>
    </div>
    ${oe}

    <div class="content">
      <div class="header-row">
        <div class="header-col left">
          ${s || "Région"} — Département de ${o || "—"} — Commune de ${a || "—"} — Village ${c(n || "—")}
        </div>

        <div class="header-col center">
          <div class="logo-frame">
            ${
              S
                ? `<img src="${S}" alt="Logo du village" />`
                : $
                  ? `<img src="${$}" alt="Logo institutionnel" />`
                  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="46" fill="#fff" stroke="#6b7b74" stroke-width="2"/>
                    <rect x="20" y="22" width="18" height="32" fill="#ef7d00"/>
                    <rect x="41" y="22" width="18" height="32" fill="#ffffff" stroke="#c7cfcb" stroke-width="0.8"/>
                    <rect x="62" y="22" width="18" height="32" fill="#1f6b4f"/>
                    <text x="50" y="72" text-anchor="middle" font-family="Times New Roman" font-size="8" fill="#2a3f36" font-weight="700">CI</text>
                  </svg>`
            }
          </div>
        </div>

        <div class="header-col right">
          <strong>République de Côte d'Ivoire</strong> — Union - Discipline - Travail
        </div>
      </div>

      <div class="title-box">
        <h1>${P}</h1>
        <div class="title-meta">
          <div class="title-meta-item">
            <span class="title-meta-label">Référence officielle</span>
            <span class="title-meta-value">${t || "—"}</span>
          </div>
          <div class="title-meta-item">
            <span class="title-meta-label">Numéro de contrôle</span>
            <span class="title-meta-value">${F || "—"}</span>
          </div>
        </div>
      </div>

      <div class="intro">
        ${Z}
      </div>

      <div class="section">
        <div class="section-title">Identité du bénéficiaire</div>
        <div class="section-body two-col">
          <div class="col">
            <div class="field"><span class="field-label">Nom :</span><span class="field-value">${m || "—"}</span></div>
            <div class="field"><span class="field-label">Prénoms :</span><span class="field-value">${f || "—"}</span></div>
            <div class="field"><span class="field-label">Naissance :</span><span class="field-value">${g || "—"}${h ? ` à ${h}` : ""}</span></div>
            <div class="field"><span class="field-label">Profession :</span><span class="field-value">${k || "—"}</span></div>
          </div>
          <div class="col">
            <div class="field"><span class="field-label">Téléphone :</span><span class="field-value">${u || "—"}</span></div>
            <div class="field"><span class="field-label">CNI :</span><span class="field-value">${ee || "—"}</span></div>
            <div class="field"><span class="field-label">Domicile :</span><span class="field-value">${N || "—"}</span></div>
          </div>
        </div>
      </div>

      ${
        D
          ? `
      <div class="section">
        <div class="section-title">Informations de cession</div>
        <div class="section-body two-col">
          <div class="col">
            <div class="field"><span class="field-label">Cédant :</span><span class="field-value">${[Y, G].filter(Boolean).join(" ") || "—"}</span></div>
            <div class="field"><span class="field-label">CNI cédant :</span><span class="field-value">${H || "—"}</span></div>
          </div>
          <div class="col">
            <div class="field"><span class="field-label">Date cession :</span><span class="field-value">${Q || "—"}</span></div>
            <div class="field"><span class="field-label">Montant :</span><span class="field-value">${W}</span></div>
          </div>
        </div>
      </div>
      `
          : ""
      }

      <div class="section">
        <div class="section-title">Informations sur la parcelle</div>
        <div class="section-body two-col">
          <div class="col">
            <div class="field"><span class="field-label">Lot :</span><span class="field-value">${v || "—"}</span></div>
            <div class="field"><span class="field-label">Superficie :</span><span class="field-value">${i(p)}</span></div>
            <div class="field"><span class="field-label">Localisation :</span><span class="field-value">${se}</span></div>
          </div>
          <div class="col">
            <div class="field"><span class="field-label">Village :</span><span class="field-value">${c(n || "—")}</span></div>
          </div>
        </div>
      </div>

      <div class="legal-note">
        La présente attestation est délivrée pour servir et valoir ce que de droit. Les témoins, coordonnées GPS, limites détaillées et informations complémentaires sont consultables via la page officielle de vérification en ligne associée au QR code.
      </div>

      <div class="signature-area">
        <div class="signature-card">
          Fait à ${i(e.lieu_signature || n || "—")}, le ${K}
          <div class="signature-title">Le Chef du Village</div>
          <div class="signature-visuals">
            <div class="signature-sign">
              ${j ? `<img src="${j}" alt="Signature du Chef" />` : ""}
              <div class="signature-line">Signature manuscrite</div>
            </div>
            <div class="stamp-box">
              ${R ? `<img src="${R}" alt="Cachet officiel" />` : '<span style="font-size:7.6pt;color:#597165;text-transform:uppercase;">Cachet</span>'}
            </div>
          </div>
          <div class="signature-name">${y || "—"}</div>
          <div style="margin-top:2mm;font-size:8.6pt;">${d}</div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-meta">
          <div><strong>Référence :</strong> ${t}</div>
          <div><strong>Contrôle :</strong> ${F || "—"}</div>
          <div><strong>Registre :</strong> ${ie || "—"}</div>
          <div><strong>Statut :</strong> ${X}</div>
          <div class="footer-hash">SHA-256 : ${J || "—"}</div>
          ${A ? `<div style="margin-top:1.6mm;font-size:7.8pt;word-break:break-all;"><strong>Vérification :</strong> ${A}</div>` : ""}
        </div>

        <div class="qr-box">
          <div class="qr-frame">
            ${U ? `<img src="${U}" alt="QR Code de vérification" />` : ""}
          </div>
          <div class="qr-caption">Scan pour vérifier</div>
        </div>
      </div>

      <div class="footer-legal">${ne}</div>
    </div>
  </div>
</body>
</html>`
  );
}
function be(e) {
  _(ae(e));
}
function he(e) {
  const t =
      e.limites &&
      (e.limites.nord || e.limites.sud || e.limites.est || e.limites.ouest),
    s =
      e.coordonnees_gps &&
      (e.coordonnees_gps.lat != null || e.coordonnees_gps.lng != null),
    o = e.gps_points && e.gps_points.length > 0,
    a = (e.temoins || []).filter((d) => d.nom || d.prenom),
    n = a.length > 0;
  if (!t && !s && !o && !n) {
    alert(
      "Aucune donnée technique (GPS, limites, témoins) disponible pour cette attestation.",
    );
    return;
  }
  const r = i(e.reference),
    l = i(e.numero_enregistrement),
    v = c(e.proprietaire_prenom),
    p = c(e.proprietaire_nom),
    m = i(e.village)
      .replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "")
      .trim(),
    f = i(e.numero_lot),
    g = i(e.lotissement),
    h = Number.isFinite(e.superficie_m2) ? e.superficie_m2 : 0,
    N = i(e.date_etablissement),
    k = i(e.control_number || ""),
    L = i(e.hash_sha256 || ""),
    x = i(e.verification_url || ""),
    z = b(e.qrDataUrl),
    u = e.limites || { nord: "", sud: "", est: "", ouest: "" },
    y = e.coordonnees_gps;
  _(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Annexe Technique – ${r}</title>
  ${w}
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      color: #1f2937;
      background: #fff;
    }
    .sheet {
      width: 210mm;
      height: 297mm;
      padding: 11mm 12mm 10mm;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
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
  <div class="head">
    <h1>Annexe technique — Attestation foncière</h1>
    <div class="sub">Données complémentaires de géoréférencement et de constatation</div>
  </div>

  <div class="meta-grid">
    <div class="meta"><div class="k">Référence</div><div class="v">${r}</div></div>
    <div class="meta"><div class="k">Enregistrement</div><div class="v">${l}</div></div>
    <div class="meta"><div class="k">Date</div><div class="v">${N}</div></div>
    <div class="meta"><div class="k">Parcelle</div><div class="v">Lot ${f || "—"}</div></div>
    <div class="meta"><div class="k">Village</div><div class="v">${m.toUpperCase()}</div></div>
    <div class="meta"><div class="k">Lotissement</div><div class="v">${g || "—"}</div></div>
    <div class="meta"><div class="k">Superficie</div><div class="v">${h} m²</div></div>
    <div class="meta"><div class="k">Contrôle</div><div class="v">${k || "—"}</div></div>
  </div>

  <div class="main">
    <div class="section">
      <div class="section-title">Identité synthétique</div>
      <div class="field-row"><span class="field-label">Détenteur</span><span class="field-value">${v} ${p}</span></div>
      <div class="field-row"><span class="field-label">Description parcelle</span><span class="field-value">Lot ${f || "—"}, ${g || m} — ${h} m²</span></div>
    </div>

    ${
      t
        ? `
    <div class="section">
      <div class="section-title">Limites de la parcelle</div>
      ${u.nord ? `<div class="field-row"><span class="field-label">Nord</span><span class="field-value">${i(u.nord)}</span></div>` : ""}
      ${u.sud ? `<div class="field-row"><span class="field-label">Sud</span><span class="field-value">${i(u.sud)}</span></div>` : ""}
      ${u.est ? `<div class="field-row"><span class="field-label">Est</span><span class="field-value">${i(u.est)}</span></div>` : ""}
      ${u.ouest ? `<div class="field-row"><span class="field-label">Ouest</span><span class="field-value">${i(u.ouest)}</span></div>` : ""}
    </div>
    `
        : ""
    }

    ${
      s
        ? `
    <div class="section">
      <div class="section-title">Coordonnées GPS centrales</div>
      <div class="field-row"><span class="field-label">Latitude</span><span class="field-value">${y?.lat ?? "—"}</span></div>
      <div class="field-row"><span class="field-label">Longitude</span><span class="field-value">${y?.lng ?? "—"}</span></div>
      ${y?.precision ? `<div class="field-row"><span class="field-label">Précision</span><span class="field-value">${y.precision} m</span></div>` : ""}
    </div>
    `
        : ""
    }

    ${
      o
        ? `
    <div class="section">
      <div class="section-title">Points GPS des limites</div>
      <table>
        <thead>
          <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
        </thead>
        <tbody>
          ${(e.gps_points || [])
            .map(
              (d, $) => `
            <tr>
              <td>${i(d.label || `Point ${$ + 1}`)}</td>
              <td>${d.lat}</td>
              <td>${d.lng}</td>
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

    ${
      typeof e.prix_cession == "number" && e.prix_cession > 0
        ? `
    <div class="section">
      <div class="section-title">Prix de cession (confidentiel)</div>
      <div class="field-row">
        <span class="field-label">Montant</span>
        <span class="field-value">${e.prix_cession.toLocaleString("fr-FR")} FCFA</span>
      </div>
    </div>
    `
        : ""
    }

    ${
      n
        ? `
    <div class="section">
      <div class="section-title">Témoins (${a.length})</div>
      <table>
        <thead>
          <tr><th>#</th><th>Nom & Prénoms</th><th>Profession</th><th>Téléphone</th><th>CNI</th></tr>
        </thead>
        <tbody>
          ${a
            .map(
              (d, $) => `
            <tr>
              <td>${$ + 1}</td>
              <td>${c(d.prenom)} ${c(d.nom)}</td>
              <td>${i(d.profession || "—")}</td>
              <td>${i(d.telephone || "—")}</td>
              <td>${i(d.cni || "—")}</td>
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
  </div>

  <div class="security">
    <div>
      <div class="sec-line">
        <span class="sec-k">N° contrôle</span>
        <span class="sec-v">${k || "—"}</span>
      </div>
      ${L ? `<div class="sec-hash">SHA-256 : ${L}</div>` : ""}
      ${x ? `<div class="sec-url">Vérification : <a href="${x}">${x}</a></div>` : ""}
    </div>
    ${z ? `<div class="sec-qr"><img src="${z}" alt="QR Code de vérification" /></div>` : ""}
  </div>

  <div class="notice">
    Cette annexe technique complète l'attestation officielle et reste soumise aux mêmes règles de vérification.
    Générée le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
    à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
  </div>
</div>
</body>
</html>`);
}
function xe(e) {
  const t = {
      virement: "Virement bancaire",
      especes: "Espèces",
      mobile_money: "Mobile Money",
      cheque: "Chèque",
    },
    s = i(e.reference),
    o = i(e.appName),
    a = i(e.appCompany),
    n = b(e.logoUrl),
    r = i(e.locataire_prenom),
    l = i(e.locataire_nom),
    v = i(e.bien_adresse),
    p = i(e.mois_concerne),
    m = i(t[e.mode_paiement] || e.mode_paiement),
    f = i(e.date_paiement),
    g = i((Number.isFinite(e.montant) ? e.montant : 0).toLocaleString("fr-FR"));
  _(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Quittance de Loyer – ${s}</title>
  ${w}
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
      ${n ? `<img src="${n}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${o}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${s}</strong></div>
      <div>Date: ${f}</div>
    </div>
  </div>

  <div class="doc-title">Quittance de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${r} ${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${v}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${p}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${m}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant du Loyer Réglé</div>
    <div class="amount-value">${g} FCFA</div>
  </div>

  <div class="footer-text">
    Je soussigné, bailleur ou mandataire, reconnais avoir reçu la somme de
    <strong>${g} francs CFA</strong>
    de <strong>${r} ${l}</strong>
    au titre du loyer du mois de <strong>${p}</strong>
    pour le bien situé à <strong>${v}</strong>.
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
</html>`);
}
function ye(e) {
  const t = {
      virement: "Virement bancaire",
      especes: "Espèces",
      mobile_money: "Mobile Money",
      cheque: "Chèque",
    },
    s = i(e.reference),
    o = i(e.appName),
    a = i(e.appCompany),
    n = b(e.logoUrl),
    r = i(e.locataire_prenom),
    l = i(e.locataire_nom),
    v = i(e.bien_adresse),
    p = i(e.mois_concerne),
    m = i(t[e.mode_paiement] || e.mode_paiement),
    f = i(e.date_paiement),
    g = i((Number.isFinite(e.montant) ? e.montant : 0).toLocaleString("fr-FR"));
  _(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement de Loyer – ${s}</title>
  ${w}
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
      ${n ? `<img src="${n}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:32px;height:32px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${o}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
    <div class="ref-date">
      <div>Réf: <strong>${s}</strong></div>
      <div>Date: ${f}</div>
    </div>
  </div>

  <div class="doc-title">Reçu de Paiement de Loyer</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Locataire</div>
      <div class="value">${r} ${l}</div>
    </div>
    <div class="info-box">
      <div class="label">Bien Immobilier</div>
      <div class="value">${v}</div>
    </div>
    <div class="info-box">
      <div class="label">Période Concernée</div>
      <div class="value">${p}</div>
    </div>
    <div class="info-box">
      <div class="label">Mode de Paiement</div>
      <div class="value">${m}</div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant Reçu</div>
    <div class="amount-value">${g} FCFA</div>
  </div>

  <div class="footer-text">
    Reçu établi pour la somme de <strong>${g} francs CFA</strong>
    versée par <strong>${r} ${l}</strong>
    au titre du loyer du mois de <strong>${p}</strong>.
  </div>

  <div class="signature-zone">
    <div class="sig-block">
      <div class="line">Signature</div>
    </div>
  </div>
</div>
</body>
</html>`);
}
function $e(e) {
  const t = {
      virement: "Virement bancaire",
      especes: "Espèces",
      mobile_money: "Mobile Money",
      cheque: "Chèque",
    },
    s = i(e.reference),
    o = i(e.appName),
    a = i(e.appCompany),
    n = b(e.logoUrl),
    r = i(e.date_transaction),
    l = i(e.client_nom),
    v = i(e.description || e.categorie),
    p = i(e.categorie),
    m = i(t[e.mode_paiement] || e.mode_paiement),
    f = i((Number.isFinite(e.montant) ? e.montant : 0).toLocaleString("fr-FR"));
  _(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de Paiement – ${s}</title>
  ${w}
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
      ${n ? `<img src="${n}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : `<img src="/default-logo.svg" style="width:40px;height:40px;object-fit:contain;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />`}
      <div>
        <div class="company-name">${o}</div>
        <div class="company-sub">${a}</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;"><div class="doc-title">Reçu de Paiement</div></div>

  <div class="ref-line">
    <span>Réf: <strong>${s}</strong></span>
    <span>Date: ${r}</span>
  </div>

  <div class="info-row"><span class="info-label">Client/Bénéficiaire</span><span class="info-value">${l}</span></div>
  <div class="info-row"><span class="info-label">Objet</span><span class="info-value">${v}</span></div>
  <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${p}</span></div>
  <div class="info-row"><span class="info-label">Mode de paiement</span><span class="info-value">${m}</span></div>

  <div class="amount-row">
    <span class="amount-label">Montant Reçu</span>
    <span class="amount-value">${f} FCFA</span>
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line">Signature</div>
    </div>
  </div>

  <div class="footer">Ce reçu est généré automatiquement par ${o} – ${a}</div>
</div>
</body>
</html>`);
}
function we(e) {
  const t = i(e.title),
    s = i(e.generated_at),
    o = b(e.logoUrl),
    a = (e.rows || []).map((n) => ({
      date: i(n.date_action),
      action: i(n.action),
      user: i(n.utilisateur_nom),
      reference: i(n.parcelle_reference),
      village: i(n.village),
      details: i(n.details),
    }));
  _(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  ${w}
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
        <div class="meta">Généré le ${s}</div>
      </div>
      ${o ? `<img src="${o}" style="width:50px;height:50px;object-fit:contain;" />` : ""}
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
        ${a
          .map(
            (n) => `
          <tr>
            <td>${n.date}</td>
            <td>${n.action}</td>
            <td>${n.user}</td>
            <td>${n.reference}</td>
            <td>${n.village}</td>
            <td>${n.details}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`);
}
function _(e) {
  const t = window.open("", "_blank", "width=900,height=700");
  if (!t) {
    alert("Veuillez autoriser les fenêtres popup pour imprimer.");
    return;
  }
  (t.document.write(e),
    t.document.close(),
    t.focus(),
    setTimeout(() => {
      t.print();
    }, 800));
}
export {
  $e as a,
  de as c,
  re as d,
  le as f,
  ue as g,
  fe as h,
  xe as i,
  ce as l,
  me as m,
  be as n,
  ye as o,
  ve as p,
  we as r,
  ge as s,
  he as t,
  pe as u,
};
