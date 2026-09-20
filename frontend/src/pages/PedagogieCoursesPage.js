import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, ChevronRight, Search, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr, todayStr, isCourseCurrent, coursePhase, isModuleVisible } from '@/lib/finance';

export default function PedagogieCoursesPage() {
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
        // Attendance only matters once classes have actually started — a
        // course still in its enrollment window has no sessions to mark yet,
        // so it waits in "autres cours" instead of cluttering the main list.
        const isActiveNow = m => isCourseCurrent(m) && coursePhase(m) === 'active';
        const current = all.filter(isActiveNow).sort((a, b) => a.name.localeCompare(b.name));
        setOtherCourses(all.filter(m => !isActiveNow(m)).sort((a, b) => a.name.localeCompare(b.name)));

        const counts = await Promise.all(current.map(m =>
          api.get('/leads', { params: { marathon_id: m.id } }).then(r => (r.data.leads || []).filter(l => l.status === 'Inscrit' || l.status === 'Participant').length).catch(() => 0)
        ));
        setCurrentCourses(current.map((m, i) => ({ marathon: m, count: counts[i] })));
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
    <div className="p-4 md:p-6 space-y-5" data-testid="pedagogie-courses-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Présence aux cours
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Cours actifs, dont les séances ont déjà commencé</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentCourses.map(({ marathon: m, count }) => (
          <button
            key={m.id}
            onClick={() => navigate(`/pedagogie/${m.id}`)}
            data-testid={`pedagogie-course-${m.id}`}
            className="stat-card text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                    <GraduationCap className="w-3 h-3" />
                    {m.formation}
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cours Actif</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <Calendar className="w-3 h-3" />
              {formatDateFr(m.end_date) || '?'} - {formatDateFr(m.course_end_date) || '?'}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-2">
              <Users className="w-3.5 h-3.5" /> {count} inscrit{count > 1 ? 's' : ''}
            </p>
          </button>
        ))}
        {currentCourses.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun cours en cours pour le moment</p>
          </div>
        )}
      </div>

      {otherCourses.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
            data-testid="pedagogie-show-others"
          >
            <Search className="w-4 h-4" />
            {showOthers ? 'Masquer' : `Rechercher parmi les ${otherCourses.length} autres cours`}
          </button>
          {showOthers && (
            <div className="space-y-2 mt-3">
              {otherCourses.map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/pedagogie/${m.id}`)}
                  data-testid={`pedagogie-other-course-${m.id}`}
                  className="w-full bg-white border border-slate-200/40 opacity-80 shadow-sm rounded-2xl p-4 text-left hover:shadow-md hover:opacity-100 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {(m.start_date && todayStr() < m.start_date)
                        ? 'À venir'
                        : (m.course_end_date && todayStr() > m.course_end_date)
                          ? 'Terminée'
                          : isCourseCurrent(m) && coursePhase(m) === 'inscription'
                            ? "En période d'inscription"
                            : 'Sans date'}
                    </span>
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
