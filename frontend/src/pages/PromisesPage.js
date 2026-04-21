import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertTriangle, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

export default function PromisesPage() {
  const { api, user, selectedMarathon, isAdmin } = useAuth();
  const [todayPromises, setTodayPromises] = useState([]);
  const [overduePromises, setOverduePromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  const fetchPromises = useCallback(async () => {
    if (!selectedMarathon) return;
    setLoading(true);
    try {
      const params = { marathon_id: selectedMarathon.id };
      if (!isAdmin) params.vendeur_id = user.id;

      const [todayRes, overdueRes] = await Promise.all([
        api.get('/promises', { params: { ...params, filter_type: 'today' } }),
        api.get('/promises', { params: { ...params, filter_type: 'overdue' } })
      ]);
      setTodayPromises(todayRes.data.promises);
      setOverduePromises(overdueRes.data.promises);
    } catch { toast.error('Erreur chargement promesses'); }
    setLoading(false);
  }, [api, selectedMarathon, user, isAdmin]);

  useEffect(() => { fetchPromises(); }, [fetchPromises]);

  const PromiseCard = ({ lead, isOverdue }) => (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${isOverdue ? 'border-red-200' : 'border-slate-200/60'}`} data-testid={`promise-card-${lead.id}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{lead.full_name}</h3>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.promise_date}</span>
          </div>
          {lead.comments && <p className="text-xs text-slate-400 mt-1">{lead.comments}</p>}
        </div>
        {isOverdue && (
          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full shrink-0">
            <AlertTriangle className="w-3 h-3" />En retard
          </span>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="promises-page">
      <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Promesses d'inscription
      </h2>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-11 rounded-xl bg-slate-100">
          <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-sm" data-testid="tab-today">
            <Clock className="w-4 h-4 mr-1" />
            Aujourd'hui ({todayPromises.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm text-sm" data-testid="tab-overdue">
            <AlertTriangle className="w-4 h-4 mr-1" />
            En retard ({overduePromises.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-4">
          {todayPromises.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Aucune promesse aujourd'hui</p>
            </div>
          ) : (
            todayPromises.map(p => <PromiseCard key={p.id} lead={p} isOverdue={false} />)
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-3 mt-4">
          {overduePromises.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">Aucune promesse en retard</p>
            </div>
          ) : (
            overduePromises.map(p => <PromiseCard key={p.id} lead={p} isOverdue={true} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
