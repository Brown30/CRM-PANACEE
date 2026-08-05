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

export default function NotificationBell() {
  const { api, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get('/notifications', { params: { vendeur_id: user.id } });
      setNotifications(data.notifications || []);
    } catch {
      // notifications are non-critical, fail silently
    }
  }, [api, user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (notif) => {
    if (notif.read) return;
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
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-700 h-9 w-9" data-testid="notification-bell">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Notifications</span>
          {unreadCount > 0 && (
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
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-emerald-50/50' : ''}`}
                data-testid={`notification-${n.id}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
