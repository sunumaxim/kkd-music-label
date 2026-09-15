import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, X, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_COLORS = {
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  demande: 'bg-primary/10 text-primary border border-primary/20',
  officiel: 'bg-red-500/15 text-red-400 border border-red-500/30 font-extrabold',
  mailing: 'bg-gradient-to-r from-red-500/15 to-amber-500/15 text-amber-300 border border-amber-500/30 font-bold',
};

const TYPE_LABELS = {
  info: 'INFO',
  success: 'SUCCÈS',
  warning: 'ALERTE',
  demande: 'DEMANDE',
  officiel: 'OFFICIEL',
  mailing: 'ANNONCE DIRECTION',
};

// Carillon audio doux pour les notifications push en direct
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Audio non supporté ou bloqué
  }
};

export default function NotificationBell({ user }) {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const ref = useRef();

  const fetchNotifs = async () => {
    if (!user?.email) return;
    try {
      const data = await base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 20);
      setNotifs(data);
    } catch (e) {
      // Ignore transient errors
    }
  };

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          playChime();
          new Notification('KKD Music · Direction Générale', {
            body: 'Notifications push activées avec succès sur cet appareil.',
            icon: '/favicon.ico',
          });
        }
      } catch {
        // Ignorer
      }
    }
  };

  useEffect(() => {
    let timer;
    const debouncedFetch = (incomingData) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetchNotifs();
        // Déclencher notification native et son si actif
        if (incomingData?.title && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          playChime();
          new Notification(incomingData.title || 'KKD Music', {
            body: incomingData.message || 'Nouvelle annonce officielle',
            icon: '/favicon.ico',
          });
        }
      }, 500);
    };

    fetchNotifs();

    const unsubscribe = typeof base44?.entities?.Notification?.subscribe === 'function'
      ? base44.entities.Notification.subscribe((event) => {
          if (!event?.data?.user_email || event.data?.user_email === user?.email) {
            debouncedFetch(event?.data);
          }
        })
      : () => {};

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      clearTimeout(timer);
    };
  }, [user?.email]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unreadNotifs = notifs.filter(n => !n.is_read);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await Promise.all(unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    } catch (e) { /* best effort */ }
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      await base44.entities.Notification.update(notif.id, { is_read: true });
    }
  };

  const openNotif = async (notif) => {
    await markRead(notif);
    setOpen(false);
    if (notif.link) {
      if (notif.link.startsWith('http')) {
        window.open(notif.link, '_blank');
      } else {
        navigate(notif.link);
      }
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
        title="Notifications et annonces officielles"
      >
        <Bell size={20} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-88 sm:w-96 bg-card border border-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* En-tête avec bouton tout lire */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-950/70 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="font-heading font-bold text-sm text-foreground">Centre de Notifications</p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                  <CheckCheck size={13} /> Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Invitation activation Push si non accordé */}
          {pushPermission === 'default' && (
            <div className="bg-gradient-to-r from-red-950/40 via-amber-950/30 to-stone-950/60 p-3 px-4 border-b border-amber-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-stone-300">
                  Activez les notifications push pour recevoir les annonces officielles en temps réel.
                </p>
              </div>
              <button
                onClick={requestPushPermission}
                className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg shrink-0 transition-colors shadow-sm"
              >
                Activer
              </button>
            </div>
          )}

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border/20">
            {notifs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground space-y-1">
                <Bell size={26} className="mx-auto mb-2 opacity-30 text-primary" />
                <p className="font-medium text-foreground">Aucune notification</p>
                <p className="text-xs text-muted-foreground">Vous êtes à jour sur toutes les communications.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const isOfficial = n.type === 'officiel' || n.type === 'mailing';
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className={`px-4 py-3.5 cursor-pointer hover:bg-secondary/60 transition-colors relative ${
                      !n.is_read ? (isOfficial ? 'bg-primary/5' : 'bg-secondary/30') : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5 uppercase tracking-wide ${
                        TYPE_COLORS[n.type] || TYPE_COLORS.info
                      }`}>
                        {TYPE_LABELS[n.type] || n.type?.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/10 text-[10px] text-muted-foreground/60">
                          <span>
                            {new Date(n.created_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {n.link && (
                            <span className="text-primary font-bold flex items-center gap-1 hover:underline">
                              Consulter <ExternalLink size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de page informatif */}
          <div className="p-2.5 bg-stone-950/80 border-t border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck size={11} className="text-primary" /> Communications officielles · KKD Music Group
            </p>
          </div>

        </div>
      )}
    </div>
  );
}