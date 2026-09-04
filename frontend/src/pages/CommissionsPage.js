import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Percent, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';
import { formatAmount } from '@/lib/finance';

export default function CommissionsPage() {
  const { api, user, selectedMarathon, isAdmin } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (!isAdmin) params.vendeur_id = user.id;
      const { data } = await api.get('/commissions', { params });
      setVendors(data.vendors || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!selectedMarathon) return <NoMarathonFallback />;

  const limit = Number(selectedMarathon.participation_fee || 0);
  const mine = !isAdmin ? vendors[0] : null;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="commissions-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Percent className="w-5 h-5 text-emerald-500" /> Commissions
      </h2>
      <p className="text-sm text-slate-500">{selectedMarathon.name}</p>

      {limit <= 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
          Aucune taxe de participation n'est définie pour cette marathon, donc aucune commission ne peut encore être calculée.
        </div>
      )}

      {!isAdmin && (
        mine ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3" data-testid="commission-card-mine">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" /> {mine.full_count} participant(s) payé(s) intégralement · {mine.pending_count} en attente
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Commission inscription</p>
                <p className="text-lg font-bold text-slate-800">{formatAmount(mine.inscription_commission)} HTG</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Commission participation</p>
                <p className="text-lg font-bold text-slate-800">{formatAmount(mine.participation_commission)} HTG</p>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Commission totale</p>
              <p className="text-2xl font-bold text-emerald-700">{formatAmount(mine.total_commission)} HTG</p>
            </div>
            {mine.potential_commission > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl p-3 text-sm">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Il te manque encore {formatAmount(mine.potential_commission)} HTG de commission potentielle si les inscrits en attente complètent leur paiement.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Percent className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucune commission pour cette marathon</p>
          </div>
        )
      )}

      {isAdmin && (
        <div className="space-y-2">
          {vendors.map(v => (
            <div key={v.vendeur_id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`commission-row-${v.vendeur_id}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{v.vendeur_name}</p>
                  <p className="text-xs text-slate-400">{v.full_count} payé(s) intégralement · {v.pending_count} en attente</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-emerald-700">{formatAmount(v.total_commission)} HTG</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                <span>Inscription: {formatAmount(v.inscription_commission)} HTG</span>
                <span>Participation: {formatAmount(v.participation_commission)} HTG</span>
                {v.potential_commission > 0 && <span className="text-blue-600">Potentiel: {formatAmount(v.potential_commission)} HTG</span>}
              </div>
            </div>
          ))}
          {vendors.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Percent className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Aucune commission pour cette marathon</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
