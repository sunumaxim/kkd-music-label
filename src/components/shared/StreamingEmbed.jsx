import React from 'react';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function getSpotifyEmbed(url) {
  if (!url) return null;
  // Convert open.spotify.com/track/xxx to embed URL
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`;
  }
  return null;
}

function getAudiomackEmbed(url) {
  if (!url) return null;
  // Audiomack embed format
  const match = url.match(/audiomack\.com\/([^/]+)\/(song|album|playlist)\/([^/?]+)/);
  if (match) {
    return `https://audiomack.com/embed/${match[2]}/${match[1]}/${match[3]}`;
  }
  return null;
}

function getAppleMusicEmbed(url) {
  if (!url) return null;
  if (url.includes('music.apple.com')) {
    return url.replace('music.apple.com', 'embed.music.apple.com');
  }
  return null;
}

export function YouTubePlayer({ url, className = "" }) {
  const videoId = getYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

export function SpotifyPlayer({ url, className = "" }) {
  const embedUrl = getSpotifyEmbed(url);
  if (!embedUrl) return null;

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  );
}

export function AudiomackPlayer({ url, className = "" }) {
  const embedUrl = getAudiomackEmbed(url);
  if (!embedUrl) return null;

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="252"
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  );
}

export function AppleMusicPlayer({ url, className = "" }) {
  const embedUrl = getAppleMusicEmbed(url);
  if (!embedUrl) return null;

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height="175"
        allow="autoplay *; encrypted-media *; fullscreen *"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        loading="lazy"
        className="rounded-lg"
      />
    </div>
  );
}

export function StreamingLinks({ spotify, youtube, apple_music, audiomack }) {
  const links = [
    { url: spotify, label: 'Spotify', color: 'bg-green-600' },
    { url: youtube, label: 'YouTube', color: 'bg-red-600' },
    { url: apple_music, label: 'Apple Music', color: 'bg-pink-600' },
    { url: audiomack, label: 'Audiomack', color: 'bg-orange-500' },
  ].filter(l => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link.color} text-white text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function YouTubeThumbnail(url) {
  const videoId = getYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}