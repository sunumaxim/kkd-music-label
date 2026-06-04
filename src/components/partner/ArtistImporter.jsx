import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Music, Youtube, Upload, CheckCircle, AlertCircle,
  Loader2, Disc, X, Info, BookOpen, Globe
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtistImporter({ artist, onClose }) {
  const queryClient = useQueryClient();
  const [spotifyUrl, setSpotifyUrl] = useState(artist?.spotify_url || '');
  const [youtubeUrl, setYoutubeUrl] = useState(artist?.youtube_url || '');
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [loadingYT, setLoadingYT] = useState(false);
  const [loadingWiki, setLoadingWiki] = useState(false);
  const [spotifyResult, setSpotifyResult] = useState(null);
  const [ytResult, setYtResult] = useState(null);
  const [wikiResult, setWikiResult] = useState(null);
  const [error, setError] = useState('');

  const artistName = artist?.name || '';

  const importSpotify = async () => {
    if (!spotifyUrl) return;
    setLoadingSpotify(true);
    setError('');
    setSpotifyResult(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_spotify',
      spotify_url: spotifyUrl,
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingSpotify(false);
    if (res.data?.error) setError(res.data.error);
    else {
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
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingYT(false);
    if (res.data?.error) setError(res.data.error);
    else {
      setYtResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['artist-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    }
  };

  const importWikipedia = async () => {
    setLoadingWiki(true);
    setError('');
    setWikiResult(null);
    const res = await base44.functions.invoke('importArtistContent', {
      action: 'import_wikipedia',
      artist_name: artistName,
      artist_id: artist?.id,
    });
    setLoadingWiki(false);
    if (res.data?.error) setError(res.data.error);
    else {
      setWikiResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
      queryClient.invalidateQueries({ queryKey: ['artist', artist?.id] });
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

      {/* WIKIPEDIA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen size={14} className="text-blue-400" />
          </div>
          <Label className="font-heading font-bold">Biographie & Infos (Wikipedia)</Label>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Importe automatiquement la biographie, le lieu de naissance, la date de naissance et le lien Wikipedia depuis l'encyclopédie libre.</span>
        </div>
        <Button
          onClick={importWikipedia}
          disabled={loadingWiki || !artistName}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full"
        >
          {loadingWiki ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          {loadingWiki ? 'Recherche Wikipedia…' : `Importer la bio de "${artistName}"`}
        </Button>
        {wikiResult && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-blue-400" />
              <p className="text-sm font-bold text-blue-400">Biographie importée !</p>
            </div>
            {wikiResult.wikipedia_url && (
              <a href={wikiResult.wikipedia_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
                <Globe size={11} /> {wikiResult.wikipedia_url}
              </a>
            )}
            {wikiResult.biography && (
              <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">{wikiResult.biography}</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* SPOTIFY / MusicBrainz */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Music size={14} className="text-green-400" />
          </div>
          <Label className="font-heading font-bold">Discographie (Spotify / MusicBrainz)</Label>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>Collez le lien du profil Spotify de l'artiste. La discographie sera importée via MusicBrainz et classée par type (single, album, EP).</span>
        </div>
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
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-sm font-bold text-green-400">
                {spotifyResult.created} sortie{spotifyResult.created !== 1 ? 's' : ''} importée{spotifyResult.created !== 1 ? 's' : ''}
                {spotifyResult.skipped > 0 && ` · ${spotifyResult.skipped} déjà présente${spotifyResult.skipped > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {spotifyResult.releases?.slice(0, 25).map((r, i) => (
                <div key={i} className="text-center">
                  <div className="aspect-square rounded-lg bg-secondary/80 flex items-center justify-center mb-1">
                    <Disc size={18} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-[10px] font-medium truncate">{r.title}</p>
                  <p className="text-[9px] text-muted-foreground capitalize">{r.release_type} {r.release_date?.slice(0,4)}</p>
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
          <Label className="font-heading font-bold">Vidéos (YouTube)</Label>
        </div>
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
          Formats : youtube.com/@handle · youtube.com/channel/UCxxx · youtube.com/c/nom — Les vidéos sont automatiquement classées (clip, teaser, interview, making-of)
        </p>
        {ytResult && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-red-400" />
              <p className="text-sm font-bold text-red-400">
                {ytResult.created} vidéo{ytResult.created !== 1 ? 's' : ''} importée{ytResult.created !== 1 ? 's' : ''}
                {ytResult.skipped > 0 && ` · ${ytResult.skipped} déjà présente${ytResult.skipped > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
              {ytResult.videos?.slice(0, 12).map((v, i) => (
                <a key={i} href={v.youtube_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-colors p-1 pr-2">
                  <img src={v.thumbnail_url} alt={v.title} className="w-16 h-11 rounded-md object-cover shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium line-clamp-2 leading-tight">{v.title}</p>
                    <p className="text-[9px] text-muted-foreground capitalize mt-0.5">{v.video_type?.replace('_', ' ')}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}