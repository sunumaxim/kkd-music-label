import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, Music2, Youtube, Loader2, CheckCircle,
  AlertCircle, X, ArrowLeft, Trash2, Import, Check,
  ChevronRight
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

// ── EXISTING CONTENT PANEL ──
function ExistingContent({ artist, platform, onClose }) {
  const [releases, setReleases] = useState(null);
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(new Set());
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const load = async () => {
      if (platform.type === 'video') {
        const data = await base44.entities.Video.filter({ artist_name: artist.name });
        setVideos(data);
      } else {
        const data = await base44.entities.Release.filter({ artist_name: artist.name });
        setReleases(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const deleteItem = async (id, type) => {
    setDeleting(prev => new Set([...prev, id]));
    await base44.functions.invoke('searchArtistOnPlatforms', {
      action: type === 'video' ? 'delete_video' : 'delete_release',
      [type === 'video' ? 'video_id' : 'release_id']: id,
    });
    if (type === 'video') {
      setVideos(v => v.filter(i => i.id !== id));
      queryClient.invalidateQueries({ queryKey: ['artist-videos'] });
    } else {
      setReleases(r => r.filter(i => i.id !== id));
      queryClient.invalidateQueries({ queryKey: ['artist-releases'] });
    }
    setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const items = platform.type === 'video' ? (videos || []) : (releases || []);
  const c = COLOR[platform.color];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <ArrowLeft size={16} />
        </button>
        <p className="font-bold text-sm">Contenu existant — {artist.name}</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement...
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">Aucun contenu {platform.type === 'video' ? 'vidéo' : 'musical'} pour cet artiste.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40 group">
              {item.cover_url || item.thumbnail_url ? (
                <img src={item.cover_url || item.thumbnail_url} alt={item.title} className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
                  <Music2 size={14} className="text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {item.release_type || item.video_type?.replace('_', ' ')} {item.release_date?.slice(0, 4) || item.publish_date?.slice(0, 4)}
                </p>
              </div>
              <button
                onClick={() => deleteItem(item.id, platform.type === 'video' ? 'video' : 'release')}
                disabled={deleting.has(item.id)}
                className="text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
              >
                {deleting.has(item.id) ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PLATFORM SECTION ──
function PlatformSection({ platform, artist, searchResults, onSelectProfile, selectedProfile, content, loadingContent, selectedItems, onToggleItem, onToggleAll, onImport, importing, importDone }) {
  const c = COLOR[platform.color];
  const Icon = platform.icon;
  const [showExisting, setShowExisting] = useState(false);

  if (showExisting) {
    return <ExistingContent artist={artist} platform={platform} onClose={() => setShowExisting(false)} />;
  }

  const results = searchResults?.[platform.id] || [];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={c.text} />
          <span className={`font-bold text-sm ${c.text}`}>{platform.label}</span>
        </div>
        <button
          onClick={() => setShowExisting(true)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Voir / supprimer existants
        </button>
      </div>

      {/* No results */}
      {results.length === 0 && !selectedProfile && (
        <p className="text-xs text-muted-foreground italic">Aucun profil trouvé — réessayez avec un autre nom.</p>
      )}

      {/* Profile selection */}
      {!selectedProfile && results.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Sélectionnez le bon profil :</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {results.map(profile => (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(platform.id, profile)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-background/60 hover:bg-background border border-border/40 hover:border-border/80 transition-all text-left"
              >
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                    {profile.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {typeof profile.followers === 'number'
                      ? `${profile.followers.toLocaleString()} abonnés`
                      : profile.followers}
                    {profile.genres?.length > 0 && ` · ${profile.genres.join(', ')}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected profile — content list */}
      {selectedProfile && (
        <div className="space-y-2">
          {/* Selected artist tag */}
          <div className="flex items-center gap-2">
            {selectedProfile.image && (
              <img src={selectedProfile.image} alt={selectedProfile.name} className="w-7 h-7 rounded-full object-cover" />
            )}
            <span className="text-xs font-semibold">{selectedProfile.name}</span>
            <button
              onClick={() => onSelectProfile(platform.id, null)}
              className="ml-auto text-muted-foreground hover:text-foreground p-0.5"
            >
              <X size={13} />
            </button>
          </div>

          {loadingContent ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-3 justify-center">
              <Loader2 size={14} className="animate-spin" /> Chargement des contenus...
            </div>
          ) : content?.length > 0 ? (
            <>
              {/* Select all */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{content.length} élément{content.length > 1 ? 's' : ''} disponible{content.length > 1 ? 's' : ''}</p>
                <button
                  onClick={() => onToggleAll(platform.id)}
                  className={`text-xs font-medium ${c.text} hover:opacity-80`}
                >
                  {selectedItems.size === content.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {/* Content grid */}
              <div className={`grid ${platform.type === 'video' ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'} gap-1.5 max-h-56 overflow-y-auto pr-0.5`}>
                {content.map(item => {
                  const selected = selectedItems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onToggleItem(platform.id, item)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                        selected ? `border-primary` : 'border-transparent'
                      } ${platform.type === 'video' ? 'flex items-center gap-2 p-1.5 bg-background/60' : 'aspect-square bg-secondary/50'}`}
                    >
                      {platform.type === 'video' ? (
                        <>
                          <img src={item.thumbnail_url} alt={item.title} className="w-16 h-11 rounded object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium line-clamp-2 leading-tight">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{item.video_type?.replace('_', ' ')}</p>
                          </div>
                          {selected && <Check size={14} className="text-primary shrink-0" />}
                        </>
                      ) : (
                        <>
                          {item.cover_url ? (
                            <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music2 size={16} className="text-muted-foreground/30" />
                            </div>
                          )}
                          {selected && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                              <Check size={18} className="text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-1">
                            <p className="text-[9px] text-white font-medium truncate">{item.title}</p>
                            <p className="text-[8px] text-white/70 capitalize">{item.release_type} {item.release_date?.slice(0, 4)}</p>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Import button */}
              {importDone ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle size={14} className="text-green-400" />
                  <p className="text-xs text-green-400 font-semibold">
                    {importDone.created} importé{importDone.created > 1 ? 's' : ''}
                    {importDone.skipped > 0 && <span className="text-muted-foreground font-normal"> · {importDone.skipped} déjà présent{importDone.skipped > 1 ? 's' : ''}</span>}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={() => onImport(platform)}
                  disabled={selectedItems.size === 0 || importing}
                  className={`w-full gap-2 text-sm ${c.btn} text-white`}
                  size="sm"
                >
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <Import size={13} />}
                  {importing ? 'Import en cours...' : `Importer (${selectedItems.size} sélectionné${selectedItems.size > 1 ? 's' : ''})`}
                </Button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-2">Aucun contenu trouvé pour ce profil.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function ArtistImporter({ artist, onClose }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState(artist?.name || '');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState('');

  // Per-platform: selected profile, content list, selected items, import state
  const [profiles, setProfiles] = useState({});
  const [contents, setContents] = useState({});
  const [loadingContent, setLoadingContent] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [importing, setImporting] = useState({});
  const [importDone, setImportDone] = useState({});

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setSearchResults(null);
    setProfiles({});
    setContents({});
    setSelectedItems({});
    setImportDone({});

    const res = await base44.functions.invoke('searchArtistOnPlatforms', { action: 'search', query: query.trim() });
    setSearching(false);
    if (res.data?.error) setError(res.data.error);
    else setSearchResults(res.data);
  };

  const handleSelectProfile = async (platformId, profile) => {
    if (!profile) {
      // Deselect
      setProfiles(p => { const n = { ...p }; delete n[platformId]; return n; });
      setContents(c => { const n = { ...c }; delete n[platformId]; return n; });
      setSelectedItems(s => { const n = { ...s }; delete n[platformId]; return n; });
      setImportDone(d => { const n = { ...d }; delete n[platformId]; return n; });
      return;
    }

    setProfiles(p => ({ ...p, [platformId]: profile }));
    setSelectedItems(s => ({ ...s, [platformId]: new Set() }));
    setImportDone(d => { const n = { ...d }; delete n[platformId]; return n; });

    // Fetch content
    setLoadingContent(l => ({ ...l, [platformId]: true }));
    const res = await base44.functions.invoke('searchArtistOnPlatforms', {
      action: 'fetch_content',
      platform: platformId,
      platform_artist_id: profile.id,
      artist_url: profile.url,
    });
    setLoadingContent(l => ({ ...l, [platformId]: false }));
    if (res.data?.content) {
      setContents(c => ({ ...c, [platformId]: res.data.content }));
    }
  };

  const toggleItem = (platformId, item) => {
    setSelectedItems(s => {
      const set = new Set(s[platformId] || []);
      if (set.has(item.id)) set.delete(item.id);
      else set.add(item.id);
      return { ...s, [platformId]: set };
    });
  };

  const toggleAll = (platformId) => {
    const content = contents[platformId] || [];
    const current = selectedItems[platformId] || new Set();
    if (current.size === content.length) {
      setSelectedItems(s => ({ ...s, [platformId]: new Set() }));
    } else {
      setSelectedItems(s => ({ ...s, [platformId]: new Set(content.map(i => i.id)) }));
    }
  };

  const doImport = async (platform) => {
    const platformId = platform.id;
    const content = contents[platformId] || [];
    const selected = selectedItems[platformId] || new Set();
    const itemsToImport = content.filter(i => selected.has(i.id));
    if (!itemsToImport.length) return;

    setImporting(i => ({ ...i, [platformId]: true }));
    const profile = profiles[platformId];

    const res = await base44.functions.invoke('searchArtistOnPlatforms', {
      action: 'import_items',
      platform: platformId,
      items: itemsToImport,
      artist_name: artist.name,
      artist_id: artist.id,
      platform_artist_url: profile?.url,
    });

    setImporting(i => ({ ...i, [platformId]: false }));

    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setImportDone(d => ({ ...d, [platformId]: res.data }));
      if (platform.type === 'video') {
        queryClient.invalidateQueries({ queryKey: ['artist-videos'] });
        queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['artist-releases'] });
        queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
      }
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-extrabold text-base">Importer le contenu</h3>
          {artist && <p className="text-xs text-muted-foreground">{artist.name}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Rechercher par nom d'artiste..."
            className="pl-9 text-sm"
          />
        </div>
        <Button onClick={doSearch} disabled={!query.trim() || searching} className="shrink-0 gap-1.5">
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Rechercher
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Platform results */}
      {searchResults && (
        <div className="space-y-4">
          {PLATFORMS.map(platform => (
            <PlatformSection
              key={platform.id}
              platform={platform}
              artist={artist}
              searchResults={searchResults}
              selectedProfile={profiles[platform.id] || null}
              onSelectProfile={handleSelectProfile}
              content={contents[platform.id] || null}
              loadingContent={!!loadingContent[platform.id]}
              selectedItems={selectedItems[platform.id] || new Set()}
              onToggleItem={toggleItem}
              onToggleAll={toggleAll}
              onImport={doImport}
              importing={!!importing[platform.id]}
              importDone={importDone[platform.id] || null}
            />
          ))}
        </div>
      )}

      {!searchResults && !searching && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Entrez le nom de l'artiste et cliquez sur Rechercher pour trouver ses profils sur chaque plateforme.
        </p>
      )}
    </div>
  );
}