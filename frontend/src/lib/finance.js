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
