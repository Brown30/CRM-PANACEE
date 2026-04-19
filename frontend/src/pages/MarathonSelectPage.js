import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Target, ChevronRight, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MarathonSelectPage() {
  const { api, user, selectMarathon, selectedMarathon, logout } = useAuth();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedMarathon) { navigate('/'); return; }
    fetchMarathons();
  }, [selectedMarathon, navigate]);

  const fetchMarathons = async () => {
    try {
      const { data } = await api.get('/marathons');
      setMarathons(data.marathons);
    } catch { toast.error('Erreur de chargement'); }
    setLoading(false);
  };

  const handleSelect = (marathon) => {
    selectMarathon(marathon);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" data-testid="marathon-select-page">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500">Bonjour,</p>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {user?.name}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} data-testid="logout-btn" className="text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Choisir une marathon
          </h2>
          <p className="text-sm text-slate-500">Sélectionnez la campagne sur laquelle vous travaillez</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : marathons.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune marathon active</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">Contactez un administrateur pour créer une marathon</p>
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              Continuer vers le tableau de bord <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {marathons.map((m, idx) => (
              <button
                key={m.id}
                data-testid={`marathon-card-${idx}`}
                onClick={() => handleSelect(m)}
                className={`w-full bg-white border border-slate-200/60 shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up stagger-${idx + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {m.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        <Trophy className="w-3 h-3" />
                        {m.formation}
                      </span>
                      {m.end_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {m.end_date}
                        </span>
                      )}
                    </div>
                    {m.objectif_total > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Target className="w-3 h-3" />
                        Objectif: {m.objectif_total} inscrits
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </button>
            ))}
            <div className="pt-4 flex justify-center">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-800">
                Continuer sans sélectionner de marathon
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
