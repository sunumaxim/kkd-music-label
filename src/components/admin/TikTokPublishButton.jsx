import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, Copy, Music2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    return `🎵 ${typeLabel} disponible maintenant !\n\n🔥 ${item.title} — ${item.artist_name}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}🎧 Disponible sur toutes les plateformes !\n\n${soundTag} #kkdmusic #${item.artist_name?.replace(/\s+/g, '').toLowerCase()} #newmusic`;
  }

  if (type === 'video') {
    const typeLabel = { clip_officiel: 'Clip Officiel', teaser: 'Teaser', interview: 'Interview', making_of: 'Making-of' }[item.video_type] || 'Vidéo';
    return `🎬 ${typeLabel} — ${item.title}\n\n🎤 ${item.artist_name}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}▶️ Disponible sur YouTube !\n\n${soundTag} #kkdmusic #clip #${item.artist_name?.replace(/\s+/g, '').toLowerCase()}`;
  }

  if (type === 'event') {
    const dateStr = item.event_date ? format(new Date(item.event_date), "d MMMM yyyy 'à' HH'h'mm", { locale: fr }) : '';
    return `📅 ÉVÉNEMENT — ${item.title}\n\n📍 ${item.location || ''}${item.city ? ', ' + item.city : ''}\n🗓️ ${dateStr}\n\n${item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') + '\n\n' : ''}🎟️ ${item.ticket_url ? 'Billets disponibles — lien en bio !' : 'Entrée libre !'}\n\n${soundTag} #kkdmusic #concert #event`;
  }

  return '';
}

export default function TikTokPublishButton({ item, type }) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState('trending');
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    setCaption(generateCaption(item, type, 'trending'));
    setSound('trending');
    setCopied(false);
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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        title="Publier sur TikTok"
        className="text-muted-foreground hover:text-black"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z"/>
        </svg>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z"/>
              </svg>
              Publier sur TikTok
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Son suggéré */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Music2 size={12} /> Son suggéré
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

            {/* Caption */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Caption générée</p>
              <Textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={8}
                className="text-sm font-mono resize-none"
              />
            </div>

            {/* Instructions */}
            <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Comment publier :</p>
              <p>1. Copiez la caption ci-dessous</p>
              <p>2. Ouvrez TikTok et créez votre vidéo</p>
              <p>3. Collez la caption et sélectionnez le son suggéré</p>
              <p>4. Publiez ! 🚀</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1 bg-black hover:bg-black/80 text-white">
                {copied ? <><Check size={14} className="mr-1" /> Copié !</> : <><Copy size={14} className="mr-1" /> Copier la caption</>}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}