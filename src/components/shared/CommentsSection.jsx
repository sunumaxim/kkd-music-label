import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Heart, User, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Composant commentaires universel
 * entityType: 'news' | 'video'
 * entity: l'objet news ou video
 * onUpdate: callback après update
 */
export default function CommentsSection({ entityType, entity, onUpdate }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(entity?.likes_count || 0);
  const [comments, setComments] = useState(entity?.comments || []);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(`liked_${entity?.id}`) === '1');
    } catch {}
    setComments(entity?.comments || []);
    setLocalLikes(entity?.likes_count || 0);
  }, [entity?.id]);

  const handleLike = async () => {
    if (liked || !user) return;
    const newCount = localLikes + 1;
    setLocalLikes(newCount);
    setLiked(true);
    try { localStorage.setItem(`liked_${entity.id}`, '1'); } catch {}
    if (entityType === 'news') {
      await base44.entities.News.update(entity.id, { likes_count: newCount });
    } else if (entityType === 'release') {
      await base44.entities.Release.update(entity.id, { likes_count: newCount });
    } else if (entityType === 'video') {
      await base44.entities.Video.update(entity.id, { likes_count: newCount });
    }
    onUpdate?.();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);
    const newComment = {
      author: user.full_name || user.email,
      text: text.trim(),
      date: new Date().toISOString(),
      user_email: user.email,
    };
    const updated = [...comments, newComment];
    setComments(updated);
    if (entityType === 'news') {
      await base44.entities.News.update(entity.id, { comments: updated });
    } else if (entityType === 'video') {
      await base44.entities.Video.update(entity.id, { comments: updated });
    } else if (entityType === 'release') {
      await base44.entities.Release.update(entity.id, { comments: updated });
    } else if (entityType === 'event') {
      await base44.entities.Event.update(entity.id, { comments: updated });
    }
    setText('');
    setSubmitting(false);
    onUpdate?.();
  };

  const displayedComments = showAll ? comments : comments.slice(-5).reverse();
  const hiddenCount = comments.length - 5;

  return (
    <div className="mt-12">
      {/* Likes (news only) */}
      {(entityType === 'news' || entityType === 'release' || entityType === 'video' || entityType === 'event') && (
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
          <button
            onClick={handleLike}
            disabled={liked || !user}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
              liked
                ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
                : user
                  ? 'border-border hover:border-primary/50 hover:text-primary cursor-pointer'
                  : 'border-border/30 text-muted-foreground/40 cursor-not-allowed'
            }`}
          >
            <Heart size={15} className={liked ? 'fill-primary text-primary' : ''} />
            {localLikes > 0 ? `${localLikes} J'aime` : "J'aime"}
          </button>
          <span className="text-xs text-muted-foreground font-mono">
            {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={18} className="text-primary" />
        <h3 className="font-display font-bold text-lg">
          Commentaires {comments.length > 0 && <span className="text-muted-foreground font-normal text-base">({comments.length})</span>}
        </h3>
      </div>

      {/* Liste commentaires */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm italic mb-8">Soyez le premier à commenter.</p>
      ) : (
        <div className="space-y-3 mb-6">
          {/* Afficher anciens cachés */}
          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-2"
            >
              <ChevronUp size={13} /> Afficher {hiddenCount} commentaire{hiddenCount > 1 ? 's' : ''} précédent{hiddenCount > 1 ? 's' : ''}
            </button>
          )}
          {(showAll ? [...comments].reverse() : displayedComments).map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-primary" />
              </div>
              <div className="flex-1 bg-card border border-border/60 rounded-xl p-3.5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-heading font-bold text-sm">{c.author}</span>
                  {c.date && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {format(new Date(c.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{c.text}</p>
              </div>
            </motion.div>
          ))}
          {showAll && comments.length > 5 && (
            <button
              onClick={() => setShowAll(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronDown size={13} /> Réduire
            </button>
          )}
        </div>
      )}

      {/* Zone de saisie */}
      {authLoading ? (
        <div className="h-20 bg-card border border-border/40 rounded-xl animate-pulse" />
      ) : user ? (
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Connecté en tant que <span className="text-foreground">{user.full_name || user.email}</span>
            </span>
          </div>
          <form onSubmit={handleComment} className="space-y-3">
            <Textarea
              placeholder="Votre commentaire..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              className="text-sm resize-none bg-background/50"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!text.trim() || submitting}
                className="bg-primary hover:bg-primary/80 gap-2"
              >
                <Send size={13} />
                {submitting ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <LogIn size={20} className="text-primary" />
          </div>
          <p className="font-heading font-bold mb-1">Rejoignez la conversation</p>
          <p className="text-sm text-muted-foreground mb-4">
            Connectez-vous pour laisser un commentaire et interagir avec la communauté KKD.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn size={14} />
                Se connecter
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/80 gap-2">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}