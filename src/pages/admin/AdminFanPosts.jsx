import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Check, X, Trash2, Users, Eye, Heart, Calendar, User, MessageSquare, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABELS = {
  en_attente: { label: 'En attente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approuve: { label: 'Approuvé', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  refuse: { label: 'Refusé', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

function FanPostCard({ post, onApprove, onRefuse, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_LABELS[post.status] || STATUS_LABELS.en_attente;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden"
    >
      {/* Photo banner si disponible */}
      {post.photo_url && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={post.photo_url}
            alt="Photo fan"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="font-heading font-bold text-white text-lg leading-tight">{post.author_name}</p>
              {post.event_name && (
                <p className="text-white/70 text-xs">{post.event_name}</p>
              )}
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header sans photo */}
        {!post.photo_url && (
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm">{post.author_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{post.author_email}</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.artist_name && (
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              🎤 {post.artist_name}
            </span>
          )}
          {post.event_name && (
            <span className="text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
              📍 {post.event_name}
            </span>
          )}
          {post.concert_date && (
            <span className="text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
              📅 {format(new Date(post.concert_date), 'd MMM yyyy', { locale: fr })}
            </span>
          )}
          {post.likes_count > 0 && (
            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
              ❤️ {post.likes_count}
            </span>
          )}
        </div>

        {/* Titre */}
        {post.title && (
          <p className="font-heading font-bold text-sm mb-1.5">{post.title}</p>
        )}

        {/* Contenu */}
        <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
          {post.content}
        </p>
        {post.content?.length > 180 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-primary mt-1 hover:underline flex items-center gap-0.5"
          >
            {expanded ? <><ChevronUp size={12} /> Réduire</> : <><ChevronDown size={12} /> Lire la suite</>}
          </button>
        )}

        {/* Metadata */}
        <p className="text-[10px] text-muted-foreground/40 font-mono mt-2">
          Soumis le {format(new Date(post.created_date), 'd MMM yyyy à HH:mm', { locale: fr })}
          {post.photo_url && <span className="ml-2">• <Image size={9} className="inline" /> Photo incluse</span>}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
          {post.status !== 'approuve' && (
            <Button
              size="sm"
              onClick={() => onApprove(post.id)}
              className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 h-8 text-xs gap-1.5"
              variant="ghost"
            >
              <Check size={14} /> Approuver
            </Button>
          )}
          {post.status !== 'refuse' && (
            <Button
              size="sm"
              onClick={() => onRefuse(post.id)}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 h-8 text-xs gap-1.5"
              variant="ghost"
            >
              <X size={14} /> Refuser
            </Button>
          )}
          {post.status === 'approuve' && (
            <Button
              size="sm"
              onClick={() => onRefuse(post.id)}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-muted-foreground h-8 text-xs gap-1.5"
              variant="ghost"
            >
              <X size={14} /> Retirer
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { if (confirm('Supprimer définitivement ce témoignage ?')) onDelete(post.id); }}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminFanPosts() {
  const [filter, setFilter] = useState('en_attente');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-fan-posts', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.FanPost.list('-created_date', 100)
      : base44.entities.FanPost.filter({ status: filter }, '-created_date', 100),
  });

  // Counts for badges
  const { data: allPosts = [] } = useQuery({
    queryKey: ['admin-fan-posts', 'all'],
    queryFn: () => base44.entities.FanPost.list('-created_date', 200),
  });

  const pending = allPosts.filter(p => p.status === 'en_attente').length;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FanPost.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fan-posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FanPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fan-posts'] }),
  });

  const filters = [
    { key: 'en_attente', label: 'En attente', badge: pending },
    { key: 'approuve', label: 'Approuvés' },
    { key: 'refuse', label: 'Refusés' },
    { key: 'all', label: 'Tous' },
  ];

  // Stats
  const approved = allPosts.filter(p => p.status === 'approuve').length;
  const totalLikes = allPosts.reduce((s, p) => s + (p.likes_count || 0), 0);
  const withPhoto = allPosts.filter(p => p.photo_url).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Users size={22} className="text-primary" /> Espace Fans
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: MessageSquare, label: 'En attente', value: pending, color: 'text-yellow-400' },
          { icon: Check, label: 'Approuvés', value: approved, color: 'text-green-400' },
          { icon: Heart, label: 'Total likes', value: totalLikes, color: 'text-red-400' },
          { icon: Image, label: 'Avec photo', value: withPhoto, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <stat.icon size={15} className={stat.color} />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold leading-none">{stat.value}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
              filter === f.key ? 'bg-primary text-white border-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            {f.badge > 0 && (
              <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'
              }`}>
                {f.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-primary/30" />
          </div>
          <p className="text-muted-foreground">Aucun témoignage dans cette catégorie.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
              <FanPostCard
                key={post.id}
                post={post}
                onApprove={(id) => updateMutation.mutate({ id, status: 'approuve' })}
                onRefuse={(id) => updateMutation.mutate({ id, status: 'refuse' })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}