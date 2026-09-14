import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { usePlayer } from '@/lib/PlayerContext';
import { artistSyncService } from '@/services/artistSyncService';
import SubmissionLinkImporter from '@/components/partner/SubmissionLinkImporter';
import SubmissionTracklistEditor from '@/components/partner/SubmissionTracklistEditor';
import {
  Music,
  X,
  Upload,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  FileAudio,
  Image as ImageIcon,
  DollarSign,
  Trash2,
  Headphones,
  Sliders,
  Disc,
  Layers,
  ListMusic,
} from 'lucide-react';

const PRESET_GENRES = [
  'Afrobeats',
  'Mbalax',
  'Rap Galsen',
  'Amapiano',
  'Afro-Pop',
  'R&B / Soul',
  'Drill',
  'Zouglou',
  'Acoustique',
  'Reggae / Dancehall',
];

const PRESET_MOODS = [
  'Énergique',
  'Dansant',
  'Mélancolique',
  'Romantique',
  'Festif',
  'Spirituel / Méditatif',
  'Urbain / Street',
];

const PRESET_LANGUAGES = ['Wolof', 'Français', 'Anglais', 'Mandingue', 'Peul / Pulaar', 'Sérère'];

const SAMPLE_COVERS = [
  {
    title: 'Afro Vibes Gold',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Acoustic Soul',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Dakar Club Lights',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Modern Vinyl',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=80',
  },
];

const SAMPLE_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const QUICK_PRICES = [500, 1000, 2000, 5000];

