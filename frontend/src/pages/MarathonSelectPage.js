import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Target, ChevronRight, LogOut, Plus, Percent } from 'lucide-react';
import { toast } from 'sonner';

export default function MarathonSelectPage() {
  const { api, user, selectMarathon, selectedMarathon, logout } = useAuth();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const navigate = useNavigate();

  const fetchMarathons = useCallback(async () => {
    try {
      // A marathon closes to declutter everyone's picker, not to cut anyone off —
      // payments can still be collected after closing, so a vendeur needs to be
      // able to step back in and check their own commission/payment data there too.
      const { data } = await api.get('/marathons/all');
      setMarathons(data.marathons);
    } catch { toast.error('Erreur de chargement'); }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (selectedMarathon) { navigate('/'); return; }
    fetchMarathons();
  }, [selectedMarathon, navigate, fetchMarathons]);

  const handleSelect = (marathon) => {
    selectMarathon(marathon);
    navigate('/');
  };

  const closedCount = marathons.filter(m => !m.active).length;
  const visibleMarathons = showClosed ? marathons : marathons.filter(m => m.active);

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

        {/* Paiement & Commission has its own marathon picker (works even on a closed
            marathon still settling payments), so it doesn't require picking a
            working marathon here first. */}
        <button
          onClick={() => navigate('/commissions')}
          data-testid="goto-commissions-btn"
          className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-left hover:bg-emerald-100 transition-colors mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Paiement & Commission</p>
            <p className="text-xs text-emerald-600">Voir qui a payé et ta commission, même pour une marathon fermée</p>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400" />
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Choisir une marathon
          </h2>
          <p className="text-sm text-slate-500">Sélectionnez la campagne sur laquelle vous travaillez</p>
        </div>

        {!loading && closedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer w-fit mb-4">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={e => setShowClosed(e.target.checked)}
              className="w-4 h-4"
              data-testid="show-closed-marathons-select"
            />
            Afficher les {closedCount} marathon{closedCount > 1 ? 's' : ''} fermée{closedCount > 1 ? 's' : ''}
          </label>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleMarathons.length === 0 ? (
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
            {visibleMarathons.map((m, idx) => (
              <button
                key={m.id}
                data-testid={`marathon-card-${idx}`}
                onClick={() => handleSelect(m)}
                className={`w-full bg-white border shadow-sm rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up stagger-${idx + 1} ${m.active ? 'border-slate-200/60' : 'border-slate-200/40 opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {m.name}
                      {!m.active && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Fermée</span>}
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
