import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

export default function ReportsPage() {
  const { api, selectedMarathon, isAdmin } = useAuth();
  const [reports, setReports] = useState(null);
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVendeur, setFilterVendeur] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    if (!selectedMarathon) return;
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (filterVendeur !== 'all') params.vendeur_id = filterVendeur;
      if (startDate && endDate) { params.start_date = startDate; params.end_date = endDate; }
      const [repRes, vRes] = await Promise.all([
        api.get('/reports', { params }),
        api.get('/users/vendeurs')
      ]);
      setReports(repRes.data);
      setVendeurs(vRes.data.vendeurs);
    } catch { toast.error('Erreur chargement rapports'); }
    setLoading(false);
  }, [api, selectedMarathon, filterVendeur, startDate, endDate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!reports) return null;

  const pieData = [
    { name: 'Inscrits', value: reports.total_inscrits },
    { name: 'Très intéressés', value: reports.total_tres_interesses },
    { name: 'Autres', value: reports.total_leads - reports.total_inscrits - reports.total_tres_interesses }
  ].filter(d => d.value > 0);

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="reports-page">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Rapports
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <Select value={filterVendeur} onValueChange={setFilterVendeur}>
            <SelectTrigger className="w-[170px] h-10 rounded-xl" data-testid="report-filter-vendeur">
              <SelectValue placeholder="Tous vendeurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous vendeurs</SelectItem>
              {vendeurs.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 rounded-xl w-[140px]" data-testid="report-start-date" />
          <span className="text-slate-400 text-sm">→</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 rounded-xl w-[140px]" data-testid="report-end-date" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{reports.total_leads}</p>
          <p className="text-xs text-slate-500 mt-1">Total leads</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-emerald-600" style={{ fontFamily: "'Outfit', sans-serif" }}>{reports.total_inscrits}</p>
          <p className="text-xs text-slate-500 mt-1">Inscrits</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Outfit', sans-serif" }}>{reports.total_tres_interesses}</p>
          <p className="text-xs text-slate-500 mt-1">Très intéressés</p>
        </div>
      </div>

      {/* Daily Chart */}
      {reports.daily.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Leads par jour
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="inscrits" fill="#059669" name="Inscrits" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tres_interesses" fill="#34D399" name="Très intéressés" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Répartition des statuts
          </h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per vendeur */}
      {isAdmin && reports.par_vendeur.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" data-testid="report-vendeur-table">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>Par vendeur</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.par_vendeur.map(v => (
              <div key={v.vendeur_id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{v.vendeur_name}</p>
                  <p className="text-xs text-slate-400">{v.total} leads total</p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-sm font-bold text-emerald-600">{v.inscrits}</p>
                    <p className="text-xs text-slate-400">inscrits</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{v.tres_interesses}</p>
                    <p className="text-xs text-slate-400">intéressés</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
