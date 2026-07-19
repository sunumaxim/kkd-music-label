import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Camera, Upload, X, Users, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import FanGalleryGrid from '@/components/fans/FanGalleryGrid';
import FanGalleryFilters from '@/components/fans/FanGalleryFilters';
import FanGalleryLightbox from '@/components/fans/FanGalleryLightbox';
import TopFansSection from '@/components/fans/TopFansSection';

const EMPTY_FORM = {
  author_name: '', author_email: '', title: '', content: '',
  event_name: '', artist_name: '', concert_date: '', photo_url: '', consent_given: false,
};

export default function FanSpace() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterArtist, setFilterArtist] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [viewMode, setViewMode] = useState('masonry');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [likedPosts, setLikedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kkd_liked_posts') || '[]'); } catch { return []; }
  });
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['fan-posts'],
    queryFn: () => base44.entities.FanPost.filter({ status: 'approuve' }, '-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FanPost.create(data),
    onSuccess: () => { setSubmitted(true); setForm(EMPTY_FORM); setShowForm(false); },
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

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (filterArtist && p.artist_name !== filterArtist) return false;
      if (filterEvent && p.event_name !== filterEvent) return false;
      return true;
    });
  }, [posts, filterArtist, filterEvent]);

  const photoPosts = useMemo(() => filteredPosts.filter(p => p.photo_url), [filteredPosts]);
  const allForLightbox = filteredPosts;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Hero immersif */}
      <div className="relative pt-16 pb-14 md:pt-24 md:pb-20 px-4 text-center overflow-hidden">
        {/* Background blur blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute top-10 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Stats row */}
        {posts.length > 0 && (
          <div className="relative flex justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="font-display text-2xl md:text-3xl font-extrabold text-primary">{posts.length}</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">moments</p>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <p className="font-display text-2xl md:text-3xl font-extrabold text-primary">
                {[...new Set(posts.map(p => p.artist_name).filter(Boolean))].length}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">artistes</p>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <p className="font-display text-2xl md:text-3xl font-extrabold text-primary">
                {posts.reduce((s, p) => s + (p.likes_count || 0), 0)}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">likes</p>
            </div>
          </div>
        )}

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-primary/20">
            <Users size={12} /> Espace Fans
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Votre moment,<br /><span className="text-primary">votre scène</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg mb-8">
            Partagez vos photos et témoignages de concerts KKD Music. Explorez la galerie de la communauté par artiste ou événement.
          </p>
          <Button
            onClick={() => { setShowForm(v => !v); setSubmitted(false); }}
            className="bg-primary hover:bg-primary/80 text-white font-heading font-bold px-8 py-3 text-base gap-2"
          >
            <Camera size={18} />
            {showForm ? 'Fermer le formulaire' : 'Partager mon moment'}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <TopFansSection />

        {/* Success */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-8 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl text-center"
            >
              <Star size={24} className="text-green-400 mx-auto mb-2" />
              <p className="font-heading font-bold text-green-300 text-lg">Merci pour votre partage !</p>
              <p className="text-sm text-muted-foreground mt-1">Votre témoignage est en modération et sera affiché prochainement.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="mb-12 bg-card border border-border/50 rounded-2xl p-6 md:p-8"
            >
              <h2 className="font-display text-2xl font-extrabold mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" /> Partagez votre moment
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Votre nom *</label>
                    <Input placeholder="Ex: Marie K." value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Email * <span className="normal-case text-muted-foreground/60">(non affiché)</span></label>
                    <Input type="email" placeholder="votre@email.com" value={form.author_email} onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Artiste</label>
                    <Input placeholder="Ex: Kerozen, Tenor..." value={form.artist_name} onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Événement / Concert</label>
                    <Input placeholder="Ex: Concert de Paris..." value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Titre de votre témoignage</label>
                    <Input placeholder="Ex: Un concert inoubliable !" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Date du concert</label>
                    <Input type="date" value={form.concert_date} onChange={e => setForm(f => ({ ...f, concert_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Votre témoignage *</label>
                  <Textarea placeholder="Décrivez votre expérience, vos émotions, vos moments forts..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[120px]" required />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Photo du concert</label>
                  {form.photo_url ? (
                    <div className="relative inline-block">
                      <img src={form.photo_url} alt="Concert" className="h-40 rounded-xl object-cover border border-border/50" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center border border-border/50 hover:bg-destructive/20">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploading ? 'Envoi en cours...' : 'Cliquez pour uploader une photo'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
                <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border/30">
                  <input type="checkbox" id="consent" checked={form.consent_given} onChange={e => setForm(f => ({ ...f, consent_given: e.target.checked }))} className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0" required />
                  <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    J'accepte que mon nom, mon témoignage et ma photo soient publiés sur le site KKD Music après modération. Mes données (email) ne seront pas partagées avec des tiers. Conformément au RGPD, je peux demander la suppression à <strong>contact@kkdmusic.com</strong>. Je déclare être l'auteur de la photo partagée et céder les droits de publication à KKD Music.
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={!form.consent_given || createMutation.isPending} className="bg-primary hover:bg-primary/80 text-white font-heading font-bold flex-1">
                    {createMutation.isPending ? 'Envoi...' : 'Partager mon moment'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="break-inside-avoid h-48 bg-card rounded-2xl animate-pulse mb-4" style={{ height: `${180 + (i % 3) * 60}px` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-5">
              <Camera size={32} className="text-primary/30" />
            </div>
            <p className="font-heading font-bold text-lg mb-2">La galerie est vide</p>
            <p className="text-muted-foreground text-sm">Soyez le premier à partager votre moment !</p>
          </div>
        ) : (
          <>
            <FanGalleryFilters
              posts={posts}
              filterArtist={filterArtist}
              filterEvent={filterEvent}
              setFilterArtist={setFilterArtist}
              setFilterEvent={setFilterEvent}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>Aucun résultat pour ces filtres.</p>
                <button onClick={() => { setFilterArtist(''); setFilterEvent(''); }} className="text-primary text-sm mt-2 hover:underline">Réinitialiser les filtres</button>
              </div>
            ) : (
              <FanGalleryGrid
                posts={filteredPosts}
                likedPosts={likedPosts}
                onLike={handleLike}
                onOpen={(i) => setLightboxIndex(i)}
                viewMode={viewMode}
              />
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <FanGalleryLightbox
          posts={filteredPosts}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex(i => Math.min(i + 1, filteredPosts.length - 1))}
          onPrev={() => setLightboxIndex(i => Math.max(i - 1, 0))}
          likedPosts={likedPosts}
          onLike={handleLike}
        />
      )}
    </div>
  );
}