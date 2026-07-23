import React, { useState } from 'react';
import { ExternalLink, Music2, Play, ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

// ── Vidéos YouTube ──
export function VideoEmbeds({ videos }) {
  if (!videos?.length) return null;
  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Play size={12} /> Vidéos
      </div>
      {videos.map((url, i) => {
        const ytId = getYouTubeId(url);
        if (!ytId) return null;
        return (
          <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={`Vidéo ${i + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      })}
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