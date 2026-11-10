import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, CircleDotDashed, CircleDashed, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';
import { formatAmount } from '@/lib/finance';
import { buildPaymentsTablePdf, buildPaymentsTableImage, downloadDataUrl } from '@/lib/paymentsTableExport';
import { slugifyFileName } from '@/lib/certificate';

// Read-only: no add/edit/delete payment action anywhere here. Built for a
// coordinator role (e.g. a professeur granted canViewCommercial) that needs
// to see who paid, how much, and who's still owed — across any course, not
// just the two or three a professeur normally has finance access to.
export default function PaymentsOverviewPage() {
  const { api, selectedMarathon } = useAuth();
  const [rows, setRows] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [limit, setLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) { setLoading(false); return; }
    setLoading(true);
    try {
      const [payRes, vRes, marRes] = await Promise.all([
        api.get('/payments', { params: { marathon_id: selectedMarathon.id } }),
        api.get('/users/vendeurs'),
        api.get(`/marathons/${selectedMarathon.id}`)
      ]);
      setRows(payRes.data.rows || []);
      setVendeurs(vRes.data.vendeurs || []);
      setLimit(Number(marRes.data.marathon?.participation_fee || 0));
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!selectedMarathon) return <NoMarathonFallback />;

  const vendeurMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));

  const getStatus = (row) => {
    if (row.participation_paid <= 0) return 'none';
    if (limit > 0 && row.participation_paid >= limit) return 'complete';
    return 'partial';
  };
  const STATUS_LABEL = { complete: 'Payé intégralement', partial: 'Payé partiellement', none: 'Rien payé' };
  const counts = rows.reduce((acc, r) => { acc[getStatus(r)]++; return acc; }, { complete: 0, partial: 0, none: 0 });

  const totalPaid = rows.reduce((s, r) => s + Number(r.participation_paid || 0), 0);
  const totalMissing = rows.reduce((s, r) => s + Math.max(limit - Number(r.participation_paid || 0), 0), 0);

  const exportRows = () => rows.map(r => ({
    full_name: `${r.full_name} (${vendeurMap[r.vendeur_id] || 'N/A'})`,
    status: STATUS_LABEL[getStatus(r)],
    paid: formatAmount(r.participation_paid),
    missing: limit > 0 ? formatAmount(Math.max(limit - r.participation_paid, 0)) : '-'
  }));

  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const pdf = buildPaymentsTablePdf({
        title: 'Détail des paiements', subtitle: selectedMarathon.name,
        rows: exportRows(), totalPaid, totalMissing, formatAmount, showStatus: true
      });
      pdf.save(`Paiements_${slugifyFileName(selectedMarathon.name)}.pdf`);
    } catch (err) { toast.error(err.message || 'Erreur export'); }
    setExportingPdf(false);
  };

  const handleExportImage = () => {
    setExportingImage(true);
    try {
      const dataUrl = buildPaymentsTableImage({
        title: 'Détail des paiements', subtitle: selectedMarathon.name,
        rows: exportRows(), totalPaid, totalMissing, formatAmount, showStatus: true
      });
      downloadDataUrl(dataUrl, `Paiements_${slugifyFileName(selectedMarathon.name)}.png`);
    } catch (err) { toast.error(err.message || 'Erreur export'); }
    setExportingImage(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="payments-overview-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Wallet className="w-5 h-5 text-blue-500" /> Paiements
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble en lecture seule — {selectedMarathon.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPdf} variant="outline" className="h-9 text-xs flex items-center gap-1.5 rounded-xl" disabled={exportingPdf} data-testid="payments-overview-export-pdf">
            <Download className="w-3.5 h-3.5" /> {exportingPdf ? 'Export...' : 'PDF'}
          </Button>
          <Button onClick={handleExportImage} variant="outline" className="h-9 text-xs flex items-center gap-1.5 rounded-xl" disabled={exportingImage} data-testid="payments-overview-export-image">
            <ImageIcon className="w-3.5 h-3.5" /> {exportingImage ? 'Export...' : 'Image'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /><p className="text-xs">Payé intégralement</p></div>
              <p className="text-xl font-bold text-emerald-600 mt-1">{counts.complete}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-amber-500"><CircleDotDashed className="w-3.5 h-3.5" /><p className="text-xs">Payé partiellement</p></div>
              <p className="text-xl font-bold text-amber-600 mt-1">{counts.partial}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center gap-1.5 text-red-400"><CircleDashed className="w-3.5 h-3.5" /><p className="text-xs">Rien payé</p></div>
              <p className="text-xl font-bold text-red-500 mt-1">{counts.none}</p>
            </div>
          </div>

          <div className="space-y-2">
            {rows.map(row => {
              const status = getStatus(row);
              const missing = limit > 0 ? Math.max(limit - row.participation_paid, 0) : null;
              return (
                <div key={row.lead_id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`payments-overview-row-${row.lead_id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{row.full_name}</p>
                      <p className="text-xs text-slate-400">{vendeurMap[row.vendeur_id] || 'N/A'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'complete' ? 'bg-emerald-50 text-emerald-700' : status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        {STATUS_LABEL[status]}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatAmount(row.participation_paid)}{limit > 0 && <> / {formatAmount(limit)}</>} HTG
                        {missing > 0 && <span className="text-red-500"> · doit {formatAmount(missing)}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-medium">Aucun participant pour ce cours</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
