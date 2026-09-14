import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Copy, Music2, Share2, UploadCloud, Radio, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { tiktokService } from '@/services';
import { toast } from 'sonner';

const TIKTOK_SOUNDS = [
  { label: '🔥 Trending Beat', value: 'trending' },
  { label: '🎵 Afro Vibes', value: 'afro' },
  { label: '🌍 Amapiano Flow', value: 'amapiano' },
  { label: '💥 Drill Energy', value: 'drill' },
  { label: '🎶 R&B Smooth', value: 'rnb' },
  { label: '🚀 Hype Intro', value: 'hype' },
];

function generateCaption(item, type, sound) {
  const soundTag = {
    trending: '#trending #viral #foryou',
    afro: '#afrobeats #afrovibe #africa',
    amapiano: '#amapiano #southafrica #log',
    drill: '#drill #trap #rap',
    rnb: '#rnb #soul #vibes',
    hype: '#hype #energy #banger',
  }[sound] || '#music #foryou #viral';

  if (type === 'release') {
    const typeLabel = { single: 'Single', album: 'Album', ep: 'EP', projet_special: 'Projet' }[item.release_type] || 'Release';
    return `🎵 ${typeLabel} disponible maintenant !\n\n🔥 ${item.title} — ${item.artist_name}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}🎧 Écoutez sur KKD Music !\n\n${soundTag} #kkdmusic #${item.artist_name?.replace(/\s+/g, '').toLowerCase()} #newmusic #africa`;
  }

  if (type === 'video') {
    const typeLabel = { clip_officiel: 'Clip Officiel', teaser: 'Teaser', interview: 'Interview', making_of: 'Making-of' }[item.video_type] || 'Vidéo';
    return `🎬 ${typeLabel} — ${item.title}\n\n🎤 ${item.artist_name}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}▶️ Disponible sur KKD Music & YouTube !\n\n${soundTag} #kkdmusic #clip #${item.artist_name?.replace(/\s+/g, '').toLowerCase()}`;
  }

  if (type === 'event') {
    const dateStr = item.event_date ? format(new Date(item.event_date), "d MMMM yyyy 'à' HH'h'mm", { locale: fr }) : '';
    return `📅 ÉVÉNEMENT — ${item.title}\n\n📍 ${item.location || ''}${item.city ? ', ' + item.city : ''}\n🗓️ ${dateStr}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}🎟️ ${item.ticket_url ? 'Billets disponibles sur KKD Music !' : 'Entrée libre !'}\n\n${soundTag} #kkdmusic #concert #event #live`;
  }

  return '';
}

