import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Heart, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ArticleComments({ article, onUpdate }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(() => {
    try { return localStorage.getItem(`liked_${article.id}`) === '1'; } catch { return false; }
  });
  const [localLikes, setLocalLikes] = useState(article.likes_count || 0);

  const comments = article.comments || [];

  const handleLike = async () => {
    if (liked) return;
    const newCount = localLikes + 1;
    setLocalLikes(newCount);
    setLiked(true);
    try { localStorage.setItem(`liked_${article.id}`, '1'); } catch {}
    await base44.entities.News.update(article.id, { likes_count: newCount });
    onUpdate?.();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const newComment = {
      author: name.trim() || 'Anonyme',
      text: text.trim(),
      date: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    await base44.entities.News.update(article.id, { comments: updated });
    setText('');
    setName('');
    setSubmitting(false);
    onUpdate?.();
  };

  return (
    <div className="mt-12">
      {/* Likes */}
      <div className="flex items-center gap-4 mb-10 pb-8 border-b border-border">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
            liked
              ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
              : 'border-border hover:border-primary/50 hover:text-primary'
          }`}
        >
          <Heart size={16} className={liked ? 'fill-primary text-primary' : ''} />
          {localLikes > 0 ? `${localLikes} J'aime` : "J'aime"}
        </button>
        <span className="text-xs text-muted-foreground font-mono">
          {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Comments section */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={18} className="text-primary" />
        <h3 className="font-display font-bold text-lg">Commentaires</h3>
      </div>

      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm italic mb-8">Soyez le premier à commenter.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-primary" />
              </div>
              <div className="flex-1 bg-card border border-border/60 rounded-xl p-4">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-heading font-bold text-sm">{c.author}</span>
                  {c.date && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {format(new Date(c.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <p className="font-heading font-bold text-sm mb-4">Laisser un commentaire</p>
        <form onSubmit={handleComment} className="space-y-3">
          <Input
            placeholder="Votre nom (optionnel)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Votre commentaire..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!text.trim() || submitting}
              className="bg-primary hover:bg-primary/80 gap-2"
            >
              <Send size={13} />
              {submitting ? 'Envoi...' : 'Publier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}