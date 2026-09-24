import { formatDateFr } from '@/lib/finance';
import { slugifyFileName } from '@/lib/certificate';

// Draws the programme (course header + one row per topic, Achevé/Inachevé)
// onto an offscreen canvas and triggers a PNG download — a plain visual
// record of what's been covered so far, without needing a PDF library.
export function downloadProgramImage(marathon, topics) {
  const width = 900;
  const rowHeight = 44;
  const headerHeight = 110;
  const padding = 24;
  const height = headerHeight + topics.length * rowHeight + padding;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(marathon.name, padding, 40);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(marathon.formation, padding, 65);

  const completedCount = topics.filter(t => t.completed).length;
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText(`${completedCount}/${topics.length} séances achevées (${progress}%)`, padding, 92);

  const truncate = (text, maxWidth) => {
    let t = text || '';
    while (t.length > 0 && ctx.measureText(t).width > maxWidth) t = t.slice(0, -1);
    return t.length < (text || '').length ? `${t}…` : t;
  };

  topics.forEach((topic, i) => {
    const rowY = headerHeight + i * rowHeight;
    ctx.fillStyle = topic.completed ? '#ecfdf5' : '#f8fafc';
    ctx.fillRect(padding - 4, rowY, width - (padding - 4) * 2, rowHeight - 8);

    // status pill
    ctx.fillStyle = topic.completed ? '#10b981' : '#94a3b8';
    ctx.fillRect(padding, rowY + 7, 86, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topic.completed ? 'Achevé' : 'Inachevé', padding + 43, rowY + 22);
    ctx.textAlign = 'left';

    // date
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText(formatDateFr(topic.date), padding + 100, rowY + 22);

    // title
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px sans-serif';
    const maxTitleWidth = width - padding - 210;
    ctx.fillText(truncate(topic.title, maxTitleWidth), padding + 175, rowY + 22);
  });

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Programme_${slugifyFileName(marathon.name)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
