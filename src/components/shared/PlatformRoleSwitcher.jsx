import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { localDb } from '@/api/localStore';
import { Shield, Building2, Mic2, Headphones, ChevronDown, Check, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = [
  {
    key: 'admin',
    title: 'Panneau Administration',
    subtitle: 'Gestion globale de la plateforme entière',
    icon: Shield,
    color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    activeBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    primaryPath: '/admin',
    tag: 'Admin'
  },
  {
    key: 'label',
    title: 'Le Label KKD Music',
    subtitle: 'Catalogue, signatures & royalties artistes',
    icon: Building2,
    color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    activeBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    primaryPath: '/mon-espace',
    tag: 'Label'
  },
  {
    key: 'artist',
    title: 'Artiste Indépendant',
    subtitle: 'Ventes directes & Licences sync',
    icon: Mic2,
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    activeBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    primaryPath: '/mon-espace',
    tag: 'Artiste'
  },
  {
    key: 'fan',
    title: 'Fan & Acheteur',
    subtitle: 'Achats directs & Billetterie',
    icon: Headphones,
    color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    activeBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    primaryPath: '/musique',
    tag: 'Acheteur'
  }
];

export default function PlatformRoleSwitcher() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Find active role based on current user's role/account_type
  const activeRole = user?.role === 'admin' ? ROLES[0]
    : user?.account_type === 'label' ? ROLES[1]
    : user?.account_type === 'artist' ? ROLES[2]
    : ROLES[3];

  const handleSelectRole = (roleItem) => {
    localDb.switchRole(roleItem.key);
    setIsOpen(false);
    
    // Smoothly redirect to the natural landing view for that role if helpful
    if (roleItem.key === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin');
    } else if ((roleItem.key === 'label' || roleItem.key === 'artist') && location.pathname === '/admin') {
      navigate('/mon-espace');
    } else if (roleItem.key === 'fan' && (location.pathname.startsWith('/admin') || location.pathname.startsWith('/mon-espace'))) {
      navigate('/musique');
    }
  };

  const Icon = activeRole.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop for easy closing */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />

              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 mb-2 w-80 sm:w-96 bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl p-3 space-y-2 z-50 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Partenaires & Rôles Clés
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">1-Click Demo</span>
                </div>

                <div className="space-y-1">
                  {ROLES.map((r) => {
                    const RoleIcon = r.icon;
                    const isCurrent = activeRole.key === r.key;

                    return (
                      <button
                        key={r.key}
                        onClick={() => handleSelectRole(r)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                          isCurrent
                            ? `${r.activeBadge} shadow-sm`
                            : 'border-transparent hover:bg-secondary/70 hover:border-border/60'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 border ${r.color}`}>
                          <RoleIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold truncate text-foreground">
                              {r.title}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${r.color}`}>
                              {r.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {r.subtitle}
                          </p>
                        </div>
                        {isCurrent && (
                          <div className="text-primary mt-1">
                            <Check size={14} className="stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] px-2 text-muted-foreground">
                  <span>Connecté : <strong className="text-foreground">{user?.email || 'Invité'}</strong></span>
                  <button
                    onClick={() => navigate(activeRole.primaryPath)}
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Ouvrir l'espace <ExternalLink size={11} />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Pill Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-xl border backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
            isOpen
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card/90 border-border/80 text-foreground hover:border-primary/50'
          }`}
          title="Changer de rôle (Label, Artiste, Admin, Fan)"
        >
          <div className={`w-2 h-2 rounded-full animate-ping ${activeRole.key === 'admin' ? 'bg-purple-400' : activeRole.key === 'label' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <Icon size={15} className="shrink-0" />
          <span className="text-xs font-bold tracking-tight hidden xs:inline">
            {activeRole.title}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}