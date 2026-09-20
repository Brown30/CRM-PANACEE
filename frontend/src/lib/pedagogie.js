// Every Saturday and Sunday between two 'YYYY-MM-DD' dates (inclusive) — the
// default class-day pattern for a course, computed on the fly from the same
// end_date/course_end_date bounds the Finance module uses for "Cours Actif"
// (end_date = day the course itself starts, course_end_date = when it ends).
export const weekendDatesBetween = (start, end) => {
  if (!start || !end || start > end) return [];
  const dates = [];
  const d = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (d <= endD) {
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const dayLabel = (iso) => DAY_LABELS[new Date(iso + 'T00:00:00').getDay()];
