import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, ClipboardList, Wallet, LayoutDashboard, Users, Trophy, RefreshCw, Banknote } from 'lucide-react';

export default function ProfesseurLayout() {
  const { user, logout, canViewCommercial, selectedMarathon, selectMarathon } = useAuth();
  const navigate = useNavigate();

  const handleChangeMarathon = () => {
    if (!selectMarathon(null)) return;
    navigate('/select-marathon');
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="professeur-layout">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-teal-600 font-semibold leading-none">{user?.title || 'Responsable'}</p>
              <p className="font-bold text-slate-900 text-base leading-tight mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="professeur-header-name">
                {user?.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500 h-9 w-9" data-testid="professeur-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-2 flex items-center gap-2 flex-wrap">
          <NavLink
            to="/mon-programme"
            end
            className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
            data-testid="professeur-nav-cours"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Mes cours
          </NavLink>
          <NavLink
            to="/mon-programme/finance"
            className={({ isActive }) => `text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm transition-all hover:brightness-110 ${isActive ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
            data-testid="professeur-nav-finance"
          >
            <Wallet className="w-3.5 h-3.5" /> Finance
          </NavLink>
          {canViewCommercial && (
            <>
              <NavLink
                to="/mon-programme/dashboard"
                className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                data-testid="professeur-nav-dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </NavLink>
              <NavLink
                to="/mon-programme/leads"
                className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                data-testid="professeur-nav-leads"
              >
                <Users className="w-3.5 h-3.5" /> Leads
              </NavLink>
              <NavLink
                to="/mon-programme/paiements"
                className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                data-testid="professeur-nav-paiements"
              >
                <Banknote className="w-3.5 h-3.5" /> Paiements
              </NavLink>
              <NavLink
                to="/mon-programme/classement"
                className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                data-testid="professeur-nav-classement"
              >
                <Trophy className="w-3.5 h-3.5" /> Classement
              </NavLink>
              {selectedMarathon && (
                <button onClick={handleChangeMarathon} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 ml-auto" data-testid="professeur-change-marathon">
                  <RefreshCw className="w-3 h-3" /> {selectedMarathon.name}
                </button>
              )}
            </>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
