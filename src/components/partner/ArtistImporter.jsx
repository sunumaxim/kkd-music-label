import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Music, Youtube, Upload, CheckCircle, AlertCircle,
  Loader2, Disc, X, Info, Eye
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtistImporter({ artist, onClose }) {
  const queryClient = useQueryClient();
  const [spotifyUrl, setSpotifyUrl] = useState(artist?.spotify_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(artist?.youtube_url || '');

  const [spotifyPreview, setSpotifyPreview] = useState(null); // { mb_artist, releases }
  const [ytPreview, setYtPreview] = useState(null);           // { channelId, channelName, videos }

  const [loadingSpotifyPreview, setLoadingSpotifyPreview] = useState(false);
  const [loadingSpotifyImport, setLoadingSpotifyImport] = useState(false);
  const [loadingYtPreview, setLoadingYtPreview] = useState(false);
  const [loadingYtImport, setLoadingYtImport] = useState(false);

  const [spotifyDone, setSpotifyDone] = useState(null);
  const [ytDone, setYtDone] = useState(null);
  const [error, setError] = useState('');

  const artistName = artist?.name || '';

  // ── SPOTIFY PREVIEW ──
  const previewSpotify = async () => {
    if (!spotifyUrl) return;
    setLoadingSpotifyPreview(true);
    setError('');
    setSpotifyPreview(null);
    setSpotifyDone(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'preview_spotify',
      spotify_url: spotifyUrl,
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingSpotifyPreview(false);
    if (res.data?.error) setError(res.data.error);
    else setSpotifyPreview(res.data);
  };

  // ── SPOTIFY IMPORT ──
  const confirmSpotifyImport = async () => {
    setLoadingSpotifyImport(true);
    setError('');
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_spotify',
      spotify_url: spotifyUrl,
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingSpotifyImport(false);
    if (res.data?.error) setError(res.data.error);
    else {
      setSpotifyDone(res.data);
      setSpotifyPreview(null);
      queryClient.invalidateQueries({ queryKey: ['artist-releases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
    }
  };

  // ── YOUTUBE PREVIEW ──
  const previewYouTube = async () => {
    if (!youtubeUrl) return;
    setLoadingYtPreview(true);
    setError('');
    setYtPreview(null);
    setYtDone(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'preview_youtube',
      youtube_url: youtubeUrl,
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingYtPreview(false);
    if (res.data?.error) setError(res.data.error);
    else setYtPreview(res.data);
  };

  // ── YOUTUBE IMPORT ──
  const confirmYtImport = async () => {
    setLoadingYtImport(true);
    setError('');
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_youtube',
      youtube_url: youtubeUrl,
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingYtImport(false);
    if (res.data?.error) setError(res.data.error);
    else {
      setYtDone(res.data);
      setYtPreview(null);
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

      {/* ── SPOTIFY ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Music size={14} className="text-green-400" />
          </div>
          <Label className="font-heading font-bold">Discographie (Spotify)</Label>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Copiez le lien du profil Spotify de l'artiste. Un aperçu s'affichera pour confirmer que c'est le bon artiste avant l'import.</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={spotifyUrl}
            onChange={e => { setSpotifyUrl(e.target.value); setSpotifyPreview(null); setSpotifyDone(null); }}
            placeholder="https://open.spotify.com/artist/..."
            className="flex-1 text-sm"
          />
          <Button
            onClick={previewSpotify}
            disabled={!spotifyUrl || loadingSpotifyPreview}
            variant="outline"
            className="gap-1.5 shrink-0 border-green-500/40 text-green-400 hover:bg-green-500/10"
          >
            {loadingSpotifyPreview ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Aperçu
          </Button>
        </div>

        {/* Preview */}
        {spotifyPreview && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-400">Artiste trouvé : <span className="text-foreground">{spotifyPreview.mb_artist?.name}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{spotifyPreview.releases?.length} sorties trouvées</p>
              </div>
              <Button
                onClick={confirmSpotifyImport}
                disabled={loadingSpotifyImport}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                size="sm"
              >
                {loadingSpotifyImport ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {loadingSpotifyImport ? 'Import...' : 'Confirmer l\'import'}
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
              {spotifyPreview.releases?.slice(0, 20).map((r, i) => (
                <div key={i} className="text-center">
                  <div className="aspect-square rounded-lg bg-secondary/80 flex items-center justify-center mb-1">
                    <Disc size={16} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-[10px] font-medium truncate leading-tight">{r.title}</p>
                  <p className="text-[9px] text-muted-foreground capitalize">{r.release_type} {r.release_date?.slice(0, 4)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {spotifyDone && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle size={16} className="text-green-400" />
            <p className="text-sm font-bold text-green-400">
              {spotifyDone.created} sortie{spotifyDone.created !== 1 ? 's' : ''} importée{spotifyDone.created !== 1 ? 's' : ''}
              {spotifyDone.skipped > 0 && <span className="font-normal text-muted-foreground"> · {spotifyDone.skipped} déjà présente{spotifyDone.skipped > 1 ? 's' : ''}</span>}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* ── YOUTUBE ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Youtube size={14} className="text-red-400" />
          </div>
          <Label className="font-heading font-bold">Vidéos (YouTube)</Label>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Collez l'URL exacte de la chaîne YouTube de l'artiste. Un aperçu s'affichera pour confirmer que c'est bien la bonne chaîne.</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={youtubeUrl}
            onChange={e => { setYoutubeUrl(e.target.value); setYtPreview(null); setYtDone(null); }}
            placeholder="https://www.youtube.com/@NomDeLaChaine"
            className="flex-1 text-sm"
          />
          <Button
            onClick={previewYouTube}
            disabled={!youtubeUrl || loadingYtPreview}
            variant="outline"
            className="gap-1.5 shrink-0 border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            {loadingYtPreview ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Aperçu
          </Button>
        </div>

        {/* Preview */}
        {ytPreview && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-400">Chaîne : <span className="text-foreground">{ytPreview.channelName}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{ytPreview.videos?.length} vidéos trouvées</p>
              </div>
              <Button
                onClick={confirmYtImport}
                disabled={loadingYtImport}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                size="sm"
              >
                {loadingYtImport ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {loadingYtImport ? 'Import...' : 'Confirmer l\'import'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {ytPreview.videos?.slice(0, 10).map((v, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg overflow-hidden bg-secondary/50 p-1 pr-2">
                  <img src={v.thumbnail_url} alt={v.title} className="w-14 h-10 rounded object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium line-clamp-2 leading-tight">{v.title}</p>
                    <p className="text-[9px] text-muted-foreground capitalize mt-0.5">{v.video_type?.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {ytDone && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <CheckCircle size={16} className="text-red-400" />
            <p className="text-sm font-bold text-red-400">
              {ytDone.created} vidéo{ytDone.created !== 1 ? 's' : ''} importée{ytDone.created !== 1 ? 's' : ''}
              {ytDone.skipped > 0 && <span className="font-normal text-muted-foreground"> · {ytDone.skipped} déjà présente{ytDone.skipped > 1 ? 's' : ''}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}