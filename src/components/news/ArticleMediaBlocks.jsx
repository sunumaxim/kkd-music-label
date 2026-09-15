import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Music2, Play, Pause, ImageIcon, ChevronLeft, ChevronRight, X, Disc, Film, User, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';

// Extraire l'ID YouTube
function getYouTubeId(url) {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Extraire l'embed Spotify
function getSpotifyEmbed(url) {
  if (!url?.includes('spotify.com')) return null;
  return url.replace('spotify.com/', 'spotify.com/embed/').split('?')[0];
}

// Extraire embed SoundCloud
function isSoundCloud(url) {
  return url?.includes('soundcloud.com');
}

// ── Galerie photos ──
export function PhotoGallery({ images }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;

  return (
    <div className="my-8">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <ImageIcon size={12} /> Galerie photos
      </div>
      {/* Main image */}
      <div
        className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setLightbox(current)}
      >
        <img src={images[current]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setCurrent(i => (i - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
            ><ChevronLeft size={16} /></button>
            <button
              onClick={e => { e.stopPropagation(); setCurrent(i => (i + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
            ><ChevronRight size={16} /></button>
          </>
        )}
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-full">
          {current + 1} / {images.length}
        </span>
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
          ><X size={24} /></button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length); }}
          ><ChevronLeft size={32} /></button>
          <img
            src={images[lightbox]}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length); }}
          ><ChevronRight size={32} /></button>
        </div>
      )}
    </div>
  );
}

// ── Vidéos (YouTube + Fichiers vidéos directs) ──
export function VideoEmbeds({ videos }) {
  if (!videos?.length) return null;
  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">
        <Play size={12} className="text-primary" /> Vidéos de l'article
      </div>
      {videos.map((url, i) => {
        if (!url) return null;
        const ytId = getYouTubeId(url);
        if (ytId) {
          return (
            <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-black border border-border/50 shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={`Vidéo ${i + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          );
        }
        return (
          <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-black border border-border/50 shadow-lg">
            <video
              src={url}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Contenu KKD Music Associé (Artiste, Morceaux & Clips) ──
export function LinkedPlatformContent({ article }) {
  const player = usePlayer();
  const hasArtist = Boolean(article?.linked_artist_name);
  const releases = Array.isArray(article?.linked_releases) ? article.linked_releases : [];
  const videos = Array.isArray(article?.linked_videos) ? article.linked_videos : [];

  if (!hasArtist && releases.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className="my-10 space-y-6 p-6 rounded-2xl bg-card border border-primary/20 shadow-xl">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary font-bold">
        <Disc size={15} /> Sur KKD Music
      </div>

      {/* 1. Artiste associé */}
      {hasArtist && (
        <div className="p-4 rounded-xl bg-background/80 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {article.linked_artist_photo_url ? (
              <img
                src={article.linked_artist_photo_url}
                alt={article.linked_artist_name}
                className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-primary/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User size={22} className="text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">Artiste du sujet</span>
              <p className="font-heading font-bold text-base text-foreground truncate flex items-center gap-1.5">
                {article.linked_artist_name}
                <CheckCircle2 size={14} className="text-primary shrink-0" />
              </p>
              <p className="text-xs text-muted-foreground">Profil certifié sur KKD Music</p>
            </div>
          </div>
          {article.linked_artist_id && (
            <Link
              to={`/artistes/${article.linked_artist_slug || article.linked_artist_id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              Voir le profil <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      {/* 2. Morceaux / Sorties associées */}
      {releases.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Music2 size={13} className="text-primary" /> Musiques & Titres mentionnés ({releases.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {releases.map((rel) => {
              const isCurrentPlaying = player?.currentTrack?.id === rel.id && player?.isPlaying;
              return (
                <div
                  key={rel.id}
                  className="p-3 rounded-xl bg-background/80 border border-border/60 hover:border-primary/40 transition-all flex items-center gap-3 group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/40">
                    {rel.cover_url ? (
                      <img src={rel.cover_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Disc size={20} className="text-primary" />
                      </div>
                    )}
                    {rel.audio_file_url && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isCurrentPlaying) {
                            player?.togglePlay();
                          } else {
                            player?.playTrack({
                              id: rel.id,
                              title: rel.title,
                              artist_name: rel.artist_name,
                              cover_url: rel.cover_url,
                              audio_file_url: rel.audio_file_url,
                              is_for_sale: rel.is_for_sale,
                              price: rel.price,
                            });
                          }
                        }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity"
                        aria-label="Écouter"
                      >
                        {isCurrentPlaying ? (
                          <Pause size={18} className="text-white fill-white" />
                        ) : (
                          <Play size={18} className="text-white fill-white ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/musique/${rel.id}`} className="font-heading font-bold text-sm text-foreground hover:text-primary transition-colors truncate block">
                      {rel.title}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{rel.artist_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {rel.is_for_sale ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Lock size={9} /> {rel.price ? `${rel.price} F CFA` : 'En vente'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/15 text-green-300 border border-green-500/30">
                          Écoute libre
                        </span>
                      )}
                      <Link to={`/musique/${rel.id}`} className="text-[11px] text-primary hover:underline font-semibold ml-auto">
                        Détails
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Clips vidéos associés */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Film size={13} className="text-primary" /> Clips Vidéos mentionnés ({videos.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map((vid) => (
              <Link
                key={vid.id}
                to={`/videos/${vid.id}`}
                className="group p-3 rounded-xl bg-background/80 border border-border/60 hover:border-primary/40 transition-all flex items-center gap-3"
              >
                <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-black/40">
                  {vid.thumbnail_url ? (
                    <img src={vid.thumbnail_url} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Film size={18} className="text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <Play size={16} className="text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {vid.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{vid.artist_name}</p>
                  <span className="text-[10px] text-primary font-bold mt-1 inline-flex items-center gap-1">
                    Regarder le clip <ArrowRight size={10} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Musiques (Spotify / SoundCloud / YouTube Music) ──
export function MusicEmbeds({ musics }) {
  if (!musics?.length) return null;
  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Music2 size={12} /> Écouter
      </div>
      {musics.map((url, i) => {
        const spotifyEmbed = getSpotifyEmbed(url);
        const ytId = getYouTubeId(url);
        const sc = isSoundCloud(url);

        if (spotifyEmbed) {
          return (
            <div key={i} className="rounded-xl overflow-hidden">
              <iframe
                src={spotifyEmbed}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
              />
            </div>
          );
        }
        if (ytId) {
          return (
            <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={`Musique ${i + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          );
        }
        if (sc) {
          return (
            <div key={i} className="rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23e60000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
              />
            </div>
          );
        }
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary text-sm hover:underline min-w-0">
            <Music2 size={14} className="shrink-0" /> <span className="truncate">{url}</span>
          </a>
        );
      })}
    </div>
  );
}

// ── Liens externes ──
export function ExternalLinks({ links }) {
  if (!links?.length) return null;
  return (
    <div className="my-8">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <ExternalLink size={12} /> Liens
      </div>
      <div className="flex flex-wrap gap-3">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-primary/50 hover:text-primary bg-card text-sm font-medium transition-all"
          >
            <ExternalLink size={12} />
            {link.label || link.url}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Tags ──
export function ArticleTags({ tags }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 my-6">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="text-xs font-mono bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors cursor-default"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}