export default function SongSubmissionModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { playTrack } = usePlayer();

  // Stepper state: 1: Metadata · 2: Files & Audio · 3: Review & Submit · 4: Success
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    format: 'single', // 'single' | 'ep' | 'album'
    tracks: [
      {
        id: 'trk_init_1',
        track_number: 1,
        title: '',
        featuring_artist: '',
        audio_file_url: '',
        duration: 180,
        is_for_sale: false,
      },
    ],
    artistMode: 'existing', // 'existing' | 'new'
    artist_id: '',
    artist_name: '',
    featuring: '',
    genre: 'Afrobeats',
    custom_genre: '',
    release_year: new Date().getFullYear(),
    language: 'Wolof',
    mood: 'Énergique',
    isrc: '',
    composer: '',
    producer: '',
    is_explicit: false,

    // Media
    cover_url: '',
    cover_name: '',
    cover_size: '',
    audio_url: '',
    audio_name: '',
    audio_size_mb: '',
    audio_duration: 0,

    // Editorial
    lyrics: '',
    description: '',

    // Distribution & Pricing
    is_for_sale: false,
    price: 1000,
    streaming_platform: 'spotify',
    streaming_link: '',
    terms_accepted: true,
  });

  // Handler for link resolution (Spotify, Deezer, Apple Music, YouTube)
  const handleLinkResolved = (resolved) => {
    if (!resolved) return;
    const isAlbum = resolved.format === 'album' || (resolved.tracks && resolved.tracks.length > 6);
    const isEp = resolved.format === 'ep' || (resolved.tracks && resolved.tracks.length > 1 && resolved.tracks.length <= 6);
    const detectedFormat = isAlbum ? 'album' : isEp ? 'ep' : 'single';

    const cleanTracks = (resolved.tracks && resolved.tracks.length > 0)
      ? resolved.tracks.map((t, idx) => ({
          id: `trk_resolved_${idx + 1}`,
          track_number: idx + 1,
          title: t.title || `Piste ${idx + 1}`,
          featuring_artist: t.featuring_artist || '',
          audio_file_url: t.audio_file_url || '',
          duration: t.duration || 180,
          is_for_sale: false,
        }))
      : [
          {
            id: 'trk_resolved_1',
            track_number: 1,
            title: resolved.title || form.title,
            featuring_artist: resolved.featuring || '',
            audio_file_url: resolved.audio_file_url || '',
            duration: 180,
            is_for_sale: false,
          },
        ];

    setForm((prev) => ({
      ...prev,
      title: resolved.title || prev.title,
      artist_name: resolved.artist_name || prev.artist_name,
      featuring: resolved.featuring || prev.featuring,
      cover_url: resolved.cover_url || prev.cover_url,
      cover_name: resolved.cover_url ? `${resolved.title} (Pochette)` : prev.cover_name,
      release_year: resolved.release_year || prev.release_year,
      format: detectedFormat,
      streaming_link: resolved.spotify_url || resolved.deezer_url || resolved.apple_music_url || resolved.youtube_url || prev.streaming_link,
      streaming_platform: resolved.platform || prev.streaming_platform,
      audio_url: resolved.audio_file_url || cleanTracks[0]?.audio_file_url || prev.audio_url,
      audio_name: cleanTracks[0]?.title || 'Extrait audio officiel',
      tracks: cleanTracks,
    }));

    toast({
      title: 'Projet importé avec succès !',
      description: `${resolved.title} (${detectedFormat === 'single' ? 'Single' : `${cleanTracks.length} morceaux regroupés`}) a été pré-rempli.`,
    });
  };

  // Fetch official label artists
  const { data: artists = [] } = useQuery({
    queryKey: ['artists-modal-list'],
    queryFn: () => base44.entities.Artist.list('name'),
    staleTime: 5 * 60 * 1000,
  });

  // Set default artist when list loads or user is available
  useEffect(() => {
    if (!form.artist_id && artists.length > 0) {
      // Find artist matching user name or take the first
      const match = artists.find(
        (a) =>
          a.name.toLowerCase() === (user?.full_name || '').toLowerCase() ||
          a.slug === 'sidy-diop'
      );
      const chosen = match || artists[0];
      if (chosen) {
        setForm((prev) => ({
          ...prev,
          artist_id: chosen.id,
          artist_name: chosen.name,
        }));
      }
    }
  }, [artists, user, form.artist_id]);

  // Audio Preview Player in Step 2
  const audioPreviewRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // File Inputs Refs
  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Stop audio preview when modal closes or unmounts
  useEffect(() => {
    if (!isOpen && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Cover Art Upload Handler
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const url = res.file_url || URL.createObjectURL(file);
      updateField('cover_url', url);
      updateField('cover_name', file.name);
      updateField('cover_size', (file.size / (1024 * 1024)).toFixed(2) + ' Mo');
      toast({
        title: 'Pochette importée',
        description: `${file.name} est prête.`,
      });
    } catch {
      toast({
        title: 'Erreur import pochette',
        description: "Impossible d'importer l'image. Veuillez réessayer.",
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Audio Master File Upload Handler
  const handleAudioFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAudio(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const url = res.file_url || URL.createObjectURL(file);
      updateField('audio_url', url);
      updateField('audio_name', file.name);
      updateField('audio_size_mb', (file.size / (1024 * 1024)).toFixed(2) + ' Mo');

      // Attempt to load duration
      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration) {
          updateField('audio_duration', Math.round(tempAudio.duration));
        }
      });

      toast({
        title: 'Fichier Master audio chargé',
        description: `${file.name} est prêt pour l'écoute.`,
      });
    } catch {
      toast({
        title: 'Erreur import audio',
        description: "Impossible d'importer le fichier audio.",
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Toggle In-Modal Audio Preview
  const togglePlayAudioPreview = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlayingAudio(true);
    } else {
      audio.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPreviewRef.current) {
      setAudioCurrentTime(audioPreviewRef.current.currentTime);
      setAudioDuration(audioPreviewRef.current.duration || 0);
    }
  };

  const handleAudioSeek = (e) => {
    const seekTime = Number(e.target.value);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.currentTime = seekTime;
      setAudioCurrentTime(seekTime);
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Validation
  const isStep1Valid = Boolean(form.title.trim() && form.artist_name.trim() && form.genre);
  const isStep2Valid = Boolean(
    form.cover_url &&
      (form.format === 'single'
        ? form.audio_url
        : form.tracks &&
          form.tracks.length > 0 &&
          form.tracks.some((t) => t.audio_file_url || (t.title && t.title.trim())))
  );
  const isStep3Valid = form.terms_accepted;

  // Final Submission
  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return;
    setSubmitting(true);

    try {
      const selectedGenre = form.custom_genre.trim() || form.genre;
      const fullArtistTitle = form.featuring.trim()
        ? `${form.artist_name.trim()} feat. ${form.featuring.trim()}`
        : form.artist_name.trim();

      // Format tracks for publication & release (Architecture Album / EP)
      const finalTracks =
        form.format === 'single'
          ? [
              {
                track_number: 1,
                title: form.title.trim(),
                artist_name: fullArtistTitle,
                audio_file_url: form.audio_url,
                duration: form.audio_duration || 180,
                is_for_sale: Boolean(form.is_for_sale),
                access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
                is_free: !form.is_for_sale,
                access_control: form.is_for_sale ? 'paid_only' : 'free_public',
                price: form.is_for_sale ? Number(form.price) : 0,
              },
            ]
          : form.tracks.map((trk, idx) => {
              const trkFeat = trk.featuring_artist ? trk.featuring_artist.trim() : '';
              const trkArtist = trkFeat
                ? `${form.artist_name.trim()} feat. ${trkFeat}`
                : form.artist_name.trim();
              return {
                track_number: idx + 1,
                title: (trk.title && trk.title.trim()) || `Piste ${idx + 1}`,
                artist_name: trkArtist,
                featuring_artist: trkFeat,
                audio_file_url: trk.audio_file_url || form.audio_url || '',
                duration: trk.duration || 180,
                is_for_sale: Boolean(form.is_for_sale),
                access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
                is_free: !form.is_for_sale,
                access_control: form.is_for_sale ? 'paid_only' : 'free_public',
                price: form.is_for_sale ? Number(form.price) : 0,
              };
            });

      const primaryAudioUrl = form.audio_url || finalTracks[0]?.audio_file_url || '';

      const publicationData = {
        partner_email: user?.email || 'artiste@kkdmusic.com',
        partner_name: user?.full_name || form.artist_name,
        content_type: 'sortie_musicale',
        release_type: form.format,
        title: form.title.trim(),
        artist_name: fullArtistTitle,
        artist_id: form.artistMode === 'existing' ? form.artist_id : '',
        genre: selectedGenre,
        release_year: Number(form.release_year) || new Date().getFullYear(),
        language: form.language,
        mood: form.mood,
        composer: form.composer,
        producer: form.producer,
        isrc: form.isrc.trim(),
        is_explicit: form.is_explicit,
        cover_url: form.cover_url,
        file_url: primaryAudioUrl,
        audio_file_url: primaryAudioUrl,
        description: form.description.trim(),
        lyrics: form.lyrics.trim(),
        is_for_sale: Boolean(form.is_for_sale),
        access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
        is_free: !form.is_for_sale,
        access_control: form.is_for_sale ? 'paid_only' : 'free_public',
        price: form.is_for_sale ? Number(form.price) : 0,
        streaming_platform: form.streaming_platform,
        streaming_link: form.streaming_link.trim(),
        status: 'publie', // Immediately available
        created_date: new Date().toISOString(),
        tracks: finalTracks,
      };

      // 1. Create PartnerPublication record
      const pubRecord = await base44.entities.PartnerPublication.create(publicationData);

      // 2. Synchronize collaborating & featuring artist profiles
      try {
        await artistSyncService.syncFeaturingArtists({
          mainArtistName: form.artist_name.trim(),
          featuringString: form.featuring.trim(),
          releaseTitle: form.title.trim(),
          releaseId: pubRecord.id,
          coverUrl: form.cover_url,
        });

        // Also synchronize featuring artists from specific tracks
        for (const trk of finalTracks) {
          if (trk.featuring_artist) {
            await artistSyncService.syncFeaturingArtists({
              mainArtistName: form.artist_name.trim(),
              featuringString: trk.featuring_artist,
              releaseTitle: trk.title,
              releaseId: pubRecord.id,
              coverUrl: form.cover_url,
            });
          }
        }
      } catch (syncErr) {
        console.warn('Featuring sync non-blocking warning:', syncErr);
      }

      // 3. Check for existing release to prevent duplicates (même titre, ISRC ou lien streaming)
      let existingReleases = [];
      try {
        existingReleases = await base44.entities.Release.list();
      } catch {
        existingReleases = [];
      }

      const duplicateCheck = artistSyncService.checkDuplicateRelease(
        {
          title: form.title.trim(),
          artist_name: form.artist_name.trim(),
          isrc: form.isrc.trim(),
          streaming_link: form.streaming_link.trim(),
          spotify_url: form.streaming_platform === 'spotify' ? form.streaming_link.trim() : '',
          deezer_url: form.streaming_platform === 'deezer' ? form.streaming_link.trim() : '',
          apple_music_url: form.streaming_platform === 'apple_music' ? form.streaming_link.trim() : '',
          youtube_url: form.streaming_platform === 'youtube' ? form.streaming_link.trim() : '',
          tracks: finalTracks,
        },
        existingReleases
      );

      let releaseRecord;
      let wasUpdatedDuplicate = false;

      if (duplicateCheck.isDuplicate && duplicateCheck.existingRelease) {
        // Mettre à jour la chanson existante au lieu de créer un doublon
        releaseRecord = await base44.entities.Release.update(duplicateCheck.existingRelease.id, {
          ...duplicateCheck.mergedUpdates,
          title: form.title.trim(),
          artist_name: fullArtistTitle,
          genre: selectedGenre,
          release_type: form.format,
          cover_url: form.cover_url || duplicateCheck.existingRelease.cover_url,
          audio_file_url: primaryAudioUrl || duplicateCheck.existingRelease.audio_file_url,
          description: form.description.trim() || duplicateCheck.existingRelease.description,
          lyrics: form.lyrics.trim() || duplicateCheck.existingRelease.lyrics,
          is_for_sale: Boolean(form.is_for_sale),
          access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
          is_free: !form.is_for_sale,
          access_control: form.is_for_sale ? 'paid_only' : 'free_public',
          price: form.is_for_sale ? Number(form.price) : 0,
          status: 'publie',
          streaming_link: form.streaming_link.trim() || duplicateCheck.existingRelease.streaming_link,
          streaming_platform: form.streaming_platform || duplicateCheck.existingRelease.streaming_platform,
          tracks: finalTracks.length > 0 ? finalTracks : (duplicateCheck.existingRelease.tracks || []),
        });
        wasUpdatedDuplicate = true;
      } else {
        // Register new playable Release on the platform with grouped tracks
        releaseRecord = await base44.entities.Release.create({
          title: form.title.trim(),
          artist_name: fullArtistTitle,
          artist_id: form.artistMode === 'existing' ? form.artist_id : `art_custom_${Date.now()}`,
          genre: selectedGenre,
          release_type: form.format,
          cover_url: form.cover_url,
          audio_file_url: primaryAudioUrl,
          release_date: new Date().toISOString(),
          description: form.description.trim(),
          lyrics: form.lyrics.trim(),
          is_for_sale: Boolean(form.is_for_sale),
          access_mode: form.is_for_sale ? 'en_vente' : 'gratuit',
          is_free: !form.is_for_sale,
          access_control: form.is_for_sale ? 'paid_only' : 'free_public',
          price: form.is_for_sale ? Number(form.price) : 0,
          plays_count: 1,
          likes_count: 0,
          is_featured: false,
          status: 'publie',
          streaming_link: form.streaming_link.trim(),
          streaming_platform: form.streaming_platform,
          tracks: finalTracks,
        });
      }

      // Invalidate relevant React Query caches for instantaneous UI updates
      queryClient.invalidateQueries({ queryKey: ['partner-publications'] });
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['all-releases'] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.invalidateQueries({ queryKey: ['featured-releases'] });

      setCreatedItem({ ...publicationData, id: releaseRecord.id || pubRecord.id });
      setStep(4); // Move to success step

      toast({
        title: wasUpdatedDuplicate
          ? 'Morceau mis à jour (Doublon évité) !'
          : form.format === 'single'
          ? 'Morceau soumis et publié avec succès !'
          : 'Projet soumis et publié avec succès !',
        description: wasUpdatedDuplicate
          ? `"${form.title}" existait déjà sur la plateforme (${duplicateCheck.matchReason}). Ses données et pistes ont été mises à jour sans doublon.`
          : `"${form.title}" (${finalTracks.length} titre${finalTracks.length > 1 ? 's' : ''}) est désormais disponible sur KKD Music.`,
      });
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: 'Erreur lors de la soumission',
        description: 'Veuillez vérifier vos fichiers et réessayer.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-3xl bg-[#11141d] border border-white/[0.1] rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Hidden Audio Element for Step 2 preview */}
        {form.audio_url && (
          <audio
            ref={audioPreviewRef}
            src={form.audio_url}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />
        )}

        {/* ═══ Header ═══ */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#151a26] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              <Music size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  Soumission de Morceau
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                  Label & Artiste
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Soumettez votre single pour diffusion et monétisation sur KKD Music
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ═══ Stepper Indicator ═══ */}
        {step < 4 && (
          <div className="px-5 sm:px-8 py-3.5 border-b border-white/[0.06] bg-[#0e1119] shrink-0">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {[
                { num: 1, label: 'Métadonnées', icon: Disc },
                { num: 2, label: 'Audio & Pochette', icon: FileAudio },
                { num: 3, label: 'Révision & Envoi', icon: Sliders },
              ].map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.num;
                const isDone = step > s.num;

                return (
                  <React.Fragment key={s.num}>
                    <button
                      onClick={() => {
                        if (s.num === 1) setStep(1);
                        if (s.num === 2 && isStep1Valid) setStep(2);
                        if (s.num === 3 && isStep1Valid && isStep2Valid) setStep(3);
                      }}
                      className="flex items-center gap-2 group cursor-pointer"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : isActive
                            ? 'bg-primary text-white shadow-md shadow-primary/40 ring-4 ring-primary/20'
                            : 'bg-white/[0.08] text-zinc-400 group-hover:text-zinc-200'
                        }`}
                      >
                        {isDone ? <Check size={14} strokeWidth={2.8} /> : s.num}
                      </div>
                      <span
                        className={`text-xs font-bold hidden sm:inline transition-colors ${
                          isActive ? 'text-white' : isDone ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 sm:mx-4 rounded-full transition-colors ${
                          step > idx + 1 ? 'bg-emerald-500/70' : 'bg-white/[0.08]'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Modal Body (Scrollable) ═══ */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {/* ────────────────────────── STEP 1: METADATA ────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                className="space-y-6"
              >
                {/* Notice Banner */}
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
                  <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <p className="font-bold text-white mb-0.5">Publication & Référencement de Musique</p>
                    Renseignez les informations de votre sortie musicale ou importez-la directement via un lien streaming. Les morceaux d'un album ou d'un EP restent rigoureusement groupés ensemble.
                  </div>
                </div>

                {/* Direct Link Importer (Spotify, Deezer, Apple Music, YouTube) */}
                <SubmissionLinkImporter
                  onResolved={handleLinkResolved}
                  currentFormat={form.format}
                />

                {/* Format / Architecture Selector: Single vs EP vs Album */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center justify-between">
                    <span>Architecture de la Sortie <span className="text-primary">*</span></span>
                    <span className="text-[11px] text-zinc-400 lowercase">
                      {form.format === 'single'
                        ? '1 morceau'
                        : form.format === 'ep'
                        ? `${form.tracks.length} titres (EP)`
                        : `${form.tracks.length} titres (Album)`}
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateField('format', 'single')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        form.format === 'single'
                          ? 'bg-primary/15 border-primary text-white shadow-lg shadow-primary/15 ring-1 ring-primary/40'
                          : 'bg-[#181d29] border-white/[0.08] text-zinc-400 hover:border-white/[0.2] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Disc size={18} className={form.format === 'single' ? 'text-primary' : 'text-zinc-400'} />
                        {form.format === 'single' && <CheckCircle2 size={14} className="text-primary" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Single</p>
                        <p className="text-[10px] text-zinc-400">1 seul titre individuel</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField('format', 'ep')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        form.format === 'ep'
                          ? 'bg-primary/15 border-primary text-white shadow-lg shadow-primary/15 ring-1 ring-primary/40'
                          : 'bg-[#181d29] border-white/[0.08] text-zinc-400 hover:border-white/[0.2] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Layers size={18} className={form.format === 'ep' ? 'text-primary' : 'text-zinc-400'} />
                        {form.format === 'ep' && <CheckCircle2 size={14} className="text-primary" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">EP (Mini-album)</p>
                        <p className="text-[10px] text-zinc-400">2 à 6 titres groupés</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField('format', 'album')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        form.format === 'album'
                          ? 'bg-primary/15 border-primary text-white shadow-lg shadow-primary/15 ring-1 ring-primary/40'
                          : 'bg-[#181d29] border-white/[0.08] text-zinc-400 hover:border-white/[0.2] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <ListMusic size={18} className={form.format === 'album' ? 'text-primary' : 'text-zinc-400'} />
                        {form.format === 'album' && <CheckCircle2 size={14} className="text-primary" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Album Complet</p>
                        <p className="text-[10px] text-zinc-400">7 titres et plus</p>
                      </div>
                    </button>
                  </div>
                  {form.format !== 'single' && (
                    <p className="text-[11px] text-emerald-400/90 font-medium pt-0.5">
                      ✓ Architecture Album garantie : tous les titres seront groupés ensemble sous cette sortie.
                    </p>
                  )}
                </div>

                {/* Song / Album Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                      {form.format === 'single' ? 'Titre du morceau' : 'Titre du projet / Album'} <span className="text-primary">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-500">{form.title.length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder={form.format === 'single' ? "Ex : Sama Guèl, Dakar Nights, Bamba…" : "Ex : Bamba Reloaded (Album), Timis (EP)…"}
                    className="w-full bg-[#181d29] border border-white/[0.1] focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                {/* Artist Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                      Artiste Principal <span className="text-primary">*</span>
                    </label>
                    <div className="flex items-center gap-1 bg-[#181d29] p-1 rounded-full border border-white/[0.08] text-[11px]">
                      <button
                        type="button"
                        onClick={() => updateField('artistMode', 'existing')}
                        className={`px-3 py-1 rounded-full font-bold transition-colors ${
                          form.artistMode === 'existing'
                            ? 'bg-primary text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Artiste du Label
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('artistMode', 'new')}
                        className={`px-3 py-1 rounded-full font-bold transition-colors ${
                          form.artistMode === 'new'
                            ? 'bg-primary text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Nouvel Artiste
                      </button>
                    </div>
                  </div>

                  {form.artistMode === 'existing' ? (
                    <select
                      value={form.artist_id}
                      onChange={(e) => {
                        const selected = artists.find((a) => a.id === e.target.value);
                        updateField('artist_id', e.target.value);
                        if (selected) updateField('artist_name', selected.name);
                      }}
                      className="w-full bg-[#181d29] border border-white/[0.1] focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                    >
                      {artists.map((art) => (
                        <option key={art.id} value={art.id} className="bg-[#181d29] text-white">
                          {art.name} ({art.genre || 'Afro-Mbalax'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.artist_name}
                      onChange={(e) => updateField('artist_name', e.target.value)}
                      placeholder="Nom de scène de l'artiste…"
                      className="w-full bg-[#181d29] border border-white/[0.1] focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  )}
                </div>

                {/* Featuring Artist */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-1.5 block">
                    Artiste en Featuring (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.featuring}
                    onChange={(e) => updateField('featuring', e.target.value)}
                    placeholder="Ex : Dip Doundou Guiss, Wally Seck…"
                    className="w-full bg-[#181d29] border border-white/[0.1] focus:border-primary rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                {/* Genre Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                      Genre Musical <span className="text-primary">*</span>
                    </label>
                    <span className="text-xs text-primary font-bold">{form.genre}</span>
                  </div>

                  {/* Preset Genre Chips */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_GENRES.map((g) => {
                      const isSelected = form.genre === g && !form.custom_genre;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            updateField('genre', g);
                            updateField('custom_genre', '');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                              : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] border border-white/[0.06]'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Genre Input */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={form.custom_genre}
                      onChange={(e) => {
                        updateField('custom_genre', e.target.value);
                        if (e.target.value.trim()) updateField('genre', e.target.value);
                      }}
                      placeholder="Autre genre personnalisé (ex : Trap Sabar, Afro-Drill)…"
                      className="w-full bg-[#181d29] border border-white/[0.08] focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Complementary Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-white/[0.06]">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5 block">
                      Année de sortie
                    </label>
                    <input
                      type="number"
                      value={form.release_year}
                      onChange={(e) => updateField('release_year', e.target.value)}
                      className="w-full bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5 block">
                      Langue principale
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) => updateField('language', e.target.value)}
                      className="w-full bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {PRESET_LANGUAGES.map((l) => (
                        <option key={l} value={l} className="bg-[#181d29]">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1.5 block">
                      Ambiance / Vibe
                    </label>
                    <select
                      value={form.mood}
                      onChange={(e) => updateField('mood', e.target.value)}
                      className="w-full bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {PRESET_MOODS.map((m) => (
                        <option key={m} value={m} className="bg-[#181d29]">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Credits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1 block">
                      Compositeur / Beatmaker
                    </label>
                    <input
                      type="text"
                      value={form.producer}
                      onChange={(e) => updateField('producer', e.target.value)}
                      placeholder="Ex : Karabalik Beatz, Papi Oumar…"
                      className="w-full bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-1 block">
                      Code ISRC (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={form.isrc}
                      onChange={(e) => updateField('isrc', e.target.value.toUpperCase())}
                      placeholder="SN-KKD-26-00001"
                      className="w-full bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────── STEP 2: COVER ART & AUDIO ────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                className="space-y-6"
              >
                {/* 1. COVER ART SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                        <ImageIcon size={15} className="text-primary" /> Pochette Officielle du Morceau{' '}
                        <span className="text-primary">*</span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Format carré 1:1, minimum 1400×1400 px recommandé (JPG, PNG, WEBP).
                      </p>
                    </div>

                    {form.cover_url && (
                      <button
                        type="button"
                        onClick={() => {
                          updateField('cover_url', '');
                          updateField('cover_name', '');
                        }}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Retirer
                      </button>
                    )}
                  </div>

                  {form.cover_url ? (
                    <div className="p-4 rounded-2xl bg-[#151924] border border-white/[0.1] flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-white/[0.1] shadow-lg">
                        <img
                          src={form.cover_url}
                          alt="Pochette"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">
                            {form.cover_name || 'Pochette validée'}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Format 1:1
                          </span>
                        </div>
                        {form.cover_size && (
                          <p className="text-xs text-zinc-400 mt-0.5">{form.cover_size}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="text-xs text-primary hover:underline font-bold mt-2 inline-block"
                        >
                          Remplacer par une autre image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/[0.02] hover:bg-primary/[0.03] rounded-2xl p-6 text-center cursor-pointer transition-all group"
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.06] group-hover:bg-primary/20 text-zinc-300 group-hover:text-primary flex items-center justify-center mx-auto mb-3 transition-colors">
                        <Upload size={22} />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">
                        {isUploadingCover
                          ? 'Chargement de la pochette…'
                          : 'Cliquez ou glissez-déposez votre pochette'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        PNG ou JPG haute résolution jusqu'à 10 Mo
                      </p>
                    </div>
                  )}

                  {/* Sample Cover Presets (Optional quick selection) */}
                  {!form.cover_url && (
                    <div>
                      <p className="text-[11px] text-zinc-400 mb-2 font-medium">
                        Ou choisissez un modèle de pochette studio KKD :
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {SAMPLE_COVERS.map((sc) => (
                          <button
                            key={sc.title}
                            type="button"
                            onClick={() => {
                              updateField('cover_url', sc.url);
                              updateField('cover_name', sc.title);
                            }}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.08] hover:border-primary transition-all shadow"
                          >
                            <img
                              src={sc.url}
                              alt={sc.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold text-white p-1 text-center">
                              {sc.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. AUDIO / TRACKLIST ARCHITECTURE SECTION */}
                {form.format === 'single' ? (
                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                          <FileAudio size={15} className="text-primary" /> Fichier Audio Master{' '}
                          <span className="text-primary">*</span>
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          WAV, FLAC ou MP3 320 kbps (ou extrait déjà lié par votre lien streaming).
                        </p>
                      </div>

                      {form.audio_url && (
                        <button
                          type="button"
                          onClick={() => {
                            if (audioPreviewRef.current) audioPreviewRef.current.pause();
                            setIsPlayingAudio(false);
                            updateField('audio_url', '');
                            updateField('audio_name', '');
                          }}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Retirer
                        </button>
                      )}
                    </div>

                    {form.audio_url ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#151924] border border-white/[0.1] space-y-4 shadow-xl">
                        {/* File Details Bar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                              <Headphones size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md">
                                {form.audio_name || 'Master audio chargé'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span>HQ Audio 24-bit / 44.1kHz</span>
                                {form.audio_size_mb && (
                                  <>
                                    <span>•</span>
                                    <span>{form.audio_size_mb}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="text-xs text-primary hover:underline font-bold"
                          >
                            Remplacer
                          </button>
                        </div>

                        {/* In-Modal Audio Player Controls */}
                        <div className="bg-black/40 rounded-xl p-3.5 border border-white/[0.06] flex items-center gap-3">
                          <button
                            type="button"
                            onClick={togglePlayAudioPreview}
                            className="w-11 h-11 rounded-full bg-primary hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-all shrink-0 cursor-pointer"
                            aria-label={isPlayingAudio ? 'Pause' : 'Play'}
                          >
                            {isPlayingAudio ? (
                              <Pause size={18} fill="currentColor" />
                            ) : (
                              <Play size={18} fill="currentColor" className="ml-0.5" />
                            )}
                          </button>

                          {/* Animated Waveform Simulation */}
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                              <span className="text-white font-bold">
                                {formatSeconds(audioCurrentTime)}
                              </span>
                              <span>{formatSeconds(audioDuration)}</span>
                            </div>

                            <input
                              type="range"
                              min="0"
                              max={audioDuration || 100}
                              value={audioCurrentTime}
                              onChange={handleAudioSeek}
                              className="w-full h-1.5 bg-white/[0.1] rounded-full accent-primary cursor-pointer"
                            />
                          </div>

                          {/* Mute toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              if (audioPreviewRef.current) {
                                audioPreviewRef.current.muted = !isMuted;
                                setIsMuted(!isMuted);
                              }
                            }}
                            className="text-zinc-400 hover:text-white p-2"
                          >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => audioInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 hover:border-primary/60 bg-white/[0.02] hover:bg-primary/[0.03] rounded-2xl p-6 text-center cursor-pointer transition-all group"
                      >
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioFileChange}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] group-hover:bg-primary/20 text-zinc-300 group-hover:text-primary flex items-center justify-center mx-auto mb-3 transition-colors">
                          <Upload size={22} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">
                          {isUploadingAudio
                            ? 'Téléversement du fichier audio en cours…'
                            : 'Cliquez ou glissez-déposez le master audio'}
                        </p>
                        <p className="text-xs text-zinc-500">WAV, FLAC ou MP3 jusqu'à 80 Mo</p>

                        {/* Quick test demo audio button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField('audio_url', SAMPLE_AUDIO_URL);
                            updateField('audio_name', 'KKD_Studio_Master_Demo.wav');
                            updateField('audio_size_mb', '34.2 Mo');
                            updateField('audio_duration', 214);
                          }}
                          className="mt-3 text-xs text-primary hover:underline font-bold inline-flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
                        >
                          <Sparkles size={13} /> Utiliser un audio de démonstration pour tester
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/[0.06]">
                    <SubmissionTracklistEditor
                      tracks={form.tracks}
                      onChange={(updatedTracks) => updateField('tracks', updatedTracks)}
                      artistName={form.artist_name}
                      format={form.format}
                    />
                  </div>
                )}

                {/* 3. CONTRÔLE D'ACCÈS DE LA PISTE : GRATUIT OU EN VENTE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#151924] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" /> Contrôle d'accès de la piste
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Choisissez si ce morceau sera disponible en écoute libre ou nécessitera un achat préalable.
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                        form.is_for_sale
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]/30'
                      }`}
                    >
                      {form.is_for_sale ? 'En vente' : 'Gratuit'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: Gratuit */}
                    <button
                      type="button"
                      onClick={() => updateField('is_for_sale', false)}
                      className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                        !form.is_for_sale
                          ? 'bg-[#1ed760]/10 border-[#1ed760] text-white shadow-md'
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          !form.is_for_sale
                            ? 'bg-[#1ed760] text-black font-black'
                            : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white">Gratuit</p>
                          {!form.is_for_sale && (
                            <span className="text-[10px] font-bold text-[#1ed760] uppercase">
                              Actif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          Streaming libre pour tous les auditeurs sur le lecteur KKD.
                        </p>
                      </div>
                    </button>

                    {/* Option 2: En Vente */}
                    <button
                      type="button"
                      onClick={() => updateField('is_for_sale', true)}
                      className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                        form.is_for_sale
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          form.is_for_sale
                            ? 'bg-amber-500 text-black font-black'
                            : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        <DollarSign size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white">En vente</p>
                          {form.is_for_sale && (
                            <span className="text-[10px] font-bold text-amber-400 uppercase">
                              Actif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          Accès verrouillé. Achat direct Wave / OM obligatoire pour écouter.
                        </p>
                      </div>
                    </button>
                  </div>

                  {form.is_for_sale && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-white/[0.06] flex items-center gap-3 flex-wrap"
                    >
                      <span className="text-xs text-zinc-300 font-medium">Prix unitaire :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="100"
                          step="50"
                          value={form.price}
                          onChange={(e) => updateField('price', e.target.value)}
                          className="w-28 bg-[#181d29] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white text-right"
                        />
                        <span className="text-xs font-mono font-bold text-zinc-400">F CFA</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {QUICK_PRICES.slice(0, 3).map((qp) => (
                          <button
                            key={qp}
                            type="button"
                            onClick={() => updateField('price', qp)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                              Number(form.price) === qp
                                ? 'bg-primary text-white'
                                : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]'
                            }`}
                          >
                            {qp} F
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 4. PAROLES & DESCRIPTION (Optionnel) */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-1.5 block">
                      Paroles du morceau (Karaoké & Paroles synchronisées - Optionnel)
                    </label>
                    <textarea
                      rows={3}
                      value={form.lyrics}
                      onChange={(e) => updateField('lyrics', e.target.value)}
                      placeholder="Collez ici les paroles du titre pour l'affichage en direct dans le lecteur…"
                      className="w-full bg-[#181d29] border border-white/[0.08] focus:border-primary rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all resize-y"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────── STEP 3: REVIEW & SUBMIT ────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                className="space-y-6"
              >
                {/* 1. SPOTIFY-STYLE LIVE PREVIEW CARD */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                      Aperçu dans KKD Music
                    </p>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Prêt pour publication
                    </span>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-[#1c222e] to-[#121620] border border-white/[0.1] p-5 shadow-2xl flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-black shrink-0 shadow-2xl border border-white/[0.1]">
                      {form.cover_url ? (
                        <img
                          src={form.cover_url}
                          alt={form.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Disc size={36} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left min-w-0 space-y-1.5">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                          {form.format === 'single' ? 'Single' : form.format === 'ep' ? 'EP' : 'Album'} • {form.release_year}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                          {form.custom_genre || form.genre}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl font-black text-white truncate">
                        {form.title || 'Titre du morceau'}
                      </h3>

                      <p className="text-sm font-semibold text-zinc-300">
                        {form.artist_name}
                        {form.featuring && (
                          <span className="text-zinc-400 font-normal">
                            {' '}
                            feat. {form.featuring}
                          </span>
                        )}
                      </p>

                      <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
                        <span>
                          {form.format === 'single'
                            ? 'Audio Master HQ'
                            : `${form.tracks.length} titres groupés`}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-bold">
                          {form.is_for_sale ? `${form.price} F CFA (Vente)` : 'Streaming Libre'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grouped Tracks List for Album / EP */}
                  {form.format !== 'single' && form.tracks && form.tracks.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#151924] border border-white/[0.08] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                          <ListMusic size={15} className="text-primary" />
                          Morceaux regroupés dans ce projet ({form.tracks.length} pistes)
                        </h4>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                          Architecture {form.format === 'ep' ? 'EP' : 'Album'}
                        </span>
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                        {form.tracks.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate min-w-0">
                              <span className="text-zinc-500 font-mono text-[11px] w-5 shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-white truncate">
                                {t.title || `Piste ${idx + 1}`}
                              </span>
                              {t.featuring_artist && (
                                <span className="text-[10px] text-amber-400 font-medium shrink-0">
                                  feat. {t.featuring_artist}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0 ml-2">
                              {t.audio_file_url ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                  <CheckCircle2 size={12} /> Audio prêt
                                </span>
                              ) : (
                                <span className="text-zinc-500">Audio lié</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. CHOIX DU MODE DE DIFFUSION : GRATUIT OU EN VENTE */}
                <div className="p-5 rounded-2xl bg-[#151924] border border-white/[0.08] space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-[#1ed760]" /> Mode de diffusion sur KKD Music
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Choisissez si votre musique sera accessible gratuitement en streaming libre ou mise en vente exclusive.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Gratuit (Streaming Libre Spotify) */}
                    <button
                      type="button"
                      onClick={() => updateField('is_for_sale', false)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        !form.is_for_sale
                          ? 'bg-[#1ed760]/10 border-[#1ed760] text-white shadow-md'
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-1.5">
                          <CheckCircle2 size={15} /> 100% Gratuit
                        </span>
                        {!form.is_for_sale && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse" />
                        )}
                      </div>
                      <p className="font-bold text-sm text-white">Streaming Libre (Spotify-style)</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Tous les auditeurs peuvent écouter votre morceau librement dans le lecteur sans payer.
                      </p>
                    </button>

                    {/* Option 2: En Vente Exclusive (D2C) */}
                    <button
                      type="button"
                      onClick={() => updateField('is_for_sale', true)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        form.is_for_sale
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <DollarSign size={15} /> Vente Exclusive
                        </span>
                        {form.is_for_sale && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p className="font-bold text-sm text-white">Achat Obligatoire (D2C Wave / OM)</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        Impossible d'écouter sans achat. L'auditeur doit payer pour débloquer le titre.
                      </p>
                    </button>
                  </div>

                  {form.is_for_sale && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-3 border-t border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {QUICK_PRICES.map((qp) => (
                          <button
                            key={qp}
                            type="button"
                            onClick={() => updateField('price', qp)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                              Number(form.price) === qp
                                ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                                : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
                            }`}
                          >
                            {qp.toLocaleString('fr-FR')} F CFA
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="100"
                          step="50"
                          value={form.price}
                          onChange={(e) => updateField('price', e.target.value)}
                          className="w-32 bg-[#181d29] border border-white/[0.1] rounded-xl px-3 py-2 text-sm font-mono font-bold text-white"
                        />
                        <span className="text-xs font-mono font-bold text-zinc-400">F CFA</span>
                      </div>

                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-300">
                        <p className="font-bold">Modèle Gagnant 80% Artiste / 20% KKD</p>
                        <p className="text-zinc-300 text-[11px] mt-0.5">
                          Pour un titre vendu à {form.price} F CFA, vous percevez{' '}
                          <strong>{Math.round(form.price * 0.8)} F CFA net</strong> directement sur
                          votre solde Wave / Orange Money.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 3. EXTERNAL STREAMING LINKS (Optional) */}
                <div className="p-4 rounded-2xl bg-[#151924] border border-white/[0.08] space-y-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                    Lien Externe (Spotify, Apple Music, YouTube - Optionnel)
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={form.streaming_platform}
                      onChange={(e) => updateField('streaming_platform', e.target.value)}
                      className="bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="spotify">Spotify</option>
                      <option value="apple_music">Apple Music</option>
                      <option value="youtube">YouTube</option>
                      <option value="audiomack">Audiomack</option>
                    </select>
                    <input
                      type="url"
                      value={form.streaming_link}
                      onChange={(e) => updateField('streaming_link', e.target.value)}
                      placeholder="https://open.spotify.com/track/..."
                      className="flex-1 bg-[#181d29] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* 4. TERMS & RIGHTS DECLARATION */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={form.terms_accepted}
                    onChange={(e) => updateField('terms_accepted', e.target.checked)}
                    className="mt-0.5 accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="terms-check"
                    className="text-xs text-zinc-300 leading-relaxed cursor-pointer"
                  >
                    Je certifie sur l'honneur détenir l'intégralité des droits d'auteur, droits
                    voisins et droits de master sur ce morceau musical, et j'autorise sa diffusion
                    sur la plateforme KKD Music.
                  </label>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────── STEP 4: SUCCESS CONFIRMATION ────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-5"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 size={44} />
                </div>

                <div>
                  <h3 className="font-display text-3xl font-black text-white">
                    Morceau Publié avec Succès !
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                    Votre titre <strong>"{createdItem?.title || form.title}"</strong> est désormais
                    en ligne et accessible sur le lecteur KKD Music.
                  </p>
                </div>

                {/* Quick Info Box */}
                <div className="max-w-md mx-auto bg-[#151924] border border-white/[0.1] rounded-2xl p-4 flex items-center gap-4 text-left">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/[0.1]">
                    <img
                      src={createdItem?.cover_url || form.cover_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base truncate">
                      {createdItem?.title || form.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {createdItem?.artist_name || form.artist_name}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-primary uppercase">
                      {createdItem?.genre || form.genre}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (createdItem) {
                        playTrack({
                          key: `track-${createdItem.id}`,
                          id: createdItem.id,
                          item_type: 'release',
                          item_id: createdItem.id,
                          title: createdItem.title,
                          artist_name: createdItem.artist_name,
                          cover_url: createdItem.cover_url,
                          audio_url: createdItem.file_url || createdItem.audio_file_url,
                        });
                        onClose();
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xl shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-105"
                  >
                    <Play size={16} fill="currentColor" /> Écouter immédiatement
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Reset form for new submission
                      setStep(1);
                      setForm((prev) => ({
                        ...prev,
                        title: '',
                        cover_url: '',
                        audio_url: '',
                        lyrics: '',
                        description: '',
                      }));
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-sm transition-colors"
                  >
                    Soumettre un autre morceau
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-full text-zinc-400 hover:text-white text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Footer Actions Bar ═══ */}
        {step < 4 && (
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#151a26] flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Précédent
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
            )}

            <div className="flex items-center gap-3">
              {step === 1 && (
                <button
                  type="button"
                  disabled={!isStep1Valid}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 disabled:opacity-40 disabled:hover:bg-primary transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Suivant : Fichiers <ArrowRight size={14} />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  disabled={!isStep2Valid}
                  onClick={() => {
                    // Pause audio preview before moving to review
                    if (audioPreviewRef.current) audioPreviewRef.current.pause();
                    setIsPlayingAudio(false);
                    setStep(3);
                  }}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 disabled:opacity-40 disabled:hover:bg-primary transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Suivant : Aperçu & Vente <ArrowRight size={14} />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={!isStep3Valid || submitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 disabled:opacity-40 disabled:hover:bg-primary transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publication en cours…
                    </>
                  ) : (
                    <>
                      <Check size={15} strokeWidth={2.8} /> Confirmer et Publier
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}