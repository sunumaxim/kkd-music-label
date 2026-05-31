import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ChevronDown } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function HeroBanner({ featuredRelease }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Vertical side text */}
      <div className="hidden lg:block absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground/40 uppercase">
          KKD_MUSIC — SunuMaxim GROUP
        </span>
      </div>

      {/* Red accent line */}
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src={LOGO_URL} alt="KKD Music" className="h-20 md:h-28 w-auto mx-auto mb-8" />
          
          <h1 className="font-display text-5xl md:text-7xl lg:text-9xl font-extrabold tracking-tighter leading-none mb-4">
            <span className="text-foreground">KKD</span>
            <span className="text-primary ml-2">MUSIC</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-4 font-light">
            Label indépendant — Artistes · Clips · Sorties musicales
          </p>
          
          <p className="text-muted-foreground/60 text-xs font-mono tracking-wider uppercase mb-12">
            Une filiale de SunuMaxim GROUP
          </p>
        </motion.div>

        {featuredRelease && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-flex flex-col items-center"
          >
            <span className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
              Nouvelle sortie
            </span>
            <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 pr-6">
              {featuredRelease.cover_url && (
                <img 
                  src={featuredRelease.cover_url} 
                  alt={featuredRelease.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="text-left">
                <p className="font-heading font-bold text-foreground">{featuredRelease.title}</p>
                <p className="text-sm text-muted-foreground">{featuredRelease.artist_name}</p>
              </div>
              <Link to="/musique" className="ml-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Play size={18} className="text-primary-foreground ml-0.5" />
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}