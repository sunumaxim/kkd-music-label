import React from 'react';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { Play, ListEnd, Clock, Lock } from 'lucide-react';
import LikeButton from '@/components/shared/LikeButton';

/**
 * Tracklist style Spotify / Audiomack
 * - Tableau épuré avec en-têtes (#, TITRE, ACTIONS, DURÉE)
 * - Remplacement du numéro de piste par le bouton Play au survol
 * - Animation Equalizer quand la piste est en cours de lecture
 * - Cadenas et verrouillage élégant pour les titres en vente
 */
export default function ReleaseTracklist({ release, hasPurchased = false }) {
  const player = usePlayer();
  const tracks = getReleaseTracks(release, { hasPurchased, includeLocked: true });
  if (!tracks.length) return null;

  return (
    <div className="w-full select-none">
      {/* Table Header style Spotify */}
      <div className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground border-b border-white/[0.06]">
        <span className="text-center">#</span>
        <span>Titre</span>
        <span className="hidden sm:inline-block">Accès & Format</span>
        <span className="w-16 text-right pr-2">
          <Clock size={12} className="inline-block" />
        </span>
      </div>

      {/* Tracks List */}
      <div className="divide-y divide-white/[0.02] mt-1">
        {tracks.map((t, i) => {
          const isCurrent = player.current?.key === t.key;
          const playing = isCurrent && player.isPlaying;

          return (
            <div
              key={t.key}
              onDoubleClick={() => {
                if (isCurrent) player.togglePlay();
                else player.playQueue(tracks, i);
              }}
              className={`grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 px-3 py-2.5 rounded-xl group transition-colors ${
                isCurrent
                  ? 'bg-primary/15 text-primary'
                  : 'hover:bg-white/[0.05] text-white'
              }`}
            >
              {/* Index number or Play icon on hover */}
              <div className="flex items-center justify-center w-9 h-9 shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isCurrent) player.togglePlay();
                    else player.playQueue(tracks, i);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                    t.is_locked
                      ? 'group-hover:bg-amber-500 group-hover:text-black'
                      : 'group-hover:bg-primary group-hover:text-white'
                  }`}
                  aria-label={playing ? 'Pause' : t.is_locked ? 'Titre en vente - Débloquer' : 'Lecture'}
                >
                  {playing ? (
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-primary group-hover:bg-white rounded-full kkd-eq-bar" style={{ height: '50%' }} />
                      <span className="w-0.5 bg-primary group-hover:bg-white rounded-full kkd-eq-bar" style={{ height: '100%', animationDelay: '0.2s' }} />
                      <span className="w-0.5 bg-primary group-hover:bg-white rounded-full kkd-eq-bar" style={{ height: '60%', animationDelay: '0.4s' }} />
                    </div>
                  ) : t.is_locked ? (
                    <>
                      <Lock
                        size={12}
                        className="text-amber-400 group-hover:hidden"
                      />
                      <Lock
                        size={13}
                        className="hidden group-hover:block"
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-mono text-muted-foreground group-hover:hidden">
                        {i + 1}
                      </span>
                      <Play
                        size={14}
                        fill="currentColor"
                        className="hidden group-hover:block ml-0.5 text-white"
                      />
                    </>
                  )}
                </button>
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-primary font-bold' : 'text-white'
                    }`}
                  >
                    {t.title}
                  </p>
                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded sm:hidden ${
                      t.is_for_sale
                        ? t.is_purchased
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                        : 'bg-[#1ed760]/20 text-[#1ed760]'
                    }`}
                  >
                    {t.is_for_sale ? (t.is_purchased ? 'Acheté' : 'Vente') : 'Gratuit'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {t.artist_name || release.artist_name}
                </p>
              </div>

              {/* Access & Format Badge */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                    t.is_for_sale
                      ? t.is_purchased
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-[#1ed760]/15 text-[#1ed760] border-[#1ed760]/25'
                  }`}
                >
                  {t.is_for_sale
                    ? t.is_purchased
                      ? '✓ Acheté'
                      : `En vente (${t.price ? `${t.price} F` : 'Payant'})`
                    : 'Gratuit'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                  HQ
                </span>
              </div>

              {/* Actions & Duration */}
              <div className="flex items-center justify-end gap-2 w-28 shrink-0">
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LikeButton
                    targetType="release"
                    targetId={release.id}
                    title={t.title}
                    artistName={release.artist_name}
                    coverUrl={release.cover_url}
                    size={15}
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    player.addToQueue(t);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                  title="Ajouter à la file d'attente"
                  aria-label="Ajouter à la file d'attente"
                >
                  <ListEnd size={14} />
                </button>

                <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                  {t.duration ? t.duration : '3:30'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}