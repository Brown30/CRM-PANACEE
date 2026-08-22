import jsPDF from 'jspdf';

// Placeholder layout, drawn directly with jsPDF (no background template yet).
// Swap this out once a visual model is provided — the calling code (LeadsPage)
// doesn't need to change, only what happens inside buildFichaInscricaoPdf.
export function buildFichaInscricaoPdf({ fullName, formation, dateStr, vendorName }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 0, width, 32, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('PANACÉE ÉDUCATION', width / 2, 14, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text("Fich Enskripsyon", width / 2, 23, { align: 'center' });

  pdf.setTextColor(30, 41, 59);
  let y = 48;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Non konplè :', 15, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(fullName, 15, y + 7);

  y += 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Fòmasyon :', 15, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(formation, 15, y + 7);

  y += 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Dat :', 15, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(dateStr, 15, y + 7);

  y += 22;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  const confirmText = `${fullName} konfime enskripsyon li nan fòmasyon "${formation}" nan Panacée Éducation.`;
  pdf.text(confirmText, 15, y, { maxWidth: width - 30 });

  if (vendorName) {
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Jenere pa ${vendorName}`, width / 2, height - 10, { align: 'center' });
  }

  return pdf;
}
