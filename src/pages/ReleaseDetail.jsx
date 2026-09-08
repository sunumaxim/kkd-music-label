import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music, Calendar, User, Heart, Headphones } from 'lucide-react';
import BuyCard from '@/components/marketplace/BuyCard';
import PlayReleaseButton from '@/components/player/PlayReleaseButton';
import ReleaseTracklist from '@/components/player/ReleaseTracklist';
import AddToPlaylist from '@/components/player/AddToPlaylist';
import { StreamingLinks } from '@/components/shared/StreamingEmbed';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import LikeButton from '@/components/shared/LikeButton';
import MobileHeader from '@/components/mobile/MobileHeader';
import { motion } from 'framer-motion';
import { extractIdFromSlug, buildShareUrl, buildSharePreviewUrl, buildEntitySlug, slugify } from '@/lib/slugify';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import { getReleaseTracks } from '@/lib/releaseTracks';

const TYPE_LABELS = {
  single: 'Single',
  album: 'Album',
  ep: 'EP',
  projet_special: 'Projet spécial',
};

export default function ReleaseDetail() {
  const { slug: slugParam } = useParams();
  const slug = slugify(slugParam);
  const legacyId = slugParam?.includes('--') ? extractIdFromSlug(slugParam) : null;
  const id = legacyId || slug;
  const queryClient = useQueryClient();

  const { data: release, isLoading } = useQuery({
    queryKey: ['release', id],
    queryFn: () => resolveEntityBySlug('Release', slugParam, 'title'),
  });

  const { data: artist } = useQuery({
    queryKey: ['artist-for-release', release?.artist_id, release?.artist_name],
    queryFn: async () => {
      if (release.artist_id) {
        const r = await base44.entities.Artist.filter({ id: release.artist_id });
        return r[0] || null;
      }
      if (release.artist_name) {
        const r = await base44.entities.Artist.filter({ name: release.artist_name });
        return r[0] || null;
      }
      return null;
    },
    enabled: !!release,
  });

  const { data: otherReleases = [] } = useQuery({
    queryKey: ['artist-releases-other', release?.artist_name, id],
    queryFn: async () => {
      const all = await base44.entities.Release.filter({ artist_name: release.artist_name });
      return all.filter((r) => r.id !== id).slice(0, 4);
    },
    enabled: !!release?.artist_name,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['release', id] });

  const effectivelyPaid = release ? (release.is_for_sale && Number(release.price) > 0) : false;
  const playable = release ? getReleaseTracks(release).length > 0 : false;
  const hasExternal = release ? !!(release.spotify_url || release.youtube_url || release.apple_music_url || release.audiomack_url || release.deezer_url) : false;
  const shareUrl = release ? buildShareUrl('/musique', release.slug || release.title) : '';
  const sharePreviewUrl = release ? buildSharePreviewUrl('release', release.slug || slugify(release.title)) : '';

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
        description={
          (effectivelyPaid ? `Prix: ${Number(release.price).toLocaleString('fr-FR')} F CFA — ` : '') +
          (release.description || `Écoutez ${release.title} de ${release.artist_name} sur KKD Music.`)
        }
        image={release.cover_url}
        url={shareUrl}
        type="music.album"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'MusicAlbum',
          name: release.title,
          byArtist: { '@type': 'MusicGroup', name: release.artist_name },
          image: release.cover_url,
          url: shareUrl,
          datePublished: release.release_date,
        }}
      />
      <MobileHeader title={release.title} backPath="/musique" />

      {/* Hero — épuré style Spotify */}
      <div className="relative overflow-hidden">
        {release.cover_url && (
          <div className="absolute inset-0">
            <img src={release.cover_url} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-20" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 pt-6 md:pt-14 pb-6 flex flex-col md:flex-row gap-6 items-end">
          <Link to="/musique" className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground absolute top-8 left-4 transition-colors">
            <ArrowLeft size={14} /> Retour
          </Link>
          {release.cover_url ? (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={release.cover_url}
              alt={release.title}
              className="w-40 h-40 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl shadow-black/40 shrink-0"
            />
          ) : (
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
              <Music size={48} className="text-muted-foreground/30" />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-4 md:pt-0">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1 block">
              {TYPE_LABELS[release.release_type] || release.release_type}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-2 break-words">{release.title}</h1>
            {artist ? (
              <Link to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`} className="inline-flex items-center gap-1.5 text-base text-muted-foreground hover:text-primary transition-colors">
                <User size={14} className="text-primary" /> {release.artist_name}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                <User size={14} className="text-primary" /> {release.artist_name}
              </span>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
              {release.release_date && (
                <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(release.release_date).getFullYear()}</span>
              )}
              {(release.plays_count || 0) > 0 && (
                <span className="flex items-center gap-1.5"><Headphones size={14} className="text-primary" /> {release.plays_count.toLocaleString('fr-FR')} écoutes</span>
              )}
              {(release.likes_count || 0) > 0 && (
                <span className="flex items-center gap-1.5"><Heart size={14} className="text-primary" /> {release.likes_count.toLocaleString('fr-FR')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Barre d'actions — lecture, like, partage, playlist */}
        <div className="flex items-center gap-3 flex-wrap">
          {playable && <PlayReleaseButton release={release} size="lg" />}
          <LikeButton targetType="release" targetId={release.id} title={release.title} artistName={release.artist_name} coverUrl={release.cover_url} size={22} />
          <ShareBar title={`${release.title} — ${release.artist_name}`} url={sharePreviewUrl} />
          {playable && <AddToPlaylist release={release} />}
        </div>

        {/* Achat exclusif */}
        {effectivelyPaid && <BuyCard item={release} itemType="release" />}

        {/* Tracklist / Lecteur KKD — section principale */}
        {playable && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-primary">
                {release.tracks && release.tracks.length ? `${release.tracks.length} piste(s)` : 'Lecture complète'}
              </p>
            </div>
            <ReleaseTracklist release={release} />
          </div>
        )}

        {/* Aucun audio disponible */}
        {!effectivelyPaid && !playable && !hasExternal && (
          <div className="bg-card border border-dashed border-border/60 rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun audio n'a encore été ajouté à cette sortie. Le fichier audio sera disponible dès qu'il sera téléversé.</p>
          </div>
        )}

        {/* Liens de streaming externes — visibles sur toutes les sorties (gratuites et payantes) */}
        {hasExternal && (
          <StreamingLinks
            spotify={release.spotify_url}
            youtube={release.youtube_url}
            apple_music={release.apple_music_url}
            audiomack={release.audiomack_url}
            deezer={release.deezer_url}
          />
        )}

        {/* Description */}
        {release.description && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-foreground/85 leading-relaxed text-sm">{release.description}</p>
          </div>
        )}

        {/* Carte artiste */}
        {artist && (
          <Link to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`} className="group block">
            <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
              {artist.photo_url ? (
                <img src={artist.photo_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User size={22} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-0.5">Artiste</p>
                <p className="font-heading font-bold text-lg truncate group-hover:text-primary transition-colors">{artist.name}</p>
                {artist.genre && <p className="text-xs text-muted-foreground truncate">{artist.genre}</p>}
              </div>
              <span className="text-xs text-primary shrink-0 flex items-center gap-1">Voir le profil <ArrowLeft size={13} className="rotate-180" /></span>
            </div>
          </Link>
        )}

        {/* Autres sorties de l'artiste */}
        {otherReleases.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg mb-4">Autres sorties de {release.artist_name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherReleases.map((r) => (
                <Link key={r.id} to={`/musique/${r.slug || slugify(r.title)}`} className="group">
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
              ))}
            </div>
          </div>
        )}

        {/* Paroles */}
        {release.lyrics && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">Paroles</h2>
            <p className="text-foreground/85 leading-relaxed whitespace-pre-line text-sm">{release.lyrics}</p>
          </div>
        )}

        {/* Commentaires */}
        <CommentsSection entityType="release" entity={release} onUpdate={refresh} />
      </div>
    </div>
  );
}