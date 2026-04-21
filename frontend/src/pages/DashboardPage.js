import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, TrendingUp, Target, AlertTriangle, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';

const getTimeAlertStyle = (pct) => {
  if (pct >= 80) return { bg: '#ff1a1a', text: '#fff', border: '#ff1a1a', pulse: true };
  if (pct >= 50) return { bg: '#ff4d4d', text: '#fff', border: '#ff4d4d', pulse: false };
  return { bg: '#ffe5e5', text: '#b91c1c', border: '#fecaca', pulse: false };
};

export default function DashboardPage() {
  const { api, user, selectedMarathon, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterVendeur, setFilterVendeur] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [vendeurs, setVendeurs] = useState([]);

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (isAdmin) {
        if (filterVendeur !== 'all') params.vendeur_id = filterVendeur;
        if (filterPeriod === 'custom' && customStart && customEnd) {
          params.start_date = customStart;
          params.end_date = customEnd;
        } else if (filterPeriod !== 'all' && filterPeriod !== 'custom') {
          params.period = filterPeriod;
        }
        const [dashRes, timeRes, vendRes] = await Promise.all([
          api.get('/dashboard/admin', { params }),
          api.get(`/marathons/${selectedMarathon.id}/time-remaining`),
          api.get('/users/vendeurs')
        ]);
        setStats(dashRes.data);
        setTimeRemaining(timeRes.data);
        setVendeurs(vendRes.data.vendeurs);
      } else {
        const vendeurParams = { marathon_id: selectedMarathon.id, vendeur_id: user.id };
        if (filterPeriod === 'custom' && customStart && customEnd) {
          vendeurParams.start_date = customStart;
          vendeurParams.end_date = customEnd;
        } else if (filterPeriod !== 'all' && filterPeriod !== 'custom') {
          vendeurParams.period = filterPeriod;
        }
        const [dashRes, timeRes] = await Promise.all([
          api.get('/dashboard/vendeur', { params: vendeurParams }),
          api.get(`/marathons/${selectedMarathon.id}/time-remaining`)
        ]);
        setStats(dashRes.data);
        setTimeRemaining(timeRes.data);
      }
    } catch { toast.error('Erreur chargement dashboard'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin, filterVendeur, filterPeriod, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!selectedMarathon) return <NoMarathonFallback />;

  if (!stats) return null;

  const timePct = timeRemaining?.time_percentage || 0;
  const timeStyle = getTimeAlertStyle(timePct);

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="dashboard-page">
      {/* HARDCORE BUSINESS ZONE branding */}
      <div className="flex items-center gap-2 opacity-[0.08] select-none pointer-events-none">
        <Flame className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-[0.3em]" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Hardcore Business Zone
        </span>
        <Flame className="w-4 h-4" />
      </div>

      {/* Marathon info bar + Time Alert */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {selectedMarathon.name}
            </h2>
            <p className="text-sm text-emerald-600 font-medium">{selectedMarathon.formation}</p>
          </div>
          {timeRemaining?.days_remaining !== null && timeRemaining?.days_remaining !== undefined && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${timeStyle.pulse ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: timeStyle.bg, color: timeStyle.text, border: `1px solid ${timeStyle.border}` }}
              data-testid="time-remaining-badge"
            >
              <Clock className="w-4 h-4" />
              {timeRemaining.days_remaining} jours restants
            </div>
          )}
        </div>
        {timeRemaining?.alert && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {timeRemaining.alert}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        {isAdmin && (
          <Select value={filterVendeur} onValueChange={setFilterVendeur}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl" data-testid="filter-vendeur">
              <SelectValue placeholder="Tous les vendeurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les vendeurs</SelectItem>
              {vendeurs.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl" data-testid="filter-period">
            <SelectValue placeholder="Toute la période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute la période</SelectItem>
            <SelectItem value="7">7 jours</SelectItem>
            <SelectItem value="15">15 jours</SelectItem>
            <SelectItem value="30">30 jours</SelectItem>
            <SelectItem value="custom">Période personnalisée</SelectItem>
          </SelectContent>
        </Select>
        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-2">
            <div>
              <Label className="text-xs text-slate-500">Début</Label>
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-10 rounded-xl w-[140px]" data-testid="custom-start-date" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Fin</Label>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-10 rounded-xl w-[140px]" data-testid="custom-end-date" />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="stat-card animate-fade-in-up stagger-1" data-testid="stat-leads">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {stats.total_leads}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total leads</p>
        </div>

        <div className="stat-card animate-fade-in-up stagger-2" data-testid="stat-inscrits">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-emerald-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {stats.inscrits}
          </p>
          <p className="text-xs text-slate-500 mt-1">Inscrits</p>
        </div>

        <div className="stat-card animate-fade-in-up stagger-3" data-testid="stat-conversion">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {stats.taux_conversion}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Taux conversion</p>
        </div>

        <div className="stat-card animate-fade-in-up stagger-4" data-testid="stat-objectif">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {isAdmin ? stats.objectif_total : stats.objectif}
          </p>
          <p className="text-xs text-slate-500 mt-1">Objectif</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Progression vers l'objectif</p>
          <p className="text-sm font-bold text-emerald-600">{stats.progression}%</p>
        </div>
        <Progress value={stats.progression} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500" data-testid="progress-bar" />
        <p className="text-xs text-slate-400 mt-2">
          {stats.inscrits} / {isAdmin ? stats.objectif_total : stats.objectif} inscrits
        </p>
      </div>

      {/* Admin: Per-vendeur table */}
      {isAdmin && stats.vendeur_stats && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" data-testid="vendeur-stats">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Performance par vendeur
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.vendeur_stats.map((v) => (
              <div key={v.vendeur_id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{v.vendeur_name}</p>
                  <p className="text-xs text-slate-400">{v.total_leads} leads | {v.inscrits} inscrits</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{v.taux_conversion}%</p>
                  {v.objectif > 0 && (
                    <p className="text-xs text-slate-400">{v.inscrits}/{v.objectif}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendeur: Très intéressés */}
      {!isAdmin && stats.tres_interesses > 0 && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
          <p className="text-sm font-medium text-emerald-700">
            {stats.tres_interesses} lead(s) très intéressé(s) à convertir
          </p>
        </div>
      )}
    </div>
  );
}
