import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Wallet, Trash2, Pencil, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';

const emptyForm = { category: 'Salaire Fixe', label: '', amount: '', day_of_month: '7' };

export default function FinanceDespensesPage() {
  const { api } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.expenses || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = (category) => {
    setEditingId(null);
    setForm({ ...emptyForm, category: category || emptyForm.category });
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ category: e.category, label: e.label, amount: String(e.amount), day_of_month: String(e.day_of_month || '') });
    setShowForm(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.category.trim() || !form.label.trim()) { toast.error('Catégorie et libellé requis'); return; }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try {
      const payload = {
        category: form.category.trim(), label: form.label.trim(), amount,
        day_of_month: form.day_of_month ? Number(form.day_of_month) : null
      };
      if (editingId) await api.put(`/expenses/${editingId}`, payload);
      else await api.post('/expenses', { ...payload, active: true });
      toast.success(editingId ? 'Dépense modifiée' : 'Dépense ajoutée');
      setShowForm(false);
      fetchExpenses();
    } catch (err) { toast.error(err.message || 'Erreur'); }
    setSaving(false);
  };

  const handleToggleActive = async (e) => {
    try {
      await api.put(`/expenses/${e.id}`, { active: !e.active });
      fetchExpenses();
    } catch (err) { toast.error(err.message || 'Erreur'); }
  };

  const handleDelete = async (e) => {
    try {
      await api.delete(`/expenses/${e.id}`);
      toast.success('Dépense supprimée');
      fetchExpenses();
    } catch { toast.error('Erreur suppression'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalMensuel = expenses.filter(e => e.active !== false).reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCategory = {};
  for (const e of expenses) {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  }

  return (
    <div className="p-4 md:p-6 space-y-5" data-testid="finance-despenses-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Dépenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">Dépenses fixes récurrentes — entrent dans le flux de caisse et la prévision financière</p>
        </div>
        <Button onClick={() => openAdd()} className="btn-primary h-9 text-xs flex items-center gap-1.5" data-testid="add-expense-btn">
          <Plus className="w-3.5 h-3.5" /> Ajouter une dépense
        </Button>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm p-5 text-white">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total mensuel (dépenses actives)</p>
        <p className="text-3xl font-bold mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{formatAmount(totalMensuel)} <span className="text-base font-normal text-slate-400">HTG</span></p>
      </div>

      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`expense-category-${category}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Wallet className="w-4 h-4 text-blue-500" /> {category}
              </h3>
              <button onClick={() => openAdd(category)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1" data-testid={`add-to-category-${category}`}>
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <div className="space-y-1.5">
              {items.map(e => (
                <div key={e.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${e.active === false ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} data-testid={`expense-row-${e.id}`}>
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">{e.label}{e.active === false && <span className="ml-1.5 text-xs text-amber-600 font-medium">(inactif)</span>}</p>
                    {e.day_of_month && (
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <CalendarClock className="w-3 h-3" /> Payé le {String(e.day_of_month).padStart(2, '0')} de chaque mois
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-slate-800">{formatAmount(e.amount)} HTG</span>
                    <button onClick={() => openEdit(e)} className="text-slate-400 hover:text-blue-600" title="Modifier" data-testid={`edit-expense-${e.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggleActive(e)} className="text-xs text-slate-400 hover:text-slate-700 underline" data-testid={`toggle-active-${e.id}`}>
                      {e.active === false ? 'Réactiver' : 'Désactiver'}
                    </button>
                    <button onClick={() => handleDelete(e)} className="text-slate-400 hover:text-red-500" title="Supprimer" data-testid={`delete-expense-${e.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucune dépense pour le moment</p>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>{editingId ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
            <DialogDescription>Dépense fixe récurrente, par mois</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Catégorie</Label>
              <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field mt-1" placeholder="Salaire Fixe" data-testid="expense-category-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Libellé (nom de la personne ou description)</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="input-field mt-1" data-testid="expense-label-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Montant (HTG)</Label>
              <Input type="number" min="0" step="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field mt-1" data-testid="expense-amount-input" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Jour du mois (paiement récurrent)</Label>
              <Input type="number" min="1" max="31" value={form.day_of_month} onChange={e => setForm({ ...form, day_of_month: e.target.value })} className="input-field mt-1" placeholder="7" data-testid="expense-day-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" disabled={saving} data-testid="expense-submit-btn">{saving ? 'Enregistrement...' : 'Confirmer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
