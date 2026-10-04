import React, { useRef, useState, useEffect } from 'react';
import { Music, Play, Pause, X } from 'lucide-react';

export default function SongExcerptPicker({ songs, selectedSong, onSelect, excerptStart, setExcerptStart, excerptDuration, setExcerptDuration }) {
  const audioRef = useRef(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const previewTimer = useRef(null);

  // Réinitialise quand on change de morceau
  useEffect(() => {
    setAudioDuration(0);
    setExcerptStart(0);
    stopPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSong?.key]);

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (a && a.duration && isFinite(a.duration)) setAudioDuration(a.duration);
  };

  const stopPreview = () => {
    const a = audioRef.current;
    if (a) a.pause();
    setPreviewing(false);
    if (previewTimer.current) { clearTimeout(previewTimer.current); previewTimer.current = null; }
  };

  const togglePreview = () => {
    const a = audioRef.current;
    if (!a) return;
    if (previewing) { stopPreview(); return; }
    a.currentTime = excerptStart;
    a.play().catch(() => {});
    setPreviewing(true);
    previewTimer.current = setTimeout(stopPreview, (excerptDuration || 6) * 1000);
  };

  useEffect(() => () => stopPreview(), []);

  const maxStart = Math.max(0, (audioDuration || 0) - (excerptDuration || 6));

  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Music size={12} className="text-primary" /> Lier à une chanson <span className="text-muted-foreground/60 normal-case font-normal">(optionnel)</span>
      </label>

      {selectedSong ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border p-2.5">
            {selectedSong.cover_url && (
              <img src={selectedSong.cover_url} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{selectedSong.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{selectedSong.artist_name}</p>
            </div>
            <button onClick={() => onSelect(null)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Extrait : début + durée + aperçu */}
          <div className="bg-secondary/20 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Extrait audio</span>
            </div>
            {/* Durée de l'extrait */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-10">Durée</span>
              {[4, 6, 8, 12].map((d) => (
                <button
                  key={d}
                  onClick={() => setExcerptDuration(d)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    excerptDuration === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
            {audioDuration > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8">{formatTime(excerptStart)}</span>
                  <input
                    type="range"
                    min={0}
                    max={maxStart}
                    step={0.5}
                    value={Math.min(excerptStart, maxStart)}
                    onChange={(e) => setExcerptStart(Number(e.target.value))}
                    className="flex-1 accent-[var(--brand-primary)]"
                  />
                  <span className="text-[10px] text-muted-foreground w-8">{formatTime(audioDuration)}</span>
                </div>
                <button
                  onClick={togglePreview}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                >
                  {previewing ? <Pause size={12} /> : <Play size={12} />}
                  {previewing ? 'Arrêter' : 'Écouter l\'extrait'}
                </button>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">Chargement de la piste…</p>
            )}
          </div>
        </div>
      ) : songs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground bg-secondary/20 rounded-xl p-3">
          Aucune chanson avec fichier audio KKD n'est encore disponible. Publiez un single gratuit pour l'utiliser ici.
        </p>
      ) : (
        <select
          onChange={(e) => {
            const s = songs.find((x) => x.key === e.target.value);
            if (s) onSelect(s);
          }}
          value=""
          className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">-- Choisir une chanson --</option>
          {songs.map((s) => (
            <option key={s.key} value={s.key}>{s.title} · {s.artist_name}</option>
          ))}
        </select>
      )}

      {/* Élément audio caché pour le chargement des métadonnées et l'aperçu */}
      {selectedSong && (
        <audio
          ref={audioRef}
          src={selectedSong.audio_url}
          onLoadedMetadata={onLoadedMetadata}
          preload="metadata"
          className="hidden"
        />
      )}
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}