export default function TikTokPublishButton({ item, type }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'sound_repo' | 'caption'
  const [sound, setSound] = useState('trending');
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Direct publish state
  const [selectedAccount, setSelectedAccount] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC_TO_EVERYONE');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedResult, setPublishedResult] = useState(null);

  // Sound repository distribution state
  const [isrcCode, setIsrcCode] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributedResult, setDistributedResult] = useState(null);

  const accounts = tiktokService.getConnectedAccounts();

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  const handleOpen = () => {
    setCaption(generateCaption(item, type, 'trending'));
    setSound('trending');
    setCopied(false);
    setPublishedResult(null);
    setDistributedResult(null);
    setIsrcCode(item.isrc || `SN-KKD-25-${Math.floor(10000 + Math.random() * 90000)}`);
    setOpen(true);
  };

  const handleSoundChange = (s) => {
    setSound(s);
    setCaption(generateCaption(item, type, s));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Publication directe via l'API TikTok
  const handleDirectPublish = async () => {
    setIsPublishing(true);
    try {
      const res = await tiktokService.publishDirectVideo({
        title: item.title || 'Nouveau contenu KKD Music',
        caption: caption,
        videoUrl: item.video_url || item.youtube_url || null,
        coverUrl: item.cover_url || item.image_url || null,
        accountId: selectedAccount,
        privacyLevel: privacy,
      });

      setPublishedResult(res.post);
      toast.success('Publication TikTok réussie !', {
        description: 'Le contenu a été transmis directement au compte TikTok.',
      });
    } catch (err) {
      toast.error('Erreur lors de la publication TikTok', {
        description: err?.message || 'Vérifiez la connexion réseau.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Transmission au répertoire TikTok Sounds
  const handleDistributeSound = async () => {
    setIsDistributing(true);
    try {
      const res = await tiktokService.distributeTrackToTikTokSounds({
        releaseId: item.id,
        trackTitle: item.title,
        artistName: item.artist_name || 'Artiste KKD',
        genre: item.genre || 'Afrobeats',
        audioUrl: item.audio_url || null,
        coverUrl: item.cover_url || null,
        isrc: isrcCode,
      });

      setDistributedResult(res.submission);
      toast.success('Morceau transmis au répertoire TikTok !', {
        description: 'La musique est enregistrée dans le catalogue commercial TikTok.',
      });
    } catch (err) {
      toast.error('Erreur lors de la transmission musicale', {
        description: err?.message,
      });
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        title="Publier sur TikTok"
        className="text-muted-foreground hover:text-foreground hover:bg-black/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z"/>
        </svg>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z"/>
                </svg>
              </div>
              <span>TikTok Hub — {item.title}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Onglets navigation */}
          <div className="flex gap-1.5 p-1 bg-secondary/50 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'direct' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Share2 size={13} /> Publication Directe
            </button>
            {type === 'release' && (
              <button
                onClick={() => setActiveTab('sound_repo')}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'sound_repo' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Radio size={13} /> Répertoire Sounds
              </button>
            )}
            <button
              onClick={() => setActiveTab('caption')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'caption' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Copy size={13} /> Légende Assistée
            </button>
          </div>

          {/* Contenu Onglet 1: Publication directe API */}
          {activeTab === 'direct' && (
            <div className="space-y-4 pt-1">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-semibold text-foreground">API TikTok active</span>
                  <span className="text-muted-foreground font-mono">({tiktokService.getConfig().clientKey.slice(0, 6)}...)</span>
                </div>
                <span className="text-[11px] bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-2 py-0.5 rounded">
                  Direct Post Ready
                </span>
              </div>

              {/* Sélection du compte */}
              <div className="space-y-1.5">
                <Label className="text-xs">Compte TikTok de destination</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs">
                        @{acc.username} {acc.account_type === 'label_official' ? '(Label KKD Officiel)' : `(Artiste: ${acc.artist_name || acc.display_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Légende & Hashtags du post</Label>
                  <button onClick={() => setCaption(generateCaption(item, type, 'trending'))} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                    <Sparkles size={11} /> Régénérer
                  </button>
                </div>
                <Textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={4}
                  className="text-xs font-mono resize-none"
                />
              </div>

              {/* Visibilité */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Visibilité</Label>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC_TO_EVERYONE" className="text-xs">🌍 Public pour tous</SelectItem>
                      <SelectItem value="MUTUAL_FOLLOW_FRIENDS" className="text-xs">👥 Amis mutuels</SelectItem>
                      <SelectItem value="SELF_ONLY" className="text-xs">🔒 Privé (Brouillon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-secondary/40 rounded-lg p-2.5 flex flex-col justify-center text-[11px] text-muted-foreground">
                  <p className="font-semibold text-foreground">Format requis</p>
                  <p>Ratio 9:16 vertical recommandé</p>
                </div>
              </div>

              {/* Résultat si publié */}
              {publishedResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                    <Check size={14} /> Publication validée sur TikTok !
                  </p>
                  <p className="text-muted-foreground">
                    Compte : <span className="font-mono font-semibold text-foreground">@{publishedResult.account_username}</span>
                  </p>
                  <a
                    href={publishedResult.tiktok_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                  >
                    Voir le post en ligne <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDirectPublish}
                  disabled={isPublishing}
                  className="flex-1 bg-black hover:bg-black/90 text-white text-xs gap-1.5 h-9"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Transmission à TikTok...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} /> Transmettre & Publier sur TikTok
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-9">
                  Fermer
                </Button>
              </div>
            </div>
          )}

          {/* Contenu Onglet 2: Répertoire Musical TikTok Sounds */}
          {activeTab === 'sound_repo' && type === 'release' && (
            <div className="space-y-4 pt-1">
              <div className="bg-secondary/40 border border-border/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Radio size={14} className="text-primary" /> Distribution TikTok Sounds
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Permet aux millions de créateurs sur TikTok d'utiliser votre morceau dans leurs vidéos et reels viraux.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Titre pour le catalogue TikTok</Label>
                  <Input value={item.title} disabled className="text-xs bg-muted/30" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Artiste crédité</Label>
                    <Input value={item.artist_name || ''} disabled className="text-xs bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Code ISRC (International)</Label>
                    <Input
                      value={isrcCode}
                      onChange={e => setIsrcCode(e.target.value)}
                      className="text-xs font-mono"
                      placeholder="SN-KKD-25-XXXXX"
                    />
                  </div>
                </div>

                <div className="bg-card border border-border/60 rounded-lg p-3 text-[11px] space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">Droits d'exploitation & Rémunération :</p>
                  <p>✓ Droits de synchronisation KKD Music Label confirmés</p>
                  <p>✓ Détection acoustique activée pour la rémunération des streams TikTok</p>
                </div>
              </div>

              {distributedResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                    <Check size={14} /> Morceau enregistré dans le répertoire TikTok Sounds !
                  </p>
                  <p className="text-muted-foreground">
                    Code ISRC : <span className="font-mono font-semibold text-foreground">{distributedResult.isrc}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Identifiant Son : <span className="font-mono text-foreground">{distributedResult.tiktok_sound_id}</span>
                  </p>
                  <a
                    href={distributedResult.tiktok_sound_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                  >
                    Consulter la fiche TikTok Sound <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDistributeSound}
                  disabled={isDistributing}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 h-9"
                >
                  {isDistributing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Transmission au répertoire...
                    </>
                  ) : (
                    <>
                      <Radio size={14} /> Transmettre au répertoire TikTok Sounds
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-9">
                  Fermer
                </Button>
              </div>
            </div>
          )}

          {/* Contenu Onglet 3: Légende Assistée (copier/coller) */}
          {activeTab === 'caption' && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Music2 size={12} /> Ambiance musicale suggérée
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIKTOK_SOUNDS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleSoundChange(s.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        sound === s.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Légende prête à coller</p>
                <Textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={6}
                  className="text-xs font-mono resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1 bg-black hover:bg-black/80 text-white text-xs h-9">
                  {copied ? <><Check size={14} className="mr-1" /> Copié !</> : <><Copy size={14} className="mr-1" /> Copier la caption</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs h-9">
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
