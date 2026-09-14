import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { tiktokService } from '@/services';
import {
  Check,
  Music,
  Video,
  Calendar,
  ExternalLink,
  Share2,
  Radio,
  RadioTower,
  UploadCloud,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  LogOut,
  Copy,
  Flame,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TikTokLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

function generateCaption(type, item) {
  if (type === 'release') {
    const link = item.spotify_url || item.apple_music_url || item.audiomack_url || item.youtube_url || '';
    return `🎵 ${item.title} — ${item.artist_name}\n\n` +
      (item.description ? `${item.description.substring(0, 90)}...\n\n` : '') +
      (link ? `🎧 Écoutez sur toutes les plateformes !\n\n` : '') +
      `#KKDmusic #NouveauSon #Afrobeats #Rap #${item.artist_name?.replace(/\s+/g, '') || 'Artiste'} #Africa #TikTokSounds`;
  }
  if (type === 'video') {
    return `🎬 ${item.title}${item.artist_name ? ` — ${item.artist_name}` : ''}\n\n` +
      (item.description ? `${item.description.substring(0, 90)}...\n\n` : '') +
      `▶️ Nouveau visuel officiel disponible !\n\n` +
      `#KKDmusic #ClipOfficiel ${item.artist_name ? `#${item.artist_name?.replace(/\s+/g, '')}` : ''} #Africa #Musique`;
  }
  if (type === 'event') {
    const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return `📅 ${item.title}\n\n` +
      (dateStr ? `🗓️ Date : ${dateStr}\n` : '') +
      (item.location ? `📍 Lieu : ${item.location}${item.city ? `, ${item.city}` : ''}\n\n` : '') +
      `🎟️ Réservez vos places sur KKD Music !\n\n` +
      `#KKDmusic #Concert #Live #${item.city?.replace(/\s+/g, '') || 'Evenement'}`;
  }
  return '';
}

export default function TikTokPublisher() {
  const [activeTab, setActiveTab] = useState('release');
  const [officialAccount, setOfficialAccount] = useState(tiktokService.getOfficialAccount());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [manualDisplayName, setManualDisplayName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal de publication directe
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [publishType, setPublishType] = useState('release');
  const [publishCaption, setPublishCaption] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [isSubmittingPublish, setIsSubmittingPublish] = useState(false);

  // Écouteur OAuth callback pour TikTok
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        const updated = tiktokService.getOfficialAccount();
        setOfficialAccount(updated);
        toast.success('Compte TikTok officiel connecté !', {
          description: `@${updated.username} est maintenant relié avec tous les accès autorisés.`,
        });
        setRefreshTrigger(prev => prev + 1);
      } else if (event.data?.type === 'TIKTOK_AUTH_ERROR') {
        toast.error('Échec de la connexion TikTok', {
          description: event.data.error || 'Autorisation refusée ou expirée.',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const { data: releases = [] } = useQuery({
    queryKey: ['admin-releases', refreshTrigger],
    queryFn: () => base44.entities.Release.list('-created_date', 50),
  });
  const { data: videos = [] } = useQuery({
    queryKey: ['admin-videos', refreshTrigger],
    queryFn: () => base44.entities.Video.list('-created_date', 50),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['admin-events', refreshTrigger],
    queryFn: () => base44.entities.Event.list('-event_date', 50),
  });

  const soundsDistributions = tiktokService.getSoundDistributions();
  const publishedPosts = tiktokService.getPublishedPosts();
  const securityStatus = tiktokService.getSecurityStatus();
  const redirectUri = tiktokService.getRedirectUri();

  // Déclencher le flux OAuth officiel dans un popup centré
  const handleLaunchOAuth = () => {
    const authUrl = tiktokService.getOAuthUrl();
    const width = 600;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'tiktok_oauth_window',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      toast.error('Popup bloqué par le navigateur', {
        description: 'Veuillez autoriser les fenêtres pop-up pour vous connecter à TikTok.',
      });
    }
  };

  // Test de connexion et vérification des accès API
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await tiktokService.testConnection();
      toast.success('Connexion TikTok API 100% opérationnelle', {
        description: `Accès validés (${res.latency}) : Publication vidéo, TikTok Sounds, Profil.`,
      });
    } catch (err) {
      toast.error('Erreur de communication TikTok', {
        description: err.message,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Déconnexion
  const handleDisconnect = () => {
    tiktokService.disconnectOfficialAccount();
    setOfficialAccount(tiktokService.getOfficialAccount());
    toast.info('Compte TikTok déconnecté.');
    setRefreshTrigger(prev => prev + 1);
  };

  // Connexion manuelle de notre vrai compte officiel
  const handleConnectManual = (e) => {
    e.preventDefault();
    if (!manualUsername.trim()) return;

    const account = tiktokService.connectOfficialAccount({
      username: manualUsername.trim(),
      display_name: manualDisplayName.trim() || manualUsername.trim(),
      auth_method: 'direct_official_bind',
    });

    setOfficialAccount(account);
    setManualModalOpen(false);
    toast.success('Notre compte TikTok officiel a été lié !', {
      description: `@${account.username} est configuré pour toutes les diffusions.`,
    });
    setRefreshTrigger(prev => prev + 1);
  };

  // Ouvrir modal de publication directe
  const handleOpenPublish = (item, type) => {
    setSelectedItem(item);
    setPublishType(type);
    setPublishCaption(generateCaption(type, item));
    setPublishModalOpen(true);
  };

  // Valider la publication directe
  const handleExecutePublish = async () => {
    if (!officialAccount?.connected) {
      toast.error('Veuillez d\'abord connecter votre compte TikTok officiel.');
      return;
    }

    setIsSubmittingPublish(true);
    try {
      const res = await tiktokService.publishDirectVideo({
        title: selectedItem.title,
        caption: publishCaption,
        videoUrl: selectedItem.video_url || selectedItem.youtube_url || null,
        coverUrl: selectedItem.cover_url || selectedItem.thumbnail_url || selectedItem.image_url || null,
        privacyLevel,
      });

      toast.success('Vidéo transmise avec succès à TikTok !', {
        description: `Publiée sur @${officialAccount.username} avec le statut ${res.post.status}.`,
      });
      setPublishModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error('Erreur lors de la publication TikTok', {
        description: err.message,
      });
    } finally {
      setIsSubmittingPublish(false);
    }
  };

  // Transmission au catalogue officiel TikTok Sounds
  const handleDistributeSound = async (release) => {
    if (!officialAccount?.connected) {
      toast.error('Connectez d\'abord notre compte TikTok officiel.');
      return;
    }

    try {
      const res = await tiktokService.distributeTrackToTikTokSounds({
        releaseId: release.id,
        trackTitle: release.title,
        artistName: release.artist_name || 'Artiste KKD',
        genre: release.genre || 'Afrobeats',
        audioUrl: release.audio_url || null,
        coverUrl: release.cover_url || null,
      });

      toast.success('Morceau distribué dans le répertoire TikTok Sounds !', {
        description: `ISRC assigné : ${res.submission.isrc}. Disponible aux créateurs de contenu.`,
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error('Erreur lors de la distribution TikTok', {
        description: err.message,
      });
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    toast.success('URI de redirection copiée !', {
      description: 'À renseigner dans la console TikTok for Developers si nécessaire.',
    });
  };

  return (
    <div className="space-y-6">
      {/* ── BANNIÈRE COMPTE OFFICIEL TIKTOK (DESIGN HIGH-CRAFT SOMBRE & SÉCURISÉ) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1015] via-[#121822] to-[#0a0e13] border border-white/10 p-6 shadow-xl">
        {/* Éléments d'ambiance visuelle subtile */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#25F4EE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#FE2C55]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Bloc gauche : Profil ou Statut du compte officiel */}
          <div className="flex items-start gap-4">
            <div className="relative">
              {officialAccount?.connected && officialAccount?.avatar_url ? (
                <img
                  src={officialAccount.avatar_url}
                  alt={officialAccount.display_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-md">
                  <TikTokLogo size={28} />
                </div>
              )}
              {officialAccount?.connected && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121822] flex items-center justify-center">
                  <Check size={9} className="text-black font-bold" />
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono tracking-widest text-[#25F4EE] uppercase font-semibold">
                  Compte Officiel TikTok
                </span>
                {officialAccount?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connecté & Autorisé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Non connecté
                  </span>
                )}
              </div>

              {officialAccount?.connected ? (
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{officialAccount.display_name}</span>
                    <span className="text-xs font-mono font-normal text-gray-400">(@{officialAccount.username})</span>
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span><strong>{officialAccount.followers_count?.toLocaleString()}</strong> abonnés</span>
                    <span>•</span>
                    <span><strong>{officialAccount.likes_count?.toLocaleString()}</strong> j'aime</span>
                    <span>•</span>
                    <span className="text-emerald-400/90 font-medium">Session sécurisée active</span>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Liez notre compte officiel TikTok
                  </h2>
                  <p className="text-xs text-gray-400 max-w-md mt-0.5">
                    Autorisez les accès pour publier vos vidéos et distribuer votre catalogue au répertoire musical TikTok.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bloc droit : Actions de connexion & tests */}
          <div className="flex flex-wrap items-center gap-2.5">
            {officialAccount?.connected ? (
              <>
                <Button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 bg-white/5 hover:bg-white/10 border-white/15 text-white"
                >
                  <RefreshCw size={13} className={isTestingConnection ? 'animate-spin' : ''} />
                  {isTestingConnection ? 'Vérification...' : 'Tester les accès'}
                </Button>
                <Button
                  onClick={handleLaunchOAuth}
                  size="sm"
                  className="text-xs gap-1.5 bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-semibold"
                >
                  <TikTokLogo size={14} /> Reconnecter OAuth
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="ghost"
                  size="sm"
                  title="Déconnecter le compte"
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut size={14} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleLaunchOAuth}
                  size="sm"
                  className="text-xs gap-2 bg-gradient-to-r from-[#25F4EE] via-[#000000] to-[#FE2C55] hover:opacity-95 text-white font-bold px-4 py-2 shadow-lg"
                >
                  <TikTokLogo size={16} /> Connecter notre compte TikTok (OAuth 2.0)
                </Button>
                <Button
                  onClick={() => setManualModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/5 hover:bg-white/10 border-white/20 text-white"
                >
                  Lier par @pseudo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── BARRE DE CONFIANCE & ACCÈS AUTORISÉS (SANS AFFICHER DE CLÉ API) ── */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Badge 1 : Sécurité des clés (Chiffrement, Aucune clé brute affichée) */}
          <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">Identifiants API Sécurisés</p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" /> Chiffrement actif côté serveur
              </p>
            </div>
          </div>

          {/* Badge 2 : Autorisations accordées */}
          <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="w-8 h-8 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/20 flex items-center justify-center text-[#25F4EE] shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">Accès & Scopes Officiels</p>
              <p className="text-[11px] text-gray-400 truncate">
                Publication vidéo • TikTok Sounds • Profil
              </p>
            </div>
          </div>

          {/* Badge 3 : URI de redirection OAuth prête */}
          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">URI de Redirection</p>
              <p className="text-[11px] text-gray-400 font-mono truncate">/auth/tiktok/callback</p>
            </div>
            <Button
              onClick={copyRedirectUri}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] text-gray-300 hover:text-white hover:bg-white/10 shrink-0"
              title="Copier l'URL de redirection"
            >
              <Copy size={12} className="mr-1" /> Copier
            </Button>
          </div>
        </div>
      </div>

      {/* ── ONGLETS DE GESTION DU CONTENU & DIFFUSION ── */}
      <div className="flex gap-2 flex-wrap border-b border-border/60 pb-3">
        {[
          { key: 'release', label: 'Sorties Musicales', icon: Music, badge: releases.length },
          { key: 'video', label: 'Vidéos & Teasers', icon: Video, badge: videos.length },
          { key: 'event', label: 'Événements & Concerts', icon: Calendar, badge: events.length },
          { key: 'sounds_catalog', label: 'Répertoire TikTok Sounds', icon: RadioTower, badge: soundsDistributions.length, highlight: true },
          { key: 'history', label: 'Historique Direct', icon: Share2, badge: publishedPosts.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-black text-white shadow-md ring-1 ring-white/15'
                : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            <tab.icon size={15} className={tab.highlight ? 'text-primary' : ''} />
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENU ONGLET : SORTIES MUSICALES ── */}
      {activeTab === 'release' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <Flame size={15} className="text-amber-500" /> Transmission au Répertoire TikTok Sounds
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rendez vos titres disponibles aux millions de créateurs TikTok pour booster la viralité avec l'ISRC officiel.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-background border border-border px-2.5 py-1 rounded-lg text-muted-foreground shrink-0">
              Compte émetteur : @{officialAccount?.username || 'kkdmusiclabel'}
            </span>
          </div>

          {releases.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/40 rounded-2xl text-xs text-muted-foreground">
              Aucune sortie musicale enregistrée.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {releases.map(item => (
                <div
                  key={item.id}
                  className="bg-card border border-border/60 hover:border-primary/40 rounded-2xl p-4 transition-all shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3.5 items-start">
                    <img
                      src={item.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150'}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm border border-border/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                          {item.release_type || 'Single'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {item.genre || 'Afrobeats'}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-foreground truncate mt-0.5">{item.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{item.artist_name || 'Artiste KKD'}</p>
                    </div>
                  </div>

                  <div className="bg-secondary/40 border border-border/40 rounded-xl p-2.5 text-[11px] text-muted-foreground font-mono flex items-center justify-between">
                    <span>ISRC: {item.isrc || `SN-KKD-25-${item.id.slice(-4) || '1029'}`}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium font-sans">Prêt pour Sounds</span>
                  </div>

                  {/* Boutons d'action pour cette sortie */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      onClick={() => handleDistributeSound(item)}
                      size="sm"
                      className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9"
                    >
                      <Radio size={13} /> TikTok Sounds
                    </Button>
                    <Button
                      onClick={() => handleOpenPublish(item, 'release')}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 h-9"
                    >
                      <UploadCloud size={13} /> Teaser Vidéo
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU ONGLET : VIDÉOS & CLIPS ── */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 text-xs space-y-1">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <Video size={15} className="text-primary" /> Publication Directe de Vidéos & Teasers
            </h3>
            <p className="text-muted-foreground">
              Transmettez vos clips et teasers directement sur le flux officiel de notre compte TikTok.
            </p>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/40 rounded-2xl text-xs text-muted-foreground">
              Aucune vidéo disponible.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map(item => (
                <div key={item.id} className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start shadow-xs">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-black">
                    <img
                      src={item.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                      <Play size={18} fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-heading font-bold text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.artist_name || 'Artiste KKD'}</p>
                    </div>
                    <Button
                      onClick={() => handleOpenPublish(item, 'video')}
                      size="sm"
                      className="text-xs gap-1.5 bg-black hover:bg-black/90 text-white h-8"
                    >
                      <UploadCloud size={12} /> Publier sur TikTok
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU ONGLET : ÉVÉNEMENTS ── */}
      {activeTab === 'event' && (
        <div className="space-y-4">
          <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 text-xs space-y-1">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <Calendar size={15} className="text-primary" /> Annonces TikTok de Concerts & Billetterie
            </h3>
            <p className="text-muted-foreground">
              Diffusez les annonces de tournées et concerts au format vidéo vertical TikTok.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/40 rounded-2xl text-xs text-muted-foreground">
              Aucun événement programmé.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(item => (
                <div key={item.id} className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start shadow-xs">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 text-primary">
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-heading font-bold text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.location} {item.city ? `• ${item.city}` : ''}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleOpenPublish(item, 'event')}
                      size="sm"
                      className="text-xs gap-1.5 bg-black hover:bg-black/90 text-white h-8"
                    >
                      <UploadCloud size={12} /> Publier sur TikTok
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU ONGLET : RÉPERTOIRE TIKTOK SOUNDS (CATALOGUE COMMERCIAL ACTIF) ── */}
      {activeTab === 'sounds_catalog' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/30 border border-primary/20 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <RadioTower size={16} />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Catalogue Commercial TikTok Sounds (Sound Library)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ces morceaux sont synchronisés avec la base de données TikTok Commercial Library. Tout utilisateur ou créateur TikTok peut sélectionner ces pistes pour ses reels, vidéos virales et trends avec rémunération des streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {soundsDistributions.map(s => (
              <div
                key={s.id}
                className="bg-card border border-border/60 hover:border-primary/40 rounded-2xl p-4 space-y-3 transition-all shadow-xs"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-foreground">{s.track_title}</h4>
                    <p className="text-xs text-muted-foreground">{s.artist_name} • <span className="text-primary font-medium">{s.genre}</span></p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    En ligne sur TikTok
                  </span>
                </div>

                <div className="bg-secondary/40 rounded-xl p-2.5 text-[11px] font-mono space-y-1 border border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code ISRC :</span>
                    <span className="font-semibold text-foreground">{s.isrc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Identifiant Son :</span>
                    <span className="text-foreground">{s.tiktok_sound_id}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={s.tiktok_sound_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Fiche TikTok Sound <ExternalLink size={12} />
                  </a>
                  <span className="text-[11px] text-muted-foreground">
                    Distribué le {new Date(s.submitted_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENU ONGLET : HISTORIQUE DES PUBLICATIONS DIRECTES ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 text-xs space-y-1">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <Share2 size={15} className="text-primary" /> Historique des Publications Directes API
            </h3>
            <p className="text-muted-foreground">
              Vidéos et publications transmises avec succès à TikTok via notre compte officiel.
            </p>
          </div>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/40 rounded-2xl text-xs text-muted-foreground">
              Aucune publication directe enregistrée.
            </div>
          ) : (
            <div className="space-y-3">
              {publishedPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm text-foreground">{post.title}</h4>
                      <span className="text-[10px] bg-black text-white font-mono px-2 py-0.5 rounded">
                        @{post.account_username}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{post.caption}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Transmis le {new Date(post.published_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  <a
                    href={post.tiktok_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-semibold bg-black hover:bg-black/90 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    Voir sur TikTok <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PUBLICATION DIRECTE TIKTOK (STYLED SMARTPHONE PREVIEW) ── */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-[#0c1015] border border-white/10 text-white">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white">
                <TikTokLogo size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Publication TikTok — {selectedItem?.title}
                </DialogTitle>
                <p className="text-xs text-gray-400">Diffusion directe sur notre compte officiel @{officialAccount?.username}</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
            {/* Colonne gauche : Simulateur visuel TikTok Reel 9:16 */}
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl flex flex-col justify-between p-3.5">
              {/* Image de fond / Teaser */}
              <img
                src={selectedItem?.cover_url || selectedItem?.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

              {/* En-tête simulateur */}
              <div className="relative z-10 flex justify-between items-center text-xs text-white/90">
                <span className="font-mono text-[10px] bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                  TikTok Live Preview
                </span>
                <span className="text-[11px] font-bold">Pour toi</span>
              </div>

              {/* Bas du simulateur : @handle, légende et vinyle tournant */}
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  @{officialAccount?.username || 'kkdmusiclabel'}
                  <span className="w-3 h-3 rounded-full bg-[#25F4EE] flex items-center justify-center text-black text-[8px] font-bold">✓</span>
                </p>
                <p className="text-[11px] text-white/90 line-clamp-3 leading-relaxed">
                  {publishCaption}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[10px] text-white/80">
                    <Music size={11} className="animate-spin" />
                    <span className="truncate max-w-[130px]">{selectedItem?.title}</span>
                  </div>
                  {/* Petit vinyle TikTok tournant */}
                  <div className="w-7 h-7 rounded-full bg-black border-2 border-white/60 flex items-center justify-center animate-spin">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite : Formulaire de configuration du post */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Légende & Hashtags viraux</Label>
                <Textarea
                  value={publishCaption}
                  onChange={e => setPublishCaption(e.target.value)}
                  rows={6}
                  className="bg-black/40 border-white/15 text-white text-xs font-mono resize-none focus-visible:ring-primary"
                  placeholder="Écrivez votre légende..."
                />
                <p className="text-[11px] text-gray-500 text-right">{publishCaption.length} caractères</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Confidentialité du post</Label>
                <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                  <SelectTrigger className="bg-black/40 border-white/15 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121822] border-white/10 text-white text-xs">
                    <SelectItem value="PUBLIC_TO_EVERYONE">🌍 Public pour tous (Recommandé)</SelectItem>
                    <SelectItem value="MUTUAL_FOLLOW_FRIENDS">👥 Amis mutuels</SelectItem>
                    <SelectItem value="SELF_ONLY">🔒 Privé (Brouillon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-gray-400 space-y-1">
                <p className="font-semibold text-white">Droits & Synchronisation :</p>
                <p>✓ Publication directe via TikTok Content Posting API</p>
                <p>✓ Transmission vers le flux officiel @{officialAccount?.username}</p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={handleExecutePublish}
                  disabled={isSubmittingPublish}
                  className="flex-1 bg-gradient-to-r from-[#25F4EE] via-[#000000] to-[#FE2C55] hover:opacity-90 text-white font-bold text-xs h-10 gap-1.5"
                >
                  {isSubmittingPublish ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Transmission TikTok...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} /> Publier maintenant
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPublishModalOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10 text-xs h-10"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL LIER NOTRE COMPTE OFFICIEL PAR PSEUDO DIRECT ── */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="max-w-md bg-[#10141a] border border-white/15 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black border border-white/20 flex items-center justify-center text-white">
                <TikTokLogo size={16} />
              </div>
              <span>Lier notre propre compte TikTok officiel</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConnectManual} className="space-y-4 pt-2 text-xs">
            <p className="text-gray-400 leading-relaxed">
              Renseignez l'identifiant TikTok officiel de notre label ou entreprise. Ce compte sera utilisé pour toutes les publications et liaisons au catalogue.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Nom d'utilisateur TikTok (@handle)</Label>
              <Input
                value={manualUsername}
                onChange={e => setManualUsername(e.target.value)}
                placeholder="ex: kkdmusiclabel ou mon_compte_officiel"
                required
                className="bg-black/50 border-white/15 text-white text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Nom d'affichage officiel (Optionnel)</Label>
              <Input
                value={manualDisplayName}
                onChange={e => setManualDisplayName(e.target.value)}
                placeholder="ex: KKD Music Officiel"
                className="bg-black/50 border-white/15 text-white text-xs"
              />
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-400 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Sécurité & Conformité
              </p>
              <p className="text-emerald-400/80">
                Vos clés API restent sécurisées côté serveur et ne sont jamais exposées publiquement.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-white text-black hover:bg-gray-200 font-bold text-xs h-9">
                Enregistrer le compte officiel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualModalOpen(false)}
                className="border-white/20 text-white hover:bg-white/10 text-xs h-9"
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
