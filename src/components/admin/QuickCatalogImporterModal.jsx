import React, { useState, useRef } from 'react';
import { catalogImporterService } from '@/services/catalogImporterService';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Sparkles, Music2, Youtube, Check, CheckCircle2,
  AlertCircle, Loader2, Play, Pause, Link2, X,
  ExternalLink, Flame, RefreshCw
} from 'lucide-react';

const SUGGESTIONS = [
  'Burna Boy', 'Wizkid', 'Asake', 'Fally Ipupa',
  'Wally Seck', 'Viviane Chidid', 'Sidiki Diabaté', 'Aya Nakamura', 'Rema'
];

export default function QuickCatalogImporterModal({
  isOpen,
  onClose,
  initialArtist = null,
  initialMode = 'search', // 'search' | 'link'
  onSuccess = null
}) {
  const queryClient = useQueryClient();

  // Mode: 'search' | 'link'
  const [mode, setMode] = useState(initialMode);

  // ── Mode Recherche Artiste ──
  const [query, setQuery] = useState(initialArtist?.name || '');
  const [searching, setSearching] = useState(false);
  const [artistProfiles, setArtistProfiles] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(initialArtist || null);
  const [activeTab, setActiveTab] = useState('releases'); // 'releases' | 'videos'

  // Discographie & Vidéos
  const [loadingContent, setLoadingContent] = useState(false);
  const [releases, setReleases] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedReleases, setSelectedReleases] = useState(new Set());
  const [selectedVideos, setSelectedVideos] = useState(new Set());

  // Mini-lecteur audio preview
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);

  // ── Mode Lien Direct 1 Clic ──
  const [directUrl, setDirectUrl] = useState('');
  const [extractingLink, setExtractingLink] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [linkError, setLinkError] = useState('');

  // ── Importation globale ──
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialisation si initialArtist est fourni
  React.useEffect(() => {
    if (initialArtist && initialArtist.name) {
      setSelectedArtist(initialArtist);
      loadArtistContent(initialArtist.name, {
        platformId: initialArtist.deezer_id || '',
        youtubeId: initialArtist.youtube_channel_id || '',
      });
    }
  }, [initialArtist]);

  if (!isOpen) return null;

  // Lancer la recherche par nom
  const handleSearch = async (targetQuery = query) => {
    const q = (targetQuery || '').trim();
    if (!q) return;
    setSearching(true);
    setErrorMessage('');
    setImportResult(null);
    setArtistProfiles([]);
    setSelectedArtist(null);
    setReleases([]);
    setVideos([]);
    setSelectedReleases(new Set());
    setSelectedVideos(new Set());

    try {
      const res = await catalogImporterService.searchArtist(q);
      setArtistProfiles(res.artists || []);
      if (res.artists?.length === 1) {
        handleSelectArtist(res.artists[0]);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Erreur lors de la recherche des plateformes.');
    } finally {
      setSearching(false);
    }
  };

  // Sélectionner un artiste trouvé
  const handleSelectArtist = async (artist) => {
    setSelectedArtist(artist);
    loadArtistContent(artist.name, {
      platformId: artist.platformId,
      platform: artist.platform,
    });
  };

  // Charger discographie + vidéos de l'artiste
  const loadArtistContent = async (name, opts = {}) => {
    setLoadingContent(true);
    setErrorMessage('');
    try {
      const { releases: rels, videos: vids } = await catalogImporterService.fetchArtistDiscographyAndVideos(name, opts);
      setReleases(rels);
      setVideos(vids);
      // Par défaut, pré-sélectionner les 6 premières sorties récentes
      setSelectedReleases(new Set(rels.slice(0, 6).map(r => r.id)));
      // Et les 3 premières vidéos
      setSelectedVideos(new Set(vids.slice(0, 3).map(v => v.id)));
    } catch (err) {
      setErrorMessage(err?.message || 'Impossible de récupérer la discographie.');
    } finally {
      setLoadingContent(false);
    }
  };

  // Toggle release selection
  const toggleRelease = (id) => {
    setSelectedReleases(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  // Toggle video selection
  const toggleVideo = (id) => {
    setSelectedVideos(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleAllReleases = () => {
    if (selectedReleases.size === releases.length) {
      setSelectedReleases(new Set());
    } else {
      setSelectedReleases(new Set(releases.map(r => r.id)));
    }
  };

  const toggleAllVideos = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map(v => v.id)));
    }
  };

  // Contrôle du mini-lecteur audio d'aperçu
  const handleTogglePlayAudio = (id, url) => {
    if (!url) return;
    if (playingAudioId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      } else {
        const audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
      setPlayingAudioId(id);
    }
  };

  // Arrêter l'audio en quittant
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudioId(null);
    onClose();
  };

  // ── Extraction Lien Direct ──
  const handleExtractLink = async () => {
    if (!directUrl.trim()) return;
    setExtractingLink(true);
    setLinkError('');
    setExtractedData(null);
    try {
      const data = await catalogImporterService.extractFromUrl(directUrl.trim());
      setExtractedData(data);
    } catch (err) {
      setLinkError(err?.message || "Impossible d'extraire les données de ce lien.");
    } finally {
      setExtractingLink(false);
    }
  };

  // ── Validation et Importation vers le catalogue ──
  const handleImportToCatalog = async () => {
    setImporting(true);
    setErrorMessage('');
    setImportResult(null);

    try {
      if (mode === 'link') {
        if (!extractedData) throw new Error('Aucune donnée à importer.');
        const isVideo = extractedData.type === 'video';
        const payloadArtist = {
          name: extractedData.artist_name || 'Artiste',
          image: extractedData.cover_url || extractedData.thumbnail_url || '',
          genres: ['Afrobeats / Urbain'],
        };
        const payloadReleases = isVideo ? [] : [extractedData];
        const payloadVideos = isVideo ? [extractedData] : [];

        const res = await catalogImporterService.importToCatalog({
          artist: payloadArtist,
          releases: payloadReleases,
          videos: payloadVideos,
        });

        setImportResult(res);
      } else {
        if (!selectedArtist) throw new Error("Veuillez d'abord sélectionner un artiste.");
        const chosenReleases = releases.filter(r => selectedReleases.has(r.id));
        const chosenVideos = videos.filter(v => selectedVideos.has(v.id));

        if (chosenReleases.length === 0 && chosenVideos.length === 0) {
          throw new Error('Veuillez cocher au moins une sortie ou une vidéo à importer.');
        }

        const res = await catalogImporterService.importToCatalog({
          artist: selectedArtist,
          releases: chosenReleases,
          videos: chosenVideos,
        });

        setImportResult(res);
      }

      // Invalider le cache React Query pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });

      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(err?.message || "Échec de l'importation.");
    } finally {
      setImporting(false);
    }
  };

  const totalSelectedCount = selectedReleases.size + selectedVideos.size;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg flex items-center gap-2">
                Alimentation Rapide du Catalogue
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] uppercase tracking-wider">
                  Spotify · YouTube · Deezer
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Recherchez par nom d'artiste ou collez un lien pour importer avec featurings, pochettes HD et audio immédiat.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs Mode */}
        <div className="flex border-b border-border/60 bg-muted/20 px-5 pt-3 gap-3">
          <button
            onClick={() => { setMode('search'); setImportResult(null); }}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              mode === 'search'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search size={15} />
            Recherche par Nom d'Artiste
          </button>
          <button
            onClick={() => { setMode('link'); setImportResult(null); }}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              mode === 'link'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 size={15} />
            Lien Simple 1 Clic (Spotify / YouTube)
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Résultat d'importation avec succès */}
          {importResult && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Publication réussie sur la plateforme !</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pl-6">
                <p>• {importResult.createdReleasesCount} sortie(s) musicale(s) importée(s) dans le catalogue.</p>
                <p>• {importResult.createdVideosCount} clip(s) vidéo(s) ajouté(s).</p>
                {importResult.skippedReleasesCount + importResult.skippedVideosCount > 0 && (
                  <p className="text-muted-foreground/70">
                    • {importResult.skippedReleasesCount + importResult.skippedVideosCount} doublon(s) déjà présent(s) ignoré(s).
                  </p>
                )}
                <p className="text-primary font-medium">
                  L'artiste <strong className="text-foreground">{importResult.artistName}</strong> et son contenu sont maintenant consultables et écoutables sur KKD Music.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODE 1 : RECHERCHE PAR ARTISTE                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {mode === 'search' && (
            <div className="space-y-4">
              {/* Barre de recherche */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Tapez le nom d'un artiste (ex: Burna Boy, Asake, Viviane Chidid...)"
                    className="pl-9 text-sm h-11"
                  />
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={searching || !query.trim()}
                  className="bg-primary hover:bg-primary/80 h-11 px-5 gap-2 shrink-0 text-sm font-semibold"
                >
                  {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  Rechercher
                </Button>
              </div>

              {/* Suggestions rapides */}
              {!selectedArtist && artistProfiles.length === 0 && !searching && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Flame size={13} className="text-amber-500" />
                    Artistes populaires fréquemment importés :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => { setQuery(s); handleSearch(s); }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary hover:text-primary transition-colors border border-border/40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des profils trouvés pour sélection */}
              {!selectedArtist && artistProfiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Sélectionnez le bon profil :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {artistProfiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectArtist(p)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/70 transition-all text-left group"
                      >
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-border/50" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0">
                            {p.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.followers ? `${p.followers} · ` : ''}{p.genres?.join(', ') || 'Afrobeats / Urbain'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                          {p.platform}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Profil Artiste Sélectionné + Onglets Discographie / Clips */}
              {selectedArtist && (
                <div className="space-y-4 pt-1">
                  {/* Carte d'identité de l'artiste */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3">
                      {selectedArtist.image ? (
                        <img src={selectedArtist.image} alt={selectedArtist.name} className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/40 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                          {selectedArtist.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading font-extrabold text-base">{selectedArtist.name}</h3>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                            Profil vérifié
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedArtist.genres?.join(', ') || 'Musique africaine / Urbaine'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedArtist(null); setReleases([]); setVideos([]); }}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <RefreshCw size={12} /> Changer d'artiste
                    </Button>
                  </div>

                  {/* Onglets Sorties vs Clips Vidéo */}
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('releases')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeTab === 'releases'
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Music2 size={14} />
                        Sorties Musicales ({releases.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('videos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activeTab === 'videos'
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Youtube size={14} className={activeTab === 'videos' ? 'text-white' : 'text-red-500'} />
                        Clips & Vidéos ({videos.length})
                      </button>
                    </div>

                    {/* Sélection groupée */}
                    <button
                      onClick={activeTab === 'releases' ? toggleAllReleases : toggleAllVideos}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      {activeTab === 'releases'
                        ? selectedReleases.size === releases.length ? 'Tout désélectionner' : 'Tout sélectionner'
                        : selectedVideos.size === videos.length ? 'Tout désélectionner' : 'Tout sélectionner'
                      }
                    </button>
                  </div>

                  {/* Loading content */}
                  {loadingContent && (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 size={24} className="animate-spin text-primary" />
                      <span>Recherche des sorties Spotify, Deezer & clips YouTube...</span>
                    </div>
                  )}

                  {/* Contenu TAB 1 : SORTIES MUSICALES */}
                  {!loadingContent && activeTab === 'releases' && (
                    <div className="space-y-2">
                      {releases.length === 0 ? (
                        <p className="text-center py-8 text-xs text-muted-foreground">
                          Aucune sortie trouvée pour cet artiste sur les plateformes.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {releases.map((rel) => {
                            const isSelected = selectedReleases.has(rel.id);
                            const isPlaying = playingAudioId === rel.id;
                            return (
                              <div
                                key={rel.id}
                                onClick={() => toggleRelease(rel.id)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border/40 bg-secondary/20 hover:bg-secondary/40'
                                }`}
                              >
                                {/* Checkbox visuelle */}
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-background'
                                }`}>
                                  {isSelected && <Check size={13} />}
                                </div>

                                {/* Pochette HD */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
                                  {rel.cover_url ? (
                                    <img src={rel.cover_url} alt={rel.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Music2 size={16} className="text-muted-foreground/40" />
                                    </div>
                                  )}
                                  {/* Bouton Play aperçu audio 30s */}
                                  {rel.audio_preview_url && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePlayAudio(rel.id, rel.audio_preview_url);
                                      }}
                                      className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity"
                                      title="Écouter l'extrait audio 30s"
                                    >
                                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                    </button>
                                  )}
                                </div>

                                {/* Informations détaillées & featurings */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-heading font-bold text-xs truncate">
                                      {rel.cleanTitle || rel.title}
                                    </p>
                                    {rel.featuring && (
                                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0 px-1.5 shrink-0 font-medium">
                                        feat. {rel.featuring}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                    <span className="capitalize font-medium text-foreground/70">{rel.release_type}</span>
                                    <span>•</span>
                                    <span>{rel.release_date}</span>
                                    {rel.audio_preview_url && (
                                      <>
                                        <span>•</span>
                                        <span className="text-primary font-medium flex items-center gap-0.5">
                                          <Sparkles size={10} /> Extrait 30s inclus
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Badges plateformes */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {rel.spotify_url && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-semibold">
                                      Spotify
                                    </span>
                                  )}
                                  {rel.deezer_url && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">
                                      Deezer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contenu TAB 2 : CLIPS & VIDÉOS */}
                  {!loadingContent && activeTab === 'videos' && (
                    <div className="space-y-2">
                      {videos.length === 0 ? (
                        <p className="text-center py-8 text-xs text-muted-foreground">
                          Aucun clip ou vidéo trouvé pour cet artiste.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {videos.map((vid) => {
                            const isSelected = selectedVideos.has(vid.id);
                            return (
                              <div
                                key={vid.id}
                                onClick={() => toggleVideo(vid.id)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border/40 bg-secondary/20 hover:bg-secondary/40'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-background'
                                }`}>
                                  {isSelected && <Check size={13} />}
                                </div>

                                {/* Miniature vidéo */}
                                <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-secondary">
                                  {vid.thumbnail_url ? (
                                    <img src={vid.thumbnail_url} alt={vid.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black/30">
                                      <Youtube size={16} className="text-red-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-heading font-bold text-xs line-clamp-1">
                                    {vid.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-red-500/30 text-red-400 bg-red-500/5">
                                      Clip officiel
                                    </Badge>
                                    <span>•</span>
                                    <span>{vid.publish_date}</span>
                                  </div>
                                </div>

                                {vid.youtube_url && (
                                  <a
                                    href={vid.youtube_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-red-500 p-1 rounded"
                                    title="Voir sur YouTube"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MODE 2 : LIEN DIRECT 1 CLIC                                   */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {mode === 'link' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold block text-foreground">
                  Collez un lien Spotify, YouTube, Deezer ou Apple Music :
                </label>
                <div className="flex gap-2">
                  <Input
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExtractLink()}
                    placeholder="https://open.spotify.com/track/... ou https://www.youtube.com/watch?v=..."
                    className="text-sm h-11"
                  />
                  <Button
                    onClick={handleExtractLink}
                    disabled={extractingLink || !directUrl.trim()}
                    className="bg-primary hover:bg-primary/80 h-11 px-5 gap-2 shrink-0 font-semibold"
                  >
                    {extractingLink ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    Analyser le lien
                  </Button>
                </div>
                {linkError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                    <AlertCircle size={13} /> {linkError}
                  </p>
                )}
              </div>

              {/* Aperçu du contenu extrait */}
              {extractedData && (
                <div className="p-4 rounded-xl border border-primary/40 bg-secondary/30 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-3.5">
                    {(extractedData.cover_url || extractedData.thumbnail_url) && (
                      <img
                        src={extractedData.cover_url || extractedData.thumbnail_url}
                        alt={extractedData.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border/50 shrink-0 shadow-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="capitalize text-[10px] bg-primary/20 text-primary border-primary/30">
                          {extractedData.platform} • {extractedData.type}
                        </Badge>
                        {extractedData.featuring && (
                          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                            feat. {extractedData.featuring}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-heading font-extrabold text-sm sm:text-base mt-1 truncate">
                        {extractedData.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Par <strong className="text-foreground">{extractedData.artist_name}</strong> • Date : {extractedData.release_date || extractedData.publish_date}
                      </p>
                    </div>
                  </div>

                  {extractedData.audio_file_url && (
                    <div className="p-2.5 rounded-lg bg-background/60 border border-border/40 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Music2 size={14} className="text-primary" />
                        Extrait audio officiel prêt pour écoute immédiate
                      </span>
                      <button
                        onClick={() => handleTogglePlayAudio('link-preview', extractedData.audio_file_url)}
                        className="px-2.5 py-1 rounded bg-primary text-white text-[11px] font-semibold flex items-center gap-1"
                      >
                        {playingAudioId === 'link-preview' ? <Pause size={12} /> : <Play size={12} />}
                        {playingAudioId === 'link-preview' ? 'Pause' : 'Écouter'}
                      </button>
                    </div>
                  )}

                  {extractedData.tracks && extractedData.tracks.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Music2 size={13} className="text-primary" />
                          Morceaux regroupés dans ce projet ({extractedData.tracks.length} titres)
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          {extractedData.type === 'ep' ? 'EP' : 'Album'}
                        </Badge>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {extractedData.tracks.map((trk, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 rounded bg-background/50 border border-border/30 text-xs">
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <span className="text-muted-foreground font-mono text-[11px] w-5 shrink-0">{i + 1}.</span>
                              <span className="font-medium text-foreground truncate">{trk.title}</span>
                              {trk.featuring_artist && (
                                <span className="text-[10px] text-amber-500 font-medium shrink-0">feat. {trk.featuring_artist}</span>
                              )}
                            </div>
                            {trk.audio_file_url && (
                              <button
                                type="button"
                                onClick={() => handleTogglePlayAudio(`track-${i}`, trk.audio_file_url)}
                                className="text-primary hover:text-primary/80 p-1 shrink-0 ml-2"
                                title="Écouter l'extrait"
                              >
                                {playingAudioId === `track-${i}` ? <Pause size={13} /> : <Play size={13} />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {mode === 'search' ? (
              selectedArtist ? (
                <span>
                  <strong className="text-foreground">{selectedReleases.size}</strong> sortie(s) et{' '}
                  <strong className="text-foreground">{selectedVideos.size}</strong> vidéo(s) sélectionnée(s)
                </span>
              ) : (
                <span>Sélectionnez un artiste pour afficher ses titres et clips</span>
              )
            ) : (
              extractedData ? (
                <span>Contenu prêt pour publication directe en 1 clic</span>
              ) : (
                <span>Collez une URL pour prévisualiser les métadonnées</span>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={handleClose} disabled={importing} className="text-xs">
              Fermer
            </Button>
            <Button
              onClick={handleImportToCatalog}
              disabled={
                importing ||
                (mode === 'search' && (!selectedArtist || totalSelectedCount === 0)) ||
                (mode === 'link' && !extractedData)
              }
              className="bg-primary hover:bg-primary/80 gap-2 text-xs font-bold text-white shadow-md"
            >
              {importing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Importation en cours...
                </>
              ) : (
                <>
                  <Check size={14} />
                  {mode === 'link'
                    ? 'Publier sur la plateforme'
                    : `Importer & Publier (${totalSelectedCount} éléments)`
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
