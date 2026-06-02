import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music, Globe, Users, Zap, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const VALUES = [
  { icon: Music, title: 'Distribution', desc: "Diffusion de votre musique sur plus de 150 plateformes mondiales : Spotify, Apple Music, Deezer, Audiomack, YouTube Music et plus." },
  { icon: Globe, title: 'Promotion digitale', desc: "Campagnes ciblées sur les réseaux sociaux, placements en playlist, relations presse et couverture médias spécialisés." },
  { icon: Users, title: 'Développement artistique', desc: "Accompagnement personnalisé : coaching, stratégie de carrière, gestion de l'image et du branding artistique." },
  { icon: Zap, title: 'Promotion de clips', desc: "Production et diffusion de contenus vidéo : teasers, clips officiels, making-of et campagnes YouTube." },
];

export default function About() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 md:py-36">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-xs font-mono text-primary tracking-widest uppercase mb-4"
          >
            À propos
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6"
          >
            KKD <span className="text-primary">MUSIC</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Label indépendant africain spécialisé dans la distribution musicale, la promotion digitale
            et le développement artistique. Nous accompagnons les artistes africains vers une visibilité mondiale.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Notre mission</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-3 mb-5">
              Amplifier les voix africaines
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              KKD Music est née de la conviction que les artistes africains méritent les mêmes outils et la même visibilité que n'importe quel artiste dans le monde.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nous offrons un écosystème complet : distribution numérique mondiale, promotion sur les plateformes sociales, gestion des clips et accompagnement stratégique pour construire des carrières durables.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border/50 rounded-2xl p-8"
          >
            <div className="space-y-5">
              {[
                { label: "Artistes accompagnés", value: "50+" },
                { label: "Plateformes de diffusion", value: "150+" },
                { label: "Pays couverts", value: "40+" },
                { label: "Années d'expérience", value: "5+" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className="font-display text-2xl font-extrabold text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-16 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Ce que nous faisons</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-3">Nos services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-5">
          Prêt à propulser votre carrière ?
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Rejoignez le réseau KKD Music et bénéficiez d'un accompagnement sur mesure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/partenaires"
            className="bg-primary text-white font-heading font-bold px-8 py-3 rounded-xl hover:bg-primary/80 transition-colors text-sm inline-flex items-center gap-2"
          >
            Nous rejoindre <ArrowRight size={16} />
          </Link>
          <a
            href="mailto:contact@kkdmusic.com"
            className="border border-border text-foreground font-heading font-bold px-8 py-3 rounded-xl hover:border-primary/50 hover:text-primary transition-colors text-sm inline-flex items-center gap-2"
          >
            <Mail size={16} /> Nous contacter
          </a>
        </div>
      </section>
    </div>
  );
}