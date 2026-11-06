import { PDFDocument, rgb } from 'pdf-lib';

export class ReportGenerator {
  async createPDF(data: {
    title: string;
    content: string;
    tables?: Array<{ title: string; data: any[][] }>;
  }): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width: _width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText(data.title, {
      x: margin,
      y,
      size: 18,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Content text
    const lines = data.content.split('\n');
    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 12,
        color: rgb(0, 0, 0),
      });
      y -= 20;
      if (y < margin) break;
    }

    // (Optionnel) Ajouter des tableaux – simplifié pour l'exemple
    // Dans une vraie implémentation, utilisez pdf-lib pour dessiner des tableaux.

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

// ─────────────────────────────────────────────────────────────
export interface QuittanceData {
  reference: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  appName?: string;
  appCompany?: string;
  logoUrl?: string;
  mois_concerne?: string;
}

const escapeHtmlQ = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

const formatMontant = (n: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(n);

export function printQuittance(data: QuittanceData): void {
  const {
    reference,
    locataire_nom,
    locataire_prenom,
    bien_adresse,
    montant,
    date_paiement,
    mode_paiement,
    appName,
    appCompany,
    logoUrl,
    mois_concerne,
  } = data;

  const company = escapeHtmlQ(appCompany || "GNAMBA SERVICES");
  const tenant = escapeHtmlQ(
    `${locataire_prenom} ${locataire_nom}`.trim() || "—"
  );

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Quittance ${escapeHtmlQ(reference)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 2.5rem;
      max-width: 760px;
      margin-inline: auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    header h1 { margin: 0; font-size: 1.5rem; color: #0f172a; }
    header .ref { font-size: 0.875rem; color: #64748b; }
    header img { max-height: 60px; }
    dl {
      display: grid;
      grid-template-columns: 12rem 1fr;
      gap: 0.5rem 1rem;
      margin: 0;
    }
    dt { color: #64748b; font-size: 0.875rem; }
    dd { margin: 0; font-weight: 500; }
    .montant {
      margin: 2rem 0;
      padding: 1rem;
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      border-radius: 6px;
    }
    .montant strong { font-size: 1.25rem; }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 1rem; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Quittance de loyer</h1>
      <p class="ref">Référence : ${escapeHtmlQ(reference)}</p>
    </div>
    ${logoUrl ? `<img src="${escapeHtmlQ(logoUrl)}" alt="${company}">` : `<strong>${company}</strong>`}
  </header>

  <dl>
    <dt>Locataire</dt>       <dd>${tenant}</dd>
    <dt>Bien</dt>            <dd>${escapeHtmlQ(bien_adresse)}</dd>
    ${mois_concerne ? `<dt>Période</dt><dd>${escapeHtmlQ(mois_concerne)}</dd>` : ""}
    <dt>Date de paiement</dt><dd>${escapeHtmlQ(date_paiement || "—")}</dd>
    <dt>Mode de paiement</dt><dd>${escapeHtmlQ(mode_paiement || "—")}</dd>
  </dl>

  <div class="montant">
    Montant acquitté : <strong>${formatMontant(montant)}</strong>
  </div>

  <p>
    La présente quittance atteste le paiement intégral du loyer indiqué
    ci-dessus. Elle vaut décharge pour la période mentionnée.
  </p>

  <footer>
    Document généré le ${new Date().toLocaleDateString("fr-FR")}${appName ? ` — ${escapeHtmlQ(appName)}` : ""}
  </footer>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=850,height=900");
  if (!win) {
    // Popup bloquée — fallback téléchargement
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quittance-${reference}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
