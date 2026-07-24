import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music, Calendar, User, Heart, Headphones, ShoppingCart } from 'lucide-react';
import { EmbeddedPlayer } from '@/components/shared/UniversalPlayer';
import BuyCard from '@/components/marketplace/BuyCard';
import PlayReleaseButton from '@/components/player/PlayReleaseButton';
import ReleaseTracklist from '@/components/player/ReleaseTracklist';
import AddToPlaylist from '@/components/player/AddToPlaylist';
import PromoAssetGenerator from '@/components/promo/PromoAssetGenerator';
import { StreamingLinks } from '@/components/shared/StreamingEmbed';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import MobileHeader from '@/components/mobile/MobileHeader';
import { motion } from 'framer-motion';
import { extractIdFromSlug, buildShareUrl, buildSharePreviewUrl, buildEntitySlug, slugify } from '@/lib/slugify';

const TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  projet_special: 'Projet spécial',
};

export default function ReleaseDetail() {
  const { slug } = useParams();
  const id = extractIdFromSlug(slug);
  const queryClient = useQueryClient();

  const { data: release, isLoading } = useQuery({
    queryKey: ['release', id],
    queryFn: async () => {
      const results = await base44.entities.Release.filter({ id });
      return results[0] || null;
    },
  });

  const { data: artist } = useQuery({
    queryKey: ['artist-by-name', release?.artist_name],
    queryFn: () => base44.entities.Artist.filter({ name: release.artist_name }).then(r => r[0] || null),
    enabled: !!release?.artist_name,
  });

  const { data: otherReleases = [] } = useQuery({
    queryKey: ['artist-releases-other', release?.artist_name, id],
    queryFn: async () => {
      const all = await base44.entities.Release.filter({ artist_name: release.artist_name });
      return all.filter(r => r.id !== id).slice(0, 4);
    },
    enabled: !!release?.artist_name,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['release', id] });

  const streamUrl = release ? (release.spotify_url || release.deezer_url || release.apple_music_url || release.audiomack_url || release.youtube_url) : null;
  const shareUrl = release ? buildShareUrl('/musique', release.title, release.id) : '';
  const sharePreviewUrl = release ? buildSharePreviewUrl('release', buildEntitySlug(release.title, release.id), shareUrl) : '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Sortie introuvable.</p>
        <Link to="/musique" className="text-primary text-sm">← Retour à la musique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageMeta
        title={`${release.title} — ${release.artist_name}`}
        description={release.description || `Écoutez ${release.title} de ${release.artist_name} sur KKD Music.`}
        image={release.cover_url}
        url={shareUrl}
        type="music.album"
      />
      <MobileHeader title={release.title} backPath="/musique" />

      {/* Hero */}
      <div className="relative overflow-hidden">
        {release.cover_url && (
          <>
            <div className="absolute inset-0">
              <img src={release.cover_url} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-20" />
            </div>
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-4 pt-6 md:pt-14 pb-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
          <Link to="/musique" className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground absolute top-8 left-4 transition-colors">
            <ArrowLeft size={14} /> Retour
          </Link>
          {release.cover_url ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={release.cover_url}
              alt={release.title}
              className="w-40 h-40 md:w-56 md:h-56 rounded-2xl object-cover shadow-2xl shadow-black/40 flex-shrink-0"
            />
          ) : (
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center flex-shrink-0">
              <Music size={48} className="text-primary/30" />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-4 md:pt-0">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1 block">
              {TYPE_LABELS[release.release_type] || release.release_type}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-2">{release.title}</h1>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              {artist ? (
                <Link to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <User size={13} className="text-primary" /> {release.artist_name}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User size={13} className="text-primary" /> {release.artist_name}
                </span>
              )}
              {release.release_date && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar size={13} /> {new Date(release.release_date).getFullYear()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 mb-4 flex-wrap text-sm text-muted-foreground">
              {(release.likes_count || 0) > 0 && (
                <span className="flex items-center gap-1.5"><Heart size={14} className="text-primary" /> {release.likes_count.toLocaleString('fr-FR')}</span>
              )}
              {(release.plays_count || 0) > 0 && (
                <span className="flex items-center gap-1.5"><Headphones size={14} className="text-primary" /> {release.plays_count.toLocaleString('fr-FR')} écoutes</span>
              )}
              {(release.sales_count || 0) > 0 && (
                <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-primary" /> {release.sales_count} {release.is_for_sale && release.release_date && new Date(release.release_date) > new Date() ? 'précommande(s)' : 'achat(s)'}</span>
              )}
            </div>
            <ShareBar title={`${release.title} — ${release.artist_name}`} url={sharePreviewUrl} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Achat exclusif */}
        <BuyCard item={release} itemType="release" />

        {release.is_for_sale && (
          <PromoAssetGenerator
            coverUrl={release.cover_url}
            title={release.title}
            artistName={release.artist_name}
            kind="release"
          />
        )}

        {/* Player externe (Spotify/YouTube…) */}
        {streamUrl && (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <EmbeddedPlayer url={streamUrl} />
          </div>
        )}

        {/* Lecture KKD — gratuit (chanson complète, lecteur persistant) */}
        {!release.is_for_sale && (release.audio_file_url || (release.tracks && release.tracks.length)) && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Écouter sur KKD</p>
                <p className="text-sm text-muted-foreground">
                  {release.tracks && release.tracks.length ? `${release.tracks.length} piste(s) · ` : ''}Lecture complète gratuite
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AddToPlaylist release={release} />
                <PlayReleaseButton release={release} size="lg" />
              </div>
            </div>
            {release.tracks && release.tracks.length > 0 && <ReleaseTracklist release={release} />}
          </div>
        )}

        {/* Streaming links */}
        <StreamingLinks
          spotify={release.spotify_url}
          youtube={release.youtube_url}
          apple_music={release.apple_music_url}
          audiomack={release.audiomack_url}
          deezer={release.deezer_url}
        />

        {/* Description */}
        {release.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <p className="text-foreground/85 leading-relaxed">{release.description}</p>
          </div>
        )}

        {/* Autres sorties de l'artiste */}
        {otherReleases.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg mb-4">Autres sorties de {release.artist_name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherReleases.map(r => {
                const slug = `${slugify(r.title)}--${r.id}`;
                return (
                  <Link key={r.id} to={`/musique/${slug}`} className="group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-card border border-border/40 mb-2">
                      {r.cover_url ? (
                        <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <Music size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-heading font-bold text-xs truncate group-hover:text-primary transition-colors">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{r.release_type?.replace('_', ' ')}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Paroles */}
        {release.lyrics && (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-3">Paroles</h2>
            <p className="text-foreground/85 leading-relaxed whitespace-pre-line text-sm">{release.lyrics}</p>
          </div>
        )}

        {/* Comments & likes */}
        <CommentsSection entityType="release" entity={release} onUpdate={refresh} />
      </div>
    </div>
  );
}