import jsPDF from 'jspdf';

// Simple table renderer (no autotable dependency): draws a header row and
// striped body rows, paginating automatically when content overflows a page.
export function buildInscritosListPdf({ title, subtitle, rows, showVendeur }) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(30, 41, 59);
  pdf.text(title, margin, y);
  y += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(subtitle, margin, y);
  y += 22;

  const columns = [
    { key: '_idx', label: '#', width: 30 },
    { key: 'full_name', label: 'Nom complet', width: showVendeur ? 155 : 175 },
    { key: 'address', label: 'Adresse', width: showVendeur ? 190 : 230 },
    { key: 'phone', label: 'Téléphone', width: showVendeur ? 110 : 130 },
    { key: 'payment_method', label: 'Mode de paiement', width: showVendeur ? 125 : 145 },
    ...(showVendeur ? [{ key: 'vendeur_name', label: 'Vendeur', width: 110 }] : []),
  ];

  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const startX = margin;
  const rowHeight = 22;
  const headerHeight = 24;

  const drawHeader = () => {
    pdf.setFillColor(16, 185, 129);
    pdf.rect(startX, y, tableWidth, headerHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    let x = startX;
    columns.forEach(col => {
      pdf.text(col.label, x + 6, y + headerHeight - 8);
      x += col.width;
    });
    y += headerHeight;
  };

  // Normalize whitespace first (some records have odd spacing/characters),
  // then use jsPDF's own splitTextToSize so the fit check matches how the
  // text is actually measured/rendered — a manual char-by-char width loop
  // was under-truncating some values and letting them bleed into the next column.
  const truncate = (text, maxWidth) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const lines = pdf.splitTextToSize(clean, maxWidth);
    if (lines.length <= 1) return lines[0] || '';
    let first = lines[0];
    while (first.length > 1 && pdf.getTextWidth(first + '…') > maxWidth) first = first.slice(0, -1);
    return first + '…';
  };

  drawHeader();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  rows.forEach((row, i) => {
    if (y + rowHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      drawHeader();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
    }
    if (i % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(startX, y, tableWidth, rowHeight, 'F');
    }
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(startX, y, tableWidth, rowHeight);
    pdf.setTextColor(30, 41, 59);
    let x = startX;
    columns.forEach(col => {
      const value = col.key === '_idx' ? String(i + 1) : row[col.key];
      pdf.text(truncate(value, col.width - 12), x + 6, y + rowHeight - 7);
      if (x > startX) pdf.line(x, y, x, y + rowHeight);
      x += col.width;
    });
    y += rowHeight;
  });

  if (rows.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Aucun inscrit', startX + 6, y + 16);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`${rows.length} inscrit(s)`, margin, pageHeight - 16);

  return pdf;
}
