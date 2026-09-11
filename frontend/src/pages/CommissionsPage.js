import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, Users, UserCheck, CheckCircle2, CircleDotDashed, CircleDashed, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';
import { buildPaymentsTablePdf } from '@/lib/paymentsTableExport';
import { slugifyFileName } from '@/lib/certificate';

export default function CommissionsPage() {
  const { api, user, isAdmin } = useAuth();
  const [marathons, setMarathons] = useState([]);
  const [marathonId, setMarathonId] = useState('');
  const [vendeurs, setVendeurs] = useState([]);
  const [vendeurFilter, setVendeurFilter] = useState('all');
  const [loadingMarathons, setLoadingMarathons] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [summary, setSummary] = useState(null);
  const [commissionVendors, setCommissionVendors] = useState([]);
  const [limit, setLimit] = useState(0);

  const selectedMarathon = marathons.find(m => m.id === marathonId) || null;

  useEffect(() => {
    (async () => {
      try {
        const [mRes, vRes] = await Promise.all([
          api.get('/marathons/all'),
          isAdmin ? api.get('/users/vendeurs') : Promise.resolve({ data: { vendeurs: [] } })
        ]);
        const sorted = [...(mRes.data.marathons || [])].sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name));
        setMarathons(sorted);
        setVendeurs(vRes.data.vendeurs || []);
      } catch { toast.error('Erreur chargement'); }
      setLoadingMarathons(false);
    })();
  }, [api, isAdmin]);

  const fetchReport = useCallback(async () => {
    if (!marathonId) return;
    setLoadingReport(true);
    try {
      const params = { marathon_id: marathonId };
      if (!isAdmin) params.vendeur_id = user.id;
      else if (vendeurFilter !== 'all') params.vendeur_id = vendeurFilter;
      const [sumRes, commRes] = await Promise.all([
        api.get('/payments/summary', { params }),
        api.get('/commissions', { params })
      ]);
      setSummary(sumRes.data);
      setCommissionVendors(commRes.data.vendors || []);
      setLimit(Number(commRes.data.participation_fee || 0));
    } catch { toast.error('Erreur chargement du rapport'); }
    setLoadingReport(false);
  }, [api, marathonId, isAdmin, user, vendeurFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const rows = summary?.rows || [];
  const getPaymentStatus = (row) => {
    if (row.participation_paid <= 0) return 'none';
    if (limit > 0 && row.participation_paid >= limit) return 'complete';
    return 'partial';
  };
  const statusCounts = rows.reduce((acc, r) => {
    acc[getPaymentStatus(r)]++;
    return acc;
  }, { complete: 0, partial: 0, none: 0 });
  const totalPaid = rows.reduce((s, r) => s + Number(r.participation_paid || 0), 0);
  const totalMissing = rows.reduce((s, r) => s + Math.max(limit - Number(r.participation_paid || 0), 0), 0);

  const mine = !isAdmin ? commissionVendors[0] : null;
  const showVendeurColumn = isAdmin && vendeurFilter === 'all';

  const handleExport = () => {
    setExporting(true);
    try {
      const vendorLabel = !isAdmin
        ? (user?.name || '')
        : vendeurFilter !== 'all'
          ? (vendeurs.find(v => v.id === vendeurFilter)?.name || '')
          : 'Tous les vendeurs';
      const pdf = buildPaymentsTablePdf({
        title: 'Paiement & Commission',
        subtitle: `${selectedMarathon?.name || ''} — ${vendorLabel}`,
        rows: rows.map(r => ({
          full_name: showVendeurColumn ? `${r.full_name} (${r.vendeur_name})` : r.full_name,
          paid: formatAmount(r.participation_paid),
          missing: limit > 0 ? formatAmount(Math.max(limit - r.participation_paid, 0)) : '-'
        })),
        totalPaid,
        totalMissing,
        formatAmount
      });
      pdf.save(`Paiement_Commission_${slugifyFileName(selectedMarathon?.name || '')}_${slugifyFileName(vendorLabel)}.pdf`);
    } catch (err) {
      toast.error(err.message || 'Erreur export');
    }
    setExporting(false);
  };

  if (loadingMarathons) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="commissions-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Percent className="w-5 h-5 text-emerald-500" /> Paiement & Commission
      </h2>

      <div className="flex flex-wrap gap-3">
        <Select value={marathonId} onValueChange={setMarathonId}>
          <SelectTrigger className="w-full max-w-sm h-10 rounded-xl" data-testid="commission-marathon-select">
            <SelectValue placeholder="Choisir une marathon..." />
          </SelectTrigger>
          <SelectContent>
            {marathons.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}{!m.active ? ' (fermée)' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && marathonId && (
          <Select value={vendeurFilter} onValueChange={setVendeurFilter}>
            <SelectTrigger className="w-[200px] h-10 rounded-xl" data-testid="commission-vendeur-filter">
              <SelectValue placeholder="Vendeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les vendeurs</SelectItem>
              {vendeurs.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {!marathonId && (
        <div className="text-center py-16 text-slate-400">
          <Percent className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Choisissez une marathon pour voir le rapport</p>
        </div>
      )}

      {marathonId && loadingReport && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {marathonId && !loadingReport && summary && (
        <>
          {limit <= 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
              Aucune taxe de participation n'est définie pour cette marathon, donc aucune commission ne peut encore être calculée.
            </div>
          )}

          {/* Report */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="commission-report">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5" /><p className="text-xs">Inscrits</p>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{summary.total_inscrits}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <UserCheck className="w-3.5 h-3.5" /><p className="text-xs">Participants</p>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-1">{summary.total_participants}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" /><p className="text-xs">Payé intégralement</p>
              </div>
              <p className="text-xl font-bold text-emerald-600 mt-1">{statusCounts.complete}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-amber-500">
                <CircleDotDashed className="w-3.5 h-3.5" /><p className="text-xs">Payé partiellement</p>
              </div>
              <p className="text-xl font-bold text-amber-600 mt-1">{statusCounts.partial}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-red-400">
                <CircleDashed className="w-3.5 h-3.5" /><p className="text-xs">Rien payé</p>
              </div>
              <p className="text-xl font-bold text-red-500 mt-1">{statusCounts.none}</p>
            </div>
          </div>

          {/* Commission */}
          {!isAdmin && (
            mine ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3" data-testid="commission-card-mine">
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
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Déjà à recevoir</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatAmount(mine.total_commission)} HTG</p>
                </div>
                {mine.potential_commission > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl p-3 text-sm">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>Tu pourrais recevoir {formatAmount(mine.total_commission + mine.potential_commission)} HTG au total si tout le monde paie ({formatAmount(mine.potential_commission)} HTG de plus).</span>
                  </div>
                )}
              </div>
            ) : null
          )}

          {isAdmin && commissionVendors.length > 0 && (
            <div className="space-y-2">
              {commissionVendors.map(v => (
                <div key={v.vendeur_id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`commission-row-${v.vendeur_id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{v.vendeur_name}</p>
                      <p className="text-xs text-slate-400">{v.full_count} payé(s) intégralement · {v.pending_count} en attente</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Déjà à recevoir</p>
                      <p className="text-lg font-bold text-emerald-700">{formatAmount(v.total_commission)} HTG</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span>Inscription: {formatAmount(v.inscription_commission)} HTG</span>
                    <span>Participation: {formatAmount(v.participation_commission)} HTG</span>
                    {v.potential_commission > 0 && <span className="text-blue-600">Potentiel si tout paie: +{formatAmount(v.potential_commission)} HTG</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment table */}
          {rows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3" data-testid="commission-payment-table">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Détail des paiements
                </h3>
                <Button onClick={handleExport} disabled={exporting} variant="outline" className="flex items-center gap-2 h-9 text-xs rounded-lg" data-testid="export-payments-table-btn">
                  <Download className="w-3.5 h-3.5" /> {exporting ? 'Export...' : 'Exporter PDF'}
                </Button>
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-medium">Nom</th>
                      {showVendeurColumn && <th className="py-2 font-medium">Vendeur</th>}
                      <th className="py-2 font-medium text-right">Payé</th>
                      <th className="py-2 font-medium text-right">Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.lead_id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{r.full_name}</td>
                        {showVendeurColumn && <td className="py-2 text-slate-500">{r.vendeur_name}</td>}
                        <td className="py-2 text-right text-slate-700">{formatAmount(r.participation_paid)} HTG</td>
                        <td className="py-2 text-right text-slate-700">
                          {limit > 0 ? `${formatAmount(Math.max(limit - r.participation_paid, 0))} HTG` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Total payé: <span className="font-semibold text-slate-800">{formatAmount(totalPaid)} HTG</span></span>
                <span className="text-slate-500">Total restant: <span className="font-semibold text-slate-800">{formatAmount(totalMissing)} HTG</span></span>
              </div>
            </div>
          )}

          {rows.length === 0 && (!isAdmin ? !mine : commissionVendors.length === 0) && (
            <div className="text-center py-16 text-slate-400">
              <Percent className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Aucun participant pour cette marathon</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
