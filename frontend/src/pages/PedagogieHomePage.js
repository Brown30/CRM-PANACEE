import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ClipboardList, ChevronRight } from 'lucide-react';

export default function PedagogieHomePage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 space-y-5" data-testid="pedagogie-home-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Pédagogie et Contrôle
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Que voulez-vous gérer ?</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/pedagogie/presence')}
          data-testid="pedagogie-goto-presence"
          className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Présence</p>
            <p className="text-xs text-slate-400 mt-0.5">Marquer les présences et suivre le taux de participation par cours</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        <button
          onClick={() => navigate('/pedagogie/programme')}
          data-testid="pedagogie-goto-programme"
          className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Programme</p>
            <p className="text-xs text-slate-400 mt-0.5">Assigner un professeur et suivre l'avancement du programme par cours</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
}
