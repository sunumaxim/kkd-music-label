import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Music, User, Headphones, CheckCircle2, ExternalLink, Video as VideoIcon, Play, Sparkles } from 'lucide-react';
import { cleanArtistName } from '@/services/artistSyncService';
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
import { useMyPurchases } from '@/hooks/useMyPurchases';

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

  const { data: featuringArtist } = useQuery({
    queryKey: ['featuring-artist-for-release', release?.featuring_artist_id, release?.featuring_artist],
    queryFn: async () => {
      if (release?.featuring_artist_id) {
        const r = await base44.entities.Artist.filter({ id: release.featuring_artist_id });
        if (r[0]) return r[0];
      }
      if (release?.featuring_artist) {
        const featName = cleanArtistName(release.featuring_artist.split(',')[0]);
        const r = await base44.entities.Artist.filter({ name: featName });
        if (r[0]) return r[0];
      }
      return null;
    },
    enabled: Boolean(release?.featuring_artist || release?.featuring_artist_id),
  });

  const { data: otherReleases = [] } = useQuery({
    queryKey: ['artist-releases-other', release?.artist_name, id],
    queryFn: async () => {
      const all = await base44.entities.Release.filter({ artist_name: release.artist_name });
      return all.filter((r) => r.id !== id).slice(0, 4);
    },
    enabled: !!release?.artist_name,
  });

  // Résolution du clip officiel synchronisé avec cette chanson
  const { data: linkedVideo } = useQuery({
    queryKey: ['release-linked-video', release?.id, release?.linked_video_id, release?.title, release?.artist_name],
    queryFn: async () => {
      if (!release) return null;
      // 1. Si un ID de clip précis est lié
      if (release.linked_video_id) {
        const found = await base44.entities.Video.filter({ id: release.linked_video_id });
        if (found && found[0]) return found[0];
      }
      // 2. Recherche automatique par artiste + titre
      if (release.artist_name) {
        const artistVideos = await base44.entities.Video.filter({ artist_name: release.artist_name });
        if (artistVideos && artistVideos.length > 0) {
          const cleanRelTitle = (release.title || '')
            .toLowerCase()
            .replace(/\(.*?\)|\[.*?\]/g, '')
            .replace(/clip\s*officiel|official\s*video|music\s*video|visualizer|audio\s*officiel/gi, '')
            .trim();

          const exact = artistVideos.find(v => {
            const cleanVidTitle = (v.title || '').toLowerCase().trim();
            return cleanVidTitle === cleanRelTitle ||
                   cleanVidTitle.includes(cleanRelTitle) ||
                   cleanRelTitle.includes(cleanVidTitle);
          });
          if (exact) return exact;

          if (release.youtube_url) {
            const byYt = artistVideos.find(v => v.youtube_url && v.youtube_url.trim() === release.youtube_url.trim());
            if (byYt) return byYt;
          }
        }
      }
      return null;
    },
    enabled: !!release,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['release', id] });

  const myPurchases = useMyPurchases();
  const hasPurchased = Boolean(
    release?.id && myPurchases.some((p) => p.item_id === release.id)
  );
  const effectivelyPaid = release
    ? Boolean(
        (release.is_for_sale || release.access_mode === 'en_vente') &&
        (Number(release.price) > 0 || release.is_for_sale)
      )
    : false;
  const playable = release ? getReleaseTracks(release, { hasPurchased, includeLocked: true }).length > 0 : false;
  const hasExternal = release ? !!(release.spotify_url || release.youtube_url || release.apple_music_url || release.audiomack_url || release.deezer_url) : false;
  
  // Détection si la chanson disponible est un extrait (30s) des plateformes
  const isAudioPreviewOnly = Boolean(
    release?.audio_preview_url ||
    release?.is_preview ||
    (release?.audio_file_url && (
      release.audio_file_url.includes('mzstatic') ||
      release.audio_file_url.includes('itunes') ||
      release.audio_file_url.includes('deezer') ||
      release.audio_file_url.includes('audio-preview')
    ))
  );
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

      {/* Hero — Spotify & Audiomack Immersive Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1b2230] to-background pt-6 md:pt-12 pb-8 border-b border-white/[0.06]">
        {release.cover_url && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={release.cover_url}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-125 opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-background" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          <Link
            to="/musique"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-white/90 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-full mb-6 border border-border transition-all shadow-xs"
          >
            <ArrowLeft size={13} /> Retour au catalogue
          </Link>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end">
            {release.cover_url ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group shrink-0"
              >
                <img
                  src={release.cover_url}
                  alt={release.title}
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl object-cover shadow-xl border border-border"
                />
                {effectivelyPaid && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg">
                    {Number(release.price).toLocaleString('fr-FR')} F CFA
                  </span>
                )}
              </motion.div>
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl bg-slate-100 border border-border flex items-center justify-center shrink-0 shadow-lg">
                <Music size={56} className="text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0 text-center md:text-left space-y-2.5">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {TYPE_LABELS[release.release_type] || release.release_type || 'Single'}
                </span>
                {effectivelyPaid && (
                  <span className="text-[11px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                    Direct-to-Consumer (D2C)
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight break-words text-foreground tracking-tight">
                {release.title}
              </h1>

              {/* Artist row with avatar & featuring */}
              <div className="flex items-center justify-center md:justify-start gap-2.5 pt-1 flex-wrap">
                {artist ? (
                  <Link
                    to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`}
                    className="flex items-center gap-2 group/art"
                  >
                    {artist.photo_url ? (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white/10 group-hover/art:ring-primary transition-all"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-muted-foreground border border-border">
                        <User size={14} />
                      </div>
                    )}
                    <span className="font-bold text-sm sm:text-base text-foreground group-hover/art:text-primary transition-colors flex items-center gap-1">
                      {release.artist_name}
                      <CheckCircle2 size={13} className="text-primary fill-primary/20" />
                    </span>
                  </Link>
                ) : (
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    {release.artist_name}
                  </span>
                )}

                {/* Artiste en Featuring Validé */}
                {release.featuring_artist && (
                  <>
                    <span className="text-zinc-500 font-semibold text-xs">feat.</span>
                    {featuringArtist ? (
                      <Link
                        to={`/artistes/${buildEntitySlug(featuringArtist.name, featuringArtist.id)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary transition-colors text-xs font-bold"
                      >
                        {featuringArtist.photo_url && (
                          <img
                            src={featuringArtist.photo_url}
                            alt={featuringArtist.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <span>{featuringArtist.name}</span>
                        <CheckCircle2 size={11} className="text-primary" />
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-zinc-300 bg-white/[0.06] px-2 py-0.5 rounded-full">
                        {release.featuring_artist}
                      </span>
                    )}
                  </>
                )}

                <span className="text-zinc-500">•</span>

                {release.release_date && (
                  <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                    {new Date(release.release_date).getFullYear()}
                  </span>
                )}

                {(release.plays_count || 0) > 0 && (
                  <>
                    <span className="text-zinc-500">•</span>
                    <span className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-1">
                      <Headphones size={13} className="text-primary" />
                      {release.plays_count.toLocaleString('fr-FR')} écoutes
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        {/* Spotify Action Bar (Play, Like, Buy, Share, Playlist) */}
        <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-white/[0.06]">
          {playable && <PlayReleaseButton release={release} hasPurchased={hasPurchased} size="lg" />}

          <LikeButton
            targetType="release"
            targetId={release.id}
            title={release.title}
            artistName={release.artist_name}
            coverUrl={release.cover_url}
            size={24}
          />

          <ShareBar title={`${release.title} — ${release.artist_name}`} url={sharePreviewUrl} />

          {playable && <AddToPlaylist release={release} />}

          <Link
            to={`/studio-video?trackId=${release.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-500/40 text-amber-400 text-xs font-bold transition-all hover:scale-105"
            title="Créer un clip vidéo TikTok pour ce titre"
          >
            <Sparkles size={14} />
            <span>Créer clip TikTok</span>
          </Link>
        </div>

        {/* Achat exclusif D2C (Wave / Orange Money) */}
        {effectivelyPaid && <BuyCard item={release} itemType="release" />}

        {/* Notice discrète sur les extraits audio (30s) avec accès aux plateformes officielles */}
        {isAudioPreviewOnly && (
          <div className="rounded-xl bg-card border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Extrait audio (30s)</span> — Écoutez l'œuvre complète sur les plateformes officielles :
            </p>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {release.spotify_url && (
                <a
                  href={release.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/30 text-[#1db954] text-xs font-semibold transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink size={11} />
                </a>
              )}
              {release.apple_music_url && (
                <a
                  href={release.apple_music_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fc3c44]/10 hover:bg-[#fc3c44]/20 border border-[#fc3c44]/30 text-[#fc3c44] text-xs font-semibold transition-colors"
                >
                  <span>Apple Music</span>
                  <ExternalLink size={11} />
                </a>
              )}
              {release.deezer_url && (
                <a
                  href={release.deezer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a238ff]/10 hover:bg-[#a238ff]/20 border border-[#a238ff]/30 text-[#a238ff] text-xs font-semibold transition-colors"
                >
                  <span>Deezer</span>
                  <ExternalLink size={11} />
                </a>
              )}
              {release.youtube_url && (
                <a
                  href={release.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff0000]/10 hover:bg-[#ff0000]/20 border border-[#ff0000]/30 text-[#ff0000] text-xs font-semibold transition-colors"
                >
                  <span>YouTube</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Clip officiel synchronisé */}
        {linkedVideo && (
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {linkedVideo.thumbnail_url ? (
                <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-border group">
                  <img
                    src={linkedVideo.thumbnail_url}
                    alt={linkedVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={16} className="text-white fill-white" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <VideoIcon size={24} />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-red-500 flex items-center gap-1">
                  <VideoIcon size={12} /> Clip officiel synchronisé
                </span>
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate mt-0.5">
                  {linkedVideo.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {linkedVideo.artist_name || release.artist_name}
                </p>
              </div>
            </div>

            <Link
              to={`/videos/${buildEntitySlug(linkedVideo.title, linkedVideo.id)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm transition-colors shrink-0 shadow-sm"
            >
              <Play size={14} className="fill-white" />
              <span>Regarder le clip</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}

        {/* Tracklist Table */}
        {playable && (
          <div className="rounded-2xl bg-card border border-border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-foreground">Pistes audio</h2>
              <span className="text-xs font-mono uppercase text-muted-foreground">
                {release.tracks && release.tracks.length ? `${release.tracks.length} titre(s)` : isAudioPreviewOnly ? 'Extrait audio (30s)' : 'Master audio'}
              </span>
            </div>
            <ReleaseTracklist release={release} hasPurchased={hasPurchased} />
          </div>
        )}

        {/* Aucun audio disponible */}
        {!effectivelyPaid && !playable && !hasExternal && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun audio n'a encore été ajouté à cette sortie. Le fichier audio master sera disponible dès qu'il sera téléversé.
            </p>
          </div>
        )}

        {/* Liens de streaming officiels */}
        {hasExternal && (
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Disponible également sur les plateformes de streaming
            </p>
            <StreamingLinks
              spotify={release.spotify_url}
              youtube={release.youtube_url}
              apple_music={release.apple_music_url}
              audiomack={release.audiomack_url}
              deezer={release.deezer_url}
            />
          </div>
        )}

        {/* Description & Paroles */}
        <div className="grid md:grid-cols-2 gap-6">
          {release.description && (
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase text-foreground tracking-wider mb-2.5">
                À propos de cette œuvre
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {release.description}
              </p>
            </div>
          )}

          {release.lyrics && (
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase text-foreground tracking-wider mb-2.5">
                Paroles du titre
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-2">
                {release.lyrics}
              </p>
            </div>
          )}
        </div>

        {/* Carte Artiste */}
        {artist && (
          <div className="rounded-2xl bg-card border border-border p-6 hover:border-primary/40 transition-all shadow-sm">
            <div className="flex items-center gap-5">
              {artist.photo_url ? (
                <img
                  src={artist.photo_url}
                  alt={artist.name}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/40 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-border">
                  <User size={28} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  Artiste Vérifié KKD
                </span>
                <h3 className="font-display font-bold text-xl text-foreground truncate mt-0.5">
                  {artist.name}
                </h3>
                {artist.genre && (
                  <p className="text-xs text-muted-foreground mt-0.5">{artist.genre}</p>
                )}
                {artist.biography && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                    {artist.biography}
                  </p>
                )}
              </div>
              <Link
                to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:border-primary text-foreground text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shrink-0"
              >
                Voir le profil
              </Link>
            </div>
          </div>
        )}

        {/* Autres sorties de l'artiste */}
        {otherReleases.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-foreground">
                Plus de titres par {release.artist_name}
              </h2>
              {artist && (
                <Link
                  to={`/artistes/${buildEntitySlug(artist.name, artist.id)}`}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Voir toute la discographie →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {otherReleases.map((r) => (
                <Link
                  key={r.id}
                  to={`/musique/${r.slug || slugify(r.title)}`}
                  className="group block p-3 rounded-2xl bg-card hover:bg-slate-50 border border-border hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2.5 border border-border/50">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {r.release_type?.replace('_', ' ') || 'Single'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Commentaires fans */}
        <div className="pt-4 border-t border-border">
          <CommentsSection entityType="release" entity={release} onUpdate={refresh} />
        </div>
      </div>
    </div>
  );
}