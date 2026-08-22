import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PhoneCall, HelpCircle, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { commonObjections } from '@/data/salesMethodologies';
import RichTextEditor from '@/components/RichTextEditor';

const FORMATION_OPTIONS = [
  'Installation de caméra de surveillance',
  'Électricité',
  'Rolling Door',
  'Windows',
  'Sheetrock',
];

function MethodologyEditor({ methodology, api, onSaved, onCancel }) {
  const [title, setTitle] = useState(methodology.title);
  const [objections, setObjections] = useState(() =>
    (methodology.objections || []).map((o, i) => ({ id: o.id || `o${i}`, question: o.question, answer: o.answer }))
  );
  const [saving, setSaving] = useState(false);

  const bodyRef = useRef(null);
  const answerRefs = useRef({});

  const addObjection = () => {
    setObjections(prev => [...prev, { id: `o-new-${Date.now()}`, question: '', answer: '' }]);
  };
  const removeObjection = (id) => {
    setObjections(prev => prev.filter(o => o.id !== id));
    delete answerRefs.current[id];
  };
  const setObjectionQuestion = (id, value) => {
    setObjections(prev => prev.map(o => (o.id === id ? { ...o, question: value } : o)));
  };

  const handleSave = async () => {
    const newBody = bodyRef.current?.getHTML() ?? methodology.body ?? '';
    const newObjections = objections
      .map(o => ({
        id: o.id,
        question: o.question,
        answer: answerRefs.current[o.id]?.getHTML() ?? o.answer ?? '',
      }))
      .filter(o => o.question.trim() || o.answer.replace(/<[^>]*>/g, '').trim());

    setSaving(true);
    try {
      await api.put(`/methodologies/${methodology.id}`, { title, body: newBody, objections: newObjections });
      toast.success('Méthodologie enregistrée');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold text-slate-500">Titre</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="input-field mt-1" />
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-500 mb-1 block">Méthodologie</Label>
        <RichTextEditor ref={bodyRef} defaultValue={methodology.body} placeholder="Texte de la méthodologie..." minRows={16} />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-500" /> Objections & Réponses (ce cours)
        </h4>
        {objections.map(o => (
          <div key={o.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Input
                value={o.question}
                onChange={e => setObjectionQuestion(o.id, e.target.value)}
                placeholder="Question / objection"
                className="input-field flex-1"
              />
              <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 shrink-0 h-9 w-9" onClick={() => removeObjection(o.id)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <RichTextEditor ref={el => { answerRefs.current[o.id] = el; }} defaultValue={o.answer} placeholder="Réponse" minRows={2} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={addObjection}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une objection
        </Button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={onCancel}>Annuler</Button>
        <Button type="button" className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  const { api, user, isAdminPrincipal } = useAuth();
  const vendorName = user?.name || '';
  const [methodologies, setMethodologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newFormation, setNewFormation] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/methodologies');
      setMethodologies(data.methodologies || []);
    } catch {
      toast.error('Erreur chargement');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newFormation || !newTitle) {
      toast.error('Formation et titre requis');
      return;
    }
    setCreating(true);
    try {
      await api.post('/methodologies', {
        formation: newFormation,
        title: newTitle,
        body: '',
        objections: [],
      });
      toast.success('Méthodologie créée');
      setShowNew(false);
      setNewFormation('');
      setNewTitle('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur création');
    }
    setCreating(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="methodology-page">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <PhoneCall className="w-5 h-5 text-emerald-500" /> Méthodologie de Vente
        </h2>
        {isAdminPrincipal && (
          <Button onClick={() => setShowNew(true)} variant="outline" className="flex items-center gap-2 h-10 text-sm rounded-xl" data-testid="add-methodology-btn">
            <Plus className="w-4 h-4" /> Nouvelle méthodologie
          </Button>
        )}
      </div>

      {methodologies.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <PhoneCall className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-medium">Aucune méthodologie disponible pour le moment</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5">
        <Accordion type="single" collapsible>
          {methodologies.map((m) => (
            <AccordionItem key={m.id} value={m.id} data-testid={`methodology-${m.formation}`}>
              <div className="flex items-center">
                <AccordionTrigger className="hover:no-underline py-4 flex-1">
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-slate-800 text-sm">{m.title}</p>
                    <p className="text-xs text-slate-400">{m.formation}</p>
                  </div>
                </AccordionTrigger>
                {isAdminPrincipal && editingId !== m.id && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-slate-400 hover:text-emerald-600 shrink-0 mr-2"
                    onClick={() => setEditingId(m.id)}
                    data-testid={`edit-methodology-${m.formation}`}
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <AccordionContent>
                {editingId === m.id ? (
                  <MethodologyEditor
                    methodology={m}
                    api={api}
                    onSaved={() => { setEditingId(null); fetchData(); }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    {m.body && (
                      <div
                        className="text-sm text-slate-600"
                        dangerouslySetInnerHTML={{ __html: m.body.replace('{vendorName}', vendorName) }}
                      />
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        <HelpCircle className="w-4 h-4 text-emerald-500" /> Objections & Réponses
                      </h4>
                      {commonObjections.length === 0 && (m.objections || []).length === 0 ? (
                        <p className="text-sm text-slate-400">Aucune objection enregistrée pour le moment</p>
                      ) : (
                        <div className="space-y-3">
                          {[...commonObjections, ...(m.objections || [])].map((o, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-3">
                              <p className="text-sm font-medium text-slate-800">{o.question}</p>
                              <div className="text-sm text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: o.answer }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* New Methodology Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Nouvelle méthodologie</DialogTitle>
            <DialogDescription>Créez un squelette éditable pour un nouveau cours</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Formation *</Label>
              <Select value={newFormation} onValueChange={setNewFormation}>
                <SelectTrigger className="input-field mt-1">
                  <SelectValue placeholder="Choisir formation..." />
                </SelectTrigger>
                <SelectContent>
                  {FORMATION_OPTIONS.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Titre *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-field mt-1" placeholder="Ex: Enstalasyon Kamera Siveyans" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="button" className="btn-primary flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
