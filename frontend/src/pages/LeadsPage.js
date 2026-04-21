import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Phone, Mail, MapPin, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsPage() {
  const { api, user, selectedMarathon, isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editLead, setEditLead] = useState(null);
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
      if (statusFilter !== 'all') params.status = statusFilter;
      const [leadsRes, vendeursRes] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/users/vendeurs')
      ]);
      setLeads(leadsRes.data.leads);
      setVendeurs(vendeursRes.data.vendeurs);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin, statusFilter]);

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
    if (!formData.full_name || !formData.phone || !formData.payment_method || !formData.address || !formData.date) {
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

  const filtered = leads.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  );

  const vendeurMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));

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

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="search-leads"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl" data-testid="filter-status">
            <Filter className="w-4 h-4 mr-1 text-slate-400" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Très intéressé">Très intéressé</SelectItem>
            <SelectItem value="Inscrit">Inscrit</SelectItem>
          </SelectContent>
        </Select>
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
                  <span className={lead.status === 'Inscrit' ? 'badge-inscrit' : 'badge-tres-interesse'}>
                    {lead.status}
                  </span>
                </div>
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
                    <SelectItem value="Très intéressé">Très intéressé</SelectItem>
                    <SelectItem value="Inscrit">Inscrit</SelectItem>
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
              <Label className="text-xs font-semibold text-slate-500">Adresse *</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field mt-1" placeholder="Adresse" data-testid="lead-address" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-500">Mode de paiement *</Label>
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
    </div>
  );
}
