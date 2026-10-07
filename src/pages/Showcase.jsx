import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Sparkles, Calendar, MapPin, QrCode, Music, Video, Users,
  TrendingUp, Ticket, ShieldCheck, Play, Heart, Eye,
} from 'lucide-react';
import PageMeta from '@/components/shared/PageMeta';

const KKD_LOGO = 'https://media.base44.com/images/public/695179b6b73caf48a00876c1/d0c46d8b9_generated_acb63943.png';
const QR_URL = (data) => `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=240x240&color=228-98-43&bgcolor=22-17-14&margin=0&qzone=1`;

function compact(n) {
  if (!n || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function Showcase() {
  const [captureMode, setCaptureMode] = useState(false);

  const { data: artists = [] } = useQuery({
    queryKey: ['showcase-artists'],
    queryFn: () => base44.entities.Artist.list('-order', 50),
    staleTime: 120_000,
  });
  const { data: releases = [] } = useQuery({
    queryKey: ['showcase-releases'],
    queryFn: () => base44.entities.Release.list('-release_date', 50),
    staleTime: 120_000,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['showcase-events'],
    queryFn: () => base44.entities.Event.list('-event_date', 30),
    staleTime: 120_000,
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['showcase-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 20),
    staleTime: 120_000,
  });

  const featuredArtists = useMemo(
    () => artists.filter(a => a.photo_url).slice(0, 6),
    [artists]
  );
  const trendingReleases = useMemo(
    () => releases.filter(r => r.cover_url).slice(0, 4),
    [releases]
  );
  const upcomingEvents = useMemo(
    () => events.filter(e => e.image_url && new Date(e.event_date) > new Date(Date.now() - 86400000)).slice(0, 3),
    [events]
  );
  const featuredVideos = useMemo(
    () => videos.filter(v => v.thumbnail_url || v.youtube_url).slice(0, 3),
    [videos]
  );

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Showcase KKD Music"
        description="Découvrez la plateforme musicale ouest-africaine — artistes, concerts, billetterie et studio vidéo IA."
        image={KKD_LOGO}
      />

      {/* Floating capture toggle */}
      {!captureMode && (
        <button
          onClick={() => setCaptureMode(true)}
          className="fixed bottom-6 right-6 z-50 kkd-btn-primary !text-xs !py-3 shadow-lg"
        >
          <Sparkles size={14} /> Mode capture
        </button>
      )}
      {captureMode && (
        <button
          onClick={() => setCaptureMode(false)}
          className="fixed bottom-6 right-6 z-50 kkd-btn-outline !text-xs !py-3 shadow-lg"
        >
          ✕ Quitter
        </button>
      )}

      {/* ── HERO ── */}
      <ShowcaseHero captureMode={captureMode} />

      {/* ── FEATURED ARTISTS ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <ShowcaseSectionHeader
          icon={Users}
          label="Artistes certifiés"
          title="Le nouveau visage de la scène ouest-africaine"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {featuredArtists.map((a) => (
            <div key={a.id} className="flex flex-col items-center text-center group">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-card border-2 border-primary/30 shadow-lg">
                {a.photo_url ? (
                  <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted"><Users size={28} className="text-muted-foreground/40" /></div>
                )}
                {a.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background flex items-center justify-center border-2 border-background">
                    <ShieldCheck size={16} className="text-accent" />
                  </div>
                )}
              </div>
              <p className="font-heading font-bold text-sm mt-3 truncate w-full">{a.name}</p>
              <p className="text-[11px] text-muted-foreground truncate w-full">{a.genre || 'Artiste KKD'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRENDING MUSIC ── */}
      <section className="bg-card/30 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ShowcaseSectionHeader
            icon={TrendingUp}
            label="Sorties du moment"
            title="La musique qui fait vibrer l'Afrique de l'Ouest"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {trendingReleases.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {r.cover_url && (
                    <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Play size={18} className="text-primary-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-heading font-bold text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.artist_name}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart size={11} className="text-primary/60" /> {compact(r.likes_count)}</span>
                    <span className="flex items-center gap-1"><Play size={11} className="text-primary/60" /> {compact(r.plays_count)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <ShowcaseSectionHeader
          icon={Calendar}
          label="Concerts & événements"
          title="Vivez la musique en direct"
        />
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {upcomingEvents.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {e.image_url && (
                  <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="kkd-badge-live">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Bientôt
                  </span>
                </div>
                {e.event_date && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <p className="text-[10px] text-white/70 uppercase font-mono">
                      {new Date(e.event_date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </p>
                    <p className="text-xl font-heading font-black text-white leading-none">
                      {new Date(e.event_date).getDate()}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-heading font-bold text-base truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={11} className="shrink-0" />
                  {[e.city, e.location].filter(Boolean).join(' · ') || 'Lieu à confirmer'}
                </p>
                {e.is_ticketed && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-accent font-bold text-sm">
                      {e.ticket_price ? `${e.ticket_price.toLocaleString('fr-FR')} F` : 'Gratuit'}
                    </span>
                    <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                      <Ticket size={12} /> Billetterie KKD
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO TICKET + QR ── */}
      <section className="bg-card/30 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ShowcaseSectionHeader
            icon={QrCode}
            label="Billetterie digitale"
            title="Des billets sécurisés avec QR code anti-falsification"
          />
          <div className="grid md:grid-cols-2 gap-8 mt-8 items-center">
            <DemoTicket />
            <div className="space-y-4">
              <FeatureBullet icon={ShieldCheck} title="Sécurité cryptographique" text="Chaque billet porte un hash de sécurité unique, infalsifiable, vérifiable par QR." />
              <FeatureBullet icon={QrCode} title="Scan & contrôle d'accès" text="Les contrôleurs scannent le QR en entrée/sortie, avec historique complet des allées et venues." />
              <FeatureBullet icon={Ticket} title="Vente en ligne Wave & Square" text="Les fans achètent en ligne, reçoivent leur billet digital, et le présentent au concert." />
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNER SPACE ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <ShowcaseSectionHeader
          icon={Sparkles}
          label="Espace partenaire"
          title="Les artistes gèrent leur carrière en autonomie"
        />
        <PartnerPreview releases={releases} events={events} />
      </section>

      {/* ── VIDEO CLIPS ── */}
      {featuredVideos.length > 0 && (
        <section className="bg-card/30 py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <ShowcaseSectionHeader
              icon={Video}
              label="Clips & live sessions"
              title="La vidéo au cœur de la plateforme"
            />
            <div className="grid md:grid-cols-3 gap-5 mt-8">
              {featuredVideos.map((v) => {
                const ytId = v.youtube_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)?.[1];
                const thumb = v.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');
                return (
                  <div key={v.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                          <Play size={22} className="text-primary-foreground ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-heading font-bold text-sm truncate">{v.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.artist_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye size={11} /> {compact(v.views_count)}</span>
                        <span className="flex items-center gap-1"><Heart size={11} className="text-primary/60" /> {compact(v.likes_count)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── STUDIO VIDEO IA ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <ShowcaseSectionHeader
          icon={Sparkles}
          label="Studio Vidéo IA"
          title="Créez des vidéos animées avec l'IA, gratuitement"
        />
        <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-border rounded-3xl p-8 md:p-12 mt-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
                <Sparkles size={14} /> NOUVEAU
              </span>
              <h3 className="font-heading text-2xl md:text-3xl font-black leading-tight">
                Transformez une image en vidéo animée de 30 à 60 secondes
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choisissez une chanson du catalogue, décrivez l'action souhaitée, et l'IA génère une vidéo
                cinématographique avec watermark KKD. 2 générations gratuites par jour.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/30 text-xs font-semibold text-secondary">30s — 60s</span>
                <span className="px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/30 text-xs font-semibold text-secondary">16:9 & 9:16</span>
                <span className="px-3 py-1.5 rounded-lg bg-secondary/20 border border-secondary/30 text-xs font-semibold text-secondary">Audio synchronisé</span>
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-card to-secondary/20 border border-border flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                  <Sparkles size={28} className="text-primary" />
                </div>
                <p className="font-heading font-bold text-lg">Génération IA en cours</p>
                <div className="flex gap-1.5 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-1.5 w-8 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="bg-gradient-to-b from-background to-card py-20">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <img src={KKD_LOGO} alt="KKD Music" className="w-16 h-16 rounded-2xl mx-auto object-cover" />
          <h2 className="font-heading text-3xl md:text-4xl font-black leading-tight">
            La scène ouest-africaine,<br />en direct de chez vous.
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Rejoignez la première plateforme D2C dédiée aux artistes indépendants d'Afrique de l'Ouest.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/" className="kkd-btn-primary">Explorer la plateforme</Link>
            <Link to="/devenir-artiste" className="kkd-btn-outline">Devenir artiste</Link>
          </div>
          <p className="text-[11px] text-muted-foreground/60 pt-4">
            KKD Music · SunuMaxim GROUP · {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </div>
  );
}

// ── HERO ──
function ShowcaseHero({ captureMode }) {
  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/10" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(228,98,43,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(31,138,92,0.12) 0%, transparent 50%)',
      }} />
      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-20 text-center space-y-6">
        <img src={KKD_LOGO} alt="KKD Music" className="w-20 h-20 md:w-24 md:h-24 rounded-2xl mx-auto object-cover shadow-2xl border border-border" />
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
            D2C Streaming & Store
          </span>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight">
            KKD MUSIC
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            La scène ouest-africaine, en direct de chez vous.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <StatBadge value="500+" label="Artistes" />
          <StatBadge value="10K+" label="Sorties" />
          <StatBadge value="50+" label="Concerts" />
          <StatBadge value="90%" label="Net pour l'artiste" />
        </div>
        {!captureMode && (
          <p className="text-xs text-muted-foreground/60 pt-4">
            👆 Utilisez le « Mode capture » pour masquer la navigation et faire vos screenshots
          </p>
        )}
      </div>
    </section>
  );
}

function StatBadge({ value, label }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
      <span className="font-heading text-xl md:text-2xl font-black text-primary">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

// ── SECTION HEADER ──
function ShowcaseSectionHeader({ icon: Icon, label, title }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Icon size={18} />
        <span className="text-xs font-mono uppercase tracking-widest font-bold">{label}</span>
      </div>
      <h2 className="font-heading text-2xl md:text-3xl font-black leading-tight max-w-2xl">{title}</h2>
    </div>
  );
}

// ── DEMO TICKET ──
function DemoTicket() {
  const ticketData = JSON.stringify({
    event: "Festival Sabar — Édition Spéciale",
    date: "2027-01-15T20:00:00",
    venue: "Grande Arène de Dakar",
    ticket_number: "KKD-DEMO-2027-X8SM",
    type: "VIP",
    qty: 1,
  });
  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">Billet VIP</p>
            <h3 className="font-heading text-lg font-black mt-1">Festival Sabar</h3>
            <p className="text-xs text-muted-foreground">Grande Arène de Dakar</p>
          </div>
          <img src={KKD_LOGO} alt="KKD" className="w-10 h-10 rounded-lg object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Date</p>
            <p className="text-sm font-bold">15 Jan 2027 · 20h00</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Type</p>
            <p className="text-sm font-bold text-accent">VIP — Accès complet</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Acheteur</p>
            <p className="text-sm font-bold">A•••• B•••</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">N° billet</p>
            <p className="text-sm font-mono font-bold">KKD-DEMO-2027</p>
          </div>
        </div>
        <div className="border-t-2 border-dashed border-border pt-4 flex items-center gap-4">
          <div className="rounded-xl overflow-hidden bg-background p-2 border border-border">
            <img src={QR_URL(ticketData)} alt="QR Code billet" className="w-28 h-28" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[10px] uppercase text-muted-foreground">Présentez ce QR à l'entrée</p>
            <p className="text-xs text-secondary font-semibold flex items-center gap-1">
              <ShieldCheck size={14} /> Hash de sécurité vérifié
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">SHA-256: a3f8••••••••2c91</p>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">Données de démonstration — aucun billet réel</p>
    </div>
  );
}

// ── FEATURE BULLET ──
function FeatureBullet({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <p className="font-heading font-bold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

// ── PARTNER PREVIEW ──
function PartnerPreview({ releases, events }) {
  const totalPlays = releases.reduce((s, r) => s + (r.plays_count || 0), 0);
  const totalSales = releases.reduce((s, r) => s + (r.sales_count || 0), 0);
  const totalEvents = events.length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-8 shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/15 to-transparent px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={KKD_LOGO} alt="KKD" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <p className="font-heading font-bold text-sm">Espace Partenaire</p>
            <p className="text-[10px] text-muted-foreground">Tableau de bord artiste</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/30 text-[10px] font-bold text-secondary">CERTIFIÉ</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="bg-card p-4 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Écoutes</p>
          <p className="font-heading text-xl font-black text-primary">{compact(totalPlays)}</p>
        </div>
        <div className="bg-card p-4 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Achats</p>
          <p className="font-heading text-xl font-black text-accent">{totalSales}</p>
        </div>
        <div className="bg-card p-4 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Concerts</p>
          <p className="font-heading text-xl font-black text-secondary">{totalEvents}</p>
        </div>
      </div>

      {/* Recent releases list */}
      <div className="p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Dernières sorties</p>
        {releases.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
              {r.cover_url && <img src={r.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{r.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.artist_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-primary">{compact(r.plays_count)}</p>
              <p className="text-[10px] text-muted-foreground">écoutes</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button className="flex-1 kkd-btn-primary !text-xs !py-2.5">Publier une sortie</button>
        <button className="flex-1 kkd-btn-outline !text-xs !py-2.5">Créer un événement</button>
      </div>
    </div>
  );
}