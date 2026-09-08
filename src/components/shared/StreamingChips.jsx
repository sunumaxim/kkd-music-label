import React from 'react';

/**
 * StreamingChips — pastilles rondes colorées par plateforme de streaming.
 * @param {object} release — l'entité Release (ou Video) avec les URLs des plateformes
 * @param {'default'|'discreet'} variant — 'default' = pastilles colorées pleine taille ;
 *        'discreet' = pastilles plus petites et monochromes (pour le contenu payant)
 */
export default function StreamingChips({ release, variant = 'default' }) {
  const available = PLATFORMS.filter((p) => release[p.key]);
  if (available.length === 0) return null;

  const discreet = variant === 'discreet';
  const iconSize = discreet ? 10 : 12;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {available.map((p) => (
        <a
          key={p.key}
          href={release[p.key]}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Écouter sur ${p.label}`}
          className={`flex items-center justify-center rounded-full transition-all hover:scale-110 ${
            discreet
              ? 'w-5 h-5 bg-[#3A302A] text-[#A6998C] hover:text-white hover:bg-[#E4622B]'
              : 'w-6 h-6 text-white hover:opacity-80'
          }`}
          style={!discreet ? { background: p.color } : {}}
        >
          {p.icon(iconSize)}
        </a>
      ))}
    </div>
  );
}

const PLATFORMS = [
  {
    key: 'spotify_url',
    label: 'Spotify',
    color: '#1DB954',
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.5 14.4a.6.6 0 01-.8.2c-2.3-1.4-5.2-1.7-8.6-.9a.6.6 0 11-.3-1.2c3.7-.8 6.9-.5 9.5 1a.6.6 0 01.2.9zm1.2-2.6a.8.8 0 01-1.1.3c-2.6-1.6-6.6-2-9.7-1.1a.8.8 0 01-.4-1.5c3.5-1 7.9-.6 10.9 1.2.4.2.5.7.3 1.1zm.1-2.8c-3.1-1.9-8.3-2-11.3-1.1a.9.9 0 11-.5-1.8c3.4-1 9.2-.9 12.8 1.3a.9.9 0 11-1 1.6z" />
      </svg>
    ),
  },
  {
    key: 'youtube_url',
    label: 'YouTube',
    color: '#FF0000',
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 7.5a3 3 0 00-2.1-2.1C19 4.8 12 4.8 12 4.8s-7 0-8.9.6A3 3 0 001 7.5 31 31 0 00.5 12 31 31 0 001 16.5a3 3 0 002.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 002.1-2.1A31 31 0 0023.5 12 31 31 0 0023 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
      </svg>
    ),
  },
  {
    key: 'apple_music_url',
    label: 'Apple Music',
    color: '#FA243C',
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.5 3v12.8a2.2 2.2 0 11-1.5-2.1V4.2l-2.5.4v13.2a2.2 2.2 0 11-1.5-2.1V3l5.5-1z" />
      </svg>
    ),
  },
  {
    key: 'audiomack_url',
    label: 'Audiomack',
    color: '#FFA200',
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 20l3-12 3 6 3-9 3 9 3-6 3 12H2z" />
      </svg>
    ),
  },
  {
    key: 'deezer_url',
    label: 'Deezer',
    color: '#A238FF',
    icon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="14" width="3" height="3" rx="0.5" />
        <rect x="8" y="14" width="3" height="3" rx="0.5" />
        <rect x="13" y="14" width="3" height="3" rx="0.5" />
        <rect x="18" y="14" width="3" height="3" rx="0.5" />
        <rect x="8" y="10" width="3" height="3" rx="0.5" />
        <rect x="13" y="10" width="3" height="3" rx="0.5" />
        <rect x="18" y="10" width="3" height="3" rx="0.5" />
        <rect x="13" y="6" width="3" height="3" rx="0.5" />
        <rect x="18" y="6" width="3" height="3" rx="0.5" />
      </svg>
    ),
  },
];