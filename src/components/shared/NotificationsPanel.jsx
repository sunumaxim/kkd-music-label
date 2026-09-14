import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';

const TYPE_COLORS = {
  info: 'bg-blue-500/10 text-blue-400',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  demande: 'bg-primary/10 text-primary',
};

const TYPE_LABELS = {
  info: 'INFO',
  success: 'SUCCÈS',
  warning: 'ALERT',
  demande: 'DEMANDE',
};

export default function NotificationsPanel({ user }) {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!user?.email) return;
    try {
      const data = await base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 6);
      setNotifs(data);
    } catch (e) { /* noop */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifs();
    const unsubscribe = typeof base44?.entities?.Notification?.subscribe === 'function'
      ? base44.entities.Notification.subscribe((event) => {
          if (!event?.data?.user_email || event.data?.user_email === user?.email) fetchNotifs();
        })
      : () => {};
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.email]);

  const unread = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unreadNotifs = notifs.filter(n => !n.is_read);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    await Promise.all(unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
  };

  const open = async (n) => {
    if (!n.is_read) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      base44.entities.Notification.update(n.id, { is_read: true }).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={18} className="text-primary" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <h3 className="font-heading font-bold text-sm">Notifications</h3>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
            <CheckCheck size={12} /> Tout lire
          </button>
        )}
      </div>

      <div className="divide-y divide-border/20">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : notifs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Bell size={22} className="mx-auto mb-2 opacity-30" />
            Aucune notification pour le moment
          </div>
        ) : (
          notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={`w-full text-left px-5 py-3.5 hover:bg-secondary/40 transition-colors flex items-start gap-3 ${!n.is_read ? 'bg-primary/3' : ''}`}
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || TYPE_COLORS.info}`}>
                {TYPE_LABELS[n.type] || n.type?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {new Date(n.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {n.link && <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}