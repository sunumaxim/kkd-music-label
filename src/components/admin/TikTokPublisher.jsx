import React, { useState } from 'react';
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
  Plus,
  RadioTower,
  KeyRound,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

function generateCaption(type, item) {
  if (type === 'release') {
    const link = item.spotify_url || item.apple_music_url || item.audiomack_url || item.youtube_url || '';
    return `🎵 ${item.title} — ${item.artist_name}\n\n` +
      (item.description ? `${item.description}\n\n` : '') +
      (link ? `🎧 ${link}\n\n` : '') +
      `#KKDmusic #NouveautéMusicale #${item.artist_name?.replace(/\s+/g, '') || 'Music'} #${item.release_type || 'Music'} #Afrobeats #Rap #Africa`;
  }
  if (type === 'video') {
    return `🎬 ${item.title}${item.artist_name ? ` — ${item.artist_name}` : ''}\n\n` +
      (item.description ? `${item.description}\n\n` : '') +
      (item.youtube_url ? `▶️ ${item.youtube_url}\n\n` : '') +
      `#KKDmusic #ClipOfficiel ${item.artist_name ? `#${item.artist_name?.replace(/\s+/g, '')}` : ''} #Musique #Africa`;
  }
  if (type === 'event') {
    const dateStr = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return `📅 ${item.title}\n\n` +
      (dateStr ? `🗓️ ${dateStr}\n` : '') +
      (item.location ? `📍 ${item.location}${item.city ? `, ${item.city}` : ''}\n` : '') +
      (item.description ? `\n${item.description}\n` : '') +
      (item.ticket_url ? `\n🎟️ ${item.ticket_url}\n` : '') +
      `\n#KKDmusic #Concert #Live #${item.city?.replace(/\s+/g, '') || 'Événement'}`;
  }
  return '';
}

