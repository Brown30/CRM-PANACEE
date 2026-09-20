import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { Trophy, ChevronRight, AlertTriangle, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, formatDateFr, todayStr, isCourseCurrent, coursePhase, isModuleVisible } from '@/lib/finance';

export default function FinanceCoursesPage() {
  const { api } = useAuth();
  const [currentCourses, setCurrentCourses] = useState([]);
  const [otherCourses, setOtherCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOthers, setShowOthers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/marathons/all');
        const all = (data.marathons || []).filter(isModuleVisible);
        const current = all.filter(isCourseCurrent).sort((a, b) => a.name.localeCompare(b.name));
        setOtherCourses(all.filter(m => !isCourseCurrent(m)).sort((a, b) => a.name.localeCompare(b.name)));

        const overviews = await Promise.all(current.map(m =>
          api.get('/finance/overview', { params: { marathon_id: m.id } }).then(r => r.data).catch(() => null)
        ));
        setCurrentCourses(current.map((m, i) => ({ marathon: m, overview: overviews[i] })));
      } catch { toast.error('Erreur chargement'); }
      setLoading(false);
    })();
  }, [api]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // One bar per course (total revenue) instead of a grouped two-series chart —
  // reads much more clearly once there are several courses at once.
  const chartData = currentCourses.map(({ marathon: m, overview: o }) => ({
    name: m.name,
    Total: o?.total_revenue || 0
  }));

  return (
    <div className="p-4 md:p-6 space-y-5" data-testid="finance-courses-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Vue d'ensemble
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Cours actuellement ouverts, entre le début des inscriptions et la fin du cours</p>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Recette totale par cours</h3>
          <div style={{ height: Math.max(currentCourses.length * 46, 120) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={formatAmount} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94A3B8" width={130} />
                <Tooltip formatter={(v) => `${formatAmount(v)} HTG`} />
                <Bar dataKey="Total" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={22}>
                  <LabelList dataKey="Total" position="right" formatter={formatAmount} style={{ fontSize: 11, fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentCourses.map(({ marathon: m, overview: o }) => (
          <button
            key={m.id}
            onClick={() => navigate(`/finance/${m.id}`)}
            data-testid={`finance-course-${m.id}`}
            className="stat-card text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    <Trophy className="w-3 h-3" />
                    {m.formation}
                  </span>
                  {coursePhase(m) === 'inscription' ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">En période d'inscription</span>
                  ) : (
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cours Actif</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <Calendar className="w-3 h-3" />
              {formatDateFr(m.start_date) || '?'} - {formatDateFr(m.course_end_date) || '?'}
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {formatAmount(o?.total_revenue || 0)} <span className="text-sm font-normal text-slate-400">HTG</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Inscription: {formatAmount(o?.inscription_revenue || 0)} · Participation: {formatAmount(o?.participation_revenue || 0)}
            </p>
            {!m.course_end_date && (
              <p className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                <AlertTriangle className="w-3 h-3" /> Définir la date de fin du cours
              </p>
            )}
          </button>
        ))}
        {currentCourses.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun cours en cours pour le moment</p>
          </div>
        )}
      </div>

      {/* Everything outside the current window: not yet started, or past its
          course end date — still reachable, just not front and center. */}
      {otherCourses.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
            data-testid="finance-show-others"
          >
            <Search className="w-4 h-4" />
            {showOthers ? 'Masquer' : `Rechercher parmi les ${otherCourses.length} autres cours`}
          </button>
          {showOthers && (
            <div className="space-y-2 mt-3">
              {otherCourses.map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/finance/${m.id}`)}
                  data-testid={`finance-other-course-${m.id}`}
                  className="w-full bg-white border border-slate-200/40 opacity-80 shadow-sm rounded-2xl p-4 text-left hover:shadow-md hover:opacity-100 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {(m.start_date && todayStr() < m.start_date)
                        ? 'À venir'
                        : (m.course_end_date && todayStr() > m.course_end_date)
                          ? 'Terminée'
                          : 'Sans date'}
                    </span>
                    {m.active === false && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Fermée aux ventes</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
