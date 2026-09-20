// Flat registration fee, paid automatically the moment a lead becomes "Inscrit".
export const INSCRIPTION_FEE = 1000;
export const INSCRIPTION_COMMISSION_RATE = 0.15;
export const PARTICIPATION_COMMISSION_RATE = 0.05;

// Displays amounts the way the school reads them: a dot as the thousands
// separator (e.g. 10000 -> "10.000") rather than a comma or space.
export const formatAmount = (n) => Math.round(Number(n) || 0).toLocaleString('de-DE');

// 'YYYY-MM-DD' (from a <input type="date">/Postgres date) -> 'DD/MM/YYYY'.
export const formatDateFr = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const todayStr = () => new Date().toISOString().split('T')[0];

// A course counts as "current" for finance purposes while today falls
// between the enrollment start date and the course's actual end date.
// Independent of the marathon's active flag — a marathon can be closed to
// new leads/vendors while the course it funded is still running and still
// collecting payments. Missing a bound just leaves that side open.
export const isCourseCurrent = (m) => {
  const today = todayStr();
  if (m.start_date && today < m.start_date) return false;
  if (m.course_end_date && today > m.course_end_date) return false;
  return true;
};

// Within the current window, a course is still in two very different
// phases: selling/enrolling (up to end_date, the marathon's own end — same
// day the course itself starts) or actually running (end_date to
// course_end_date). Independent of the active flag too.
export const coursePhase = (m) => (m.end_date && todayStr() < m.end_date) ? 'inscription' : 'active';

// Courses in these formations stay fully usable in the CRM (leads, ranking,
// etc.) but are left out of the Finance module entirely — they aren't
// tracked there.
export const FINANCE_EXCLUDED_FORMATIONS = ['Rolling Door'];
export const isFinanceVisible = (m) => !FINANCE_EXCLUDED_FORMATIONS.includes(m.formation);
