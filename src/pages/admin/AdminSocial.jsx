import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TikTokPublisher from '@/components/admin/TikTokPublisher';
import { Button } from '@/components/ui/button';
import { Instagram, Send, CheckCircle2, AlertCircle, Loader2, Image, Music, Video, Newspaper, Calendar } from 'lucide-react';

const CONTENT_TYPES = [
  { value: 'release', label: 'Sortie musicale', icon: Music, entity: 'Release', titleKey: 'title', subtitleKey: 'artist_name' },
  { value: 'video', label: 'Clip / Vidéo', icon: Video, entity: 'Video', titleKey: 'title', subtitleKey: 'artist_name' },
  { value: 'event', label: 'Événement', icon: Calendar, entity: 'Event', titleKey: 'title', subtitleKey: 'city' },
  { value: 'news', label: 'Article', icon: Newspaper, entity: 'News', titleKey: 'title', subtitleKey: 'category' },
];

function InstagramPublisher() {
  const [selectedType, setSelectedType] = useState('release');
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error' | 'no_image'
  const [message, setMessage] = useState('');

  const typeConfig = CONTENT_TYPES.find(t => t.value === selectedType);

  const { data: items = [] } = useQuery({
    queryKey: ['social-items', selectedType],
    queryFn: () => base44.entities[typeConfig.entity].list('-created_date', 20),
    enabled: !!typeConfig,
  });

  const handlePublish = async () => {
    if (!selectedId) return;
    setStatus('loading');
    setMessage('');
    const res = await base44.functions.invoke('publishToInstagram', {
      content_type: selectedType,
      entity_id: selectedId,
    });
    const data = res.data;
    if (data?.skipped) {
      setStatus('no_image');
      setMessage("Ce contenu n'a pas d'image. Ajoutez une image/couverture pour publier sur Instagram.");
    } else if (data?.success) {
      setStatus('success');
      setMessage(`Publié avec succès sur Instagram ! ID du post : ${data.post_id}`);
    } else {
      setStatus('error');
      setMessage(data?.error || 'Erreur inconnue lors de la publication.');
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Instagram size={18} className="text-pink-500" />
        <h3 className="font-heading font-bold">Publier sur Instagram</h3>
      </div>
      <p className="text-xs text-muted-foreground">Choisissez un contenu et publiez-le directement sur votre compte Instagram Business connecté.</p>

      {/* Type selector */}
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Type de contenu</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CONTENT_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); setSelectedId(''); setStatus(null); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedType === t.value
                    ? 'bg-pink-500/10 border-pink-500/40 text-pink-400'
                    : 'border-border text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item selector */}
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Choisir un élément</p>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setStatus(null); }}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">-- Sélectionner --</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item[typeConfig.titleKey]}{item[typeConfig.subtitleKey] ? ` — ${item[typeConfig.subtitleKey]}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && status !== 'loading' && (
        <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
          status === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
          status === 'no_image' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' :
          'bg-destructive/10 border border-destructive/30 text-destructive'
        }`}>
          {status === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          {message}
        </div>
      )}

      {/* Publish button */}
      <Button
        onClick={handlePublish}
        disabled={!selectedId || status === 'loading'}
        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white gap-2"
      >
        {status === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {status === 'loading' ? 'Publication en cours...' : 'Publier sur Instagram'}
      </Button>
    </div>
  );
}

export default function AdminSocial() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-2">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">Réseaux Sociaux</span>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-1">Publication Social Media</h1>
        <p className="text-sm text-muted-foreground mt-1">Publiez directement sur Instagram et générez vos légendes TikTok</p>
      </div>

      {/* Instagram status */}
      <div className="bg-gradient-to-r from-pink-600/10 to-purple-600/10 border border-pink-500/20 rounded-xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
          <Instagram size={16} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm">Instagram Business — Connecté ✅</p>
          <p className="text-xs text-muted-foreground">Compte lié via OAuth. Vous pouvez publier des images et des légendes directement.</p>
        </div>
      </div>

      {/* Manual Instagram Publisher */}
      <InstagramPublisher />

      {/* IG tip */}
      <div className="bg-card border border-border/40 rounded-xl p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
          <AlertCircle size={14} className="text-yellow-400" /> Pourquoi mes anciens posts ne s'affichent pas ?
        </p>
        <p>Instagram via l'API Business ne permet de voir que les posts publiés <strong>via l'API</strong>, pas ceux publiés manuellement depuis l'app Instagram.</p>
        <p>Pour vos futures publications, utilisez le bouton ci-dessus. Les posts apparaîtront alors dans votre feed normal et seront suivis ici.</p>
        <p>Les publications via TikTok restent assistées (copier/coller) car TikTok n'autorise pas la publication automatique via API.</p>
      </div>

      {/* TikTok section */}
      <div>
        <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>
          Légendes TikTok
        </h2>
        <TikTokPublisher />
      </div>
    </div>
  );
}