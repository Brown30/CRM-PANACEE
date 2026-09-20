import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr } from '@/lib/finance';

export default function MesCoursProfesseurPage() {
  const { api, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/marathons/all');
        setCourses((data.marathons || []).filter(m => m.professeur_id === user.id).sort((a, b) => a.name.localeCompare(b.name)));
      } catch { toast.error('Erreur chargement'); }
      setLoading(false);
    })();
  }, [api, user.id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="mes-cours-professeur-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Mes cours</h2>
        <p className="text-sm text-slate-500 mt-0.5">Marquez les sujets réalisés pour chaque séance</p>
      </div>

      <div className="space-y-3">
        {courses.map(m => (
          <button
            key={m.id}
            onClick={() => navigate(`/mon-programme/${m.id}`)}
            data-testid={`professeur-course-${m.id}`}
            className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{m.formation}</p>
              {m.end_date && m.course_end_date && (
                <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <Calendar className="w-3 h-3" /> {formatDateFr(m.end_date)} - {formatDateFr(m.course_end_date)}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
        {courses.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun cours ne vous a encore été assigné</p>
          </div>
        )}
      </div>
    </div>
  );
}
