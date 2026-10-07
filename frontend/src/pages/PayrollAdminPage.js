import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Banknote, ChevronDown, ChevronUp, Trash2, CheckCircle2, EyeOff, Eye, Table } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, monthLabelFr } from '@/lib/finance';

export default function PayrollAdminPage() {
  const { api, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState(null);

  const [payingVendeur, setPayingVendeur] = useState(null);
  const [month, setMonth] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchVendeurs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vRes } = await api.get('/users/vendeurs');
      const list = vRes.vendeurs || [];
      const totals = await Promise.all(list.map(v =>
        api.get('/commissions/total', { params: { vendeur_id: v.id } }).then(r => r.data).catch(() => ({ total_commission: 0, breakdown: [] }))
      ));
      setVendeurs(list.map((v, i) => ({ ...v, commission: totals[i].total_commission || 0, breakdown: totals[i].breakdown || [] })));
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchVendeurs(); }, [fetchVendeurs]);

  const toggleHistory = async (v) => {
    if (expandedId === v.id) { setExpandedId(null); return; }
    setExpandedId(v.id);
    if (history[v.id]) return;
    setHistoryLoading(v.id);
    try {
      const { data } = await api.get('/commissions/history', { params: { vendeur_id: v.id } });
      setHistory(prev => ({ ...prev, [v.id]: data.history || [] }));
    } catch { toast.error('Erreur chargement historique'); }
    setHistoryLoading(null);
  };

  const openPay = (v) => {
    setPayingVendeur(v);
    setMonth('');
    setAmount(String(Math.round(v.commission)));
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    if (!month) { toast.error('Mois requis'); return; }
    setSaving(true);
    try {
      await api.post('/commissions/mark-paid', {
        vendeur_id: payingVendeur.id, month, amount: Number(amount)
      });
      toast.success('Commission marquée comme payée');
      setPayingVendeur(null);
      setHistory(prev => { const next = { ...prev }; delete next[payingVendeur.id]; return next; });
      fetchVendeurs();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
    setSaving(false);
  };

  const refreshVendeur = async (vendeurId) => {
    try {
      const { data } = await api.get('/commissions/total', { params: { vendeur_id: vendeurId } });
      setVendeurs(prev => prev.map(v => v.id === vendeurId ? { ...v, commission: data.total_commission || 0, breakdown: data.breakdown || [] } : v));
    } catch { toast.error('Erreur chargement'); }
  };

  const handleToggleExclusion = async (v, marathonId, excluded) => {
    try {
      await api.post('/commissions/toggle-exclusion', { vendeur_id: v.id, marathon_id: marathonId, excluded });
      toast.success(excluded ? 'Cours exclu de sa commission' : 'Cours réintégré à sa commission');
      refreshVendeur(v.id);
    } catch (err) { toast.error(err.message || 'Erreur'); }
  };

  const handleDeletePayment = async (v, paymentId) => {
    try {
      await api.delete(`/commissions/payments/${paymentId}`);
      toast.success('Paiement annulé');
      const { data } = await api.get('/commissions/history', { params: { vendeur_id: v.id } });
      setHistory(prev => ({ ...prev, [v.id]: data.history || [] }));
      fetchVendeurs();
    } catch { toast.error('Erreur annulation'); }
  };

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
    <div className="p-4 md:p-6 space-y-4" data-testid="payroll-admin-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Banknote className="w-5 h-5 text-emerald-500" /> Payroll
        </h2>
        <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg flex items-center gap-1.5" onClick={() => navigate('/payroll/resume')} data-testid="payroll-summary-link">
          <Table className="w-3.5 h-3.5" /> Fiche de paie (tableau)
        </Button>
      </div>
      <p className="text-sm text-slate-500">Commission à recevoir par vendeur, tous cours confondus. Marquer comme payée la retire d'ici et l'ajoute à l'historique du vendeur.</p>

      <div className="space-y-2">
        {vendeurs.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`payroll-vendeur-${v.id}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{v.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Fixe {formatAmount(v.salaire_fixe ?? 15000)} HTG</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Commission à recevoir</p>
                  <p className="text-lg font-bold text-emerald-700">{formatAmount(v.commission)} HTG</p>
                </div>
                <Button
                  onClick={() => openPay(v)}
                  disabled={v.commission <= 0}
                  className="btn-primary h-9 text-xs flex items-center gap-1.5"
                  data-testid={`mark-paid-${v.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Marquer payée
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <button onClick={() => toggleHistory(v)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" data-testid={`toggle-history-${v.id}`}>
                Historique {expandedId === v.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setExpandedBreakdownId(expandedBreakdownId === v.id ? null : v.id)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800" data-testid={`toggle-breakdown-${v.id}`}>
                Détail par cours {expandedBreakdownId === v.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {expandedBreakdownId === v.id && (
              <div className="mt-2 space-y-1.5">
                {v.breakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Aucun cours pour le moment</p>
                ) : (
                  v.breakdown.map(b => (
                    <div key={b.marathon_id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${b.excluded ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} data-testid={`breakdown-row-${v.id}-${b.marathon_id}`}>
                      <span className="text-slate-600 truncate mr-2">{b.marathon_name}{b.excluded && <span className="ml-1.5 text-amber-600 font-medium">(exclu)</span>}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-medium ${b.excluded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{formatAmount(b.commission)} HTG</span>
                        <button
                          onClick={() => handleToggleExclusion(v, b.marathon_id, !b.excluded)}
                          className={b.excluded ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-red-500'}
                          title={b.excluded ? 'Réintégrer ce cours dans sa commission' : 'Exclure ce cours de sa commission'}
                          data-testid={`toggle-exclusion-${v.id}-${b.marathon_id}`}
                        >
                          {b.excluded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {expandedId === v.id && (
              <div className="mt-2 space-y-1.5">
                {historyLoading === v.id ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (history[v.id] || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Aucune commission payée pour le moment</p>
                ) : (
                  (history[v.id] || []).map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs" data-testid={`history-row-${h.id}`}>
                      <span className="text-slate-600">{monthLabelFr(h.month)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{formatAmount(h.amount)} HTG</span>
                        <button onClick={() => handleDeletePayment(v, h.id)} className="text-slate-400 hover:text-red-500" data-testid={`delete-history-${h.id}`} title="Annuler ce paiement">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
        {vendeurs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Banknote className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun vendeur</p>
          </div>
        )}
      </div>

      <Dialog open={!!payingVendeur} onOpenChange={(open) => !open && setPayingVendeur(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Marquer la commission comme payée</DialogTitle>
            <DialogDescription>{payingVendeur?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkPaid} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Mois du paiement</Label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field mt-1" data-testid="payroll-month-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Montant (HTG)</Label>
              <Input type="number" min="0" step="1" value={amount} onChange={e => setAmount(e.target.value)} className="input-field mt-1" data-testid="payroll-amount-input" required />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setPayingVendeur(null)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" disabled={saving} data-testid="payroll-submit-btn">{saving ? 'Enregistrement...' : 'Confirmer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
