import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceCoursesPage() {
  const { api } = useAuth();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/marathons/all');
        const sorted = [...(data.marathons || [])].sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name));
        setMarathons(sorted);
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
        Nos cours
      </h2>
      <p className="text-sm text-slate-500">Choisissez un cours pour voir sa situation financière</p>

      <div className="space-y-3">
        {marathons.map(m => (
          <button
            key={m.id}
            onClick={() => navigate(`/finance/${m.id}`)}
            data-testid={`finance-course-${m.id}`}
            className={`w-full bg-white border shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between ${m.active ? 'border-slate-200/60' : 'border-slate-200/40 opacity-60'}`}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {m.name}
                {!m.active && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Fermée</span>}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                  <Trophy className="w-3 h-3" />
                  {m.formation}
                </span>
                {m.end_date && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Début du cours: {m.end_date}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        ))}
        {marathons.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun cours pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
