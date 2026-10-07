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
