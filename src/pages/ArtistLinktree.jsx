import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageMeta from '@/components/shared/PageMeta';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import { slugify } from '@/lib/slugify';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import { checkArtistCertifiedInDb } from '@/services/artistCertification';
import {
  Youtube, Music, Instagram, Facebook, Globe, MapPin,
  Share2, Check, Disc3, ExternalLink, BookOpen, Loader2,
} from 'lucide-react';

import { LOGO_ARTIST as KKD_LOGO } from '@/lib/logos';

const STREAMING = [
  { field: 'spotify_url', label: 'Spotify', icon: Music, color: '#1DB954' },
  { field: 'youtube_url', label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { field: 'apple_music_url', label: 'Apple Music', icon: Music, color: '#FA243C' },
  { field: 'deezer_url', label: 'Deezer', icon: Music, color: '#A238FF' },
  { field: 'audiomack_url', label: 'Audiomack', icon: Music, color: '#FFA200' },
  { field: 'soundcloud_url', label: 'SoundCloud', icon: Music, color: '#FF5500' },
];

const SOCIALS = [
  { field: 'instagram_url', label: 'Instagram', icon: Instagram, color: '#E4405F' },
  { field: 'tiktok_url', label: 'TikTok', icon: Music, color: '#EE1D52' },
  { field: 'facebook_url', label: 'Facebook', icon: Facebook, color: '#1877F2' },
];

const WEB_LINKS = [
  { field: 'website_url', label: 'Site officiel', icon: Globe, color: '#E4622B' },
  { field: 'wikipedia_url', label: 'Wikipedia', icon: BookOpen, color: '#A6998C' },
];

export default function ArtistLinktree() {
  const { slug: slugParam } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist-linktree', slugParam],
    queryFn: () => resolveEntityBySlug('Artist', slugParam, 'name'),
  });

  const { data: isCertified = false } = useQuery({
    queryKey: ['linktree-certified', artist?.id, slugParam],
    queryFn: () => checkArtistCertifiedInDb(artist || slugParam),
    enabled: Boolean(artist || slugParam),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['linktree-events', artist?.name],
    queryFn: () => base44.entities.Event.filter({ artist_name: artist?.name }),
    enabled: !!artist?.name,
    select: (data) =>
      data
        .filter((e) => e.event_date && new Date(e.event_date) >= new Date(Date.now() - 86400000))
        .filter((e) => !e.published_status || e.published_status === 'approuve')
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5),
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['linktree-releases', artist?.name],
    queryFn: () => base44.entities.Release.filter({ artist_name: artist?.name }),
    enabled: !!artist?.name,
    select: (data) =>
      data
        .sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0))
        .slice(0, 6),
  });

  const streamingLinks = STREAMING.filter((p) => artist?.[p.field]);
  const socialLinks = SOCIALS.filter((p) => artist?.[p.field]);
  const webLinks = WEB_LINKS.filter((p) => artist?.[p.field]);
  const hasAnyLink = streamingLinks.length + socialLinks.length + webLinks.length > 0;

  const shareUrl = `${window.location.origin}/l/${slugify(slugParam)}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: artist?.name || 'KKD Music', url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <img src={KKD_LOGO} alt="KKD Music" className="w-14 h-14 rounded-xl" />
        <p className="text-muted-foreground">Artiste introuvable.</p>
        <Link to="/artistes" className="text-primary hover:underline">Voir tous les artistes</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${artist.name} — Liens officiels | KKD Music`}
        description={`Tous les liens officiels de ${artist.name} : streaming, réseaux sociaux, concerts et actualités sur KKD Music.`}
        image={artist.photo_url}
        url={shareUrl}
        type="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'MusicGroup',
          name: artist.name,
          image: artist.photo_url,
          genre: artist.genre,
          url: shareUrl,
          sameAs: [
            artist.spotify_url, artist.youtube_url, artist.apple_music_url,
            artist.instagram_url, artist.facebook_url, artist.tiktok_url,
          ].filter(Boolean),
        }}
      />

      <div className="max-w-md mx-auto px-4 py-8 pb-24">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-card border-2 border-primary/30 shadow-lg mb-4">
            {artist.photo_url ? (
              <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 size={40} className="text-muted-foreground/40" />
              </div>
            )}
          </div>
          <h1 className="font-heading text-2xl font-extrabold flex items-center gap-2">
            {artist.name}
            {isCertified && <VerifiedBadge size={18} />}
          </h1>
          {artist.genre && (
            <p className="text-sm text-muted-foreground mt-1">{artist.genre}</p>
          )}
          {artist.biography && (
            <p className="text-xs text-muted-foreground/80 mt-3 line-clamp-3 max-w-xs">
              {artist.biography}
            </p>
          )}
          <button
            onClick={handleShare}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Lien copié !' : 'Partager cette page'}
          </button>
        </div>

        {/* Liens streaming */}
        {streamingLinks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Écouter</p>
            <div className="space-y-2.5">
              {streamingLinks.map((p) => (
                <LinkButton key={p.field} {...p} url={artist[p.field]} />
              ))}
            </div>
          </div>
        )}

        {/* Liens réseaux sociaux */}
        {socialLinks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Suivre</p>
            <div className="space-y-2.5">
              {socialLinks.map((p) => (
                <LinkButton key={p.field} {...p} url={artist[p.field]} />
              ))}
            </div>
          </div>
        )}

        {/* Liens web */}
        {webLinks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Web</p>
            <div className="space-y-2.5">
              {webLinks.map((p) => (
                <LinkButton key={p.field} {...p} url={artist[p.field]} />
              ))}
            </div>
          </div>
        )}

        {/* Aucun lien */}
        {!hasAnyLink && events.length === 0 && releases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Aucun lien vérifié pour cet artiste pour le moment.
            </p>
          </div>
        )}

        {/* Concerts à venir */}
        {events.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Concerts à venir</p>
            <div className="space-y-2">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to={`/evenements/${e.slug || e.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all group"
                >
                  <div className="text-center bg-secondary/30 border border-border rounded-xl p-2 shrink-0 min-w-[48px]">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">
                      {new Date(e.event_date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </p>
                    <p className="text-lg font-heading font-extrabold text-primary leading-none">
                      {new Date(e.event_date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{e.title}</p>
                    {(e.city || e.location) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{[e.city, e.location].filter(Boolean).join(' · ')}</span>
                      </p>
                    )}
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Dernières sorties */}
        {releases.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Dernières sorties</p>
            <div className="grid grid-cols-3 gap-2.5">
              {releases.map((r) => (
                <Link key={r.id} to={`/musique/${r.slug || r.id}`} className="group block">
                  <div className="aspect-square rounded-xl overflow-hidden bg-card border border-border mb-1.5 shadow-sm">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 size={20} className="text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold truncate group-hover:text-primary transition-colors">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-border text-center">
          <Link
            to={`/artistes/${artist.slug || slugify(artist.name)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Voir le profil complet sur KKD Music
          </Link>
          <div className="flex items-center justify-center gap-2 mt-4">
            <img src={KKD_LOGO} alt="KKD Music" className="w-6 h-6 rounded" />
            <span className="text-xs text-muted-foreground font-semibold">KKD Music</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkButton({ label, icon: Icon, color, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all group"
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={20} />
      </span>
      <span className="flex-1 text-left font-semibold text-sm">{label}</span>
      <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
}