import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, monthLabelFr } from '@/lib/finance';

const currentMonth = () => new Date().toISOString().slice(0, 7);

// A clean, printable table — built to be screenshotted and sent to
// comptabilité, not to be edited here. Combines two separate sources that
// otherwise never appear together: vendeurs (salaire fixe + commission,
// tracked on users.salaire_fixe / /commissions/total) and everyone else's
// recurring salary (the Dépenses module's expenses/expense_entries).
export default function PayrollSummaryPage() {
  const { api, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [vendeurs, setVendeurs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const month = currentMonth();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    // Fetched independently — vendeurs, expenses and expense_entries are
    // unrelated tables, so one missing/erroring (e.g. a migration not run
    // yet) shouldn't blank out the parts that do work.
    try {
      const { data: vRes } = await api.get('/users/vendeurs');
      const vendeurList = (vRes.vendeurs || []).filter(v => v.active !== false);
      const totals = await Promise.all(vendeurList.map(v =>
        api.get('/commissions/total', { params: { vendeur_id: v.id } }).then(r => r.data).catch(() => ({ total_commission: 0 }))
      ));
      setVendeurs(vendeurList.map((v, i) => ({ ...v, commission: totals[i].total_commission || 0 })));
    } catch (err) { toast.error(`Vendeurs: ${err.message || 'erreur'}`); }
    try {
      const { data: expRes } = await api.get('/expenses');
      setExpenses(expRes.expenses || []);
    } catch (err) { toast.error(`Dépenses: ${err.message || 'erreur'}`); }
    try {
      const { data: entRes } = await api.get('/expenses/entries', { params: { month } });
      setEntries(entRes.entries || []);
    } catch (err) { toast.error(`Dépenses (validation du mois): ${err.message || 'erreur'}`); }
    setLoading(false);
  }, [api, month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // A salaire déjà suivi côté vendeur (users.salaire_fixe + commission) ne
  // doit pas aussi apparaître comme une dépense générique — sinon la même
  // personne serait comptée deux fois dans le total.
  const vendeurNames = useMemo(() => new Set(vendeurs.map(v => v.name.toLowerCase())), [vendeurs]);
  const entryFor = useMemo(() => {
    const map = {};
    for (const e of entries) map[e.expense_id] = e;
    return map;
  }, [entries]);

  const staffRows = expenses
    .filter(e => e.active !== false && !vendeurNames.has(e.label.toLowerCase()))
    .map(e => {
      const entry = entryFor[e.id];
      if (entry) return { label: e.label, category: e.category, amount: entry.amount, pending: !entry.confirmed, variable: e.variable };
      if (e.variable) return { label: e.label, category: e.category, amount: null, pending: true, variable: true };
      return { label: e.label, category: e.category, amount: e.amount, pending: true, variable: false };
    });

  const vendeurRows = vendeurs.map(v => ({
    label: v.name,
    category: 'Vendeur',
    fixe: Number(v.salaire_fixe ?? 15000),
    commission: v.commission,
    amount: Number(v.salaire_fixe ?? 15000) + v.commission
  }));

  const totalGeneral = vendeurRows.reduce((s, r) => s + r.amount, 0) + staffRows.reduce((s, r) => s + (r.amount || 0), 0);
  const hasPending = staffRows.some(r => r.pending);

  if (!isAdmin) return (
    <div className="p-4 md:p-6 text-center py-20 text-slate-400">
      <p className="font-medium">Accès non autorisé</p>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="payroll-summary-page">
      <button onClick={() => navigate('/payroll')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Banknote className="w-5 h-5 text-emerald-500" /> Fiche de paie — {monthLabelFr(month)}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Tout le monde à payer, en un seul tableau — prêt pour une capture d'écran</p>
      </div>

      {hasPending && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
          Au moins un salaire n'est pas encore confirmé pour {monthLabelFr(month)} (voir "à valider" ci-dessous) — allez dans Finance → Dépenses pour le valider.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
        <table className="w-full text-sm" data-testid="payroll-summary-table">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
              <th className="py-2.5 px-4 font-semibold">Nom</th>
              <th className="py-2.5 px-4 font-semibold">Catégorie</th>
              <th className="py-2.5 px-4 font-semibold text-right">Fixe</th>
              <th className="py-2.5 px-4 font-semibold text-right">Commission</th>
              <th className="py-2.5 px-4 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {vendeurRows.map(r => (
              <tr key={`v-${r.label}`} className="border-b border-slate-100" data-testid={`payroll-summary-row-${r.label}`}>
                <td className="py-2.5 px-4 text-slate-800 font-medium">{r.label}</td>
                <td className="py-2.5 px-4 text-slate-500">{r.category}</td>
                <td className="py-2.5 px-4 text-right text-slate-700">{formatAmount(r.fixe)}</td>
                <td className="py-2.5 px-4 text-right text-slate-700">{formatAmount(r.commission)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{formatAmount(r.amount)}</td>
              </tr>
            ))}
            {staffRows.map(r => (
              <tr key={`s-${r.label}`} className="border-b border-slate-100" data-testid={`payroll-summary-row-${r.label}`}>
                <td className="py-2.5 px-4 text-slate-800 font-medium">{r.label}</td>
                <td className="py-2.5 px-4 text-slate-500">{r.category}</td>
                <td className="py-2.5 px-4 text-right text-slate-700" colSpan={2}>
                  {r.amount === null ? (
                    <span className="text-amber-600 text-xs">À calculer (variable)</span>
                  ) : r.pending ? (
                    <span className="text-amber-600">{formatAmount(r.amount)} <span className="text-xs">(à valider)</span></span>
                  ) : (
                    formatAmount(r.amount)
                  )}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{r.amount !== null ? formatAmount(r.amount) : '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white">
              <td className="py-3 px-4 font-bold" colSpan={4}>Total général</td>
              <td className="py-3 px-4 text-right font-bold text-lg">{formatAmount(totalGeneral)} HTG</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
