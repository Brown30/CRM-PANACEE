import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, Users } from 'lucide-react';
import { toast } from 'sonner';
import NoMarathonFallback from '@/components/NoMarathonFallback';

const STATUS_BADGE = {
  'Potentiel': 'bg-slate-100 text-slate-600',
  'Très intéressé': 'bg-amber-100 text-amber-700',
  'Inscrit': 'bg-blue-100 text-blue-700',
  'Participant': 'bg-emerald-100 text-emerald-700'
};

// Deliberately read-only: no add/edit/transfer anywhere on this page. Built
// for a coordinator role (e.g. a professeur granted canViewCommercial) that
// needs visibility across every vendor's leads, never write access to them —
// that stays admin-only in the regular Leads page.
export default function LeadsOverviewPage() {
  const { api, selectedMarathon } = useAuth();
  const [leads, setLeads] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendeurFilter, setVendeurFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!selectedMarathon) return;
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (vendeurFilter !== 'all') params.vendeur_id = vendeurFilter;
      const [leadsRes, vendeursRes] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/users/vendeurs')
      ]);
      setLeads(leadsRes.data.leads || []);
      setVendeurs(vendeursRes.data.vendeurs || []);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  }, [api, selectedMarathon, statusFilter, vendeurFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!selectedMarathon) return <NoMarathonFallback />;

  const vendeurMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));
  const filtered = leads.filter(l => l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="leads-overview-page">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <Users className="w-5 h-5 text-blue-500" /> Leads — tous les vendeurs
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble en lecture seule — {selectedMarathon.name}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher (nom)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-xl"
          data-testid="leads-overview-search"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={vendeurFilter} onValueChange={setVendeurFilter}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl" data-testid="leads-overview-filter-vendeur"><SelectValue placeholder="Vendeur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les vendeurs</SelectItem>
            {vendeurs.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl" data-testid="leads-overview-filter-status"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Potentiel">Potentiel</SelectItem>
            <SelectItem value="Très intéressé">Très intéressé</SelectItem>
            <SelectItem value="Inscrit">Inscrit</SelectItem>
            <SelectItem value="Participant">Participant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4" data-testid={`leads-overview-row-${lead.id}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{lead.full_name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {lead.phone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                    <span className="text-xs text-slate-400">{vendeurMap[lead.vendeur_id] || 'N/A'}</span>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                  {lead.status}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Aucun lead pour ce filtre</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
