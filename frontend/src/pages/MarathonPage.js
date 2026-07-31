import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trophy, Calendar, Target, Users, Trash2, RotateCcw, Shuffle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { pendingImport } from '@/data/pendingImport';

const parseImportText = (text) => {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    let parts;
    if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(',')) parts = line.split(',');
    else {
      const match = line.match(/^(.*?)[\s,]+([\d\s\-()]{7,})$/);
      parts = match ? [match[1], match[2]] : [line, ''];
    }
    return { full_name: (parts[0] || '').trim(), phone: (parts[1] || '').trim() };
  }).filter(l => l.full_name);
};

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

  const [redistributeSource, setRedistributeSource] = useState(null);
  const [redistTargetId, setRedistTargetId] = useState('');
  const [excludeInscrit, setExcludeInscrit] = useState(true);
  const [availableCount, setAvailableCount] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [redistLoading, setRedistLoading] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importTargetId, setImportTargetId] = useState('');
  const [importText, setImportText] = useState('');
  const [importAllocations, setImportAllocations] = useState({});
  const [importLoading, setImportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, vRes] = await Promise.all([
        api.get(isAdmin ? '/marathons/all' : '/marathons'),
        api.get('/users/vendeurs')
      ]);
      setMarathons(mRes.data.marathons);
      setVendeurs(vRes.data.vendeurs);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handleReactivate = async (id) => {
    try {
      await api.put(`/marathons/${id}`, { active: true });
      toast.success('Marathon réactivée');
      fetchData();
    } catch { toast.error('Erreur réactivation'); }
  };

  const openRedistribute = (marathon) => {
    setRedistributeSource(marathon);
    setRedistTargetId('');
    setExcludeInscrit(true);
    setAvailableCount(null);
    setAllocations({});
  };

  useEffect(() => {
    if (!redistributeSource) return;
    api.get('/leads/count', {
      params: {
        marathon_id: redistributeSource.id,
        exclude_status: excludeInscrit ? 'Inscrit' : undefined
      }
    }).then(r => setAvailableCount(r.data.count)).catch(() => setAvailableCount(null));
  }, [redistributeSource, excludeInscrit, api]);

  const setAllocation = (vendeurId, value) => {
    setAllocations(prev => ({ ...prev, [vendeurId]: parseInt(value) || 0 }));
  };

  const allocationTotal = Object.values(allocations).reduce((s, v) => s + v, 0);

  const handleRedistribute = async () => {
    if (!redistTargetId) { toast.error('Escolha a maratona de destino'); return; }
    if (allocationTotal === 0) { toast.error('Informe ao menos uma quantidade'); return; }
    if (availableCount !== null && allocationTotal > availableCount) {
      toast.error(`Total (${allocationTotal}) maior que os leads disponíveis (${availableCount})`);
      return;
    }
    const payloadAllocations = Object.entries(allocations)
      .filter(([, qty]) => qty > 0)
      .map(([vendeur_id, quantity]) => ({ vendeur_id, quantity }));
    setRedistLoading(true);
    try {
      const { data } = await api.post('/leads/bulk-redistribute', {
        source_marathon_id: redistributeSource.id,
        target_marathon_id: redistTargetId,
        exclude_status: excludeInscrit ? 'Inscrit' : undefined,
        allocations: payloadAllocations
      });
      toast.success(`${data.moved} lead(s) redistribué(s)`);
      setRedistributeSource(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur redistribution');
    }
    setRedistLoading(false);
  };

  const openImport = () => {
    if (pendingImport) {
      const targetMarathon = marathons.find(m => m.active && pendingImport.formationMatch.test(m.formation));
      const resolvedAllocations = {};
      for (const { namePrefix, quantity } of pendingImport.allocations) {
        const vendeur = vendeurs.find(v => v.name.toLowerCase().startsWith(namePrefix.toLowerCase()));
        if (vendeur) resolvedAllocations[vendeur.id] = quantity;
      }
      setImportTargetId(targetMarathon?.id || '');
      setImportText(pendingImport.text);
      setImportAllocations(resolvedAllocations);
    } else {
      setImportTargetId('');
      setImportText('');
      setImportAllocations({});
    }
    setShowImport(true);
  };

  const setImportAllocation = (vendeurId, value) => {
    setImportAllocations(prev => ({ ...prev, [vendeurId]: parseInt(value) || 0 }));
  };

  const importParsed = parseImportText(importText);
  const importAllocationTotal = Object.values(importAllocations).reduce((s, v) => s + v, 0);

  const handleImport = async () => {
    if (!importTargetId) { toast.error('Escolha a maratona de destino'); return; }
    if (importParsed.length === 0) { toast.error('Cole ao menos um nome e telefone'); return; }
    if (importAllocationTotal !== importParsed.length) {
      toast.error(`Total distribuído (${importAllocationTotal}) precisa ser igual ao número de leads colados (${importParsed.length})`);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const blocks = Object.entries(importAllocations).filter(([, qty]) => qty > 0);
    setImportLoading(true);
    try {
      let cursor = 0;
      let created = 0;
      for (const [vendeur_id, quantity] of blocks) {
        const chunk = importParsed.slice(cursor, cursor + quantity);
        cursor += quantity;
        for (const { full_name, phone } of chunk) {
          await api.post('/leads', {
            date: today,
            full_name,
            phone,
            email: '',
            payment_method: '',
            comments: '',
            status: 'Potentiel',
            address: '',
            profession: '',
            vendeur_id,
            marathon_id: importTargetId,
            promise_date: null
          });
          created++;
        }
      }
      toast.success(`${created} lead(s) importé(s)`);
      setShowImport(false);
    } catch (err) {
      toast.error(err.message || 'Erreur import');
    }
    setImportLoading(false);
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
          <div className="flex items-center gap-2">
            <Button onClick={openImport} variant="outline" className="flex items-center gap-2 h-10 text-sm rounded-xl" data-testid="import-leads-btn">
              <Upload className="w-4 h-4" /> Importer leads
            </Button>
            <Button onClick={() => { setFormData({ name: '', formation: '', start_date: '', end_date: '', objectif_total: 0, objectif_par_vendeur: {} }); setShowForm(true); }} className="btn-primary flex items-center gap-2 h-10 text-sm" data-testid="add-marathon-btn">
              <Plus className="w-4 h-4" /> Créer
            </Button>
          </div>
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
              {isAdminPrincipal && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600" onClick={() => openRedistribute(m)} data-testid={`redistribute-marathon-${m.id}`} title="Redistribuir leads">
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  {m.active ? (
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(m.id)} data-testid={`delete-marathon-${m.id}`} title="Desativar">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600" onClick={() => handleReactivate(m.id)} data-testid={`reactivate-marathon-${m.id}`} title="Reativar">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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

      {/* Redistribute Dialog */}
      <Dialog open={!!redistributeSource} onOpenChange={(open) => !open && setRedistributeSource(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Redistribuir leads</DialogTitle>
            <DialogDescription>
              De "{redistributeSource?.name}" para outra maratona, divididos por vendedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exclude-inscrit"
                checked={excludeInscrit}
                onChange={e => setExcludeInscrit(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="exclude-inscrit" className="text-sm text-slate-600">
                Apenas leads não inscritos (excluir status "Inscrit")
              </Label>
            </div>

            <p className="text-sm text-slate-500">
              {availableCount === null ? 'Carregando...' : `${availableCount} lead(s) disponível(is)`}
            </p>

            <div>
              <Label className="text-xs font-semibold text-slate-500">Maratona de destino *</Label>
              <Select value={redistTargetId} onValueChange={setRedistTargetId}>
                <SelectTrigger className="input-field mt-1" data-testid="redistribute-target">
                  <SelectValue placeholder="Escolher maratona..." />
                </SelectTrigger>
                <SelectContent>
                  {marathons.filter(m => m.active && m.id !== redistributeSource?.id).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-2 block">Quantidade por vendedor</Label>
              <div className="space-y-2">
                {vendeurs.map(v => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-28 truncate">{v.name}</span>
                    <Input
                      type="number"
                      min="0"
                      value={allocations[v.id] || ''}
                      onChange={e => setAllocation(v.id, e.target.value)}
                      className="h-9 rounded-lg flex-1"
                      placeholder="0"
                      data-testid={`redistribute-qty-${v.id}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Total: {allocationTotal}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setRedistributeSource(null)}>
                Cancelar
              </Button>
              <Button type="button" className="btn-primary flex-1" onClick={handleRedistribute} disabled={redistLoading} data-testid="redistribute-submit-btn">
                {redistLoading ? 'Redistribuindo...' : 'Redistribuir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Leads Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Importer des leads</DialogTitle>
            <DialogDescription>
              Collez une liste (Nom + Téléphone), un par ligne, puis répartissez entre les vendeurs
            </DialogDescription>
          </DialogHeader>
          {pendingImport && (
            <p className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2">
              Pré-preenchido com a lista pendente. Confira a maratona e as quantidades antes de confirmar.
            </p>
          )}
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Maratona de destino *</Label>
              <Select value={importTargetId} onValueChange={setImportTargetId}>
                <SelectTrigger className="input-field mt-1" data-testid="import-target">
                  <SelectValue placeholder="Escolher maratona..." />
                </SelectTrigger>
                <SelectContent>
                  {marathons.filter(m => m.active).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500">Nom + Téléphone (un par ligne)</Label>
              <Textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="rounded-xl mt-1 font-mono text-xs"
                rows={8}
                placeholder={'Jean Baptiste\t42 05 38 85\nMarie Claire, 32 16 66 16'}
                data-testid="import-textarea"
              />
              <p className="text-xs text-slate-400 mt-1">{importParsed.length} lead(s) détecté(s)</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-2 block">Quantidade por vendedor</Label>
              <div className="space-y-2">
                {vendeurs.map(v => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-28 truncate">{v.name}</span>
                    <Input
                      type="number"
                      min="0"
                      value={importAllocations[v.id] || ''}
                      onChange={e => setImportAllocation(v.id, e.target.value)}
                      className="h-9 rounded-lg flex-1"
                      placeholder="0"
                      data-testid={`import-qty-${v.id}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Total: {importAllocationTotal} / {importParsed.length}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowImport(false)}>
                Cancelar
              </Button>
              <Button type="button" className="btn-primary flex-1" onClick={handleImport} disabled={importLoading} data-testid="import-submit-btn">
                {importLoading ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
