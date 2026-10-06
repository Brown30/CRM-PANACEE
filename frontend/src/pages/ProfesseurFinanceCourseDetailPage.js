import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Users, UserCheck, CheckCircle2, CircleDotDashed, CircleDashed,
  Wallet, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, formatDateFr, coursePhase } from '@/lib/finance';

// Read-only — a professeur granted finance access to a specific course can
// see its numbers, but never edit anything here (that stays admin-only on
// the full Finance module's own course detail page).
export default function ProfesseurFinanceCourseDetailPage() {
  const { marathonId } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, summaryRes] = await Promise.all([
        api.get('/finance/overview', { params: { marathon_id: marathonId } }),
        api.get('/payments/summary', { params: { marathon_id: marathonId } })
      ]);
      const marathon = overviewRes.data.marathon;
      if (!(marathon?.finance_viewer_ids || []).includes(user.id)) {
        toast.error('Cet accès financier ne vous est pas accordé');
        navigate('/mon-programme/finance');
        return;
      }
      setOverview(overviewRes.data);
      setSummary(summaryRes.data);
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api, marathonId, user.id, navigate]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const rows = summary?.rows || [];
  const limit = overview?.participation_fee || 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!overview) return null;

  const m = overview.marathon;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="professeur-finance-course-detail-page">
      <button onClick={() => navigate('/mon-programme/finance')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </button>

      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h2>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-sm text-slate-500">{m.formation}</p>
          {coursePhase(m) === 'inscription' ? (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">En période d'inscription</span>
          ) : (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cours Actif</span>
          )}
        </div>
        {m.end_date && m.course_end_date && (
          <p className="flex items-center gap-1 text-xs text-slate-400 mt-2">
            <Calendar className="w-3.5 h-3.5" /> {formatDateFr(m.end_date)} - {formatDateFr(m.course_end_date)}
          </p>
        )}
      </div>

      {/* Report */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between text-left" data-testid="professeur-finance-toggle-details">
          <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Voir la liste des participants et paiements en cours</h3>
          {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDetails && (
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
                {rows.map(r => (
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
            {rows.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Aucun participant pour ce cours</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
