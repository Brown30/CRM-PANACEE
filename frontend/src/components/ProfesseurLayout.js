import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, LogOut } from 'lucide-react';

export default function ProfesseurLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50" data-testid="professeur-layout">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-teal-600" />
            </div>
            <span className="font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Mon Programme</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-red-500 h-9 w-9" data-testid="professeur-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
      <p className="text-center text-xs text-slate-300 py-4">{user?.name}</p>
    </div>
  );
}
