import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Users, UserCheck, CheckCircle2, CircleDotDashed, CircleDashed,
  Wallet, Calendar, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';
import { buildPaymentsTablePdf } from '@/lib/paymentsTableExport';
import { slugifyFileName } from '@/lib/certificate';

export default function FinanceCourseDetailPage() {
  const { marathonId } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseEndDate, setCourseEndDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [rows, setRows] = useState(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/finance/overview', { params: { marathon_id: marathonId } });
      setOverview(data);
      setCourseEndDate(data.marathon?.course_end_date || '');
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api, marathonId]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const handleSaveCourseEndDate = async () => {
    setSavingDate(true);
    try {
      await api.put(`/marathons/${marathonId}`, { course_end_date: courseEndDate || null });
      toast.success('Date de fin enregistrée');
      fetchOverview();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement');
    }
    setSavingDate(false);
  };

  const toggleDetails = async () => {
    const next = !showDetails;
    setShowDetails(next);
    if (next && rows === null) {
      setLoadingRows(true);
      try {
        const { data } = await api.get('/payments/summary', { params: { marathon_id: marathonId } });
        setRows(data.rows || []);
      } catch {
        toast.error('Erreur chargement des détails');
      }
      setLoadingRows(false);
    }
  };

  const limit = overview?.participation_fee || 0;
  const totalPaid = (rows || []).reduce((s, r) => s + Number(r.participation_paid || 0), 0);
  const totalMissing = (rows || []).reduce((s, r) => s + Math.max(limit - Number(r.participation_paid || 0), 0), 0);

  const handleExport = () => {
    setExporting(true);
    try {
      const pdf = buildPaymentsTablePdf({
        title: 'Détail des paiements',
        subtitle: `${overview?.marathon?.name || ''}`,
        rows: (rows || []).map(r => ({
          full_name: `${r.full_name} (${r.vendeur_name})`,
          paid: formatAmount(r.participation_paid),
          missing: limit > 0 ? formatAmount(Math.max(limit - r.participation_paid, 0)) : '-'
        })),
        totalPaid,
        totalMissing,
        formatAmount
      });
      pdf.save(`Finance_${slugifyFileName(overview?.marathon?.name || '')}.pdf`);
    } catch (err) {
      toast.error(err.message || 'Erreur export');
    }
    setExporting(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!overview) return null;

  const m = overview.marathon;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="finance-course-detail-page">
      <button onClick={() => navigate('/finance')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800" data-testid="finance-back-btn">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h2>
        <p className="text-sm text-slate-500">{m.formation}</p>
      </div>

      {/* Course dates */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Début du cours</p>
          <p className="text-sm font-medium text-slate-800 mt-1">{m.end_date || 'Non défini'}</p>
        </div>
        <div>
          <Label className="text-xs text-slate-400">Fin du cours</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input type="date" value={courseEndDate || ''} onChange={e => setCourseEndDate(e.target.value)} className="h-9 rounded-lg w-[160px]" data-testid="course-end-date-input" />
            <Button size="sm" className="btn-primary h-9 text-xs" onClick={handleSaveCourseEndDate} disabled={savingDate} data-testid="save-course-end-date-btn">
              {savingDate ? '...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      {limit <= 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
          Aucune taxe de participation n'est définie pour ce cours (page Marathons).
        </div>
      )}

      {/* Report */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="finance-report">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
          <div className="flex items-center gap-1.5 text-slate-400"><Users className="w-3.5 h-3.5" /><p className="text-xs">Inscrits</p></div>
          <p className="text-xl font-bold text-slate-900 mt-1">{overview.total_inscrits}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
          <div className="flex items-center gap-1.5 text-emerald-500"><UserCheck className="w-3.5 h-3.5" /><p className="text-xs">Participants</p></div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{overview.total_participants}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
          <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /><p className="text-xs">Payé intégralement</p></div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{overview.payment_status.complete}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
          <div className="flex items-center gap-1.5 text-amber-500"><CircleDotDashed className="w-3.5 h-3.5" /><p className="text-xs">Payé partiellement</p></div>
          <p className="text-xl font-bold text-amber-600 mt-1">{overview.payment_status.partial}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-3">
          <div className="flex items-center gap-1.5 text-red-400"><CircleDashed className="w-3.5 h-3.5" /><p className="text-xs">Rien payé</p></div>
          <p className="text-xl font-bold text-red-500 mt-1">{overview.payment_status.none}</p>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Wallet className="w-4 h-4 text-blue-500" /> Recettes
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Inscriptions</p>
            <p className="text-lg font-bold text-slate-800">{formatAmount(overview.inscription_revenue)} HTG</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Participations</p>
            <p className="text-lg font-bold text-slate-800">{formatAmount(overview.participation_revenue)} HTG</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Recette totale à ce jour</p>
          <p className="text-2xl font-bold text-blue-700">{formatAmount(overview.total_revenue)} HTG</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
        <button onClick={toggleDetails} className="w-full flex items-center justify-between text-left" data-testid="finance-toggle-details">
          <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Voir la liste des inscrits et participants</h3>
          {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDetails && (
          loadingRows ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={handleExport} disabled={exporting} variant="outline" className="flex items-center gap-2 h-9 text-xs rounded-lg" data-testid="finance-export-btn">
                  <Download className="w-3.5 h-3.5" /> {exporting ? 'Export...' : 'Exporter PDF'}
                </Button>
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-medium">Nom</th>
                      <th className="py-2 font-medium">Vendeur</th>
                      <th className="py-2 font-medium text-right">Payé</th>
                      <th className="py-2 font-medium text-right">Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows || []).map(r => (
                      <tr key={r.lead_id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{r.full_name}</td>
                        <td className="py-2 text-slate-500">{r.vendeur_name}</td>
                        <td className="py-2 text-right text-slate-700">{formatAmount(r.participation_paid)} HTG</td>
                        <td className="py-2 text-right text-slate-700">
                          {limit > 0 ? `${formatAmount(Math.max(limit - r.participation_paid, 0))} HTG` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(rows || []).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Aucun participant pour ce cours</p>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
