import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function RankingPage() {
  const { api, selectedMarathon } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedMarathon) return;
    const fetch = async () => {
      try {
        const { data } = await api.get('/ranking', { params: { marathon_id: selectedMarathon.id } });
        setRanking(data.ranking);
      } catch { toast.error('Erreur chargement ranking'); }
      setLoading(false);
    };
    fetch();
  }, [api, selectedMarathon]);

  const getMedalColor = (idx) => {
    if (idx === 0) return 'text-amber-400';
    if (idx === 1) return 'text-slate-400';
    if (idx === 2) return 'text-amber-600';
    return 'text-slate-300';
  };

  const getBgClass = (idx) => {
    if (idx === 0) return 'bg-amber-50 border-amber-200';
    if (idx === 1) return 'bg-slate-50 border-slate-200';
    if (idx === 2) return 'bg-orange-50 border-orange-200';
    return 'bg-white border-slate-200/60';
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="ranking-page">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Classement
        </h2>
      </div>
      <p className="text-sm text-slate-500">Classement basé sur les inscrits - {selectedMarathon?.name}</p>

      {/* Top 3 podium */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-4 pb-2">
          {[1, 0, 2].map(idx => {
            const r = ranking[idx];
            if (!r) return null;
            return (
              <div key={r.vendeur_id} className={`text-center ${idx === 0 ? 'pt-0' : 'pt-4'}`}>
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${idx === 0 ? 'bg-amber-100 ring-2 ring-amber-300' : idx === 1 ? 'bg-slate-100 ring-2 ring-slate-300' : 'bg-orange-100 ring-2 ring-orange-300'}`}>
                  <Medal className={`w-5 h-5 ${getMedalColor(idx)}`} />
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{r.vendeur_name}</p>
                <p className="text-lg font-bold text-emerald-600" style={{ fontFamily: "'Outfit', sans-serif" }}>{r.inscrits}</p>
                <p className="text-xs text-slate-400">inscrits</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranking list */}
      <div className="space-y-2">
        {ranking.map((r, idx) => (
          <div key={r.vendeur_id} className={`rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${getBgClass(idx)}`} data-testid={`ranking-item-${idx}`}>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              {idx < 3 ? (
                <Medal className={`w-4 h-4 ${getMedalColor(idx)}`} />
              ) : (
                <span className="text-sm font-bold text-slate-400">{idx + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{r.vendeur_name}</p>
              <p className="text-xs text-slate-400">{r.total_leads} leads | {r.taux_conversion}% conversion</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600" style={{ fontFamily: "'Outfit', sans-serif" }}>{r.inscrits}</p>
              <p className="text-xs text-slate-400">inscrits</p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucune donnée de classement</p>
          </div>
        )}
      </div>
    </div>
  );
}
