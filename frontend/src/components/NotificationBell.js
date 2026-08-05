import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const timeAgo = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
};

export default function NotificationBell({ mode = 'vendeur' }) {
  const { api, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [vendeurMap, setVendeurMap] = useState({});
  const [open, setOpen] = useState(false);
  const isAdminMode = mode === 'admin';

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const params = isAdminMode ? {} : { vendeur_id: user.id };
      const { data } = await api.get('/notifications', { params });
      setNotifications(data.notifications || []);
      if (isAdminMode) {
        const { data: vData } = await api.get('/users/vendeurs');
        setVendeurMap(Object.fromEntries((vData.vendeurs || []).map(v => [v.id, v.name])));
      }
    } catch {
      // notifications are non-critical, fail silently
    }
  }, [api, user, isAdminMode]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = isAdminMode ? 0 : notifications.filter(n => !n.read).length;

  const markRead = async (notif) => {
    if (isAdminMode || notif.read) return;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    try {
      await api.put(`/notifications/${notif.id}`, { read: true });
    } catch {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await Promise.all(unread.map(n => api.put(`/notifications/${n.id}`, { read: true })));
    } catch {
      fetchNotifications();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchNotifications(); }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 ${unreadCount > 0 ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'}`}
          data-testid="notification-bell"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">
            {isAdminMode ? 'Notifications (tous les lancements)' : 'Notifications'}
          </span>
          {!isAdminMode && unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1" data-testid="mark-all-read">
              <CheckCheck className="w-3.5 h-3.5" /> Tout marquer lu
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Aucune notification</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left px-3 py-2.5 ${!isAdminMode ? 'hover:bg-slate-50 cursor-pointer' : ''} transition-colors ${!n.read && !isAdminMode ? 'bg-emerald-50/50' : ''}`}
                data-testid={`notification-${n.id}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isAdminMode ? 'bg-slate-300' : 'bg-emerald-500'}`} />}
                  <div className="flex-1 min-w-0">
                    {isAdminMode && (
                      <p className="text-xs font-semibold text-emerald-600">{vendeurMap[n.vendeur_id] || 'Vendeur'}</p>
                    )}
                    <p className={`text-sm ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
