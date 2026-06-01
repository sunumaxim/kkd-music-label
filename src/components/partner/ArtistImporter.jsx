import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Music, Youtube, Upload, CheckCircle, AlertCircle,
  Loader2, RefreshCw, Disc, Video, ExternalLink, X
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtistImporter({ artist, onClose }) {
  const queryClient = useQueryClient();
  const [spotifyUrl, setSpotifyUrl] = useState(artist?.spotify_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(artist?.youtube_url || '');
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [loadingYT, setLoadingYT] = useState(false);
  const [spotifyResult, setSpotifyResult] = useState(null);
  const [ytResult, setYtResult] = useState(null);
  const [error, setError] = useState('');

  const importSpotify = async () => {
    if (!spotifyUrl) return;
    setLoadingSpotify(true);
    setError('');
    setSpotifyResult(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_spotify',
      spotify_url: spotifyUrl,
      artist_id: artist?.id,
      artist_name: artist?.name,
    });
    setLoadingSpotify(false);
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setSpotifyResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['artist-releases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
    }
  };

  const importYouTube = async () => {
    if (!youtubeUrl) return;
    setLoadingYT(true);
    setError('');
    setYtResult(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_youtube',
      youtube_url: youtubeUrl,
      artist_id: artist?.id,
      artist_name: artist?.name,
    });
    setLoadingYT(false);
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setYtResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['artist-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-extrabold text-lg">Importer le contenu</h3>
          {artist && <p className="text-xs text-muted-foreground mt-0.5">{artist.name}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* SPOTIFY */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Music size={14} className="text-green-400" />
          </div>
          <Label className="font-heading font-bold">Importer depuis Spotify</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Collez le lien du profil artiste Spotify pour importer automatiquement toutes ses sorties (singles, albums, EPs).
        </p>
        <div className="flex gap-2">
          <Input
            value={spotifyUrl}
            onChange={e => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/artist/..."
            className="flex-1 text-sm"
          />
          <Button
            onClick={importSpotify}
            disabled={!spotifyUrl || loadingSpotify}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 shrink-0"
          >
            {loadingSpotify ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {loadingSpotify ? 'Import…' : 'Importer'}
          </Button>
        </div>

        {spotifyResult && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-sm font-bold text-green-400">
                {spotifyResult.created} nouvelle{spotifyResult.created > 1 ? 's' : ''} sortie{spotifyResult.created > 1 ? 's' : ''} importée{spotifyResult.created > 1 ? 's' : ''}
                {spotifyResult.skipped > 0 && ` (${spotifyResult.skipped} déjà présente${spotifyResult.skipped > 1 ? 's' : ''})`}
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {spotifyResult.releases?.slice(0, 20).map((r, i) => (
                <div key={i} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-1">
                    {r.cover_url
                      ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Disc size={14} className="text-muted-foreground/30" /></div>
                    }
                  </div>
                  <p className="text-[10px] font-medium truncate">{r.title}</p>
                  <p className="text-[9px] text-muted-foreground capitalize">{r.release_type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* YOUTUBE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Youtube size={14} className="text-red-400" />
          </div>
          <Label className="font-heading font-bold">Importer depuis YouTube</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Collez le lien de la chaîne YouTube pour importer toutes les vidéos (clips, teasers, interviews…).
        </p>
        <div className="flex gap-2">
          <Input
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/@NomDeLaChaine"
            className="flex-1 text-sm"
          />
          <Button
            onClick={importYouTube}
            disabled={!youtubeUrl || loadingYT}
            className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0"
          >
            {loadingYT ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {loadingYT ? 'Import…' : 'Importer'}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          Formats acceptés : youtube.com/@handle · youtube.com/channel/UCxxx · youtube.com/c/nom
        </p>

        {ytResult && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-red-400" />
              <p className="text-sm font-bold text-red-400">
                {ytResult.created} nouvelle{ytResult.created > 1 ? 's' : ''} vidéo{ytResult.created > 1 ? 's' : ''} importée{ytResult.created > 1 ? 's' : ''}
                {ytResult.skipped > 0 && ` (${ytResult.skipped} déjà présente${ytResult.skipped > 1 ? 's' : ''})`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {ytResult.videos?.slice(0, 10).map((v, i) => (
                <a key={i} href={v.youtube_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-colors p-1 pr-2">
                  <img src={v.thumbnail_url} alt={v.title}
                    className="w-16 h-11 rounded-md object-cover shrink-0" />
                  <p className="text-[10px] font-medium line-clamp-2 leading-tight">{v.title}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}