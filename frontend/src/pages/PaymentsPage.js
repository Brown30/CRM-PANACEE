import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Wallet, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';
import { INSCRIPTION_FEE, formatAmount } from '@/lib/finance';

export default function PaymentsPage() {
  const { api, user, selectedMarathon, isAdmin, isAdminPrincipal, canManagePayments } = useAuth();
  const [rows, setRows] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendeurFilter, setVendeurFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [amountDrafts, setAmountDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const limit = Number(selectedMarathon?.participation_fee || 0);

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (!isAdmin) params.vendeur_id = user.id;
      else if (vendeurFilter !== 'all') params.vendeur_id = vendeurFilter;
      const [payRes, vRes] = await Promise.all([
        api.get('/payments', { params }),
        isAdmin ? api.get('/users/vendeurs') : Promise.resolve({ data: { vendeurs: [] } })
      ]);
      setRows(payRes.data.rows || []);
      setVendeurs(vRes.data.vendeurs || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin, vendeurFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const vMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));

  const handleAdd = async (row) => {
    const raw = amountDrafts[row.lead_id];
    const amount = parseFloat(raw);
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    setSavingId(row.lead_id);
    try {
      await api.post('/payments', {
        lead_id: row.lead_id,
        marathon_id: selectedMarathon.id,
        amount,
        created_by: user.id,
        created_by_name: user.name
      });
      setAmountDrafts(prev => ({ ...prev, [row.lead_id]: '' }));
      toast.success('Paiement enregistré');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement');
    }
    setSavingId(null);
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await api.delete(`/payments/${paymentId}`);
      toast.success('Paiement supprimé');
      fetchData();
    } catch { toast.error('Erreur suppression'); }
  };

  const filtered = rows.filter(r => r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!selectedMarathon) return <NoMarathonFallback />;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="payments-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Wallet className="w-5 h-5 text-emerald-500" /> Paiements
        </h2>
      </div>

      <p className="text-sm text-slate-500">
        {selectedMarathon.name} — Inscription: {formatAmount(INSCRIPTION_FEE)} HTG (automatique)
        {limit > 0 && <> — Participation: {formatAmount(limit)} HTG</>}
      </p>

      {limit <= 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
          Aucune taxe de participation n'est définie pour cette marathon. Un admin doit la renseigner dans "Marathons" avant que les paiements de participation puissent être suivis.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un nom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl"
            data-testid="payments-search"
          />
        </div>
        {isAdmin && (
          <Select value={vendeurFilter} onValueChange={setVendeurFilter}>
            <SelectTrigger className="w-[200px] h-10 rounded-xl" data-testid="payments-vendeur-filter">
              <SelectValue placeholder="Vendeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les vendeurs</SelectItem>
              {vendeurs.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map(row => {
          const isComplete = limit > 0 && row.participation_paid >= limit;
          const isExpanded = expandedId === row.lead_id;
          return (
            <div key={row.lead_id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`payment-row-${row.lead_id}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{row.full_name}</p>
                  {isAdmin && vendeurFilter === 'all' && (
                    <p className="text-xs text-slate-400">{vMap[row.vendeur_id] || 'N/A'}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      Inscription: {formatAmount(INSCRIPTION_FEE)} HTG
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isComplete && <CheckCircle2 className="w-3 h-3" />}
                      Participation: {formatAmount(row.participation_paid)}{limit > 0 && <> / {formatAmount(limit)}</>} HTG
                    </span>
                  </div>
                </div>
                {row.payments.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setExpandedId(isExpanded ? null : row.lead_id)} data-testid={`payment-toggle-${row.lead_id}`}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {isExpanded && row.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  {row.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatAmount(p.amount)} HTG {p.created_by_name ? `— ${p.created_by_name}` : ''} {p.created_at ? `— ${new Date(p.created_at).toLocaleDateString('fr-FR')}` : ''}</span>
                      {isAdminPrincipal && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => handleDeletePayment(p.id)} data-testid={`delete-payment-${p.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canManagePayments && !isComplete && limit > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Montant"
                    value={amountDrafts[row.lead_id] || ''}
                    onChange={e => setAmountDrafts(prev => ({ ...prev, [row.lead_id]: e.target.value }))}
                    className="h-9 rounded-lg flex-1"
                    data-testid={`payment-amount-${row.lead_id}`}
                  />
                  <Button
                    type="button"
                    className="btn-primary h-9 px-3"
                    disabled={savingId === row.lead_id}
                    onClick={() => handleAdd(row)}
                    data-testid={`payment-add-${row.lead_id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun inscrit pour cette marathon</p>
          </div>
        )}
      </div>
    </div>
  );
}
