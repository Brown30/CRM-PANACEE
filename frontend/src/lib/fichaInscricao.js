import jsPDF from 'jspdf';

const TEMPLATE_SRC = '/fichas/recu_rabais.png';

// Positions as a fraction of the (square) template image, tuned against
// RECU_RABAIS_PANACEE_ASSINADO.png. Adjust here if the template changes.
const NAME_POS = { xPct: 0.44, yPct: 0.417 };
const FORMATION_POS = { xPct: 0.12, yPct: 0.508 };
const DATE_POS = { xPct: 0.69, yPct: 0.590 };

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// The template is a 2613x2613 photo-style PNG; re-encoding a canvas that size
// losslessly (canvas.toDataURL('image/png')) produced ~20-27MB PDFs. Downscaling
// to this max dimension and exporting as JPEG keeps it sharp on screen/print
// while landing around 250-300KB.
const MAX_DIM = 1400;

export async function buildFichaInscricaoPdf({ fullName, formation, dateStr }) {
  const bg = await loadImage(TEMPLATE_SRC);

  const canvas = document.createElement('canvas');
  let width = bg.width;
  let height = bg.height;
  if (Math.max(width, height) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0, width, height);

  ctx.fillStyle = '#1e3a5f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const drawFilledField = ({ xPct, yPct }, text, fontSizePct, maxWidthPct) => {
    let fontSize = Math.round(canvas.height * fontSizePct);
    ctx.font = `600 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
    if (maxWidthPct) {
      const maxWidth = canvas.width * maxWidthPct;
      while (ctx.measureText(text).width > maxWidth && fontSize > 14) {
        fontSize -= 1;
        ctx.font = `600 ${fontSize}px 'Segoe UI', Arial, sans-serif`;
      }
    }
    ctx.fillText(text, canvas.width * xPct, canvas.height * yPct);
  };

  drawFilledField(NAME_POS, fullName, 0.028, 0.47);
  drawFilledField(FORMATION_POS, formation, 0.028, 0.75);
  drawFilledField(DATE_POS, dateStr, 0.026, 0.28);

  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
  return pdf;
}
