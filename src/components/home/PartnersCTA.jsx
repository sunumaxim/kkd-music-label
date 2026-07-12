import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Handshake } from 'lucide-react';

export default function PartnersCTA() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-14"
        >
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-primary tracking-widest uppercase mb-3">
                <Handshake size={14} /> Partenaires Officiels
              </span>
              <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Rejoignez le mouvement KKD Music
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base leading-relaxed">
                Distribution, promotion clips, développement artistique et partenariats labels.
                Collaborons pour porter votre musique au niveau international.
              </p>
            </div>
            <Link
              to="/partenaires"
              className="shrink-0 inline-flex items-center gap-2 bg-primary text-white font-heading font-bold px-7 py-3.5 rounded-xl hover:bg-primary/85 transition-colors text-sm shadow-lg shadow-primary/20 group"
            >
              Devenir partenaire
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}