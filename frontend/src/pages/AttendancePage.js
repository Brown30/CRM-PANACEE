import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, CalendarCheck, Phone, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AttendancePage() {
  const { api, selectedMarathon, canManageAttendance } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState(null);

  const fetchRoster = useCallback(async () => {
    if (!selectedMarathon) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/attendance', { params: { marathon_id: selectedMarathon.id, date } });
      setRoster(data.roster || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, date]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const toggle = async (row) => {
    const previous = row.present;
    const newPresent = row.present !== true;
    setSavingId(row.lead_id);
    setRoster(prev => prev.map(r => r.lead_id === row.lead_id
      ? { ...r, present: newPresent, status: newPresent && r.status === 'Inscrit' ? 'Participant' : r.status }
      : r
    ));
    try {
      await api.post('/attendance/mark', {
        marathon_id: selectedMarathon.id,
        lead_id: row.lead_id,
        date,
        present: newPresent
      });
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement');
      setRoster(prev => prev.map(r => r.lead_id === row.lead_id ? { ...r, present: previous, status: row.status } : r));
    }
    setSavingId(null);
  };

  const filtered = roster.filter(r => r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const presentCount = roster.filter(r => r.present === true).length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!selectedMarathon) return <NoMarathonFallback />;

  if (!canManageAttendance) return (
    <div className="p-4 md:p-6 text-center py-20 text-slate-400">
      <p className="font-medium">Accès non autorisé</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="attendance-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <CalendarCheck className="w-5 h-5 text-emerald-500" /> Présence
        </h2>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-[160px] h-10 rounded-xl"
          data-testid="attendance-date"
        />
      </div>

      <p className="text-sm text-slate-500">{selectedMarathon.name} — {presentCount}/{roster.length} présent(s)</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un nom..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-xl"
          data-testid="attendance-search"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(row => (
          <button
            key={row.lead_id}
            type="button"
            onClick={() => toggle(row)}
            disabled={savingId === row.lead_id}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border shadow-sm text-left transition-all disabled:opacity-60 ${
              row.present === true
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-white border-slate-200/60 hover:shadow-md'
            }`}
            data-testid={`attendance-row-${row.lead_id}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${row.present === true ? 'bg-emerald-500' : 'bg-slate-100'}`}>
              {row.present === true ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{row.full_name}</p>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3 h-3" />{row.phone}
              </span>
            </div>
            <span className={row.status === 'Participant' ? 'badge-participant' : 'badge-inscrit'}>
              {row.status}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun inscrit pour cette maratona</p>
          </div>
        )}
      </div>
    </div>
  );
}
