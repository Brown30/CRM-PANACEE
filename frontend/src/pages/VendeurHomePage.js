import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Percent, LogOut, ChevronRight } from 'lucide-react';

export default function VendeurHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" data-testid="vendeur-home-page">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500">Bonjour,</p>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {user?.name}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} data-testid="logout-btn" className="text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Où voulez-vous aller ?
          </h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/select-marathon')}
            data-testid="vendeur-goto-commercial"
            className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Commercial</p>
              <p className="text-xs text-slate-400 mt-0.5">Leads, promesses, ranking, objectifs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>

          <button
            onClick={() => navigate('/paiement-commission')}
            data-testid="vendeur-goto-commission"
            className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Paiement et Commission</p>
              <p className="text-xs text-slate-400 mt-0.5">Tes inscrits, tes participants, et ta commission par cours</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
