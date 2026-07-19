import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Instagram, Send, Loader2, CheckCircle2, AlertCircle, Copy, Check, Radio, Facebook } from 'lucide-react';

const PLATFORMS = [
  { key: 'plateforme', label: 'Plateforme KKD', icon: Radio, color: 'text-primary' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { key: 'tiktok', label: 'TikTok', icon: null, color: 'text-foreground' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
];

function TikTokIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.53V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
  );
}

export default function DestinationPanel({ broadcast, linkedEvent, onChange }) {
  const [igStatus, setIgStatus] = useState(null);
  const [igMsg, setIgMsg] = useState('');
  const [tiktokCopied, setTiktokCopied] = useState(false);

  const dests = broadcast.destinations || [];

  const toggle = (key) => {
    const next = dests.includes(key) ? dests.filter(d => d !== key) : [...dests, key];
    onChange({ destinations: next });
  };

  const publishInstagram = async () => {
    if (!linkedEvent) {
      setIgStatus('error');
      setIgMsg('Lie un événement avec une image pour publier sur Instagram.');
      return;
    }
    setIgStatus('loading');
    setIgMsg('');
    try {
      const res = await base44.functions.invoke('publishToInstagram', {
        content_type: 'event',
        entity_id: linkedEvent.id,
      });
      const d = res.data;
      if (d?.success) {
        setIgStatus('success');
        setIgMsg(`Publié ! Post ID : ${d.post_id}`);
      } else if (d?.skipped) {
        setIgStatus('error');
        setIgMsg("L'événement lié n'a pas d'image.");
      } else {
        setIgStatus('error');
        setIgMsg(d?.error || 'Erreur lors de la publication.');
      }
    } catch (e) {
      setIgStatus('error');
      setIgMsg(e.message);
    }
  };

  const tiktokCaption = `🔴 LIVE — ${broadcast.title}\n\n${broadcast.description || ''}\n\n▶️ Regarder le direct : ${broadcast.stream_url || (linkedEvent ? 'sur KKD Music' : '')}\n\n#kkdmusic #live #concert #${(broadcast.title || 'live').replace(/\s+/g, '').toLowerCase()}`;

  const copyTikTok = () => {
    navigator.clipboard.writeText(tiktokCaption);
    setTiktokCopied(true);
    setTimeout(() => setTiktokCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Send size={16} className="text-primary" /> Destinations de diffusion
      </h3>

      <div className="space-y-2">
        {PLATFORMS.map(p => {
          const active = dests.includes(p.key);
          return (
            <button
              key={p.key}
              onClick={() => toggle(p.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                active ? 'bg-primary/10 border-primary/40 text-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center bg-secondary ${p.color}`}>
                {p.icon ? <p.icon size={15} /> : <TikTokIcon size={14} />}
              </span>
              <span className="flex-1 text-left">{p.label}</span>
              {active && <Check size={14} className="text-primary" />}
            </button>
          );
        })}
      </div>

      {dests.includes('plateforme') && (
        <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground">
          {linkedEvent ? (
            <p>Le direct s'affichera en lecture intégrée sur la page de l'événement « <span className="text-foreground font-medium">{linkedEvent.title}</span> ».</p>
          ) : (
            <p>Lie un événement pour que le direct s'affiche sur sa page publique.</p>
          )}
        </div>
      )}

      {dests.includes('instagram') && (
        <div className="border-t border-border/50 pt-3 space-y-2">
          <button
            onClick={publishInstagram}
            disabled={igStatus === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {igStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Instagram size={14} />}
            {igStatus === 'loading' ? 'Publication…' : 'Publier sur Instagram'}
          </button>
          {igStatus && igStatus !== 'loading' && (
            <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
              igStatus === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'
            }`}>
              {igStatus === 'success' ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertCircle size={13} className="shrink-0 mt-0.5" />}
              {igMsg}
            </div>
          )}
        </div>
      )}

      {dests.includes('tiktok') && (
        <div className="border-t border-border/50 pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">TikTok ne permet pas la publication auto. Copie la légende :</p>
          <textarea readOnly value={tiktokCaption} rows={4} className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-mono resize-none" />
          <button onClick={copyTikTok} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black text-white text-sm font-medium">
            {tiktokCopied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier la légende</>}
          </button>
        </div>
      )}

      {dests.includes('facebook') && (
        <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Facebook</p>
          <p>1. Ouvre ta Page Facebook → « Créer un direct »</p>
          {broadcast.stream_url && (
            <>
              <p>2. Colle le lien du flux :</p>
              <code className="block bg-secondary rounded p-2 text-[10px] break-all">{broadcast.stream_url}</code>
            </>
          )}
        </div>
      )}
    </div>
  );
}