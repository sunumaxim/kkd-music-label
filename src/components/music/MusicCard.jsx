import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/lib/PlayerContext';
import { getReleaseTracks } from '@/lib/releaseTracks';
import { useMyPurchases } from '@/hooks/useMyPurchases';
import { Play, Pause, Music, ShoppingBag, Loader2 } from 'lucide-react';
import { slugify } from '@/lib/slugify';
import StreamingChips from '@/components/shared/StreamingChips';
import { fetchProtectedPreview } from '@/lib/previewAudio';

/**
 * Carte musicale style Spotify (sombre, pochette dessus, pastilles plateformes au bas).
 * - Gratuit : bouton play → lecteur global KKD
 * - Payant non acheté : bouton play → extrait 25-30s sur la carte → bouton "Acheter"
 * - Payant acheté (validé admin) : bouton play → lecture complète via URL signée
 * - Pastilles plateformes : colorées sur les cartes gratuites, discrètes sur les payantes
 */
export default function MusicCard({ release }) {
  const player = usePlayer();
  const navigate = useNavigate();
  const tracks = getReleaseTracks(release);
  const freePlayable = tracks.length > 0;
  const paid = release.is_for_sale && Number(release.price) > 0;
  const slug = release.slug || slugify(release.title);

  const myPurchases = useMyPurchases();
  const myAccess = myPurchases.find((p) => p.item_id === release.id);
  const hasAccess = !!myAccess?.protected_url;

  const currentKey = player.current?.key;
  const isCurrent =
    (freePlayable && tracks.some((t) => t.key === currentKey)) ||
    (hasAccess && currentKey === release.id);
  const playing = isCurrent && player.isPlaying;

  // --- État de l'extrait sur carte ---
  const [previewState, setPreviewState] = useState('idle'); // idle | loading | playing | paused | done
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const audioRef = useRef(null);

  const previewDuration = release.preview_duration || 30;
  const previewStart = release.preview_start || 0;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Déjà acheté — lecture complète
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
      });
      return;
    }

    // Gratuit — lecteur global
    if (freePlayable) {
      if (isCurrent) {
        player.togglePlay();
        return;
      }
      player.playQueue(tracks, 0);
      return;
    }

    // Payant non acheté — extrait sur carte
    if (previewState === 'playing') {
      audioRef.current?.pause();
      setPreviewState('paused');
      return;
    }
    if (previewState === 'paused' && previewUrl) {
      audioRef.current?.play().catch(() => {});
      setPreviewState('playing');
      return;
    }

    // Démarrer l'extrait — via fonction backend sécurisée (jamais d'URL signée exposée)
    if (!release.protected_file_uri) {
      setPreviewState('idle');
      return;
    }

    setPreviewState('loading');
    try {
      let url = previewUrl;
      if (!url) {
        url = await fetchProtectedPreview({
          itemType: 'release',
          itemId: release.id,
          previewStart,
          previewDuration,
        });
        if (!url) { setPreviewState('idle'); return; }
        setPreviewUrl(url);
      }
      const a = audioRef.current;
      if (!a || !url) return;
      a.src = url;
      a.currentTime = previewStart;
      a.play().catch(() => {});
      setPreviewState('playing');
    } catch {
      setPreviewState('idle');
    }
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime >= previewStart + previewDuration) {
      a.pause();
      setPreviewState('done');
      setPreviewProgress(100);
      return;
    }
    if (a.currentTime >= previewStart) {
      setPreviewProgress(
        Math.min(100, ((a.currentTime - previewStart) / previewDuration) * 100)
      );
    }
  };

  const showBuyButton = previewState === 'done';
  const showPreviewBar =
    previewState === 'playing' || previewState === 'paused' || previewState === 'done';
  const isPreviewing = previewState === 'playing' || previewState === 'paused';

  return (
    <Link to={`/musique/${slug}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-[#231C18] border border-[#3A302A] transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
        {/* Pochette */}
        <div className="relative aspect-square overflow-hidden">
          {release.cover_url ? (
            <img
              src={release.cover_url}
              alt={release.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(228,98,43,0.13), #231C18)' }}
            >
              <Music size={32} className="text-[#A6998C]/30" />
            </div>
          )}

          {/* Badge prix */}
          {paid && (
            <span className="absolute top-2 left-2 bg-[#D9A441] text-[#0E0C0B] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full z-10">
              {Number(release.price).toLocaleString('fr-FR')} F
            </span>
          )}

          {/* Indicateur lecture en cours */}
          {playing && (
            <div className="absolute top-2 right-2 bg-[#E4622B] text-[#0E0C0B] rounded-full px-2 py-1.5 flex items-end gap-0.5 h-7 z-10">
              <span className="w-0.5 bg-[#0E0C0B] rounded-full kkd-eq-bar" style={{ height: '50%' }} />
              <span className="w-0.5 bg-[#0E0C0B] rounded-full kkd-eq-bar" style={{ height: '80%', animationDelay: '0.2s' }} />
              <span className="w-0.5 bg-[#0E0C0B] rounded-full kkd-eq-bar" style={{ height: '60%', animationDelay: '0.4s' }} />
            </div>
          )}

          {/* Barre de progression de l'extrait */}
          {showPreviewBar && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-10">
              <div
                className="h-full bg-[#E4622B] transition-all duration-150"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
          )}

          {/* Bouton lecture */}
          {!showBuyButton && (
            <button
              onClick={handlePlay}
              className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#E4622B] text-[#0E0C0B] flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 z-10"
              aria-label={playing || isPreviewing ? 'Pause' : 'Lecture'}
            >
              {previewState === 'loading' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : playing || previewState === 'playing' ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          )}

          {/* Bouton Acheter (après extrait) */}
          {showBuyButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/musique/${slug}`);
              }}
              className="absolute inset-x-2 bottom-2 h-10 rounded-full bg-[#E4622B] text-[#0E0C0B] flex items-center justify-center gap-1.5 shadow-xl text-xs font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all z-10"
            >
              <ShoppingBag size={14} /> Acheter
            </button>
          )}
        </div>

        {/* Corps */}
        <div className="p-3">
          <p
            className={`font-heading font-bold text-sm truncate ${
              isCurrent ? 'text-[#E4622B]' : 'text-white'
            }`}
          >
            {release.title}
          </p>
          <p className="text-xs text-[#A6998C] truncate">
            {release.artist_name}
            {release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}
          </p>
          <StreamingChips
            release={release}
            variant={paid && !hasAccess ? 'discreet' : 'default'}
          />
        </div>
      </div>

      {/* Audio caché pour l'extrait */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          setPreviewState('done');
          setPreviewProgress(100);
        }}
        preload="metadata"
        className="hidden"
      />
    </Link>
  );
}