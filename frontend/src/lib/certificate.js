import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const CERTIFICATE_TEMPLATES = {
  'Installation de caméra de surveillance': '/certificates/camera.png',
  'Électricité': '/certificates/electricite.png',
  'Rolling Door': '/certificates/rideaux.png',
};

const NAME_POS = { xPct: 0.5, yPct: 0.436 };
const DATE_POS = { xPct: 0.5, yPct: 0.93 };
const QR_POS = { xPct: 0.895, yPct: 0.72, sizePct: 0.085 };

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

const waitForFonts = async () => {
  if (document.fonts) {
    await Promise.all([
      document.fonts.load("bold 100px 'Cormorant SC'"),
      document.fonts.load("500 30px 'Montserrat'"),
    ]);
    await document.fonts.ready;
  }
};

export async function buildCertificatePdf({ fullName, formation, dateStr, verifyUrl }) {
  const templateSrc = CERTIFICATE_TEMPLATES[formation];
  if (!templateSrc) {
    throw new Error(`Aucun modèle de certificat pour la formation "${formation}"`);
  }

  await waitForFonts();
  const bg = await loadImage(templateSrc);

  const canvas = document.createElement('canvas');
  canvas.width = bg.width;
  canvas.height = bg.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bg, 0, 0);

  ctx.fillStyle = '#7ED956';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nameText = fullName.toUpperCase();
  const maxNameWidth = canvas.width * 0.72;
  let nameFontSize = Math.round(canvas.height * 0.052);
  ctx.font = `bold ${nameFontSize}px 'Cormorant SC'`;
  while (ctx.measureText(nameText).width > maxNameWidth && nameFontSize > 20) {
    nameFontSize -= 2;
    ctx.font = `bold ${nameFontSize}px 'Cormorant SC'`;
  }
  ctx.fillText(nameText, canvas.width * NAME_POS.xPct, canvas.height * NAME_POS.yPct);

  ctx.fillStyle = '#555555';
  ctx.font = `500 ${Math.round(canvas.height * 0.018)}px 'Montserrat'`;
  ctx.fillText(`Délivré le ${dateStr}`, canvas.width * DATE_POS.xPct, canvas.height * DATE_POS.yPct);

  // JPEG-compress the decorative background/name/date (photo-like content, compresses
  // well); the PDF was previously ~6MB because canvas.toDataURL('image/png') re-encodes
  // losslessly and is far less efficient than the original template file's compression.
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

  // QR code is added as its own lossless PNG layer on top, not baked into the JPEG —
  // its fine black/white pattern needs to stay crisp to remain scannable.
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 400, color: { dark: '#222222' } });
  const qrSize = canvas.width * QR_POS.sizePct;
  pdf.addImage(
    qrDataUrl,
    'PNG',
    canvas.width * QR_POS.xPct - qrSize / 2,
    canvas.height * QR_POS.yPct - qrSize / 2,
    qrSize,
    qrSize
  );

  return pdf;
}

export function slugifyFileName(fullName) {
  return fullName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
