import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, ChevronRight, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';

export default function FinanceCoursesPage() {
  const { api } = useAuth();
  const [activeCourses, setActiveCourses] = useState([]);
  const [closedCourses, setClosedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/marathons/all');
        const all = data.marathons || [];
        const active = all.filter(m => m.active).sort((a, b) => a.name.localeCompare(b.name));
        setClosedCourses(all.filter(m => !m.active).sort((a, b) => a.name.localeCompare(b.name)));

        // The landing page shows real numbers right away instead of gating on a
        // course picker — one /finance/overview call per active course, combined
        // into the school-wide totals below.
        const overviews = await Promise.all(active.map(m =>
          api.get('/finance/overview', { params: { marathon_id: m.id } }).then(r => r.data).catch(() => null)
        ));
        setActiveCourses(active.map((m, i) => ({ marathon: m, overview: overviews[i] })));
      } catch { toast.error('Erreur chargement'); }
      setLoading(false);
    })();
  }, [api]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="finance-courses-page">
      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Vue d'ensemble
      </h2>

      {/* Per-course breakdown */}
      <div className="space-y-3">
        {activeCourses.map(({ marathon: m, overview: o }) => (
          <button
            key={m.id}
            onClick={() => navigate(`/finance/${m.id}`)}
            data-testid={`finance-course-${m.id}`}
            className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium mt-1">
                  <Trophy className="w-3 h-3" />
                  {m.formation}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </div>
            {o && (
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Inscription: <span className="font-semibold text-slate-800">{formatAmount(o.inscription_revenue)} HTG</span></span>
                <span className="text-slate-500">Participation: <span className="font-semibold text-slate-800">{formatAmount(o.participation_revenue)} HTG</span></span>
                <span className="text-slate-500">Total: <span className="font-semibold text-blue-700">{formatAmount(o.total_revenue)} HTG</span></span>
              </div>
            )}
            <p className="text-xs text-blue-600 font-medium mt-2">Voir plus d'informations →</p>
          </button>
        ))}
        {activeCourses.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun cours actif pour le moment</p>
          </div>
        )}
      </div>

      {/* Closed courses — still reachable in case payments are still being collected */}
      {closedCourses.length > 0 && (
        <div className="pt-2">
          <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer w-fit mb-3">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={e => setShowClosed(e.target.checked)}
              className="w-4 h-4"
              data-testid="finance-show-closed"
            />
            Afficher les {closedCourses.length} cours fermé{closedCourses.length > 1 ? 's' : ''}
          </label>
          {showClosed && (
            <div className="space-y-2">
              {closedCourses.map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/finance/${m.id}`)}
                  data-testid={`finance-closed-course-${m.id}`}
                  className="w-full bg-white border border-slate-200/40 opacity-70 shadow-sm rounded-2xl p-4 text-left hover:shadow-md transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Fermée</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
