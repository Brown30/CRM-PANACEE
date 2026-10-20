import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, formatDateFr } from '@/lib/finance';

export default function FinanceCaixaPage() {
  const { api } = useAuth();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cashData }, { data: expData }] = await Promise.all([
        api.get('/cash/summary'),
        api.get('/expenses')
      ]);
      setSummary(cashData);
      setExpenses(expData.expenses || []);
    } catch {
      toast.error('Erreur chargement de la trésorerie');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!summary) return null;

  const balance = Number(summary.balance) || 0;
  // Worst-case look-ahead: every active fixed cost, paid in full — a
  // placeholder threshold the admin asked to refine later, but usable now.
  const fixedCostsTotal = expenses.filter(e => e.active !== false).reduce((s, e) => s + (Number(e.amount) || 0), 0);
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
                ? 'Attention : si tous les coûts fixes actifs sont payés, la caisse devient négative'
                : isTight
                ? 'Prudence : la caisse reste positive, mais avec peu de marge après les coûts fixes'
                : 'Basé sur notre flux de caisse, les coûts fixes peuvent être payés sans inquiétude'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Coûts fixes actifs : {formatAmount(fixedCostsTotal)} HTG · Solde projeté après paiement : {formatAmount(projected)} HTG
            </p>
          </div>
        </div>
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
