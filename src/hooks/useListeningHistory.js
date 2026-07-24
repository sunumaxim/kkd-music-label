import { useState, useEffect } from 'react';

/**
 * Historique d'écoute local (localStorage) — "Écoutés récemment".
 * Alimenté par le lecteur audio global dès qu'une piste démarre.
 * Aucune donnée envoyée au serveur : 100 % côté client.
 */

const KEY = 'kkd_listening_history';
const MAX = 24;

export function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function recordPlay(track) {
  if (!track) return;
  const key = track.key || track.item_id || track.audio_url;
  if (!key) return;
  const entry = {
    key,
    title: track.title || 'Titre inconnu',
    artist_name: track.artist_name || '',
    cover_url: track.cover_url || '',
    item_id: track.item_id || '',
    item_type: track.item_type || 'release',
    audio_url: track.audio_url || '',
    played_at: Date.now(),
  };
  const hist = readHistory().filter((h) => h.key !== key);
  hist.unshift(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(hist.slice(0, MAX)));
  } catch {}
  try {
    window.dispatchEvent(new Event('kkd-history-change'));
  } catch {}
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  try {
    window.dispatchEvent(new Event('kkd-history-change'));
  } catch {}
}

export function useListeningHistory() {
  const [history, setHistory] = useState(() => readHistory());

  useEffect(() => {
    const update = () => setHistory(readHistory());
    window.addEventListener('kkd-history-change', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('kkd-history-change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return history;
}