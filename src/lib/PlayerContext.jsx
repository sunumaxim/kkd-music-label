import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { recordPlay } from '@/hooks/useListeningHistory';
import { base44 } from '@/api/base44Client';

const PlayerContext = createContext(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

/**
 * Lecteur audio global style Spotify/Amazon Music.
 * - File d'écoute persistante (survit aux changements de page)
 * - Lecture en arrière-plan / écran éteint via Media Session API
 * - Enchaînement automatique, répétition (off / tout / un), aléatoire
 */
export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [shuffle, setShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);

  const current = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Historique d'écoute local + compteur d'écoutes (plays_count) côté serveur
  useEffect(() => {
    if (current && current.audio_url) {
      recordPlay(current);
      if (current.item_type && current.item_id) {
        base44.functions.invoke('incrementPlay', { item_type: current.item_type, item_id: current.item_id }).catch(() => {});
      }
    }
  }, [current?.key, current?.audio_url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lance la lecture quand la piste courante change
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    setCurrentTime(0);
    setError(null);
    setIsBuffering(true);
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => { setError('Lecture impossible'); setIsBuffering(false); });
  }, [currentIndex, current?.audio_url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
    else a.pause();
  }, [current]);

  const next = useCallback(() => {
    if (!queue.length) return;
    if (shuffle && queue.length > 1) {
      let r = Math.floor(Math.random() * queue.length);
      if (r === currentIndex) r = (r + 1) % queue.length;
      setCurrentIndex(r);
      return;
    }
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
    else if (repeatMode === 'all') setCurrentIndex(0);
    else setIsPlaying(false);
  }, [queue, currentIndex, shuffle, repeatMode]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else if (repeatMode === 'all') setCurrentIndex(queue.length - 1);
  }, [currentIndex, queue.length, repeatMode]);

  const seek = useCallback((t) => {
    const a = audioRef.current;
    if (a) { a.currentTime = t; setCurrentTime(t); }
  }, []);

  const retry = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    setError(null);
    setIsBuffering(true);
    a.load();
    const p = a.play();
    if (p && p.catch) p.catch(() => { setError('Lecture impossible'); setIsBuffering(false); });
  }, [current]);

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const a = audioRef.current;
      if (a) { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); }
      return;
    }
    if (shuffle && queue.length > 1) {
      let r = Math.floor(Math.random() * queue.length);
      if (r === currentIndex) r = (r + 1) % queue.length;
      setCurrentIndex(r);
      return;
    }
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
    else if (repeatMode === 'all') setCurrentIndex(0);
    else setIsPlaying(false);
  }, [repeatMode, shuffle, queue.length, currentIndex]);

  // Media Session API — contrôles écran verrouillé / arrière-plan
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !current) return;
    try {
      if (typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title || '',
          artist: current.artist_name || 'KKD Music',
          album: 'KKD Music',
          artwork: current.cover_url
            ? [{ src: current.cover_url, sizes: '512x512', type: 'image/jpeg' }]
            : [],
        });
      }
      navigator.mediaSession.setActionHandler('play', () => { const a = audioRef.current; if (a) a.play().catch(() => {}); });
      navigator.mediaSession.setActionHandler('pause', () => { const a = audioRef.current; if (a) a.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
      try { navigator.mediaSession.setActionHandler('seekto', (d) => { if (d && d.seekTime != null) seek(d.seekTime); }); } catch {}
    } catch {}
  }, [current, prev, next, seek]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'; } catch {}
    }
  }, [isPlaying]);

  const playTrack = useCallback((track) => {
    setQueue([track]);
    setCurrentIndex(0);
  }, []);

  const playQueue = useCallback((tracks, startIndex = 0) => {
    if (!tracks || !tracks.length) return;
    setQueue(tracks);
    setCurrentIndex(Math.max(0, Math.min(startIndex, tracks.length - 1)));
  }, []);

  const playAt = useCallback((index) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
  }, [queue.length]);

  const removeFromQueue = useCallback((index) => {
    setQueue((q) => {
      const next = q.filter((_, i) => i !== index);
      setCurrentIndex((ci) => {
        if (index < ci) return ci - 1;
        if (index === ci) return Math.min(ci, next.length - 1);
        return ci;
      });
      return next;
    });
  }, []);

  // Ajoute une ou plusieurs pistes à la fin de la file (sans interrompre la lecture)
  const addToQueue = useCallback((tracks) => {
    const arr = Array.isArray(tracks) ? tracks : [tracks];
    if (!arr.length) return;
    setQueue((q) => {
      const wasEmpty = q.length === 0;
      const nextQ = [...q, ...arr];
      if (wasEmpty) setCurrentIndex(0);
      return nextQ;
    });
  }, []);

  // Insère une ou plusieurs pistes juste après la piste en cours (lecture « à suivre »)
  const playNext = useCallback((tracks) => {
    const arr = Array.isArray(tracks) ? tracks : [tracks];
    if (!arr.length) return;
    setQueue((q) => {
      if (!q.length) { setCurrentIndex(0); return [...arr]; }
      const insertAt = currentIndex + 1;
      return [...q.slice(0, insertAt), ...arr, ...q.slice(insertAt)];
    });
  }, [currentIndex]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) a.pause();
    setQueue([]); setCurrentIndex(-1); setIsPlaying(false); setCurrentTime(0); setDuration(0);
  }, []);

  const value = {
    queue, currentIndex, current, isPlaying, isBuffering, error, currentTime, duration, volume, playbackRate, repeatMode, shuffle,
    playTrack, playQueue, playAt, addToQueue, playNext, removeFromQueue, togglePlay, next, prev, seek, retry, setVolume, setPlaybackRate, setRepeatMode, setShuffle, stop,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={current?.audio_url || ''}
        preload="auto"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onStalled={() => setIsBuffering(true)}
        onError={() => { setError('Lecture impossible'); setIsBuffering(false); setIsPlaying(false); }}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
}