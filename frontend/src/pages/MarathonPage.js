import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trophy, Calendar, Target, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MarathonPage() {
  const { api, isAdmin, isAdminPrincipal } = useAuth();
  const [marathons, setMarathons] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', formation: '', start_date: '', end_date: '',
    objectif_total: 0, objectif_par_vendeur: {}
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mRes, vRes] = await Promise.all([
        api.get(isAdmin ? '/marathons/all' : '/marathons'),
        api.get('/users/vendeurs')
      ]);
      setMarathons(mRes.data.marathons);
      setVendeurs(vRes.data.vendeurs);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.formation) {
      toast.error('Nom et formation requis'); return;
    }
    try {
      await api.post('/marathons', formData);
      toast.success('Marathon créée');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/marathons/${id}`);
      toast.success('Marathon désactivée');
      fetchData();
    } catch { toast.error('Erreur suppression'); }
  };

  const setVendeurObjectif = (vendeurId, value) => {
    setFormData(prev => ({
      ...prev,
      objectif_par_vendeur: { ...prev.objectif_par_vendeur, [vendeurId]: parseInt(value) || 0 }
    }));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="marathon-page">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Marathons
        </h2>
        {isAdminPrincipal && (
          <Button onClick={() => { setFormData({ name: '', formation: '', start_date: '', end_date: '', objectif_total: 0, objectif_par_vendeur: {} }); setShowForm(true); }} className="btn-primary flex items-center gap-2 h-10 text-sm" data-testid="add-marathon-btn">
            <Plus className="w-4 h-4" /> Créer
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {marathons.map((m) => (
          <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${m.active ? 'border-slate-200/60' : 'border-slate-200/40 opacity-60'}`} data-testid={`marathon-item-${m.id}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</h3>
                  {!m.active && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-emerald-500" />{m.formation}</span>
                  {m.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.start_date} → {m.end_date || '...'}</span>}
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" />Obj: {m.objectif_total}</span>
                </div>
                {m.objectif_par_vendeur && Object.keys(m.objectif_par_vendeur).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(m.objectif_par_vendeur).map(([vid, obj]) => {
                      const v = vendeurs.find(v => v.id === vid);
                      return v ? (
                        <span key={vid} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                          <Users className="w-3 h-3 inline mr-1" />{v.name}: {obj}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              {isAdminPrincipal && m.active && (
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 shrink-0" onClick={() => handleDelete(m.id)} data-testid={`delete-marathon-${m.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {marathons.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium">Aucune marathon</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Créer une marathon</DialogTitle>
            <DialogDescription>Définissez les détails de la nouvelle campagne</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Nom *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field mt-1" placeholder="Nom de la marathon" data-testid="marathon-name" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Formation *</Label>
              <Select value={formData.formation} onValueChange={v => setFormData({...formData, formation: v})}>
                <SelectTrigger className="input-field mt-1" data-testid="marathon-formation">
                  <SelectValue placeholder="Choisir formation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Installation de caméra de surveillance">Installation de caméra de surveillance</SelectItem>
                  <SelectItem value="Électricité">Électricité</SelectItem>
                  <SelectItem value="Rolling Door">Rolling Door</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Date début</Label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="input-field mt-1" data-testid="marathon-start" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Date fin</Label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="input-field mt-1" data-testid="marathon-end" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Objectif total</Label>
              <Input type="number" value={formData.objectif_total} onChange={e => setFormData({...formData, objectif_total: parseInt(e.target.value) || 0})} className="input-field mt-1" data-testid="marathon-objectif" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-2 block">Objectif par vendeur</Label>
              <div className="space-y-2">
                {vendeurs.map(v => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-28 truncate">{v.name}</span>
                    <Input
                      type="number"
                      value={formData.objectif_par_vendeur[v.id] || ''}
                      onChange={e => setVendeurObjectif(v.id, e.target.value)}
                      className="h-9 rounded-lg flex-1"
                      placeholder="0"
                      data-testid={`marathon-vendeur-obj-${v.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" data-testid="marathon-submit-btn">Créer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
