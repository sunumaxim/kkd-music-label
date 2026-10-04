// Extrait la liste des morceaux jouables (avec fichier audio KKD public) depuis les releases.
// Chaque morceau inclut l'URL audio publique utilisable pour la lecture d'extrait côté frontend.
export function extractPlayableSongs(releases) {
  const songs = [];
  (releases || []).forEach((r) => {
    if (r.audio_file_url) {
      songs.push({
        key: r.id,
        release_id: r.id,
        title: r.title,
        artist_name: r.artist_name || 'Artiste inconnu',
        cover_url: r.cover_url || '',
        audio_url: r.audio_file_url,
      });
    }
    if (Array.isArray(r.tracks)) {
      r.tracks.forEach((t, i) => {
        if (t.audio_file_url) {
          songs.push({
            key: `${r.id}-${i}`,
            release_id: r.id,
            title: t.title || `${r.title} (piste ${i + 1})`,
            artist_name: r.artist_name || 'Artiste inconnu',
            cover_url: r.cover_url || '',
            audio_url: t.audio_file_url,
          });
        }
      });
    }
  });
  return songs;
}