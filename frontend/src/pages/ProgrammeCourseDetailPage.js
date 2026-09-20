import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ClipboardList, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr } from '@/lib/finance';
import ProgramSection from '@/components/ProgramSection';

export default function ProgrammeCourseDetailPage() {
  const { marathonId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [marathon, setMarathon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarathon = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/marathons/${marathonId}`);
      setMarathon(data.marathon);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, marathonId]);

  useEffect(() => { fetchMarathon(); }, [fetchMarathon]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!marathon) return null;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="programme-course-detail-page">
      <button onClick={() => navigate('/pedagogie/programme')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{marathon.name}</h2>
            <p className="text-sm text-slate-500">{marathon.formation}</p>
          </div>
        </div>
        {marathon.end_date && marathon.course_end_date && (
          <p className="flex items-center gap-1 text-xs text-slate-400 mt-3">
            <Calendar className="w-3.5 h-3.5" /> {formatDateFr(marathon.end_date)} - {formatDateFr(marathon.course_end_date)}
          </p>
        )}
      </div>

      <ProgramSection marathon={marathon} manage onMarathonUpdate={setMarathon} />
    </div>
  );
}
