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
// etc.) but are left out of the Finance and Pédagogie modules entirely — no
// real weekend/curriculum structure tracked there.
export const MODULE_EXCLUDED_FORMATIONS = ['Rolling Door'];
export const isModuleVisible = (m) => !MODULE_EXCLUDED_FORMATIONS.includes(m.formation);

// Rolling Door never counts toward commission/payroll — a permanent,
// formation-wide exclusion. Windows and Sheetrock used to be blanket-excluded
// here too, but that's now handled per vendeur/marathon instead (see
// commission_exclusions, managed from Payroll's "Détail par cours"), since a
// blanket rule meant a course couldn't even be reviewed to decide vendor by
// vendor whether it should count yet.
export const COMMISSION_EXCLUDED_FORMATIONS = ['Rolling Door'];
export const isCommissionVisible = (m) => !COMMISSION_EXCLUDED_FORMATIONS.includes(m.formation);

// 'YYYY-MM' (from a <input type="month"> or stored payroll month) -> 'Mois Année'.
const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const monthLabelFr = (month) => {
  if (!month) return '';
  const [y, m] = month.split('-');
  return `${MONTH_NAMES_FR[Number(m) - 1] || m} ${y}`;
};
