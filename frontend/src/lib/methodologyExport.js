import jsPDF from 'jspdf';

// The rich-text editor stores HTML — strip it down to readable plain text
// (keeping paragraph/list breaks) rather than trying to reproduce bold/lists
// in the PDF, matching how the rest of the app's exports stay plain-text.
const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<\/p>|<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// One or several methodologies (each with title/formation/body/objections),
// one per PDF page.
export function buildMethodologyPdf(methodologies) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeParagraph = (text, { fontSize = 11, style = 'normal', color = [30, 41, 59], lineGap = 15 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(lineGap);
      doc.text(line, margin, y);
      y += lineGap;
    }
  };

  methodologies.forEach((m, idx) => {
    if (idx > 0) { doc.addPage(); y = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(16, 185, 129);
    const titleLines = doc.splitTextToSize(m.title || 'Méthodologie', maxWidth);
    titleLines.forEach(line => { doc.text(line, margin, y); y += 20; });

    if (m.formation) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(m.formation, margin, y);
      y += 18;
    }
    y += 6;

    const bodyText = htmlToText(m.body);
    if (bodyText) writeParagraph(bodyText);

    if ((m.objections || []).length > 0) {
      y += 10;
      ensureSpace(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Objections & Réponses', margin, y);
      y += 20;

      m.objections.forEach(o => {
        const q = htmlToText(o.question);
        const a = htmlToText(o.answer);
        if (q) writeParagraph(q, { style: 'bold', fontSize: 11 });
        if (a) writeParagraph(a, { fontSize: 11 });
        y += 10;
      });
    }
  });

  return doc;
}
