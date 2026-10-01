import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Wallet, Trash2, Pencil, CalendarClock, Check, X, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount } from '@/lib/finance';

const emptyForm = { category: 'Salaire Fixe', label: '', amount: '', day_of_month: '7', variable: false };

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function FinanceDespensesPage() {
  const { api } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [validating, setValidating] = useState(null); // expense being confirmed for the month
  const [validateAmount, setValidateAmount] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.expenses || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api]);

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const { data } = await api.get('/expenses/entries', { params: { month } });
      setEntries(data.entries || []);
    } catch { toast.error('Erreur chargement du mois'); }
    setLoadingEntries(false);
  }, [api, month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const entryFor = useMemo(() => {
    const map = {};
    for (const e of entries) map[e.expense_id] = e;
    return map;
  }, [entries]);

  const openAdd = (category) => {
    setEditingId(null);
    setForm({ ...emptyForm, category: category || emptyForm.category });
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({ category: e.category, label: e.label, amount: String(e.amount), day_of_month: String(e.day_of_month || ''), variable: !!e.variable });
    setShowForm(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.category.trim() || !form.label.trim()) { toast.error('Catégorie et libellé requis'); return; }
    const amount = Number(form.amount) || 0;
    if (!form.variable && amount <= 0) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try {
      const payload = {
        category: form.category.trim(), label: form.label.trim(), amount,
        day_of_month: form.day_of_month ? Number(form.day_of_month) : null,
        variable: form.variable
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

  // Validating a month = deciding, for this one expense, whether it's really
  // paid this month and for how much — a variable salary has no sane default,
  // and even a fixed one can be overridden (e.g. a partial month).
  const openValidate = (e) => {
    const existing = entryFor[e.id];
    setValidating(e);
    setValidateAmount(existing ? String(existing.amount) : (e.variable ? '' : String(e.amount)));
  };

  const handleConfirmMonth = async (ev) => {
    ev.preventDefault();
    const amount = Number(validateAmount);
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    try {
      await api.post('/expenses/entries', { expense_id: validating.id, month, amount, confirmed: true });
      toast.success('Confirmé pour ce mois');
      setValidating(null);
      fetchEntries();
    } catch (err) { toast.error(err.message || 'Erreur'); }
  };

  const handleSkipMonth = async (e) => {
    try {
      await api.post('/expenses/entries', { expense_id: e.id, month, amount: 0, confirmed: false });
      toast.success('Marqué comme non payé ce mois');
      fetchEntries();
    } catch (err) { toast.error(err.message || 'Erreur'); }
  };

  const handleUndoMonth = async (entry) => {
    try {
      await api.delete(`/expenses/entries/${entry.id}`);
      fetchEntries();
    } catch { toast.error('Erreur'); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeExpenses = expenses.filter(e => e.active !== false);
  const totalConfirme = activeExpenses.reduce((s, e) => {
    const entry = entryFor[e.id];
    return s + (entry && entry.confirmed ? Number(entry.amount) : 0);
  }, 0);
  const pendingCount = activeExpenses.filter(e => !entryFor[e.id]).length;

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
          <p className="text-sm text-slate-500 mt-0.5">À valider chaque mois — entre dans le flux de caisse et la prévision financière</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field h-9 text-xs w-36" data-testid="despenses-month-input" />
          <Button onClick={() => openAdd()} className="btn-primary h-9 text-xs flex items-center gap-1.5" data-testid="add-expense-btn">
            <Plus className="w-3.5 h-3.5" /> Ajouter une dépense
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm p-5 text-white">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total confirmé pour {month}</p>
        <p className="text-3xl font-bold mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{formatAmount(totalConfirme)} <span className="text-base font-normal text-slate-400">HTG</span></p>
        {pendingCount > 0 && (
          <p className="text-xs text-amber-300 mt-1">{pendingCount} dépense{pendingCount > 1 ? 's' : ''} encore à valider pour ce mois</p>
        )}
      </div>

      {loadingEntries ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
                {items.map(e => {
                  const entry = entryFor[e.id];
                  return (
                    <div key={e.id} className={`rounded-lg px-3 py-2 text-sm ${e.active === false ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} data-testid={`expense-row-${e.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-slate-700 truncate">
                            {e.label}
                            {e.variable && <span className="ml-1.5 text-xs text-blue-600 font-medium">(variable)</span>}
                            {e.active === false && <span className="ml-1.5 text-xs text-amber-600 font-medium">(inactif)</span>}
                          </p>
                          {e.day_of_month && (
                            <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              <CalendarClock className="w-3 h-3" /> Payé le {String(e.day_of_month).padStart(2, '0')} de chaque mois
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {!e.variable && <span className="text-xs text-slate-400">{formatAmount(e.amount)} HTG par défaut</span>}
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

                      {e.active !== false && (
                        <div className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200/60">
                          {!entry ? (
                            <>
                              <span className="text-xs text-amber-600 font-medium">À valider pour {month}</span>
                              <div className="flex items-center gap-2">
                                <Button type="button" size="sm" className="h-7 text-xs btn-primary flex items-center gap-1" onClick={() => openValidate(e)} data-testid={`validate-expense-${e.id}`}>
                                  <Check className="w-3 h-3" /> Confirmer
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="h-7 text-xs flex items-center gap-1" onClick={() => handleSkipMonth(e)} data-testid={`skip-expense-${e.id}`}>
                                  <X className="w-3 h-3" /> Ne paie pas ce mois
                                </Button>
                              </div>
                            </>
                          ) : entry.confirmed ? (
                            <>
                              <span className="text-xs text-emerald-600 font-medium">Confirmé — {formatAmount(entry.amount)} HTG</span>
                              <button onClick={() => handleUndoMonth(entry)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1" data-testid={`undo-expense-${e.id}`}>
                                <Undo2 className="w-3 h-3" /> Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-slate-400 font-medium">Ne sera pas payé ce mois</span>
                              <button onClick={() => handleUndoMonth(entry)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1" data-testid={`undo-expense-${e.id}`}>
                                <Undo2 className="w-3 h-3" /> Annuler
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>{editingId ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
            <DialogDescription>Dépense récurrente, à valider chaque mois</DialogDescription>
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
            <div className="flex items-center gap-2">
              <Checkbox checked={form.variable} onCheckedChange={checked => setForm({ ...form, variable: checked === true })} data-testid="expense-variable-checkbox" />
              <Label className="text-xs font-semibold text-slate-500">Montant variable (différent chaque mois, ex. salaire aux heures)</Label>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">{form.variable ? 'Montant de référence (facultatif)' : 'Montant (HTG)'}</Label>
              <Input type="number" min="0" step="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field mt-1" data-testid="expense-amount-input" required={!form.variable} />
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

      <Dialog open={!!validating} onOpenChange={(open) => !open && setValidating(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Confirmer pour {month}</DialogTitle>
            <DialogDescription>{validating?.label}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmMonth} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Montant à payer ce mois (HTG)</Label>
              <Input type="number" min="0" step="1" value={validateAmount} onChange={e => setValidateAmount(e.target.value)} className="input-field mt-1" data-testid="validate-amount-input" required autoFocus />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setValidating(null)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" data-testid="validate-submit-btn">Confirmer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
