import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Trophy, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CertificatsPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: marathonsData } = await api.get('/marathons/all');
      const marathons = marathonsData.marathons || [];
      const results = await Promise.all(marathons.map(async (m) => {
        const { data } = await api.get('/leads', { params: { marathon_id: m.id, status: 'Participant' } });
        return { marathon: m, count: (data.leads || []).length };
      }));
      setCourses(results.filter(c => c.count > 0));
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="certificats-page">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <Award className="w-5 h-5 text-emerald-500" /> Certificats
      </h2>
      <p className="text-sm text-slate-500">Choisissez un cours pour voir ses participants et générer leurs certificats</p>

      {courses.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Aucun participant pour le moment</p>
          <p className="text-xs mt-1">Les leads passent en statut "Participant" pour apparaître ici</p>
        </div>
      )}

      <div className="space-y-3">
        {courses.map(({ marathon, count }) => (
          <button
            key={marathon.id}
            onClick={() => navigate(`/certificats/${marathon.id}`)}
            className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
            data-testid={`certificats-course-${marathon.id}`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{marathon.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{marathon.formation}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {count} participant{count > 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
