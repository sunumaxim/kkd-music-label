import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { catalogImporterService } from '@/services/catalogImporterService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Link2, Loader2, CheckCircle, AlertTriangle, Music2,
  Youtube, X, Check, ChevronRight, Disc, Plus, Import
} from 'lucide-react';

const PLATFORMS = [
  { id: 'spotify', label: 'Spotify', color: 'green', icon: Music2, type: 'release' },
  { id: 'deezer', label: 'Deezer', color: 'purple', icon: Music2, type: 'release' },
  { id: 'audiomack', label: 'Audiomack', color: 'orange', icon: Music2, type: 'release' },
  { id: 'youtube', label: 'YouTube', color: 'red', icon: Youtube, type: 'video' },
];

const COLOR = {
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', btn: 'bg-green-600 hover:bg-green-700' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', btn: 'bg-purple-600 hover:bg-purple-700' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', btn: 'bg-orange-600 hover:bg-orange-700' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', btn: 'bg-red-600 hover:bg-red-700' },
};

/**
 * PlatformImporter — permet de compiler une tracklist depuis des plateformes externes.
 * Deux modes : (1) coller un lien d'album/playlist → extraction auto de la tracklist,
 * (2) rechercher un artiste → sélectionner son profil → parcourir sa discographie → sélectionner les titres.
 * Retourne les pistes sélectionnées via onImport(tracks, metadata).
 */
