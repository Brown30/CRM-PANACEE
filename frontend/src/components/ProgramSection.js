import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Check, X, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFr } from '@/lib/finance';
import { PROGRAM_TEMPLATES } from '@/lib/programTemplates';

// Shared between the pedagogia/admin course detail page (manage=true: can
// assign a professeur and generate the program from the formation's
// template) and the professeur's own restricted view (manage=false: can only
// edit topic titles and toggle them done, for the course already assigned).
export default function ProgramSection({ marathon, manage, onMarathonUpdate }) {
  const { api } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [professeurs, setProfesseurs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [savingTitleId, setSavingTitleId] = useState(null);

  const fetchTopics = useCallback(async () => {
    try {
      const { data } = await api.get('/pedagogie/program-topics', { params: { marathon_id: marathon.id } });
      setTopics(data.topics || []);
    } catch { toast.error('Erreur chargement du programme'); }
    setLoading(false);
  }, [api, marathon.id]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  useEffect(() => {
    if (!manage) return;
    api.get('/users/professeurs').then(({ data }) => setProfesseurs(data.professeurs || [])).catch(() => {});
  }, [api, manage]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/pedagogie/program-topics/generate', { marathon_id: marathon.id });
      toast.success(data.inserted > 0 ? `${data.inserted} séance(s) ajoutée(s) au programme` : 'Programme déjà à jour');
      fetchTopics();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
    setGenerating(false);
  };

  const handleAssignProfesseur = async (professeurId) => {
    try {
      const { data } = await api.put(`/marathons/${marathon.id}`, { professeur_id: professeurId || null });
      toast.success('Professeur assigné');
      onMarathonUpdate?.(data.marathon);
    } catch (err) { toast.error(err.message || 'Erreur'); }
  };

  const handleToggleCompleted = async (topic) => {
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: !topic.completed } : t));
    try {
      await api.put(`/pedagogie/program-topics/${topic.id}`, { completed: !topic.completed });
    } catch (err) {
      toast.error(err.message || 'Erreur');
      setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed: topic.completed } : t));
    }
  };

  const handleTitleBlur = async (topic, value) => {
    if (value === topic.title) return;
    setSavingTitleId(topic.id);
    try {
      await api.put(`/pedagogie/program-topics/${topic.id}`, { title: value });
      setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, title: value } : t));
    } catch (err) { toast.error(err.message || 'Erreur'); }
    setSavingTitleId(null);
  };

  const completedCount = topics.filter(t => t.completed).length;
  const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const hasTemplate = !!PROGRAM_TEMPLATES[marathon.formation];

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="program-section">
      {manage && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Professeur</p>
            <Select value={marathon.professeur_id || 'none'} onValueChange={v => handleAssignProfesseur(v === 'none' ? null : v)}>
              <SelectTrigger className="input-field" data-testid="program-professeur-select">
                <SelectValue placeholder="Aucun professeur assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {professeurs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {topics.length === 0 && (
            hasTemplate ? (
              <Button type="button" className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleGenerate} disabled={generating} data-testid="program-generate-btn">
                <Sparkles className="w-4 h-4" /> {generating ? 'Génération...' : 'Générer le programme depuis le modèle'}
              </Button>
            ) : (
              <p className="text-xs text-amber-600">Aucun modèle de programme disponible pour "{marathon.formation}"</p>
            )
          )}
        </div>
      )}

      {topics.length > 0 && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Progression du programme</p>
              <span className="text-sm font-bold text-purple-600">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{completedCount}/{topics.length} séance{topics.length > 1 ? 's' : ''} réalisée{completedCount > 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-2">
            {topics.map(topic => (
              <div key={topic.id} className={`rounded-2xl border shadow-sm p-4 transition-all ${topic.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200/60'}`} data-testid={`program-topic-${topic.id}`}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(topic)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${topic.completed ? 'bg-emerald-500' : 'bg-slate-100'}`}
                    data-testid={`program-toggle-${topic.id}`}
                    title={topic.completed ? 'Marquer non réalisé' : 'Marquer réalisé'}
                  >
                    {topic.completed ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-slate-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 mb-1">{formatDateFr(topic.date)}</p>
                    <Input
                      defaultValue={topic.title || ''}
                      onBlur={e => handleTitleBlur(topic, e.target.value)}
                      disabled={savingTitleId === topic.id}
                      className="input-field text-sm"
                      placeholder="Sujet de la séance"
                      data-testid={`program-title-${topic.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {topics.length === 0 && !manage && (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Le programme n'a pas encore été généré pour ce cours</p>
        </div>
      )}
    </div>
  );
}
