import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import ProgramSection from '@/components/ProgramSection';

export default function ProfesseurProgramPage() {
  const { marathonId } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [marathon, setMarathon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarathon = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/marathons/${marathonId}`);
      if (data.marathon?.professeur_id !== user.id) {
        toast.error('Ce cours ne vous est pas assigné');
        navigate('/mon-programme');
        return;
      }
      setMarathon(data.marathon);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, marathonId, user.id, navigate]);

  useEffect(() => { fetchMarathon(); }, [fetchMarathon]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!marathon) return null;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="professeur-program-page">
      <button onClick={() => navigate('/mon-programme')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour à mes cours
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{marathon.name}</h2>
            <p className="text-sm text-slate-500">{marathon.formation}</p>
          </div>
        </div>
      </div>

      <ProgramSection marathon={marathon} manage={false} />
    </div>
  );
}
