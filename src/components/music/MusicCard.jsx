import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { useMyPurchases } from '@/hooks/useMyPurchases';
import { Play, Pause, Music, Lock, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { slugify } from '@/lib/slugify';
import StreamingChips from '@/components/shared/StreamingChips';

/**
 * Carte musicale style Spotify
 * - Design sombre épuré, transitions fluides Spotify-grade
 * - Musique Gratuite : Bouton vert Spotify rond pour écouter librement
 * - Musique En Vente : STRICTEMENT IMPOSSIBLE d'écouter sans achat (Bouton Cadenas / Achat)
 * - Badge Acheté / Badge Gratuit / Badge Prix
 */
export default function MusicCard({ release }) {
  const player = usePlayer();
  const navigate = useNavigate();

  const myPurchases = useMyPurchases();
  const myAccess = myPurchases.find((p) => p.item_id === release.id);
  const hasAccess = !!myAccess?.protected_url;

  const paid = Boolean(release.is_for_sale && Number(release.price) > 0);
  const tracks = getReleaseTracks(release, { hasPurchased: hasAccess });
  const isPlayable = tracks.length > 0;
  const slug = release.slug || slugify(release.title);

  const currentKey = player.current?.key;
  const isCurrent =
    (isPlayable && tracks.some((t) => t.key === currentKey)) ||
    (hasAccess && currentKey === release.id);
  const playing = isCurrent && player.isPlaying;

  const handleAction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Déjà acheté — lecture complète
    if (hasAccess) {
      if (isCurrent) {
        player.togglePlay();
        return;
      }
      player.playTrack({
        key: release.id,
        title: release.title,
        artist_name: release.artist_name,
        cover_url: release.cover_url,
        audio_url: myAccess.protected_url,
        item_type: 'release',
        item_id: release.id,
        is_for_sale: true,
        is_purchased: true,
      });
      return;
    }

    // 2. Musique Gratuite — lecture libre comme sur Spotify
    if (!paid && isPlayable) {
      if (isCurrent) {
        player.togglePlay();
        return;
      }
      player.playQueue(tracks, 0);
      return;
    }

    // 3. Musique En Vente — STRICTEMENT IMPOSSIBLE D'ÉCOUTER SANS ACHAT
    // Déclenche le service de contrôle d'accès et affiche la modale d'achat/verrouillage
    player.playTrack({
      key: release.id,
      id: release.id,
      item_id: release.id,
      item_type: 'release',
      title: release.title,
      artist_name: release.artist_name,
      cover_url: release.cover_url,
      audio_url: release.audio_file_url || (release.tracks && release.tracks[0]?.audio_file_url),
      is_for_sale: true,
      access_mode: 'en_vente',
      is_free: false,
      price: release.price,
    });
  };

  return (
    <Link to={`/musique/${slug}`} className="group block h-full select-none">
      <div className="h-full rounded-2xl overflow-hidden bg-[#121212] hover:bg-[#181818] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.8)] group-hover:-translate-y-1 flex flex-col p-3.5">
        {/* Pochette avec bouton d'action Spotify */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900 shrink-0 shadow-lg">
          {release.cover_url ? (
            <img
              src={release.cover_url}
              alt={release.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Music size={36} className="text-zinc-600" />
            </div>
          )}

          {/* Badges de Statut */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {hasAccess ? (
              <span className="bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Check size={11} strokeWidth={3} /> Acheté
              </span>
            ) : paid ? (
              <span className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Lock size={10} strokeWidth={2.5} /> {Number(release.price).toLocaleString('fr-FR')} F CFA
              </span>
            ) : (
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                <Sparkles size={10} className="text-emerald-400" /> Gratuit
              </span>
            )}
          </div>

          {/* Equalizer vert si en cours de lecture */}
          {playing && (
            <div className="absolute top-2.5 right-2.5 bg-[#1ed760] text-black rounded-full px-2 py-1 flex items-end gap-0.5 h-6 z-10 shadow-md">
              <span className="w-0.5 bg-black rounded-full kkd-eq-bar" style={{ height: '50%' }} />
              <span className="w-0.5 bg-black rounded-full kkd-eq-bar" style={{ height: '90%', animationDelay: '0.2s' }} />
              <span className="w-0.5 bg-black rounded-full kkd-eq-bar" style={{ height: '60%', animationDelay: '0.4s' }} />
            </div>
          )}

          {/* Bouton d'action style Spotify */}
          {paid && !hasAccess ? (
            /* Cas Payant non acheté : Bouton Achat / Cadenas */
            <button
              onClick={handleAction}
              title="Musique en vente — Cliquez pour acheter"
              className="absolute bottom-2.5 right-2.5 h-10 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-2xl transition-all duration-200 z-10 opacity-90 group-hover:opacity-100 group-hover:scale-105 active:scale-95"
            >
              <ShoppingBag size={14} />
              <span>Acheter</span>
            </button>
          ) : (
            /* Cas Gratuit ou Acheté : Bouton vert Spotify rond classique */
            <button
              onClick={handleAction}
              className={`absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl transition-all duration-200 z-10 ${
                playing
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105'
              } hover:brightness-110 active:scale-95`}
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Détails du morceau */}
        <div className="pt-3 px-1 flex flex-col flex-1 justify-between gap-1">
          <div>
            <p
              className={`font-display font-bold text-sm leading-snug truncate transition-colors ${
                isCurrent ? 'text-[#1ed760]' : 'text-white group-hover:text-[#1ed760]'
              }`}
            >
              {release.title}
            </p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {release.artist_name}
              {release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}
            </p>
          </div>

          <div className="mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500">
            <span>{release.release_type === 'album' ? 'Album' : release.release_type === 'ep' ? 'EP' : 'Single'}</span>
            <StreamingChips
              release={release}
              variant={paid && !hasAccess ? 'discreet' : 'default'}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
