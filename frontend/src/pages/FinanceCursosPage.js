import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GraduationCap, Pencil, Trash2, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';

const emptyForm = {
  formation: '', preco_padrao: '', duracao_semanas_padrao: '', duracao_semanas_max: '',
  horas_sabado_padrao: '', horas_domingo_padrao: ''
};

export default function FinanceCursosPage() {
  const { api } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cursos');
      setCursos(data.cursos || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchCursos(); }, [fetchCursos]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      formation: c.formation, preco_padrao: String(c.preco_padrao),
      duracao_semanas_padrao: String(c.duracao_semanas_padrao),
      duracao_semanas_max: c.duracao_semanas_max ? String(c.duracao_semanas_max) : '',
      horas_sabado_padrao: String(c.horas_sabado_padrao || 0), horas_domingo_padrao: String(c.horas_domingo_padrao || 0)
    });
    setShowForm(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.formation.trim() || !form.duracao_semanas_padrao) { toast.error('Formation et durée requises'); return; }
    setSaving(true);
    try {
      const payload = {
        formation: form.formation.trim(),
        preco_padrao: Number(form.preco_padrao) || 0,
        duracao_semanas_padrao: Number(form.duracao_semanas_padrao) || 0,
        duracao_semanas_max: form.duracao_semanas_max ? Number(form.duracao_semanas_max) : null,
        horas_sabado_padrao: Number(form.horas_sabado_padrao) || 0,
        horas_domingo_padrao: Number(form.horas_domingo_padrao) || 0
      };
      if (editingId) await api.put(`/cursos/${editingId}`, payload);
      else await api.post('/cursos', payload);
      toast.success(editingId ? 'Curso modifié' : 'Curso ajouté');
      setShowForm(false);
      fetchCursos();
    } catch (err) { toast.error(err.message || 'Erreur'); }
    setSaving(false);
  };

  const handleDelete = async (c) => {
    try {
      await api.delete(`/cursos/${c.id}`);
      toast.success('Curso supprimé');
      fetchCursos();
    } catch { toast.error('Erreur suppression'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5" data-testid="finance-cursos-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Cursos</h2>
          <p className="text-sm text-slate-500 mt-0.5">Prix, durée et horaires par défaut de chaque formation</p>
        </div>
        <Button onClick={openAdd} className="btn-primary h-9 text-xs flex items-center gap-1.5" data-testid="add-curso-btn">
          <Plus className="w-3.5 h-3.5" /> Ajouter un curso
        </Button>
      </div>

      <div className="space-y-2">
        {cursos.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`curso-row-${c.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.formation}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatAmount(c.preco_padrao)} HTG</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.duracao_semanas_padrao} semaine{c.duracao_semanas_padrao > 1 ? 's' : ''}
                    {c.duracao_semanas_max && c.duracao_semanas_max !== c.duracao_semanas_padrao && <> (jusqu'à {c.duracao_semanas_max})</>}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" /> Samedi {c.horas_sabado_padrao}h · Dimanche {c.horas_domingo_padrao}h
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600" title="Modifier" data-testid={`edit-curso-${c.id}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(c)} className="text-slate-400 hover:text-red-500" title="Supprimer" data-testid={`delete-curso-${c.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {cursos.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucun curso pour le moment</p>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>{editingId ? 'Modifier le curso' : 'Ajouter un curso'}</DialogTitle>
            <DialogDescription>Valeurs par défaut pour cette formation</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Formation</Label>
              <Input value={form.formation} onChange={e => setForm({ ...form, formation: e.target.value })} className="input-field mt-1" placeholder="Ex. Sheetrock" data-testid="curso-formation-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Prix (HTG)</Label>
              <Input type="number" min="0" step="1" value={form.preco_padrao} onChange={e => setForm({ ...form, preco_padrao: e.target.value })} className="input-field mt-1" data-testid="curso-preco-input" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Durée (semaines)</Label>
                <Input type="number" min="1" value={form.duracao_semanas_padrao} onChange={e => setForm({ ...form, duracao_semanas_padrao: e.target.value })} className="input-field mt-1" data-testid="curso-duracao-input" required />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Max (facultatif)</Label>
                <Input type="number" min="1" value={form.duracao_semanas_max} onChange={e => setForm({ ...form, duracao_semanas_max: e.target.value })} className="input-field mt-1" data-testid="curso-duracao-max-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Heures samedi</Label>
                <Input type="number" min="0" step="0.5" value={form.horas_sabado_padrao} onChange={e => setForm({ ...form, horas_sabado_padrao: e.target.value })} className="input-field mt-1" data-testid="curso-horas-sabado-input" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Heures dimanche</Label>
                <Input type="number" min="0" step="0.5" value={form.horas_domingo_padrao} onChange={e => setForm({ ...form, horas_domingo_padrao: e.target.value })} className="input-field mt-1" data-testid="curso-horas-domingo-input" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" disabled={saving} data-testid="curso-submit-btn">{saving ? 'Enregistrement...' : 'Confirmer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
