import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import MetaTags from '@shared/components/MetaTags';
import { useAuth } from '@features/auth/AuthContext';
import {
  LayoutDashboard, FileText, Video, MessageSquare,
  Zap, File, FileBadge, FolderTree, Settings,
  Users, LogOut, Menu, PartyPopper, Mail, ShieldCheck, UserCircle, Images, KeyRound
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/management/septentrional', icon: LayoutDashboard },
      { label: 'Mon profil', path: '/management/septentrional/profil', icon: UserCircle },
    ]
  },
  {
    label: 'Contenu',
    items: [
      { label: 'Articles', path: '/management/septentrional/articles', icon: FileText },
      { label: 'Vidéos', path: '/management/septentrional/videos', icon: Video },
      { label: 'Médiathèque', path: '/management/septentrional/mediatheque', icon: Images },
      { label: 'Flash Infos', path: '/management/septentrional/flash-infos', icon: Zap },
      { label: 'Occasions spéciales', path: '/management/septentrional/occasions', icon: PartyPopper },
    ]
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Commentaires', path: '/management/septentrional/commentaires', icon: MessageSquare },
      { label: 'Pages', path: '/management/septentrional/pages', icon: File },
      { label: 'Abonnés', path: '/management/septentrional/abonnes', icon: Users, adminOnly: true },
      { label: 'Newsletter', path: '/management/septentrional/newsletter', icon: Mail, adminOnly: true },
    ]
  },
  {
    label: 'Système',
    items: [
      { label: 'Catégories', path: '/management/septentrional/categories', icon: FolderTree, adminOnly: true },
      { label: 'Paramètres', path: '/management/septentrional/parametres', icon: Settings, adminOnly: true },
      { label: 'Utilisateurs', path: '/management/septentrional/utilisateurs', icon: ShieldCheck, adminOnly: true },
      { label: 'Clés API', path: '/management/septentrional/api-keys', icon: KeyRound, adminOnly: true },
    ]
  }
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/management/septentrional/login');
  };

  const isActive = (path) => {
    if (path === '/management/septentrional') return location.pathname === '/management/septentrional';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <MetaTags title="Administration" noIndex />
      {/* Sidebar mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 gradient-admin-sidebar text-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hover:translate-x-0 flex flex-col group`}
      >
        {/* Desktop Hover Trigger & Indicator */}
        <div className="absolute top-0 bottom-0 -right-4 w-4 bg-transparent hidden lg:block cursor-pointer" />
        <div className="absolute top-1/2 -right-3 w-3 h-20 -translate-y-1/2 bg-sept-blue-strong/90 backdrop-blur-sm rounded-none hidden lg:flex items-center justify-center shadow-lg border-y border-r border-white/20 group-hover:opacity-0 transition-opacity duration-200 cursor-pointer">
          <div className="w-0.5 h-8 bg-white/60 rounded-none" />
        </div>
        <div className="p-4 border-b border-white/10 bg-black/10">
          <Link to="/management/septentrional" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 bg-sept-accent text-white font-black text-lg flex items-center justify-center font-serif shadow-sm">
              S
            </div>
            <div>
              <div className="font-bold text-sm tracking-wider uppercase font-serif">Septentrional</div>
              <div className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Administration</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
          {menuGroups.map((group, i) => {
            const visibleItems = group.items.filter(item => !(item.adminOnly && !isAdmin()));
            if (visibleItems.length === 0) return null;

            return (
              <div key={i}>
                <div className="admin-menu-group-label">{group.label}</div>
                <div className="space-y-1 mt-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition-all duration-150 overflow-hidden ${
                          isActive(item.path)
                            ? 'bg-white/15 text-white font-semibold border-l-4 border-sept-blue shadow-sm'
                            : 'text-white/75 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${isActive(item.path) ? 'text-sept-blue scale-110' : 'group-hover:scale-110 text-white/70'}`} />
                        <span className="relative z-10 text-xs uppercase tracking-wider">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-none mb-2 border border-white/10">
            <div className="w-8 h-8 rounded-none bg-sept-blue text-white flex items-center justify-center text-xs font-bold uppercase shadow-inner">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-white">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-none text-xs uppercase tracking-wider font-semibold text-white/80 hover:bg-red-600 hover:text-white transition-colors duration-150 border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-4">
        {/* Top bar */}
        <header className="bg-white border-b-2 border-sept-blue-strong/20 px-4 py-3 flex items-center justify-between lg:justify-end sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700 bg-gray-100 rounded-none border border-gray-300 active:scale-95 transition-transform"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs uppercase tracking-wider font-bold text-sept-blue-strong hover:text-white hover:bg-sept-blue-strong border border-sept-blue-strong px-4 py-2 rounded-none transition-colors flex items-center gap-2">
              ← Voir le site public
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
