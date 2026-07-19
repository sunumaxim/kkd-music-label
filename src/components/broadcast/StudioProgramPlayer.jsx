import React, { useState } from 'react';
import { Radio, Play, ChevronLeft, ChevronRight, Music } from 'lucide-react';
import { detectPlatform, EmbeddedPlayer } from '@/components/shared/UniversalPlayer';

function ytId(url) {
  if (!url) return null;
  const info = detectPlatform(url);
  if (info && info.platform === 'youtube' && info.type === 'video') return info.id;
  return null;
}

export default function StudioProgramPlayer({ broadcast, videos = [] }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const isLive = broadcast.status === 'en_direct';
  const bg = broadcast.background_image_url;
  const sceneIds = broadcast.source_video_ids || [];
  const scenes = sceneIds.map(id => videos.find(v => v.id === id)).filter(Boolean);
  const audio = broadcast.audio_playlist || [];

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

  return (
    <div className="space-y-3">
      {/* Lecteur principal */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        {bg && <img src={bg} alt="fond" className="absolute inset-0 w-full h-full object-cover opacity-50 z-0" />}

        {primary?.kind === 'youtube' && (
          <iframe
            src={`https://www.youtube.com/embed/${primary.id}?autoplay=1&rel=0&modestbranding=1`}
            className="absolute inset-0 w-full h-full z-20"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        )}
        {primary?.kind === 'file' && (
          <video src={primary.url} controls autoPlay className="absolute inset-0 w-full h-full object-contain bg-black z-20" />
        )}
        {radioMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white/80 gap-2">
            <Radio size={30} className="text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest">Mode radio / studio</span>
            <span className="text-sm">{audio.length} piste{audio.length > 1 ? 's' : ''} en file</span>
          </div>
        )}
        {!primary && !radioMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 z-20">
            <Play size={32} />
            <span className="text-xs mt-2">Aucune source configurée</span>
          </div>
        )}

        {isLive && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN DIRECT
          </div>
        )}
      </div>

      {/* Navigation des scènes (studio) */}
      {scenes.length > 0 && !isLive && (
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2">
          <button
            onClick={() => setSceneIdx(i => Math.max(0, i - 1))}
            disabled={sceneIdx === 0}
            className="p-1 rounded hover:bg-secondary disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-muted-foreground font-mono flex-1 truncate">
            Scène {sceneIdx + 1} / {scenes.length} — {scenes[sceneIdx]?.title || ''}
          </span>
          <button
            onClick={() => setSceneIdx(i => Math.min(scenes.length - 1, i + 1))}
            disabled={sceneIdx === scenes.length - 1}
            className="p-1 rounded hover:bg-secondary disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Playlist (radio / studio) */}
      {audio.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Music size={12} /> Playlist ({audio.length})
          </p>
          {audio.map((url, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-2">
              {detectPlatform(url) ? (
                <EmbeddedPlayer url={url} />
              ) : (
                <audio controls src={url} className="w-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}