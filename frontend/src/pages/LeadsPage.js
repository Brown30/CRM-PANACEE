import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Phone, Mail, MapPin, Calendar, Filter, X, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { buildFichaInscricaoPdf } from '@/lib/fichaInscricao';
import { slugifyFileName } from '@/lib/certificate';

export default function LeadsPage() {
  const { api, user, selectedMarathon, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendeurFilter, setVendeurFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editLead, setEditLead] = useState(null);
  const [fichaPdf, setFichaPdf] = useState(null);
  const [fichaPreviewUrl, setFichaPreviewUrl] = useState(null);
  const [fichaFileName, setFichaFileName] = useState('');
  const [generatingFicha, setGeneratingFicha] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    full_name: '', phone: '', email: '', payment_method: '',
    comments: '', status: 'Très intéressé', address: '',
    profession: '', vendeur_id: '', promise_date: ''
  });

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) return;
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (!isAdmin) params.vendeur_id = user.id;
      else if (vendeurFilter !== 'all') params.vendeur_id = vendeurFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const [leadsRes, vendeursRes] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/users/vendeurs')
      ]);
      setLeads(leadsRes.data.leads);
      setVendeurs(vendeursRes.data.vendeurs);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin, statusFilter, vendeurFilter, dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditLead(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      full_name: '', phone: '', email: '', payment_method: '',
      comments: '', status: 'Très intéressé', address: '',
      profession: '', vendeur_id: user.role === 'vendeur' ? user.id : '',
      promise_date: ''
    });
    setShowForm(true);
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setFormData({
      date: lead.date || '', full_name: lead.full_name || '',
      phone: lead.phone || '', email: lead.email || '',
      payment_method: lead.payment_method || '', comments: lead.comments || '',
      status: lead.status || 'Très intéressé', address: lead.address || '',
      profession: lead.profession || '', vendeur_id: lead.vendeur_id || '',
      promise_date: lead.promise_date || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isLost = formData.status === 'Pa enterese ditou';
    if (!formData.full_name || !formData.phone || !formData.date || (!isLost && (!formData.payment_method || !formData.address))) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      if (editLead) {
        await api.put(`/leads/${editLead.id}`, formData);
        toast.success('Lead modifié');
      } else {
        await api.post('/leads', { ...formData, marathon_id: selectedMarathon.id });
        toast.success('Lead ajouté');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (leadId) => {
    try {
      const { data } = await api.delete(`/leads/${leadId}`);
      toast.success(data.message);
      fetchData();
    } catch { toast.error('Erreur suppression'); }
  };

  const handleGenerateFicha = async () => {
    if (!editLead || !selectedMarathon) return;
    setGeneratingFicha(true);
    try {
      const dateStr = new Date().toLocaleDateString('fr-FR');
      const pdf = buildFichaInscricaoPdf({
        fullName: editLead.full_name,
        formation: selectedMarathon.formation,
        dateStr,
        vendorName: user?.name || ''
      });
      setFichaPdf(pdf);
      setFichaFileName(`Fiche_Inscription_${slugifyFileName(editLead.full_name)}.pdf`);
      setFichaPreviewUrl(pdf.output('bloburl'));
    } catch (err) {
      toast.error(err.message || 'Erreur génération fiche');
    }
    setGeneratingFicha(false);
  };

  const closeFichaPreview = () => {
    if (fichaPreviewUrl) URL.revokeObjectURL(fichaPreviewUrl);
    setFichaPreviewUrl(null);
    setFichaPdf(null);
  };

  const filtered = leads.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm) ||
    l.comments?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vendeurMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));

  // Import batches tag leads with a short one-line comment (e.g. "Ansyen Enterese X (date)",
  // "Enterese Kamera (Janvier 2026)"). Any single-line comment is shown as a badge; longer,
  // multi-line free-text notes are not, since those aren't tags.
  const getTagBadge = (comments) => {
    const trimmed = comments?.trim();
    if (!trimmed || trimmed.includes('\n') || trimmed.length > 80) return null;
    return trimmed;
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="leads-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Leads
        </h2>
        <Button onClick={openAdd} className="btn-primary flex items-center gap-2 h-10 text-sm" data-testid="add-lead-btn">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-testid="search-leads"
          placeholder="Rechercher (nom, téléphone, commentaire)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-xl"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {isAdmin && (
          <Select value={vendeurFilter} onValueChange={setVendeurFilter}>
            <SelectTrigger className="w-[160px] h-10 rounded-xl" data-testid="filter-vendeur">
              <SelectValue placeholder="Vendeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les vendeurs</SelectItem>
              {vendeurs.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl" data-testid="filter-status">
            <Filter className="w-4 h-4 mr-1 text-slate-400" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Potentiel">Potentiel</SelectItem>
            <SelectItem value="Très intéressé">Très intéressé</SelectItem>
            <SelectItem value="Inscrit">Inscrit</SelectItem>
            <SelectItem value="Participant">Participant</SelectItem>
            <SelectItem value="Pa enterese ditou">Pa enterese ditou</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-[160px] h-10 rounded-xl"
          data-testid="filter-date"
        />
        {(vendeurFilter !== 'all' || statusFilter !== 'all' || dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-xs text-slate-500 flex items-center gap-1"
            onClick={() => { setVendeurFilter('all'); setStatusFilter('all'); setDateFilter(''); }}
            data-testid="clear-filters"
          >
            <X className="w-3.5 h-3.5" /> Effacer les filtres
          </Button>
        )}
      </div>

      {/* Leads count */}
      <p className="text-sm text-slate-500">{filtered.length} lead(s)</p>

      {/* Leads List - Card style for mobile */}
      <div className="space-y-3">
        {filtered.map((lead) => (
          <div
            key={lead.id}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => openEdit(lead)}
            data-testid={`lead-card-${lead.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{lead.full_name}</h3>
                  <span className={
                    lead.status === 'Inscrit' ? 'badge-inscrit' :
                    lead.status === 'Potentiel' ? 'badge-potentiel' :
                    lead.status === 'Participant' ? 'badge-participant' :
                    lead.status === 'Pa enterese ditou' ? 'badge-pa-enterese' : 'badge-tres-interesse'
                  }>
                    {lead.status}
                  </span>
                </div>
                {getTagBadge(lead.comments) && (
                  <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1">
                    {getTagBadge(lead.comments)}
                  </span>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                  {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.address}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.date}</span>
                </div>
                {isAdmin && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    Vendeur: {vendeurMap[lead.vendeur_id] || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            {lead.promise_date && lead.status === 'Très intéressé' && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 inline-block">
                Promesse: {lead.promise_date}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium">Aucun lead trouvé</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>
              {editLead ? 'Modifier le lead' : 'Nouveau lead'}
            </DialogTitle>
            <DialogDescription>
              {editLead ? 'Modifiez les informations du lead' : 'Remplissez les informations du lead'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Date *</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field mt-1" data-testid="lead-date" required />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Statut *</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="input-field mt-1" data-testid="lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Potentiel">Potentiel</SelectItem>
                    <SelectItem value="Très intéressé">Très intéressé</SelectItem>
                    <SelectItem value="Inscrit">Inscrit</SelectItem>
                    <SelectItem value="Participant">Participant</SelectItem>
                    <SelectItem value="Pa enterese ditou">Pa enterese ditou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Nom complet *</Label>
              <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-field mt-1" placeholder="Nom complet" data-testid="lead-fullname" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Téléphone *</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field mt-1" placeholder="Téléphone" data-testid="lead-phone" required />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field mt-1" placeholder="Email" data-testid="lead-email" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Adresse{formData.status !== 'Pa enterese ditou' && ' *'}</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field mt-1" placeholder="Adresse" data-testid="lead-address" required={formData.status !== 'Pa enterese ditou'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Mode de paiement{formData.status !== 'Pa enterese ditou' && ' *'}</Label>
                <Select value={formData.payment_method} onValueChange={v => setFormData({...formData, payment_method: v})}>
                  <SelectTrigger className="input-field mt-1" data-testid="lead-payment">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONCASH">MONCASH</SelectItem>
                    <SelectItem value="NATCASH">NATCASH</SelectItem>
                    <SelectItem value="LOCAL">LOCAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500">Profession</Label>
                <Input value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} className="input-field mt-1" placeholder="Profession" data-testid="lead-profession" />
              </div>
            </div>
            {isAdmin && (
              <div>
                <Label className="text-xs font-semibold text-slate-500">Vendeur *</Label>
                <Select value={formData.vendeur_id} onValueChange={v => setFormData({...formData, vendeur_id: v})}>
                  <SelectTrigger className="input-field mt-1" data-testid="lead-vendeur">
                    <SelectValue placeholder="Choisir vendeur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendeurs.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.status === 'Très intéressé' && (
              <div>
                <Label className="text-xs font-semibold text-slate-500">Date promesse</Label>
                <Input type="date" value={formData.promise_date} onChange={e => setFormData({...formData, promise_date: e.target.value})} className="input-field mt-1" data-testid="lead-promise-date" />
              </div>
            )}
            {editLead && formData.status === 'Très intéressé' && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl text-sm flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={handleGenerateFicha}
                disabled={generatingFicha}
                data-testid="lead-generate-ficha-btn"
              >
                <FileText className="w-4 h-4" />
                {generatingFicha ? 'Génération...' : "Générer la fiche d'inscription"}
              </Button>
            )}
            <div>
              <Label className="text-xs font-semibold text-slate-500">Commentaires</Label>
              <Textarea value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="rounded-xl mt-1" placeholder="Commentaires..." data-testid="lead-comments" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" className="btn-primary flex-1" data-testid="lead-submit-btn">
                {editLead ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
            {editLead && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-10 rounded-xl text-sm"
                onClick={() => { handleDelete(editLead.id); setShowForm(false); }}
                data-testid="lead-delete-btn"
              >
                Supprimer ce lead
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Ficha d'inscription preview */}
      <Dialog open={!!fichaPreviewUrl} onOpenChange={(open) => !open && closeFichaPreview()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Fiche d'inscription</DialogTitle>
            <DialogDescription>Vérifiez avant de télécharger ou d'envoyer au lead</DialogDescription>
          </DialogHeader>
          {fichaPreviewUrl && (
            <iframe src={fichaPreviewUrl} title="Fiche d'inscription" className="w-full h-96 rounded-xl border border-slate-200" />
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={closeFichaPreview}>
              Fermer
            </Button>
            <Button
              type="button"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={() => fichaPdf?.save(fichaFileName)}
              data-testid="ficha-download-btn"
            >
              <Download className="w-4 h-4" /> Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
