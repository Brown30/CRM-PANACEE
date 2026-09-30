import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, LayoutDashboard, LogOut, ArrowLeft, TrendingUp } from 'lucide-react';

export default function FinanceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="finance-layout">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Module Financier</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 text-xs rounded-lg flex items-center gap-1.5 text-slate-500" onClick={() => navigate(-1)} data-testid="finance-go-back">
              <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg flex items-center gap-1.5" onClick={() => navigate('/choose-module')} data-testid="finance-switch-module">
              <LayoutDashboard className="w-3.5 h-3.5" /> Changer de module
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500 h-9 w-9" data-testid="finance-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-2 flex items-center gap-2">
          <NavLink
            to="/finance"
            end
            className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
            data-testid="finance-nav-overview"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Vue d'ensemble
          </NavLink>
          <NavLink
            to="/finance/despesas"
            className={({ isActive }) => `text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
            data-testid="finance-nav-despesas"
          >
            <Wallet className="w-3.5 h-3.5" /> Dépenses
          </NavLink>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
      <p className="text-center text-xs text-slate-300 py-4">{user?.name}</p>
    </div>
  );
}
