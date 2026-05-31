import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LOGO_URL = "https://i.imgur.com/YOUR_LOGO.png"; // fallback

export default function HeroBanner({ featuredRelease }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 py-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary text-xs font-medium px-4 py-1.5 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          KKD MUSIC — Label Indépendant
        </motion.div>

        {/* Logo / Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-none"
        >
          <span className="text-foreground">KKD</span>
          <span className="text-primary"> MUSIC</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed"
        >
          Distribution, promotion & développement artistique.<br />
          Rejoignez l'écosystème KKD Music.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/artistes"
            className="bg-primary text-white font-heading font-bold px-8 py-3 rounded-xl hover:bg-primary/80 transition-colors text-sm"
          >
            Découvrir nos artistes
          </Link>
          <Link
            to="/partenaires"
            className="border border-border text-foreground font-heading font-bold px-8 py-3 rounded-xl hover:border-primary/50 hover:text-primary transition-colors text-sm"
          >
            Travailler avec nous
          </Link>
        </motion.div>

        {/* Featured release */}
        {featuredRelease && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 flex items-center gap-4 bg-card border border-border/50 rounded-2xl px-5 py-4 max-w-sm w-full"
          >
            {featuredRelease.cover_url && (
              <img src={featuredRelease.cover_url} alt={featuredRelease.title} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Dernière sortie</p>
              <p className="font-heading font-bold text-sm mt-0.5">{featuredRelease.title}</p>
              <p className="text-xs text-muted-foreground">{featuredRelease.artist_name}</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}