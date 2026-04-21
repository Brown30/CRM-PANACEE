import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

const MEDAL_STYLES = {
  0: { emoji: '#1', bg: 'bg-gradient-to-br from-yellow-300 to-amber-400', ring: 'ring-amber-300', text: 'text-amber-900', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' },
  1: { emoji: '#2', bg: 'bg-gradient-to-br from-slate-200 to-slate-300', ring: 'ring-slate-300', text: 'text-slate-700', glow: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]' },
  2: { emoji: '#3', bg: 'bg-gradient-to-br from-amber-500 to-orange-600', ring: 'ring-orange-400', text: 'text-orange-900', glow: 'shadow-[0_0_15px_rgba(234,88,12,0.3)]' },
};

const getCardBg = (idx) => {
  if (idx === 0) return 'bg-amber-50/80 border-amber-200/80';
  if (idx === 1) return 'bg-slate-50/80 border-slate-200';
  if (idx === 2) return 'bg-orange-50/80 border-orange-200/80';
  return 'bg-white border-slate-200/60';
};

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

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="ranking-page">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Classement
        </h2>
      </div>
      <p className="text-sm text-slate-500">Basé sur les inscrits - {selectedMarathon?.name}</p>

      {/* Top 3 Podium */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[1, 0, 2].map(podiumIdx => {
            const r = ranking[podiumIdx];
            if (!r) return null;
            const medal = MEDAL_STYLES[podiumIdx];
            const isFirst = podiumIdx === 0;
            return (
              <div key={r.vendeur_id} className={`text-center ${isFirst ? '' : 'pt-6'}`}>
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ring-3 ${medal.bg} ${medal.ring} ${medal.glow} ${isFirst ? 'scale-110' : ''} transition-all`}>
                  <span className={`text-lg font-black ${medal.text}`}>{medal.emoji}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-2 truncate px-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {r.vendeur_name}
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {r.inscrits}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">inscrits</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Ranking List */}
      <div className="space-y-2 pt-2">
        {ranking.map((r, idx) => {
          const medal = MEDAL_STYLES[idx];
          return (
            <div
              key={r.vendeur_id}
              className={`rounded-2xl border shadow-sm p-4 flex items-center gap-4 transition-all hover:shadow-md ${getCardBg(idx)}`}
              data-testid={`ranking-item-${idx}`}
            >
              {/* Rank badge */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                medal ? `${medal.bg} ${medal.glow}` : 'bg-slate-100'
              }`}>
                <span className={`text-sm font-black ${medal ? medal.text : 'text-slate-400'}`}>
                  {idx < 3 ? MEDAL_STYLES[idx].emoji : `#${idx + 1}`}
                </span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${idx === 0 ? 'text-amber-900' : 'text-slate-800'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {r.vendeur_name}
                </p>
                <p className="text-xs text-slate-400">{r.total_leads} leads | {r.taux_conversion}% conversion</p>
              </div>

              {/* Inscrits count */}
              <div className="text-right">
                <p className={`text-2xl font-black ${idx === 0 ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {r.inscrits}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">inscrits</p>
              </div>
            </div>
          );
        })}
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
