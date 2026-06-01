import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_COLORS = {
  info: 'bg-blue-500/10 text-blue-400',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  demande: 'bg-primary/10 text-primary',
};

export default function NotificationBell({ user }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const fetchNotifs = async () => {
    if (!user?.email) return;
    const data = await base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 20);
    setNotifs(data);
  };

  useEffect(() => {
    fetchNotifs();
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user?.email) fetchNotifs();
    });
    return unsubscribe;
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
    // Optimistic: mark all as read immediately
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    await Promise.all(unreadNotifs.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      // Optimistic: mark this one as read immediately
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      await base44.entities.Notification.update(notif.id, { is_read: true });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Bell size={20} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <p className="font-heading font-bold text-sm">Notifications</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Aucune notification
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/3' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TYPE_COLORS[n.type] || TYPE_COLORS.info}`}>
                      {n.type?.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {new Date(n.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}