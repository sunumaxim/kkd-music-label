import React, { useState, useEffect, useRef } from 'react';
import { Radio, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { detectPlatform, EmbeddedPlayer } from '@/components/shared/UniversalPlayer';

function ytId(url) {
  if (!url) return null;
  const info = detectPlatform(url);
  if (info && info.platform === 'youtube' && info.type === 'video') return info.id;
  return null;
}

export default function StudioProgramPlayer({ broadcast, videos = [] }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const audioRef = useRef(null);

  const isLive = broadcast.status === 'en_direct';
  const isFinished = broadcast.status === 'termine';
  const bg = broadcast.background_image_url;
  const sceneIds = broadcast.source_video_ids || [];
  const scenes = sceneIds.map(id => videos.find(v => v.id === id)).filter(Boolean);
  const audio = broadcast.audio_playlist || [];

  const currentTrack = audio[trackIdx];
  const trackEmbedded = currentTrack ? detectPlatform(currentTrack) : null;

  // Source vidéo principale
  let primary = null;
  if (isLive && broadcast.stream_url) {
    const id = ytId(broadcast.stream_url);
    if (id) primary = { kind: 'youtube', id };
  } else if (scenes.length > 0) {
    const cur = scenes[Math.min(sceneIdx, scenes.length - 1)];
    const id = ytId(cur?.youtube_url);
    if (id) primary = { kind: 'youtube', id };
    else if (cur?.video_file_url) primary = { kind: 'file', url: cur.video_file_url };
  } else if (broadcast.source_video_url) {
    primary = { kind: 'file', url: broadcast.source_video_url };
  }

  const radioMode = !primary && audio.length > 0;

  // Avancement automatique du fil (sauf si le live est terminé)
  const advanceTrack = () => {
    if (isFinished) return;
    setTrackIdx(i => (i + 1 < audio.length ? i + 1 : i));
  };
  const advanceScene = () => {
    if (isFinished) return;
    setSceneIdx(i => (i + 1 < scenes.length ? i + 1 : i));
  };

  // Respect de la politique autoplay : démarrage sur interaction
  useEffect(() => {
    if (started && audioRef.current && !trackEmbedded) {
      audioRef.current.play().catch(() => {});
    }
  }, [started, trackIdx, trackEmbedded]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        {bg && <img src={bg} alt="fond" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" />}

        {primary?.kind === 'youtube' && (
          <iframe
            src={`https://www.youtube.com/embed/${primary.id}?autoplay=1&rel=0&modestbranding=1`}
            className="absolute inset-0 w-full h-full z-20"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        )}
        {primary?.kind === 'file' && (
          <video
            src={primary.url}
            controls
            autoPlay
            onEnded={advanceScene}
            className="absolute inset-0 w-full h-full object-contain bg-black z-20"
          />
        )}

        {/* Mode radio / studio : image + chanson associées = vidéo du direct */}
        {radioMode && (
          <>
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/80 gap-2 pointer-events-none">
              <Radio size={30} className="text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest">Mode radio / studio</span>
              {currentTrack && (
                <span className="text-sm font-heading">Piste {trackIdx + 1} / {audio.length}</span>
              )}
            </div>

            {/* Piste courante (lien plateforme embarqué) */}
            {currentTrack && trackEmbedded && !isFinished && (
              <div className="absolute bottom-0 left-0 right-0 z-20 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <EmbeddedPlayer url={currentTrack} />
              </div>
            )}

            {/* Piste courante (fichier audio — avance automatique) */}
            {currentTrack && !trackEmbedded && !isFinished && (
              <audio
                key={trackIdx}
                ref={audioRef}
                src={currentTrack}
                autoPlay={started}
                onEnded={advanceTrack}
                controls
                className="absolute bottom-2 left-2 right-2 z-20 w-[calc(100%-1rem)] h-9"
              />
            )}

            {/* Bouton de démarrage (politique autoplay du navigateur) */}
            {!started && !isFinished && !trackEmbedded && (
              <button
                onClick={() => setStarted(true)}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
              >
                <span className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full font-medium text-sm">
                  <Play size={18} fill="currentColor" /> Lancer la diffusion
                </span>
              </button>
            )}
          </>
        )}

        {!primary && !radioMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 z-20">
            <Play size={32} />
            <span className="text-xs mt-2">Aucune source configurée</span>
          </div>
        )}

        {isLive && (
          <div className="absolute top-3 left-3 z-40 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN DIRECT
          </div>
        )}
        {isFinished && (
          <div className="absolute top-3 left-3 z-40 bg-black/70 text-white/80 text-[11px] font-mono px-3 py-1 rounded-full">
            DIFFUSION TERMINÉE
          </div>
        )}
      </div>

      {/* Navigation des scènes (studio) — fallback pour les embeds YouTube sans détection de fin */}
      {scenes.length > 0 && !isLive && (
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2">
          <button onClick={() => setSceneIdx(i => Math.max(0, i - 1))} disabled={sceneIdx === 0} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-muted-foreground font-mono flex-1 truncate">
            Scène {sceneIdx + 1} / {scenes.length} — {scenes[sceneIdx]?.title || ''}
          </span>
          <button onClick={() => setSceneIdx(i => Math.min(scenes.length - 1, i + 1))} disabled={sceneIdx === scenes.length - 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}