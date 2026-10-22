import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign, AlertTriangle, CheckCircle2, Users, GraduationCap, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, formatDateFr, isCourseCurrent } from '@/lib/finance';

export default function FinanceCaixaPage() {
  const { api } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  // Scenario toggle for optional (sócio) salaries — included by default, but
  // this is a "what if we pay / don't pay" simulation, not stored state.
  const [excludedOptionalIds, setExcludedOptionalIds] = useState(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cashData }, { data: expData }, { data: usersData }, { data: marathonsData }] = await Promise.all([
        api.get('/cash/summary'),
        api.get('/expenses'),
        api.get('/users'),
        api.get('/marathons/all')
      ]);
      setSummary(cashData);
      setExpenses(expData.expenses || []);
      setUsers(usersData.users || []);
      setMarathons(marathonsData.marathons || []);
    } catch {
      toast.error('Erreur chargement de la trésorerie');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeProfIds = useMemo(() => {
    const ids = new Set();
    marathons.filter(isCourseCurrent).forEach(m => (m.professeur_ids || []).forEach(id => ids.add(id)));
    return ids;
  }, [marathons]);

  const toggleOptional = (id) => {
    setExcludedOptionalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!summary) return null;

  const balance = Number(summary.balance) || 0;

  // Salaries sourced straight from the user record — the single source of
  // truth for anyone with a CRM login and a salaire_fixe set (avoids the old
  // duplication with a separate Dépenses entry for the same person).
  const usersFixed = users.filter(u => u.active !== false && Number(u.salaire_fixe) > 0);
  const usersFixedTotal = usersFixed.reduce((s, u) => s + Number(u.salaire_fixe), 0);

  const activeExpenses = expenses.filter(e => e.active !== false);
  const fixedExpenses = activeExpenses.filter(e => (e.cost_type || 'fixed') === 'fixed');
  const optionalExpenses = activeExpenses.filter(e => e.cost_type === 'optional');
  const conditionalExpenses = activeExpenses.filter(e => e.cost_type === 'conditional_professor');
  const periodicExpenses = activeExpenses.filter(e => e.cost_type === 'periodic');

  const fixedExpensesTotal = fixedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const optionalExpensesTotal = optionalExpenses.filter(e => !excludedOptionalIds.has(e.id)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const conditionalExpensesTotal = conditionalExpenses.filter(e => activeProfIds.has(e.professeur_id)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const periodicExpensesTotal = periodicExpenses.reduce((s, e) => s + (Number(e.amount) || 0) / (Number(e.period_months) || 1), 0);

  const fixedCostsTotal = usersFixedTotal + fixedExpensesTotal + optionalExpensesTotal + conditionalExpensesTotal + periodicExpensesTotal;
  const projected = balance - fixedCostsTotal;
  const isDanger = projected < 0;
  const isTight = !isDanger && fixedCostsTotal > 0 && projected < fixedCostsTotal * 0.2;

  const movements = [...summary.entries].filter(e => e.type !== 'opening_balance').reverse();

  return (
    <div className="p-4 md:p-6 space-y-5" data-testid="finance-caixa-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Trésorerie</h2>
        <p className="text-sm text-slate-500 mt-0.5">La réalité de notre caisse, suivie mouvement par mouvement depuis le {formatDateFr(summary.opening_date)}</p>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm p-5 text-white">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5" /> Solde de caisse actuel
        </p>
        <p className="text-3xl font-bold mt-1" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="caixa-balance">
          {formatAmount(balance)} <span className="text-base font-normal text-slate-400">HTG</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">Solde initial du {formatDateFr(summary.opening_date)} : {formatAmount(summary.opening_balance)} HTG</p>
      </div>

      <div className={`rounded-2xl shadow-sm p-4 border ${isDanger ? 'bg-red-50 border-red-200' : isTight ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`} data-testid="caixa-projection">
        <div className="flex items-start gap-2.5">
          {isDanger ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> : isTight ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
          <div>
            <p className={`text-sm font-semibold ${isDanger ? 'text-red-700' : isTight ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isDanger
                ? 'Attention : si on paie tous les coûts fixes sélectionnés, la caisse devient négative'
                : isTight
                ? 'Prudence : la caisse reste positive, mais avec peu de marge après ces coûts'
                : 'Basé sur notre flux de caisse, ces coûts peuvent être payés sans inquiétude'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Coûts fixes du mois : {formatAmount(fixedCostsTotal)} HTG · Solde projeté après paiement : {formatAmount(projected)} HTG
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-4" data-testid="caixa-cost-breakdown">
        <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Détail des coûts fixes du mois</h3>

        {usersFixed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5"><Users className="w-3.5 h-3.5" /> Salaires (depuis la fiche utilisateur) — {formatAmount(usersFixedTotal)} HTG</p>
            <div className="space-y-1">
              {usersFixed.map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs text-slate-600 px-2 py-1">
                  <span>{u.name}</span><span className="font-medium">{formatAmount(u.salaire_fixe)} HTG</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {fixedExpenses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Coûts fixes obligatoires — {formatAmount(fixedExpensesTotal)} HTG</p>
            <div className="space-y-1">
              {fixedExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs text-slate-600 px-2 py-1">
                  <span>{e.label}</span><span className="font-medium">{formatAmount(e.amount)} HTG</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {optionalExpenses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Coûts optionnels (associés) — décochez pour simuler sans</p>
            <div className="space-y-1">
              {optionalExpenses.map(e => (
                <label key={e.id} className="flex items-center justify-between text-xs text-slate-600 px-2 py-1 cursor-pointer" data-testid={`caixa-optional-${e.id}`}>
                  <span className="flex items-center gap-2">
                    <Checkbox checked={!excludedOptionalIds.has(e.id)} onCheckedChange={() => toggleOptional(e.id)} />
                    {e.label}
                  </span>
                  <span className="font-medium">{formatAmount(e.amount)} HTG</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {conditionalExpenses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5"><GraduationCap className="w-3.5 h-3.5" /> Professeurs (payés s'ils ont un cours en cours) — {formatAmount(conditionalExpensesTotal)} HTG</p>
            <div className="space-y-1">
              {conditionalExpenses.map(e => {
                const hasCourse = activeProfIds.has(e.professeur_id);
                return (
                  <div key={e.id} className="flex items-center justify-between text-xs px-2 py-1">
                    <span className="text-slate-600">{e.label}</span>
                    <span className="flex items-center gap-2">
                      <span className={hasCourse ? 'text-emerald-600' : 'text-slate-400'}>{hasCourse ? 'Cours en cours' : 'Sans cours actuellement'}</span>
                      <span className={`font-medium ${hasCourse ? 'text-slate-700' : 'text-slate-300 line-through'}`}>{formatAmount(e.amount)} HTG</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {periodicExpenses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5"><CalendarClock className="w-3.5 h-3.5" /> Coûts périodiques (dilués au mois) — {formatAmount(periodicExpensesTotal)} HTG</p>
            <div className="space-y-1">
              {periodicExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs text-slate-600 px-2 py-1">
                  <span>{e.label} {e.next_due_date && <span className="text-slate-400">(prochaine échéance {formatDateFr(e.next_due_date)})</span>}</span>
                  <span className="font-medium">{formatAmount((Number(e.amount) || 0) / (Number(e.period_months) || 1))} HTG/mois</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {usersFixed.length === 0 && activeExpenses.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Aucun coût fixe configuré</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid="caixa-movements">
        <h3 className="font-semibold text-slate-800 text-sm mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Mouvements récents</h3>
        <div className="space-y-1.5">
          {movements.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50 text-sm" data-testid={`caixa-movement-${m.id}`}>
              <div className="flex items-center gap-2 min-w-0">
                {m.amount >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-slate-700 truncate">{m.description || m.category}</p>
                  <p className="text-xs text-slate-400">{formatDateFr(m.entry_date)}</p>
                </div>
              </div>
              <span className={`font-semibold shrink-0 ${m.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {m.amount >= 0 ? '+' : ''}{formatAmount(m.amount)} HTG
              </span>
            </div>
          ))}
          {movements.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <CircleDollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Aucun mouvement encore enregistré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