export default function PlatformImporter({ onImport, onClose }) {
  const [mode, setMode] = useState('link');

  // ── Link mode ──
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [linkError, setLinkError] = useState('');
  const [linkSelected, setLinkSelected] = useState(new Set());

  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setLinkError('');
    setLinkData(null);
    setLinkSelected(new Set());
    try {
      let data = null;
      try {
        data = await catalogImporterService.extractFromUrl(url.trim());
      } catch (e) {
        console.warn('Fallback vers Base44 extractLinkMetadata:', e);
      }

      if (!data) {
        const res = await base44.functions.invoke('extractLinkMetadata', { url: url.trim() });
        if (res.data?.error) throw new Error(res.data.error);
        data = res.data;
      }

      if (!data) throw new Error("Impossible d'extraire les données du lien.");

      setLinkData(data);
      // Pré-sélectionner toutes les pistes si c'est un album
      if (data?.tracks?.length) {
        setLinkSelected(new Set(data.tracks.map((_, i) => i)));
      } else {
        setLinkSelected(new Set([0]));
      }
    } catch (err) {
      setLinkError(err?.message || 'Extraction échouée');
    } finally {
      setExtracting(false);
    }
  };

  const toggleLinkTrack = (idx) => {
    setLinkSelected((prev) => {
      const s = new Set(prev);
      if (s.has(idx)) s.delete(idx);
      else s.add(idx);
      return s;
    });
  };

  // ── Search mode ──
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [profiles, setProfiles] = useState({});
  const [contents, setContents] = useState({});
  const [loadingContent, setLoadingContent] = useState({});
  const [selectedItems, setSelectedItems] = useState({});

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResults(null);
    setProfiles({});
    setContents({});
    setSelectedItems({});
    try {
      const res = await base44.functions.invoke('searchArtistOnPlatforms', { action: 'search', query: query.trim() });
      if (res.data?.error) setSearchError(res.data.error);
      else setSearchResults(res.data);
    } catch (err) {
      setSearchError(err?.message || 'Recherche échouée');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProfile = async (platformId, profile) => {
    if (!profile) {
      setProfiles((p) => { const n = { ...p }; delete n[platformId]; return n; });
      setContents((c) => { const n = { ...c }; delete n[platformId]; return n; });
      setSelectedItems((s) => { const n = { ...s }; delete n[platformId]; return n; });
      return;
    }
    setProfiles((p) => ({ ...p, [platformId]: profile }));
    setSelectedItems((s) => ({ ...s, [platformId]: new Set() }));
    setLoadingContent((l) => ({ ...l, [platformId]: true }));
    try {
      const res = await base44.functions.invoke('searchArtistOnPlatforms', {
        action: 'fetch_content',
        platform: platformId,
        platform_artist_id: profile.id,
        artist_url: profile.url,
      });
      if (res.data?.content) setContents((c) => ({ ...c, [platformId]: res.data.content }));
    } catch { /* noop */ }
    setLoadingContent((l) => ({ ...l, [platformId]: false }));
  };

  const toggleItem = (platformId, item) => {
    setSelectedItems((s) => {
      const set = new Set(s[platformId] || []);
      if (set.has(item.id)) set.delete(item.id);
      else set.add(item.id);
      return { ...s, [platformId]: set };
    });
  };

  const toggleAll = (platformId) => {
    const content = contents[platformId] || [];
    const current = selectedItems[platformId] || new Set();
    setSelectedItems((s) => ({
      ...s,
      [platformId]: current.size === content.length ? new Set() : new Set(content.map((i) => i.id)),
    }));
  };

  // ── Confirm ──
  const totalSelected = mode === 'link'
    ? linkSelected.size
    : Object.values(selectedItems).reduce((acc, s) => acc + s.size, 0);

  const handleConfirm = () => {
    let tracks = [];
    let metadata = null;

    if (mode === 'link' && linkData) {
      metadata = linkData;
      if (linkData.tracks?.length) {
        tracks = linkData.tracks
          .filter((_, i) => linkSelected.has(i))
          .map((t) => ({
            title: t.title,
            streaming_link: t.spotify_url || t.deezer_url || t.youtube_url || t.audiomack_url || t.soundcloud_url || '',
            streaming_platform: linkData.platform,
            duration_ms: t.duration_ms || 0,
          }));
      } else {
        // Single track / video → une seule piste avec le lien
        tracks = [{
          title: linkData.title,
          streaming_link: url.trim(),
          streaming_platform: linkData.platform,
          duration_ms: 0,
        }];
      }
    } else if (mode === 'search') {
      for (const platform of PLATFORMS) {
        const items = contents[platform.id] || [];
        const selected = selectedItems[platform.id] || new Set();
        for (const item of items) {
          if (!selected.has(item.id)) continue;
          const link = item.spotify_url || item.deezer_url || item.youtube_url || item.audiomack_url || '';
          tracks.push({
            title: item.title,
            streaming_link: link,
            streaming_platform: platform.id,
            duration_ms: 0,
          });
        }
      }
    }

    if (tracks.length > 0) {
      onImport(tracks, metadata);
    }
    onClose();
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Import size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm">Importer depuis une plateforme</h3>
            <p className="text-[11px] text-muted-foreground">Spotify, Deezer, Audiomack, YouTube</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X size={18} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 bg-secondary p-1 rounded-lg">
        <button
          onClick={() => setMode('link')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all ${mode === 'link' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Link2 size={13} /> Coller un lien
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all ${mode === 'search' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Search size={13} /> Rechercher un artiste
        </button>
      </div>

      {/* ── Link mode ── */}
      {mode === 'link' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/album/..."
              type="url"
              className="flex-1"
            />
            <Button type="button" onClick={handleExtract} disabled={!url.trim() || extracting} className="shrink-0 gap-2">
              {extracting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Extraire
            </Button>
          </div>

          {linkError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {linkError}
            </div>
          )}

          {linkData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <CheckCircle size={14} />
                Extrait depuis {linkData.platform}
              </div>
              <div className="flex gap-3 bg-secondary/40 rounded-xl p-3">
                {linkData.cover_url && <img src={linkData.cover_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{linkData.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{linkData.artist_name}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{linkData.description}</p>
                </div>
              </div>

              {linkData.tracks?.length > 0 && (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{linkData.tracks.length} pistes — {linkSelected.size} sélectionnée{linkSelected.size > 1 ? 's' : ''}</p>
                    <button
                      onClick={() => setLinkSelected(linkSelected.size === linkData.tracks.length ? new Set() : new Set(linkData.tracks.map((_, i) => i)))}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {linkSelected.size === linkData.tracks.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  {linkData.tracks.map((t, i) => {
                    const selected = linkSelected.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleLinkTrack(i)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${selected ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border/80'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                          {selected && <Check size={11} className="text-white" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <span className="text-xs font-medium flex-1 truncate">{t.title}</span>
                        {t.duration_ms > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(t.duration_ms / 1000)}s</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Search mode ── */}
      {mode === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Nom de l'artiste..."
                className="pl-9 text-sm"
              />
            </div>
            <Button onClick={doSearch} disabled={!query.trim() || searching} className="shrink-0 gap-1.5">
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Chercher
            </Button>
          </div>

          {searchError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {searchError}
            </div>
          )}

          {searchResults && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {PLATFORMS.map((platform) => {
                const c = COLOR[platform.color];
                const Icon = platform.icon;
                const results = searchResults[platform.id] || [];
                const selectedProfile = profiles[platform.id];
                const content = contents[platform.id];
                const loading = !!loadingContent[platform.id];
                const selected = selectedItems[platform.id] || new Set();

                return (
                  <div key={platform.id} className={`rounded-xl border ${c.border} ${c.bg} p-3 space-y-2`}>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={c.text} />
                      <span className={`font-bold text-xs ${c.text}`}>{platform.label}</span>
                    </div>

                    {!selectedProfile && results.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic">Aucun profil trouvé.</p>
                    )}

                    {!selectedProfile && results.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                        {results.map((profile) => (
                          <button
                            key={profile.id}
                            onClick={() => handleSelectProfile(platform.id, profile)}
                            className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-background/60 hover:bg-background border border-border/40 transition-all text-left"
                          >
                            {profile.image ? (
                              <img src={profile.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 text-[10px] font-bold">{profile.name?.[0]}</div>
                            )}
                            <span className="text-xs font-semibold truncate flex-1">{profile.name}</span>
                            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedProfile && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedProfile.image && <img src={selectedProfile.image} alt="" className="w-6 h-6 rounded-full object-cover" />}
                          <span className="text-xs font-semibold">{selectedProfile.name}</span>
                          <button onClick={() => handleSelectProfile(platform.id, null)} className="ml-auto text-muted-foreground hover:text-foreground">
                            <X size={12} />
                          </button>
                        </div>

                        {loading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs py-2 justify-center">
                            <Loader2 size={12} className="animate-spin" /> Chargement...
                          </div>
                        ) : content?.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-muted-foreground">{content.length} éléments — {selected.size} sélectionné{selected.size > 1 ? 's' : ''}</p>
                              <button onClick={() => toggleAll(platform.id)} className={`text-[10px] ${c.text} hover:opacity-80`}>
                                {selected.size === content.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                              </button>
                            </div>
                            <div className={`grid ${platform.type === 'video' ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'} gap-1 max-h-40 overflow-y-auto pr-0.5`}>
                              {content.map((item) => {
                                const isSel = selected.has(item.id);
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => toggleItem(platform.id, item)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${isSel ? 'border-primary' : 'border-transparent'} ${platform.type === 'video' ? 'flex items-center gap-1.5 p-1 bg-background/60' : 'aspect-square bg-secondary/50'}`}
                                  >
                                    {platform.type === 'video' ? (
                                      <>
                                        <img src={item.thumbnail_url} alt="" className="w-12 h-8 rounded object-cover shrink-0" />
                                        <p className="text-[10px] font-medium line-clamp-2 leading-tight flex-1">{item.title}</p>
                                        {isSel && <Check size={12} className="text-primary shrink-0" />}
                                      </>
                                    ) : (
                                      <>
                                        {item.cover_url ? (
                                          <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Disc size={14} className="text-muted-foreground/30" />
                                          </div>
                                        )}
                                        {isSel && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center"><Check size={16} className="text-white" /></div>}
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-1">
                                          <p className="text-[8px] text-white font-medium truncate">{item.title}</p>
                                        </div>
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic text-center py-1">Aucun contenu.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!searchResults && !searching && (
            <p className="text-center text-xs text-muted-foreground py-3">
              Entrez le nom de l'artiste pour trouver ses profils sur chaque plateforme.
            </p>
          )}
        </div>
      )}

      {/* Confirm */}
      {totalSelected > 0 && (
        <Button onClick={handleConfirm} className="w-full gap-2">
          <Plus size={15} />
          Ajouter {totalSelected} piste{totalSelected > 1 ? 's' : ''} à l'album
        </Button>
      )}
    </div>
  );
}