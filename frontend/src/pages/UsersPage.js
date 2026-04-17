import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, User, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { api, isAdminPrincipal } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', role: 'vendeur' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch { toast.error('Erreur chargement'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) { toast.error('Nom et code requis'); return; }
    try {
      await api.post(`/users?name=${encodeURIComponent(formData.name)}&code=${formData.code}&role=${formData.role}`);
      toast.success('Utilisateur créé');
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch { toast.error('Erreur suppression'); }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin_principal') return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    if (role === 'admin_secondary') return <Shield className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-slate-400" />;
  };

  const getRoleBadge = (role) => {
    if (role === 'admin_principal') return 'bg-emerald-100 text-emerald-700';
    if (role === 'admin_secondary') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const getRoleLabel = (role) => {
    if (role === 'admin_principal') return 'Admin Principal';
    if (role === 'admin_secondary') return 'Admin Secondaire';
    return 'Vendeur';
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="users-page">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Utilisateurs
        </h2>
        {isAdminPrincipal && (
          <Button onClick={() => { setFormData({ name: '', code: '', role: 'vendeur' }); setShowForm(true); }} className="btn-primary flex items-center gap-2 h-10 text-sm" data-testid="add-user-btn">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-4" data-testid={`user-item-${u.id}`}>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              {getRoleIcon(u.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadge(u.role)}`}>
                  {getRoleLabel(u.role)}
                </span>
                <span className="text-xs text-slate-400">Code: {u.code}</span>
              </div>
            </div>
            {isAdminPrincipal && u.role !== 'admin_principal' && (
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 shrink-0" onClick={() => handleDelete(u.id)} data-testid={`delete-user-${u.id}`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }}>Nouvel utilisateur</DialogTitle>
            <DialogDescription>Ajoutez un nouvel utilisateur au système</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500">Nom *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field mt-1" placeholder="Nom complet" data-testid="user-name" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Code *</Label>
              <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="input-field mt-1" placeholder="Code d'accès" data-testid="user-code" required />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500">Rôle</Label>
              <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                <SelectTrigger className="input-field mt-1" data-testid="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendeur">Vendeur</SelectItem>
                  <SelectItem value="admin_secondary">Admin Secondaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" className="btn-primary flex-1" data-testid="user-submit-btn">Créer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
