import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, selectedMarathon, selectMarathon, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeMarathon = () => {
    selectMarathon(null);
    navigate('/select-marathon');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Mon Profil</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{user?.name}</h3>
            <p className="text-sm text-slate-400 capitalize bg-slate-100 px-3 py-1 rounded-full inline-block mt-1">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl space-y-2">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Marathon actif</p>
          <div className="flex items-center justify-between">
            <p className="font-medium text-emerald-900">{selectedMarathon?.name}</p>
            <Button variant="outline" size="sm" onClick={handleChangeMarathon} className="h-8 border-emerald-200 hover:bg-emerald-100 text-emerald-700">
              Changer
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button 
            variant="destructive" 
            className="w-full flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}
