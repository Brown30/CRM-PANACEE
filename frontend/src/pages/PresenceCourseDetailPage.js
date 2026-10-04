import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, GraduationCap, Calendar, Phone, Check, X, Plus, ClipboardList, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr, todayStr } from '@/lib/finance';
import { weekendDatesBetween, dayLabel } from '@/lib/pedagogie';

export default function PresenceCourseDetailPage() {
  const { marathonId } = useParams();
  const navigate = useNavigate();
  const { api, isAdmin, canManagePresence } = useAuth();

  const [marathon, setMarathon] = useState(null);
  const [extraDates, setExtraDates] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [inscritLeads, setInscritLeads] = useState([]);
  const [loadingInscrits, setLoadingInscrits] = useState(false);
  const [promotingId, setPromotingId] = useState(null);
  const [participantSearch, setParticipantSearch] = useState('');

  const datesScrollRef = useRef(null);
  const scrollDates = (direction) => {
    datesScrollRef.current?.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  const fetchBase = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: mData }, { data: exData }] = await Promise.all([
        api.get(`/marathons/${marathonId}`),
        api.get('/pedagogie/extra-dates', { params: { marathon_id: marathonId } })
      ]);
      setMarathon(mData.marathon);
      setExtraDates(exData.dates || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, marathonId]);

  useEffect(() => { fetchBase(); }, [fetchBase]);

  const filteredInscritLeads = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return inscritLeads;
    return inscritLeads.filter(l => l.full_name?.toLowerCase().includes(q) || l.phone?.includes(q));
  }, [inscritLeads, participantSearch]);

  const sessions = useMemo(() => {
    if (!marathon) return [];
    const weekend = weekendDatesBetween(marathon.end_date, marathon.course_end_date).map(date => ({ date, type: 'weekend' }));
    const extra = extraDates.map(e => ({ date: e.date, type: 'extra', id: e.id, label: e.label }));
    const byDate = new Map();
    for (const s of [...weekend, ...extra]) byDate.set(s.date, s.type === 'extra' ? s : (byDate.get(s.date) || s));
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [marathon, extraDates]);

  // Default to the most recent class day that already happened, so opening the
  // page lands on "today's" or the last relevant session, not some future date.
  useEffect(() => {
    if (selectedDate || sessions.length === 0) return;
    const today = todayStr();
    const past = sessions.filter(s => s.date <= today);
    setSelectedDate(past.length > 0 ? past[past.length - 1].date : sessions[0].date);
  }, [sessions, selectedDate]);

  const loadRoster = useCallback(async () => {
    if (!selectedDate) { setRoster([]); return; }
    setRosterLoading(true);
    try {
      // Only Participants show up here — whether someone counts as a
      // participant at all is decided on the Leads page, not here.
      const { data } = await api.get('/attendance', { params: { marathon_id: marathonId, date: selectedDate, status: 'Participant' } });
      setRoster(data.roster || []);
    } catch { toast.error('Erreur chargement présence'); }
    setRosterLoading(false);
  }, [api, marathonId, selectedDate]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  const toggle = async (row) => {
    // Undoing a presence already marked (they weren't actually there) is
    // admin-only, to keep a careless tap from erasing someone else's
    // attendance record. Marking someone present in the first place is
    // restricted to admins and the Directeur Pédagogique — everyone else with
    // access to this page (e.g. a plain pedagogia grant) can only view it.
    if (row.present === true) {
      if (!isAdmin) {
        toast.error('Seul un admin peut retirer une présence déjà marquée');
        return;
      }
    } else if (!canManagePresence) {
      toast.error('Seul un admin ou le Directeur Pédagogique peut marquer une présence');
      return;
    }
    const previous = row.present;
    const newPresent = row.present !== true;
    setSavingId(row.lead_id);
    setRoster(prev => prev.map(r => r.lead_id === row.lead_id ? { ...r, present: newPresent } : r));
    try {
      await api.post('/attendance/mark', { marathon_id: marathonId, lead_id: row.lead_id, date: selectedDate, present: newPresent, skip_status_update: true });
      await loadRoster();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement');
      setRoster(prev => prev.map(r => r.lead_id === row.lead_id ? { ...r, present: previous } : r));
    }
    setSavingId(null);
  };

  // Inscrit -> Participant is still a deliberate, explicit action (not an
  // automatic side effect of marking presence) — this just lets whoever
  // manages Présence do that promotion without leaving the page to find the
  // lead on the Leads list first.
  const openAddParticipant = async () => {
    setShowAddParticipant(true);
    setParticipantSearch('');
    setLoadingInscrits(true);
    try {
      const { data } = await api.get('/leads', { params: { marathon_id: marathonId, status: 'Inscrit' } });
      setInscritLeads(data.leads || []);
    } catch { toast.error('Erreur chargement'); }
    setLoadingInscrits(false);
  };

  const handlePromote = async (lead) => {
    setPromotingId(lead.id);
    try {
      await api.put(`/leads/${lead.id}`, { status: 'Participant' });
      toast.success(`${lead.full_name} ajouté comme participant`);
      setInscritLeads(prev => prev.filter(l => l.id !== lead.id));
      await loadRoster();
    } catch (err) { toast.error(err.message || 'Erreur'); }
    setPromotingId(null);
  };

  const handleAddDate = async (e) => {
    e.preventDefault();
    if (!newDate) { toast.error('Date requise'); return; }
    try {
      await api.post('/pedagogie/extra-dates', { marathon_id: marathonId, date: newDate, label: newLabel.trim() || null });
      toast.success('Date de cours ajoutée');
      setShowAddDate(false);
      setNewDate('');
      setNewLabel('');
      const { data } = await api.get('/pedagogie/extra-dates', { params: { marathon_id: marathonId } });
      setExtraDates(data.dates || []);
      setSelectedDate(newDate);
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleDeleteDate = async (id) => {
    try {
      await api.delete(`/pedagogie/extra-dates/${id}`);
      toast.success('Date supprimée');
      const { data } = await api.get('/pedagogie/extra-dates', { params: { marathon_id: marathonId } });
      setExtraDates(data.dates || []);
      if (selectedDate && !sessions.some(s => s.date === selectedDate)) setSelectedDate(null);
    } catch { toast.error('Erreur suppression'); }
  };

  const toggleReport = async () => {
    if (showReport) { setShowReport(false); return; }
    setShowReport(true);
    if (report) return;
    setReportLoading(true);
    try {
      const { data } = await api.get('/pedagogie/attendance-report', { params: { marathon_id: marathonId } });
      setReport(data);
    } catch { toast.error('Erreur chargement rapport'); }
    setReportLoading(false);
  };

  const presentCount = roster.filter(r => r.present === true).length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!marathon) return null;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="presence-course-detail-page">
      <button onClick={() => navigate('/pedagogie/presence')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour aux cours
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{marathon.name}</h2>
            <p className="text-sm text-slate-500">{marathon.formation}</p>
          </div>
        </div>
        {marathon.end_date && marathon.course_end_date ? (
          <p className="flex items-center gap-1 text-xs text-slate-400 mt-3">
            <Calendar className="w-3.5 h-3.5" /> {formatDateFr(marathon.end_date)} - {formatDateFr(marathon.course_end_date)}
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-3">
            Définissez la date de fin des inscriptions et la date de fin du cours (page Marathons) pour générer les dates de cours automatiquement.
          </p>
        )}
      </div>

      {/* Attendance report — up top as a collapsible card, so it doesn't take
          scrolling past the whole roster to reach on a big class. */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm" data-testid="pedagogie-report-card">
        <button onClick={toggleReport} className="w-full flex items-center justify-between p-4" data-testid="pedagogie-toggle-report">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <ClipboardList className="w-4 h-4 text-purple-500" />
            Rapport de présence
          </span>
          {showReport ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showReport && (
          <div className="px-4 pb-4">
            {reportLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : report && report.rows.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2 mt-2">{report.session_dates.length} séance{report.session_dates.length > 1 ? 's' : ''} déjà passée{report.session_dates.length > 1 ? 's' : ''} comptabilisée{report.session_dates.length > 1 ? 's' : ''}</p>
                {report.rows.map(row => (
                  <div key={row.lead_id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0" data-testid={`pedagogie-report-row-${row.lead_id}`}>
                    <p className="text-sm text-slate-700 truncate flex-1">{row.full_name}</p>
                    <p className="text-xs text-slate-400 shrink-0">{row.present_count}/{row.total_sessions}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      row.attendance_rate >= 75 ? 'bg-emerald-100 text-emerald-700' : row.attendance_rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.attendance_rate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Aucune séance passée à comptabiliser pour le moment</p>
            )}
          </div>
        )}
      </div>

      {/* Date chips */}
      <div className="flex items-center gap-2">
        {sessions.length > 0 && (
          <button
            onClick={() => scrollDates(-1)}
            className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
            data-testid="pedagogie-dates-scroll-left"
            title="Voir les dates précédentes"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div ref={datesScrollRef} className="flex-1 flex gap-2 overflow-x-auto pb-1 scroll-smooth">
          {sessions.map(s => (
            <div key={s.date} className="relative shrink-0">
              <button
                onClick={() => setSelectedDate(s.date)}
                data-testid={`pedagogie-date-${s.date}`}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  selectedDate === s.date
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-slate-200/60 text-slate-600 hover:border-purple-300'
                }`}
              >
                <span>{dayLabel(s.date)}</span>
                <span>{formatDateFr(s.date)}</span>
                {s.type === 'extra' && <span className="text-[10px] opacity-80 mt-0.5">Pratique</span>}
              </button>
              {s.type === 'extra' && (
                <button
                  onClick={() => handleDeleteDate(s.id)}
                  data-testid={`pedagogie-delete-date-${s.date}`}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-400 hover:bg-red-500 text-white flex items-center justify-center"
                  title="Supprimer cette date"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-slate-400 py-2">Aucune date de cours pour le moment</p>
          )}
        </div>
        {sessions.length > 0 && (
          <button
            onClick={() => scrollDates(1)}
            className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
            data-testid="pedagogie-dates-scroll-right"
            title="Voir les dates suivantes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={() => setShowAddDate(true)} data-testid="pedagogie-add-date-btn" title="Ajouter une date de cours pratique">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {selectedDate && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{presentCount}/{roster.length} présent(s) le {formatDateFr(selectedDate)}</p>
            {canManagePresence && (
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg flex items-center gap-1.5 shrink-0" onClick={openAddParticipant} data-testid="pedagogie-open-add-participant">
                <UserPlus className="w-3.5 h-3.5" /> Ajouter des participants
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {rosterLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {roster.map(row => (
                  <div
                    key={row.lead_id}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border shadow-sm transition-all ${
                      row.present === true ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200/60'
                    }`}
                    data-testid={`pedagogie-attendance-row-${row.lead_id}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(row)}
                      disabled={savingId === row.lead_id || (row.present === true ? !isAdmin : !canManagePresence)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-60 ${
                        row.present === true ? 'bg-emerald-500' : 'bg-slate-100 hover:bg-emerald-100'
                      }`}
                      title={row.present === true ? (isAdmin ? 'Retirer la présence' : 'Seul un admin peut retirer une présence') : (canManagePresence ? 'Marquer présent' : 'Seul un admin ou le Directeur Pédagogique peut marquer une présence')}
                      data-testid={`pedagogie-check-${row.lead_id}`}
                    >
                      <Check className={`w-7 h-7 ${row.present === true ? 'text-white' : 'text-slate-300'}`} strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{row.full_name}</p>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone className="w-3 h-3" />{row.phone}
                      </span>
                    </div>
                  </div>
                ))}
                {roster.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">Aucun participant pour ce cours</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Add practical class date dialog */}
      <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Ajouter une date de cours</DialogTitle>
            <DialogDescription>Pour une séance pratique en dehors des week-ends habituels</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDate} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Date *</Label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input-field mt-1" data-testid="pedagogie-new-date-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Libellé (optionnel)</Label>
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} className="input-field mt-1" placeholder="Ex: Séance pratique" data-testid="pedagogie-new-date-label" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowAddDate(false)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" data-testid="pedagogie-new-date-submit">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Promote Inscrit leads to Participant, without leaving this page */}
      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Ajouter des participants</DialogTitle>
            <DialogDescription>Personnes inscrites à ce cours, pas encore comptées comme participantes</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              placeholder="Rechercher par nom ou téléphone..."
              className="input-field pl-9"
              data-testid="pedagogie-participant-search"
              autoFocus
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loadingInscrits ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInscritLeads.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{inscritLeads.length === 0 ? 'Aucun inscrit en attente' : 'Aucun résultat'}</p>
            ) : (
              filteredInscritLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5" data-testid={`pedagogie-inscrit-row-${lead.id}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{lead.full_name}</p>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />{lead.phone}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="btn-primary h-8 text-xs shrink-0 flex items-center gap-1"
                    onClick={() => handlePromote(lead)}
                    disabled={promotingId === lead.id}
                    data-testid={`pedagogie-promote-${lead.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </Button>
                </div>
              ))
            )}
          </div>
          <Button type="button" variant="outline" className="w-full h-11 rounded-xl" onClick={() => setShowAddParticipant(false)}>Fermer</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
