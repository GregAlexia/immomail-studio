import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ReceiptData {
  agencyName: string;
  ownerName: string;
  tenantName: string;
  propertyTitle: string;
  propertyAddress: string;
  periodLabel: string; // ex "juin 2026"
  monthlyRent: number;
  charges: number;
  issuedOn: string; // ex "5 juin 2026"
  city: string;
}

// Remplace les espaces fines/insécables (U+202F, U+00A0, U+2009) que l'encodage
// WinAnsi d'Helvetica ne sait pas représenter.
const S = (s: string) => s.replace(/[   ]/g, " ");
const eur = (n: number) =>
  S(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n));

// Génère une VRAIE quittance de loyer PDF (pdf-lib). Aucune dépendance externe.
export async function generateReceipt(data: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.1, 0.12, 0.16);
  const muted = rgb(0.42, 0.45, 0.5);
  const accent = rgb(0.13, 0.45, 0.42);
  const M = 56;
  let y = 786;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 11,
    f = font,
    color = ink
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  const total = data.monthlyRent + data.charges;

  // En-tête
  text(data.agencyName, M, y, 18, bold, accent);
  text("QUITTANCE DE LOYER", 595.28 - M - 200, y, 14, bold, ink);
  y -= 20;
  text("Quittance générée automatiquement", M, y, 9, font, muted);
  y -= 8;
  page.drawLine({
    start: { x: M, y },
    end: { x: 595.28 - M, y },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });
  y -= 30;

  text(`Période : ${data.periodLabel}`, M, y, 12, bold);
  text(`Émise le ${data.issuedOn}`, 595.28 - M - 150, y, 10, font, muted);
  y -= 34;

  // Parties
  text("BAILLEUR", M, y, 9, bold, muted);
  text("LOCATAIRE", 320, y, 9, bold, muted);
  y -= 16;
  text(data.ownerName, M, y, 11, font);
  text(data.tenantName, 320, y, 11, font);
  y -= 30;

  text("BIEN LOUÉ", M, y, 9, bold, muted);
  y -= 16;
  text(data.propertyTitle, M, y, 11, font);
  y -= 15;
  text(data.propertyAddress, M, y, 10, font, muted);
  y -= 34;

  // Tableau des montants
  page.drawRectangle({
    x: M,
    y: y - 86,
    width: 595.28 - 2 * M,
    height: 100,
    color: rgb(0.97, 0.98, 0.98),
    borderColor: rgb(0.88, 0.9, 0.92),
    borderWidth: 1,
  });
  const rx = 595.28 - M - 16;
  const rightAlign = (s: string, yy: number, f = font, size = 11) => {
    const w = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: rx - w, y: yy, size, font: f, color: ink });
  };
  let ry = y - 8;
  text("Loyer hors charges", M + 16, ry, 11, font);
  rightAlign(eur(data.monthlyRent), ry);
  ry -= 24;
  text("Provision pour charges", M + 16, ry, 11, font);
  rightAlign(eur(data.charges), ry);
  ry -= 14;
  page.drawLine({
    start: { x: M + 16, y: ry },
    end: { x: rx, y: ry },
    thickness: 0.5,
    color: rgb(0.8, 0.82, 0.85),
  });
  ry -= 22;
  text("TOTAL PERÇU", M + 16, ry, 12, bold);
  rightAlign(eur(total), ry, bold, 13);
  y -= 120;

  // Mention légale
  const mention = `Je soussigné(e), ${data.ownerName}, bailleur du logement désigné ci-dessus, déclare avoir reçu de ${data.tenantName} la somme de ${eur(total)} au titre du loyer et des charges pour la période de ${data.periodLabel}, et lui en donne quittance, sous réserve de tous mes droits.`;
  const wrap = (s: string, max: number, size: number, f = font): string[] => {
    const words = s.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > max) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  for (const line of wrap(mention, 595.28 - 2 * M, 10)) {
    text(line, M, y, 10, font, muted);
    y -= 15;
  }
  y -= 24;
  text(`Fait à ${data.city}, le ${data.issuedOn}`, M, y, 10, font);
  y -= 40;
  text("Signature du bailleur", 595.28 - M - 160, y, 10, font, muted);
  text(data.agencyName, 595.28 - M - 160, y - 16, 11, bold, accent);

  // Pied de page
  page.drawText(
    "Document de démonstration — ImmoMail Studio (données fictives)",
    { x: M, y: 40, size: 8, font, color: rgb(0.6, 0.62, 0.66) }
  );

  return doc.save();
}
