import jsPDF from 'jspdf';

// Same manual header+striped-rows table renderer used for the inscritos list
// (see inscritosExport.js), sized for a simple 3-column payment breakdown
// instead: name, amount paid, amount still owed.
export function buildPaymentsTablePdf({ title, subtitle, rows, totalPaid, totalMissing, formatAmount }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
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
    { key: 'full_name', label: 'Nom complet', width: 280 },
    { key: 'paid', label: 'Payé (HTG)', width: 100 },
    { key: 'missing', label: 'Reste à payer (HTG)', width: 105 },
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

  const truncate = (text, maxWidth) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const safeWidth = maxWidth * 0.92;
    if (pdf.getTextWidth(clean) <= safeWidth) return clean;
    let t = clean;
    while (t.length > 1 && pdf.getTextWidth(t + '…') > safeWidth) t = t.slice(0, -1);
    return t + '…';
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
    pdf.text('Aucun participant', startX + 6, y + 16);
    y += 24;
  }

  y += 16;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);
  pdf.text(`Total payé: ${formatAmount(totalPaid)} HTG`, margin, y);
  y += 18;
  pdf.text(`Total restant à payer: ${formatAmount(totalMissing)} HTG`, margin, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`${rows.length} participant(s)`, margin, pageHeight - 16);

  return pdf;
}
