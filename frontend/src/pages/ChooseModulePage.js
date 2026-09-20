import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Wallet, GraduationCap, LogOut, ChevronRight } from 'lucide-react';

export default function ChooseModulePage() {
  const { user, logout, canAccessFinance, canAccessPedagogie } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" data-testid="choose-module-page">
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
            Choisir un module
          </h2>
          <p className="text-sm text-slate-500">Où voulez-vous aller ?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/select-marathon')}
            data-testid="choose-crm-btn"
            className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>CRM Commercial</p>
              <p className="text-xs text-slate-400 mt-0.5">Leads, ventes, présence, paiements par vendeur</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>

          {canAccessFinance && (
            <button
              onClick={() => navigate('/finance')}
              data-testid="choose-finance-btn"
              className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Module Financier</p>
                <p className="text-xs text-slate-400 mt-0.5">Vue d'ensemble des finances de l'école</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}

          {canAccessPedagogie && (
            <button
              onClick={() => navigate('/pedagogie')}
              data-testid="choose-pedagogie-btn"
              className="w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Pédagogie et Contrôle</p>
                <p className="text-xs text-slate-400 mt-0.5">Présence aux cours, programmes des professeurs</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
