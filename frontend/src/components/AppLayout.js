import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, CalendarClock, Trophy, BarChart3, FileText, UserCog, LogOut, ChevronDown, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const { user, logout, selectedMarathon, selectMarathon, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeMarathon = () => {
    selectMarathon(null);
    navigate('/select-marathon');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/promesses', icon: CalendarClock, label: 'Promesses' },
    { to: '/ranking', icon: Trophy, label: 'Ranking' },
  ];

  const adminItems = [
    { to: '/marathons', icon: Flag, label: 'Marathons' },
    { to: '/rapports', icon: BarChart3, label: 'Rapports' },
    { to: '/utilisateurs', icon: UserCog, label: 'Utilisateurs' },
  ];

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="app-layout">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 flex-col z-30">
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Panacée <span className="text-emerald-500">CRM</span>
          </h1>
        </div>

        {/* Marathon selector */}
        <button onClick={handleChangeMarathon} className="mx-4 mt-4 p-3 bg-emerald-50 rounded-xl text-left hover:bg-emerald-100 transition-colors" data-testid="change-marathon-desktop">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Marathon active</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-medium text-slate-800 truncate">{selectedMarathon?.name}</p>
            <ChevronDown className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-emerald-700">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500 shrink-0" data-testid="logout-desktop">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Panacée <span className="text-emerald-500">CRM</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleChangeMarathon} className="text-xs bg-emerald-50 text-emerald-700 font-medium px-3 py-1.5 rounded-full max-w-[140px] truncate" data-testid="change-marathon-mobile">
              {selectedMarathon?.name}
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500 h-8 w-8" data-testid="logout-mobile">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-64 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
        <div className="flex items-center justify-around px-2 py-1">
          {allItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
