import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';

const HERO_VIDEO = "https://media.base44.com/videos/public/6a1cbc29f199c6e829efde07/7f81fc39d_video2.mp4";

export default function HeroBanner({ featuredRelease, latestVideo }) {
  const bg = featuredRelease?.cover_url || latestVideo?.thumbnail_url;

  return (
    <section className="relative min-h-[92vh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background VIDEO */}
      <video
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        style={{ pointerEvents: 'none' }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90" />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      {/* Red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 py-20 w-full max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary text-xs font-medium px-4 py-1.5 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          KKD MUSIC — Label Indépendant Africain
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-6xl md:text-8xl font-extrabold tracking-tight leading-none"
        >
          <span className="text-foreground">KKD</span>
          <span className="text-primary"> MUSIC</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed"
        >
          Distribution · Promotion · Développement artistique
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <Link to="/artistes" className="bg-primary text-white font-heading font-bold px-8 py-3 rounded-xl hover:bg-primary/80 transition-colors text-sm">
            Découvrir nos artistes
          </Link>
          <Link to="/partenaires" className="border border-border text-foreground font-heading font-bold px-8 py-3 rounded-xl hover:border-primary/50 hover:text-primary transition-colors text-sm">
            Travailler avec nous
          </Link>
        </motion.div>

        {/* Featured release card */}
        {featuredRelease && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-14 w-full max-w-sm"
          >
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 text-left">● En ce moment</p>
            <Link to="/musique" className="group flex items-center gap-4 bg-card/80 backdrop-blur border border-border/60 hover:border-primary/40 rounded-2xl px-5 py-4 transition-all">
              {featuredRelease.cover_url && (
                <div className="relative shrink-0">
                  <img src={featuredRelease.cover_url} alt={featuredRelease.title} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="absolute inset-0 rounded-xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-white fill-white" />
                  </div>
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-mono text-primary uppercase tracking-wider">{featuredRelease.release_type || 'Single'}</p>
                <p className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">{featuredRelease.title}</p>
                <p className="text-xs text-muted-foreground truncate">{featuredRelease.artist_name}</p>
              </div>
              <ExternalLink size={14} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}