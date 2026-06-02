import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Camera, Upload, X, ChevronDown, ChevronUp, Users, Star, Calendar, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = {
  author_name: '',
  author_email: '',
  title: '',
  content: '',
  event_name: '',
  artist_name: '',
  concert_date: '',
  photo_url: '',
  consent_given: false,
};

export default function FanSpace() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [likedPosts, setLikedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kkd_liked_posts') || '[]'); } catch { return []; }
  });
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['fan-posts'],
    queryFn: () => base44.entities.FanPost.filter({ status: 'approuve' }, '-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FanPost.create(data),
    onSuccess: () => {
      setSubmitted(true);
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.consent_given) return;
    createMutation.mutate(form);
  };

  const handleLike = async (post) => {
    if (likedPosts.includes(post.id)) return;
    const newLiked = [...likedPosts, post.id];
    setLikedPosts(newLiked);
    localStorage.setItem('kkd_liked_posts', JSON.stringify(newLiked));
    await base44.entities.FanPost.update(post.id, { likes_count: (post.likes_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['fan-posts'] });
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Hero */}
      <div className="relative py-20 md:py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-primary/20">
            <Users size={12} /> Espace Fans
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Votre moment,<br /><span className="text-primary">votre scène</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-8">
            Partagez vos photos et témoignages de concerts KKD Music. Rejoignez la communauté et montrez votre passion pour la musique africaine.
          </p>
          <Button
            onClick={() => { setShowForm(v => !v); setSubmitted(false); }}
            className="bg-primary hover:bg-primary/80 text-white font-heading font-bold px-8 py-3 text-base gap-2"
          >
            <Camera size={18} />
            {showForm ? 'Annuler' : 'Partager mon moment'}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Success message */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl text-center"
            >
              <Star size={24} className="text-green-400 mx-auto mb-2" />
              <p className="font-heading font-bold text-green-300 text-lg">Merci pour votre partage !</p>
              <p className="text-sm text-muted-foreground mt-1">Votre témoignage est en cours de modération et sera affiché prochainement.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mb-12 bg-card border border-border/50 rounded-2xl p-6 md:p-8"
            >
              <h2 className="font-display text-2xl font-extrabold mb-6 flex items-center gap-2">
                <Camera size={20} className="text-primary" /> Partagez votre moment
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Votre nom *</label>
                    <Input
                      placeholder="Ex: Marie K."
                      value={form.author_name}
                      onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Votre email * <span className="text-muted-foreground/60 normal-case">(non affiché)</span></label>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={form.author_email}
                      onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Artiste</label>
                    <Input
                      placeholder="Ex: Kerozen, Tenor..."
                      value={form.artist_name}
                      onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Événement / Concert</label>
                    <Input
                      placeholder="Ex: Concert de Paris, Festival..."
                      value={form.event_name}
                      onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Titre de votre témoignage</label>
                    <Input
                      placeholder="Ex: Un concert inoubliable !"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Date du concert</label>
                    <Input
                      type="date"
                      value={form.concert_date}
                      onChange={e => setForm(f => ({ ...f, concert_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Votre témoignage *</label>
                  <Textarea
                    placeholder="Décrivez votre expérience, vos émotions, vos moments forts..."
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Photo du concert</label>
                  {form.photo_url ? (
                    <div className="relative inline-block">
                      <img src={form.photo_url} alt="Concert" className="h-40 rounded-xl object-cover border border-border/50" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photo_url: '' }))}
                        className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center border border-border/50 hover:bg-destructive/20"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploading ? 'Envoi...' : 'Cliquez pour uploader une photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                {/* RGPD consent */}
                <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border/30">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={form.consent_given}
                    onChange={e => setForm(f => ({ ...f, consent_given: e.target.checked }))}
                    className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
                    required
                  />
                  <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    J'accepte que mon nom, mon témoignage et ma photo soient publiés sur le site KKD Music après modération. 
                    Mes données (email) sont collectées uniquement à des fins de vérification et ne seront pas partagées avec des tiers. 
                    Conformément au RGPD, je peux demander la suppression de mes données à <strong>contact@kkdmusic.com</strong>. 
                    Je déclare être l'auteur de la photo partagée et céder les droits de publication à KKD Music.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={!form.consent_given || createMutation.isPending}
                    className="bg-primary hover:bg-primary/80 text-white font-heading font-bold flex-1"
                  >
                    {createMutation.isPending ? 'Envoi...' : 'Partager mon moment'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Soyez le premier à partager votre moment !</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-extrabold">
                <span className="text-primary">{posts.length}</span> moment{posts.length > 1 ? 's' : ''} partagé{posts.length > 1 ? 's' : ''}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
                >
                  {post.photo_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.photo_url}
                        alt={post.title || 'Photo de concert'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {(post.artist_name || post.event_name) && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.artist_name && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            <Music size={8} /> {post.artist_name}
                          </span>
                        )}
                        {post.concert_date && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
                            <Calendar size={8} /> {format(new Date(post.concert_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    )}
                    {post.title && (
                      <h3 className="font-heading font-bold text-sm mb-1 line-clamp-1">{post.title}</h3>
                    )}
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-3">{post.content}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="text-xs font-medium text-muted-foreground">{post.author_name}</div>
                      <button
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                          likedPosts.includes(post.id)
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        <Heart size={11} className={likedPosts.includes(post.id) ? 'fill-current' : ''} />
                        {post.likes_count || 0}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}