import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Search, Library, User } from 'lucide-react';

const TABS = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Explorer', path: '/explorer', icon: Compass },
  { label: 'Recherche', path: '/recherche', icon: Search },
  { label: 'Bibliothèque', path: '/mes-achats', icon: Library },
  { label: 'Mon Espace', path: '/mon-espace', icon: User },
];

export default function MobileBottomTabs() {
  const location = useLocation();

  const handleTabPress = (e, tab) => {
    if (location.pathname === tab.path) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0d13]/95 backdrop-blur-2xl border-t border-white/[0.08] select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={(e) => handleTabPress(e, tab)}
              className={`flex-1 flex flex-col items-center justify-center h-full gap-1 transition-all ${
                isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
