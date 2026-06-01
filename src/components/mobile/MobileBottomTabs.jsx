import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Music, Newspaper } from 'lucide-react';

const TABS = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Artistes', path: '/artistes', icon: Users },
  { label: 'Musique', path: '/musique', icon: Music },
  { label: 'Actualités', path: '/actualites', icon: Newspaper },
];

// Deep child routes that should hide the bottom tabs
const DEEP_ROUTES = ['/artistes/', '/actualites/'];

export default function MobileBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on deep child screens
  const isDeep = DEEP_ROUTES.some(
    (prefix) => location.pathname.startsWith(prefix) && location.pathname.length > prefix.length
  );
  if (isDeep) return null;

  const handleTabPress = (e, tab) => {
    if (location.pathname === tab.path) {
      // Re-tap on active tab: scroll to top instead of navigating
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Otherwise let the Link navigate normally, preserving browser history
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          // Highlight if current path starts with tab path (handles sub-routes)
          const isActive = tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={(e) => handleTabPress(e, tab)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 select-none transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}