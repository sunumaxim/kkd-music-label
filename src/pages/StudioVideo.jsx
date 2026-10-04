// KKD Music — Studio de Génération Vidéo Musicale multi-formats (TikTok, Reels, YouTube)
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Play, Pause, Film, Music, 
  Upload, Layers, Sliders, Zap, Crown, Smartphone 
} from 'lucide-react';
import { musicService } from '@/services/musicService';
import { 
  videoGeneratorService, 
  VIDEO_FORMATS, 
  VIDEO_THEMES, 
  DURATION_OPTIONS 
} from '@/services/videoGeneratorService';
import { AudioVisualizerEngine } from '@/utils/audioVisualizerEngine';
import CreditModal from '@/components/studio/CreditModal';
import ExportModal from '@/components/studio/ExportModal';
import PageMeta from '@/components/shared/PageMeta';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function StudioVideo() {
  const [searchParams] = useSearchParams();
  const trackIdParam = searchParams.get('trackId');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // État utilisateur
  const { data: user } = useQuery({
    queryKey: ['studio-user'],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    staleTime: 30_000,
  });

  const [credits, setCredits] = useState(3);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState('idle'); // 'exporting' | 'complete' | 'error'
  const [exportProgress, setExportProgress] = useState({ percent: 0, elapsedSeconds: 0, totalSeconds: 15 });
  const [exportResult, setExportResult] = useState(null);

  // Configuration du projet vidéo
  const [selectedFormat, setSelectedFormat] = useState('tiktok_9_16');
  const [selectedTheme, setSelectedTheme] = useState('neon_pulse');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [trackTitle, setTrackTitle] = useState('Nouveau Single');
  const [artistName, setArtistName] = useState('Artiste KKD');
  const [lyricsText, setLyricsText] = useState('Disponible maintenant sur KKD Music');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [secondaryColor, setSecondaryColor] = useState('#EF4444');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioStartOffset, setAudioStartOffset] = useState(0);

  // État de lecture audio / prévisualisation
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(180);
  const [currentTime, setCurrentTime] = useState(0);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const engineRef = useRef(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Liste des sorties musicales pour sélection rapide
  const { data: releases = [] } = useQuery({
    queryKey: ['studio-releases'],
    queryFn: () => musicService.listReleases('-created_date', 30),
    staleTime: 60_000,
  });

  // Historique des projets générés par l'utilisateur
  const { data: userProjects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['studio-user-projects', user?.id || user?.uid],
    queryFn: () => videoGeneratorService.getUserProjects(user?.id || user?.uid),
    staleTime: 20_000,
  });

  // Synchronisation du solde de crédits
  useEffect(() => {
    if (user) {
      setCredits(videoGeneratorService.getUserCredits(user));
    }
  }, [user]);

  // Pré-remplissage si trackId fourni dans l'URL
  useEffect(() => {
    if (trackIdParam && releases.length > 0) {
      const match = releases.find(r => r.id === trackIdParam || r.slug === trackIdParam);
      if (match) {
        setTrackTitle(match.title || 'Single');
        setArtistName(match.artist_name || 'Artiste');
        setCoverUrl(match.cover_url || '');
        if (match.audio_file_url) {
          setAudioUrl(match.audio_file_url);
        }
      }
    }
  }, [trackIdParam, releases]);

  // Initialisation du Moteur Audio-Visuel sur le Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const isVertical = selectedFormat.includes('9_16');
    canvas.width = isVertical ? 540 : 960;
    canvas.height = isVertical ? 960 : 540;

    const userSub = videoGeneratorService.getUserSubscription(user);
    const hasWatermark = userSub.id === 'free';

    const engine = new AudioVisualizerEngine(canvas, {
      theme: selectedTheme,
      format: selectedFormat,
      trackTitle,
      artistName,
      lyricsText,
      accentColor,
      secondaryColor,
      hasWatermark
    });

    if (coverUrl) {
      engine.setCoverImage(coverUrl);
    }

    if (audioRef.current) {
      engine.setupAudioContext(audioRef.current);
    }

    engine.startPreviewLoop();
    engineRef.current = engine;

    return () => {
      engine.stopPreviewLoop();
    };
  }, [selectedFormat]);

  // Mise à jour réactive des options du moteur
  useEffect(() => {
    if (engineRef.current) {
      const userSub = videoGeneratorService.getUserSubscription(user);
      engineRef.current.setOptions({
        theme: selectedTheme,
        format: selectedFormat,
        trackTitle,
        artistName,
        lyricsText,
        accentColor,
        secondaryColor,
        hasWatermark: userSub.id === 'free'
      });
      if (coverUrl) {
        engineRef.current.setCoverImage(coverUrl);
      }
    }
  }, [selectedTheme, selectedFormat, trackTitle, artistName, lyricsText, accentColor, secondaryColor, coverUrl, user]);

  // Gestion du lecteur audio
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (engineRef.current && !engineRef.current.audioContext) {
        engineRef.current.setupAudioContext(audio);
      }
      audio.currentTime = audioStartOffset;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play notice:', err);
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    setCurrentTime(current);

    // Arrêt si on dépasse la durée sélectionnée en prévisualisation
    if (current >= audioStartOffset + selectedDuration) {
      audioRef.current.currentTime = audioStartOffset;
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 180);
    }
  };

  // Sélection d'une piste officielle
  const handleSelectRelease = (rel) => {
    setTrackTitle(rel.title || 'Titre');
    setArtistName(rel.artist_name || 'Artiste');
    setCoverUrl(rel.cover_url || '');
    if (rel.audio_file_url) {
      setAudioUrl(rel.audio_file_url);
    }
    toast({
      title: 'Piste sélectionnée',
      description: `« ${rel.title} » chargée dans le Studio.`,
    });
  };

  // Upload d'un fichier audio local
  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setTrackTitle(cleanName);
    toast({
      title: 'Fichier audio importé',
      description: `${file.name} est prêt pour la synchronisation.`,
    });
  };

  // Upload d'une pochette personnalisée
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoverUrl(ev.target.result);
      if (engineRef.current) {
        engineRef.current.setCoverImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Lancement de la génération vidéo
  const handleStartGeneration = async () => {
    const durationOpt = DURATION_OPTIONS.find(d => d.duration === selectedDuration) || DURATION_OPTIONS[0];
    const requiredCredits = durationOpt.credits;

    if (credits < requiredCredits) {
      setCreditModalOpen(true);
      toast({
        title: 'Crédits insuffisants',
        description: `Il vous faut ${requiredCredits} crédit(s) pour générer cette vidéo de ${selectedDuration}s.`,
        variant: 'destructive'
      });
      return;
    }

    setExportStatus('exporting');
    setExportProgress({ percent: 0, elapsedSeconds: 0, totalSeconds: selectedDuration });
    setExportModalOpen(true);

    try {
      // 1. Déduction des crédits
      const newBalance = await videoGeneratorService.deductCredits(
        user, 
        requiredCredits, 
        `Génération vidéo ${selectedDuration}s (${selectedFormat}) pour « ${trackTitle} »`
      );
      setCredits(newBalance);

      // 2. Démarrer l'audio sur l'offset
      if (audioRef.current) {
        audioRef.current.currentTime = audioStartOffset;
        audioRef.current.play().catch(() => {});
      }

      // 3. Exécution de l'export Canvas + Audio
      await engineRef.current.exportVideo({
        durationSeconds: selectedDuration,
        onProgress: (prog) => {
          setExportProgress(prog);
        },
        onComplete: async (res) => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          setExportResult(res);
          setExportStatus('complete');

          // 4. Sauvegarde dans l'historique Firestore
          await videoGeneratorService.saveProject({
            title: trackTitle,
            artist_name: artistName,
            format: selectedFormat,
            theme: selectedTheme,
            duration: selectedDuration,
            thumbnail_url: coverUrl,
            user_email: user?.email || '',
          });
          refetchProjects();

          toast({
            title: 'Vidéo générée avec succès !',
            description: `${selectedDuration} secondes synchronisées en MP4.`,
          });
        },
        onError: (err) => {
          console.error('Export error:', err);
          setExportStatus('error');
          toast({
            title: 'Échec de génération',
            description: err?.message || 'Une erreur est survenue lors de l’encodage.',
            variant: 'destructive'
          });
        }
      });

    } catch (err) {
      setExportStatus('error');
      toast({
        title: 'Erreur',
        description: err?.message,
        variant: 'destructive'
      });
    }
  };

  const userSub = videoGeneratorService.getUserSubscription(user);
  const currentDurationOpt = DURATION_OPTIONS.find(d => d.duration === selectedDuration) || DURATION_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-24">
      <PageMeta
        title="Studio Vidéo & TikTok — KKD Music"
        description="Générez vos clips musicaux et teasers pour TikTok, Instagram Reels et YouTube synchronisés avec vos morceaux."
      />

      {/* Élément audio masqué pour l'analyse spectrale */}
      <audio
        ref={audioRef}
        src={audioUrl || 'https://assets.mixkit.co/music/preview/mixkit-afrobeat-groove-107.mp3'}
        crossOrigin="anonymous"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAudioFileUpload}
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── Top Bar Studio ── */}
      <div className="border-b border-border/50 bg-[#0E131E]/90 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/10">
              <Film size={18} className="text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">Studio Vidéo & TikTok</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                  9:16 & 16:9
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Visualiseur audio réactif, pochette animée & paroles synchronisées
              </p>
            </div>
          </div>

          {/* Statut Crédits & Abonnement */}
          <div className="flex items-center gap-3">
            {/* Badge Abonnement */}
            <button
              onClick={() => setCreditModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/60 hover:border-amber-500/50 transition-colors text-xs"
            >
              <Crown size={14} className={userSub.id !== 'free' ? 'text-amber-400' : 'text-muted-foreground'} />
              <span className="font-semibold text-white">{userSub.name}</span>
            </button>

            {/* Solde Crédits */}
            <div className="flex items-center gap-2 bg-[#141B2D] px-3.5 py-1.5 rounded-xl border border-amber-500/30">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-muted-foreground">Solde :</span>
              <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                {credits} crédit{credits > 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={() => setCreditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
            >
              <Zap size={13} />
              <span>Recharger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenu Principal Studio ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Panneau Gauche : Réglages & Création (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Sélection Audio */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Music size={14} className="text-amber-400" />
                  1. Piste Sonore
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Upload size={12} />
                  <span>Importer MP3 / WAV</span>
                </button>
              </div>

              {/* Sélection rapide depuis le catalogue */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Morceau du catalogue KKD :</label>
                <select
                  value={trackTitle}
                  onChange={(e) => {
                    const found = releases.find(r => r.title === e.target.value);
                    if (found) handleSelectRelease(found);
                  }}
                  className="w-full bg-[#141B2D] border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choisir un morceau officiel --</option>
                  {releases.map((rel) => (
                    <option key={rel.id} value={rel.title}>
                      {rel.title} · {rel.artist_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ajustement du segment audio */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Début de l'extrait :</span>
                  <span className="font-mono text-amber-400 tabular-nums font-bold">
                    {Math.floor(audioStartOffset / 60)}:{String(Math.floor(audioStartOffset % 60)).padStart(2, '0')}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(10, Math.floor(audioDuration - selectedDuration))}
                  value={audioStartOffset}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAudioStartOffset(val);
                    if (audioRef.current) {
                      audioRef.current.currentTime = val;
                    }
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0:00</span>
                  <span>Extrait de {selectedDuration}s</span>
                  <span>{Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* 2. Format & Durée */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-border/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Smartphone size={14} className="text-amber-400" />
                2. Format & Réseau Social
              </span>

              {/* Ratios */}
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFormat === fmt.id
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-[#141B2D]/60 border-border/60 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <span className="block text-xs font-bold">{fmt.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{fmt.width}x{fmt.height}</span>
                  </button>
                ))}
              </div>

              {/* Durée */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Durée de la vidéo :</label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.duration}
                      onClick={() => setSelectedDuration(opt.duration)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedDuration === opt.duration
                          ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                          : 'bg-[#141B2D]/60 border-border/60 text-muted-foreground hover:text-white'
                      }`}
                    >
                      <span className="block text-xs">{opt.duration} secondes</span>
                      <span className="block text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                        {opt.credits} crédit{opt.credits > 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Thèmes Visuels & Motion */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-border/60 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers size={14} className="text-amber-400" />
                3. Preset Visuel & Animation
              </span>

              <div className="space-y-2">
                {VIDEO_THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setSelectedTheme(th.id);
                      setAccentColor(th.accentColor);
                      setSecondaryColor(th.secondaryColor);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedTheme === th.id
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-[#141B2D]/60 border-border/60 text-muted-foreground hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold text-white">{th.name}</span>
                      <span className="block text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {th.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: th.accentColor }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: th.secondaryColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Textes & Personnalisation */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-border/60 space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sliders size={14} className="text-amber-400" />
                4. Textes & Pochette
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Titre du morceau :</label>
                  <input
                    type="text"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="w-full bg-[#141B2D] border border-border/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Nom de l'artiste :</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full bg-[#141B2D] border border-border/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Punchline ou Paroles :</label>
                <input
                  type="text"
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  placeholder="Ex: Le beat qui fait bouger tout Dakar !"
                  className="w-full bg-[#141B2D] border border-border/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pochette :</span>
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-7 h-7 rounded object-cover border border-border" />
                  ) : (
                    <span className="text-[11px] text-slate-500">Par défaut</span>
                  )}
                </div>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Changer la pochette
                </button>
              </div>
            </div>

          </div>

          {/* Panneau Central & Droit : Prévisualisation Canvas & Export (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Cadre de Prévisualisation Directe */}
            <div className="p-6 rounded-2xl bg-[#0D121D] border border-border/70 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Prévisualisation Temps Réel (60 FPS)
                  </span>
                </div>

                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  Format : {selectedFormat.includes('9_16') ? 'Vertical 9:16' : 'Paysage 16:9'}
                </span>
              </div>

              {/* Conteneur Canvas adaptatif */}
              <div className="relative flex items-center justify-center p-3 rounded-2xl bg-black/60 border border-border/50 shadow-2xl overflow-hidden max-w-full">
                <canvas
                  ref={canvasRef}
                  className={`rounded-xl shadow-2xl object-contain max-h-[520px] ${
                    selectedFormat.includes('9_16') ? 'aspect-[9/16] w-auto' : 'aspect-[16/9] w-full'
                  }`}
                />

                {/* Bouton Play/Pause superposé au survol ou pause */}
                <button
                  onClick={handleTogglePlay}
                  className={`absolute p-4 rounded-full bg-amber-500/90 text-slate-950 shadow-xl hover:scale-110 transition-all ${
                    isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-90'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
              </div>

              {/* Barre de contrôle du lecteur */}
              <div className="w-full mt-4 flex items-center justify-between gap-4 px-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-white text-xs font-semibold transition-colors"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Préécouter l\'extrait'}</span>
                </button>

                <div className="text-xs font-mono text-muted-foreground tabular-nums">
                  Position : {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Bouton d'Action de Génération Vidéo */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121826] to-[#1E1B2E] border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Prêt à exporter
                </span>
                <h3 className="text-base font-bold text-white">
                  Générer le clip vidéo pour TikTok & Reels
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coût de l'opération : <strong className="text-amber-400 font-mono tabular-nums">{currentDurationOpt.credits} crédit{currentDurationOpt.credits > 1 ? 's' : ''}</strong> (Solde : {credits})
                </p>
              </div>

              <button
                onClick={handleStartGeneration}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider shrink-0"
              >
                <Sparkles size={16} />
                <span>Générer la vidéo MP4</span>
              </button>
            </div>

            {/* Historique des vidéos générées */}
            {userProjects.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0D121D] border border-border/60">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mes clips récents ({userProjects.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userProjects.slice(0, 4).map((proj, idx) => (
                    <div
                      key={proj.id || idx}
                      className="p-3 rounded-xl bg-[#141B2D]/70 border border-border/40 flex items-center gap-3 hover:border-border transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-border/50">
                        {proj.thumbnail_url ? (
                          <img src={proj.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Film size={18} className="text-amber-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-white truncate">{proj.title}</span>
                        <span className="block text-[11px] text-muted-foreground truncate">{proj.artist_name}</span>
                        <span className="block text-[10px] text-amber-400 font-mono mt-0.5">
                          {proj.duration}s · {proj.format?.includes('9_16') ? '9:16' : '16:9'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Modal d'Achat de Crédits / Abonnements */}
      <CreditModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        user={user}
        currentCredits={credits}
        onCreditsUpdated={(newBal) => setCredits(newBal)}
      />

      {/* Modal d'Exportation & Partage TikTok */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        status={exportStatus}
        progress={exportProgress}
        result={exportResult}
        projectDetails={{
          title: trackTitle,
          artist: artistName,
          format: selectedFormat,
          theme: selectedTheme
        }}
        onReset={() => {
          setExportModalOpen(false);
          setExportStatus('idle');
        }}
      />
    </div>
  );
}
