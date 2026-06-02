import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Trash2, Clock, Users } from 'lucide-react';

const STATUS_LABELS = {
  en_attente: { label: 'En attente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approuve: { label: 'Approuvé', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  refuse: { label: 'Refusé', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export default function AdminFanPosts() {
  const [filter, setFilter] = useState('en_attente');
  const [preview, setPreview] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-fan-posts', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.FanPost.list('-created_date', 100)
      : base44.entities.FanPost.filter({ status: filter }, '-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FanPost.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fan-posts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FanPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fan-posts'] }),
  });

  const filters = [
    { key: 'en_attente', label: 'En attente' },
    { key: 'approuve', label: 'Approuvés' },
    { key: 'refuse', label: 'Refusés' },
    { key: 'all', label: 'Tous' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Users size={22} className="text-primary" /> Espace Fans
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.key ? 'bg-primary text-white border-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Aucun témoignage dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-start gap-4">
              {post.photo_url && (
                <img src={post.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-bold text-sm">{post.author_name}</span>
                  {post.artist_name && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{post.artist_name}</span>
                  )}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_LABELS[post.status]?.color}`}>
                    {STATUS_LABELS[post.status]?.label}
                  </span>
                </div>
                {post.title && <p className="text-sm font-medium mb-0.5">{post.title}</p>}
                <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{post.author_email}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {post.status !== 'approuve' && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    onClick={() => updateMutation.mutate({ id: post.id, status: 'approuve' })}
                  >
                    <Check size={16} />
                  </Button>
                )}
                {post.status !== 'refuse' && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => updateMutation.mutate({ id: post.id, status: 'refuse' })}
                  >
                    <X size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => { if (confirm('Supprimer ce témoignage ?')) deleteMutation.mutate(post.id); }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}