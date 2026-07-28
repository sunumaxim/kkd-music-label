import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Calendar, Music2, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { slugify } from '@/lib/slugify';
import BrandLogo from '@/components/brand/BrandLogo';

const HERO_VIDEO = 'https://media.base44.com/videos/public/6a1cbc29f199c6e829efde07/7f81fc39d_video2.mp4';

function ytThumb(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

const TYPE_META = {
  release: { label: 'Nouvelle Sortie', icon: Music2, cta: 'Écouter', to: (s) => `/musique/${slugify(s.title)}--${s.id}` },
  video:   { label: 'Clip à la une',    icon: Play,    cta: 'Regarder', to: (s) => `/videos/${s.id}` },
  event:   { label: 'Événement',        icon: Calendar, cta: 'Réserver', to: (s) => `/evenements/${slugify(s.title)}--${s.id}` },
  news:    { label: 'Actualité',        icon: Newspaper, cta: 'Lire',    to: (s) => `/actualites/${s.id}` },
};

function fmtEventDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

export function buildSlides(releases, videos, events, news) {
  const slides = [];
  const push = (s) => { if (s && s.image) slides.push(s); };
  (releases || []).filter(r => r.is_featured).slice(0, 3).forEach(r => push({ id: `r-${r.id}`, type: 'release', image: r.cover_url, title: r.title, subtitle: r.artist_name, meta: r.release_type, raw: r }));
  (videos || []).filter(v => v.is_featured).slice(0, 2).forEach(v => push({ id: `v-${v.id}`, type: 'video', image: v.thumbnail_url || ytThumb(v.youtube_url), title: v.title, subtitle: v.artist_name, meta: v.video_type, raw: v }));
  (events || []).filter(e => e.is_featured).slice(0, 2).forEach(e => push({ id: `e-${e.id}`, type: 'event', image: e.image_url, title: e.title, subtitle: [e.city, e.location].filter(Boolean).join(' · '), meta: fmtEventDate(e.event_date), raw: e }));
  (news || []).filter(n => n.is_featured).slice(0, 2).forEach(n => push({ id: `n-${n.id}`, type: 'news', image: n.image_url, title: n.title, subtitle: n.excerpt, meta: n.category, raw: n }));
  if (slides.length < 4) {
    (releases || []).filter(r => !r.is_featured && r.cover_url).slice(0, 6 - slides.length).forEach(r => push({ id: `r-${r.id}`, type: 'release', image: r.cover_url, title: r.title, subtitle: r.artist_name, meta: r.release_type, raw: r }));
  }
  return slides.slice(0, 6);
}

function BrandFallback() {
  return (
    <section className="relative min-h-[64vh] md:min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-background">
      <video src={HERO_VIDEO} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-20" style={{ pointerEvents: 'none' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90" />
      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <BrandLogo height={64} />
        <p className="mt-6 text-muted-foreground text-base md:text-lg" style={{ fontWeight: 500 }}>La scène ouest-africaine, en direct de chez vous.</p>
        <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">Streaming · Vente directe · Événements</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/musique" className="kkd-btn-primary"><Play size={16} fill="currentColor" /> Écouter maintenant</Link>
          <Link to="/partenaires" className="kkd-btn-outline">Travailler avec nous</Link>
        </div>
      </div>
    </section>
  );
}

export default function HeroSlider({ releases, videos, events, news }) {
  const slides = buildSlides(releases, videos, events, news);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const next = useCallback(() => setIndex(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timer.current = setInterval(next, 6000);
    return () => clearInterval(timer.current);
  }, [next, paused, slides.length]);

  useEffect(() => { if (index > slides.length - 1) setIndex(0); }, [slides.length, index]);

  if (slides.length === 0) return <BrandFallback />;

  const cur = slides[index];
  const meta = TYPE_META[cur.type];
  const Icon = meta.icon;

  return (
    <section className="relative h-[64vh] md:h-[92vh] min-h-[420px] overflow-hidden bg-background select-none" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence>
        <motion.div key={cur.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.8 }, scale: { duration: 7, ease: 'linear' } }} className="absolute inset-0">
          <img src={cur.image} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/35 to-transparent" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex items-end pb-14 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="kkd-badge-live"><Icon size={11} /> {meta.label}</span>
              {cur.meta && <span className="text-[10px] uppercase tracking-wider text-foreground/60" style={{ fontWeight: 500 }}>{String(cur.meta).replace(/_/g, ' ')}</span>}
            </div>
            <h1 className="text-4xl md:text-7xl uppercase leading-[0.95]">{cur.title}</h1>
            {cur.subtitle && <p className="mt-4 text-base md:text-xl text-foreground/70 line-clamp-2 max-w-xl">{cur.subtitle}</p>}
            <div className="mt-7 flex items-center gap-3 flex-wrap">
              <Link to={meta.to(cur.raw)} className="kkd-btn-primary"><Play size={15} fill="currentColor" /> {meta.cta}</Link>
              <Link to="/musique" className="kkd-btn-outline">Explorer</Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button onClick={prev} aria-label="Précédent" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/15 items-center justify-center text-white hover:bg-black/60 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} aria-label="Suivant" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/15 items-center justify-center text-white hover:bg-black/60 transition-colors">
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
        ))}
      </div>
    </section>
  );
}