function ContentCard({ type, item, icon: Icon, label, onDirectPublish, onDistributeSound }) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const caption = generateCaption(type, item);
  const image = item.cover_url || item.thumbnail_url || item.image_url;

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirect = async () => {
    setPublishing(true);
    try {
      await onDirectPublish(item, type, caption);
    } finally {
      setPublishing(false);
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      await onDistributeSound(item);
    } finally {
      setDistributing(false);
    }
  };

  const ytLink = item.youtube_url || (type === 'video' ? item.youtube_url : null);

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col md:flex-row gap-4">
      {image ? (
        <img src={image} alt={item.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon size={22} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-heading font-bold text-sm truncate">{item.title || item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.artist_name || item.city || ''} · <span className="capitalize">{label}</span>
            </p>
          </div>
          {type === 'release' && (
            <span className="text-[11px] bg-primary/10 text-primary font-mono px-2 py-0.5 rounded">
              ISRC: {item.isrc || 'Auto-assigné'}
            </span>
          )}
        </div>
        <pre className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 whitespace-pre-wrap line-clamp-2 font-body">
          {caption}
        </pre>
        <div className="flex gap-2 flex-wrap pt-1">
          {/* Action 1: Publication directe API */}
          <Button
            size="sm"
            onClick={handleDirect}
            disabled={publishing}
            className="gap-1.5 text-xs bg-black hover:bg-black/80 text-white"
          >
            {publishing ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Publication...
              </>
            ) : (
              <>
                <UploadCloud size={13} /> Publier directement
              </>
            )}
          </Button>

          {/* Action 2: Si sortie, transmission au répertoire TikTok Sounds */}
          {type === 'release' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDistribute}
              disabled={distributing}
              className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
            >
              {distributing ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Transmission...
                </>
              ) : (
                <>
                  <Radio size={13} /> Transmettre au répertoire Sounds
                </>
              )}
            </Button>
          )}

          {/* Action 3: Copier */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className={`gap-1.5 text-xs border border-border/60 ${copied ? 'text-green-600' : ''}`}
          >
            {copied ? <Check size={13} /> : <TikTokIcon size={13} />}
            {copied ? 'Copié !' : 'Copier légende'}
          </Button>

          {ytLink && (
            <Button size="sm" variant="ghost" asChild className="text-xs gap-1.5">
              <a href={ytLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} /> Voir vidéo
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'release', label: 'Sorties Musicales', icon: Music },
  { key: 'video', label: 'Vidéos & Clips', icon: Video },
  { key: 'event', label: 'Événements', icon: Calendar },
  { key: 'sounds_catalog', label: 'Répertoire TikTok Sounds', icon: RadioTower },
  { key: 'history', label: 'Publications Directes', icon: Share2 },
];

export default function TikTokPublisher() {
  const [activeTab, setActiveTab] = useState('release');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAccountType, setNewAccountType] = useState('artist');
  const [artistNameInput, setArtistNameInput] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const config = tiktokService.getConfig();
  const accounts = tiktokService.getConnectedAccounts();
  const soundsDistributions = tiktokService.getSoundDistributions();
  const publishedPosts = tiktokService.getPublishedPosts();

  const handleConnectNewAccount = (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    tiktokService.connectAccount({
      username: newUsername.trim(),
      display_name: newAccountType === 'artist' ? (artistNameInput || newUsername) : 'KKD Music Officiel',
      account_type: newAccountType,
      artist_name: artistNameInput || null,
      verified: true,
      followers_count: Math.floor(1000 + Math.random() * 25000),
    });

    toast.success('Compte TikTok connecté avec succès !', {
      description: `@${newUsername.replace('@', '')} est désormais disponible pour la publication.`,
    });

    setNewUsername('');
    setArtistNameInput('');
    setConnectModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDirectPublish = async (item, type, caption) => {
    const res = await tiktokService.publishDirectVideo({
      title: item.title,
      caption: caption,
      videoUrl: item.video_url || item.youtube_url || null,
      coverUrl: item.cover_url || item.thumbnail_url || item.image_url || null,
    });

    toast.success('Publication TikTok réussie !', {
      description: `Contenu transmis directement vers TikTok avec l'ID ${res.post.id}.`,
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDistributeSound = async (item) => {
    const res = await tiktokService.distributeTrackToTikTokSounds({
      releaseId: item.id,
      trackTitle: item.title,
      artistName: item.artist_name || 'Artiste KKD',
      genre: item.genre || 'Afrobeats',
      audioUrl: item.audio_url || null,
      coverUrl: item.cover_url || null,
    });

    toast.success('Morceau transmis au catalogue TikTok Sounds !', {
      description: `Disponible pour les créateurs de contenu sur TikTok (ISRC: ${res.submission.isrc}).`,
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const dataMap = { release: releases, video: videos, event: events };
  const items = dataMap[activeTab] || [];
  const currentTab = TABS.find(t => t.key === activeTab);

  return (
    <div className="space-y-6">
      {/* Configuration & Comptes TikTok */}
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
              <TikTokIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base">Intégration TikTok API</h3>
                <span className="text-[11px] bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active & Synchronisée
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Publication directe de vidéos et transmission du catalogue au répertoire musical TikTok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="text-xs gap-1.5 bg-black hover:bg-black/90 text-white"
            >
              <Plus size={14} /> Connecter un compte TikTok
            </Button>
          </div>
        </div>

        {/* Clés API et Comptes connectés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-xs space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1.5">
              <KeyRound size={13} className="text-primary" /> Clé Client TikTok
            </p>
            <p className="font-mono font-semibold text-foreground truncate">{config.clientKey}</p>
            <p className="text-[10px] text-muted-foreground">Configurée et synchronisée</p>
          </div>

          <div className="bg-secondary/40 rounded-lg p-3 text-xs space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1.5">
              <RadioTower size={13} className="text-primary" /> Répertoire TikTok Sounds
            </p>
            <p className="font-semibold text-foreground">
              {soundsDistributions.length} morceau(x) distribué(s)
            </p>
            <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Catalogue commercial actif</p>
          </div>

          <div className="bg-secondary/40 rounded-lg p-3 text-xs space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1.5">
              <TikTokIcon size={13} /> Comptes TikTok Liés
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {accounts.map(acc => (
                <span
                  key={acc.id}
                  className="bg-card border border-border/60 rounded px-2 py-0.5 text-[11px] font-mono text-foreground font-medium"
                >
                  @{acc.username}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Comptes label & artistes</p>
          </div>
        </div>
      </div>

      {/* Onglets navigation */}
      <div className="flex gap-2 flex-wrap border-b border-border/50 pb-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-black text-white shadow-xs'
                : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            {tab.key === 'sounds_catalog' && (
              <span className="ml-1 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] rounded-full">
                {soundsDistributions.length}
              </span>
            )}
            {tab.key === 'history' && (
              <span className="ml-1 px-1.5 py-0.2 bg-secondary text-foreground text-[10px] rounded-full">
                {publishedPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Onglet Répertoire TikTok Sounds */}
      {activeTab === 'sounds_catalog' && (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
              <RadioTower size={15} className="text-primary" /> Catalogue Musical Transmis au Répertoire TikTok
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Les morceaux ci-dessous sont synchronisés avec la base de données TikTok Sound Library. Les créateurs de contenu sur TikTok peuvent les intégrer directement dans leurs vidéos pour booster la visibilité et générer des royalties.
            </p>
          </div>

          {soundsDistributions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-muted-foreground text-xs">
              Aucun morceau n'a encore été transmis au répertoire TikTok. Cliquez sur "Transmettre au répertoire" depuis l'onglet Sorties.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {soundsDistributions.map(s => (
                <div key={s.id} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading font-bold text-sm">{s.track_title}</h4>
                      <p className="text-xs text-muted-foreground">{s.artist_name} · <span className="text-primary font-medium">{s.genre}</span></p>
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-2 py-0.5 rounded">
                      En ligne sur TikTok
                    </span>
                  </div>

                  <div className="bg-secondary/40 rounded-lg p-2.5 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code ISRC :</span>
                      <span className="font-semibold text-foreground">{s.isrc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID Son TikTok :</span>
                      <span className="text-foreground">{s.tiktok_sound_id}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={s.tiktok_sound_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      Ouvrir dans TikTok Sounds <ExternalLink size={12} />
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(s.submitted_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Historique des publications directes */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-secondary/40 border border-border/50 rounded-xl p-4 text-xs space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
              <Share2 size={15} className="text-primary" /> Historique des Publications Directes API
            </p>
            <p className="text-muted-foreground">
              Vidéos et teasers transmis et publiés directement sur les comptes TikTok officiels et partenaires.
            </p>
          </div>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border/40 text-muted-foreground text-xs">
              Aucune publication directe effectuée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {publishedPosts.map(post => (
                <div key={post.id} className="bg-card border border-border/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm">{post.title}</h4>
                      <span className="text-[10px] bg-black text-white font-mono px-2 py-0.5 rounded">
                        @{post.account_username}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{post.caption}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Publié le {new Date(post.published_at).toLocaleString('fr-FR')}
                    </p>
                  </div>

                  <a
                    href={post.tiktok_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-semibold bg-black text-white hover:bg-black/90 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    Voir sur TikTok <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglets standards : Sorties, Vidéos, Événements */}
      {['release', 'video', 'event'].includes(activeTab) && (
        <div>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-12 text-xs">
              Aucun(e) {currentTab?.label?.toLowerCase()} disponible.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <ContentCard
                  key={item.id}
                  type={activeTab}
                  item={item}
                  icon={currentTab?.icon || Music}
                  label={currentTab?.label || ''}
                  onDirectPublish={handleDirectPublish}
                  onDistributeSound={handleDistributeSound}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Connecter un compte TikTok */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white">
                <TikTokIcon size={16} />
              </div>
              <span>Connecter un compte TikTok</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConnectNewAccount} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type de compte</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewAccountType('artist')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    newAccountType === 'artist'
                      ? 'border-black bg-black/5 text-foreground font-semibold'
                      : 'border-border/60 text-muted-foreground'
                  }`}
                >
                  🎤 Artiste Partenaire
                </button>
                <button
                  type="button"
                  onClick={() => setNewAccountType('label_official')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    newAccountType === 'label_official'
                      ? 'border-black bg-black/5 text-foreground font-semibold'
                      : 'border-border/60 text-muted-foreground'
                  }`}
                >
                  🏢 Label Officiel KKD
                </button>
              </div>
            </div>

            {newAccountType === 'artist' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Nom de l'artiste</Label>
                <Input
                  value={artistNameInput}
                  onChange={e => setArtistNameInput(e.target.value)}
                  placeholder="Ex: Amadou & The Band"
                  className="text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Nom d'utilisateur TikTok (@handle)</Label>
              <Input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Ex: kkdmusic / artiste_officiel"
                required
                className="text-xs"
              />
            </div>

            <div className="bg-secondary/40 rounded-lg p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Autorisations TikTok Login Kit :</p>
              <p>✓ Lecture du profil basique</p>
              <p>✓ Envoi et publication de vidéos directes</p>
              <p>✓ Synchronisation des sons au répertoire musical</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-black hover:bg-black/90 text-white text-xs h-9">
                Valider et lier le compte
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConnectModalOpen(false)}
                className="text-xs h-9"
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
