import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

/**
 * Universal share bar — copies clean slug URL + opens social share dialogs
 */
export default function ShareBar({ title, url, compact = false }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: shareUrl });
    } else {
      copyLink();
    }
  };

  if (compact) {
    return (
      <button
        onClick={openShare}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          copied ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-card border-border/50 hover:border-primary/40 text-muted-foreground hover:text-foreground'
        }`}
      >
        {copied ? <Check size={12} /> : <Share2 size={12} />}
        {copied ? 'Copié !' : 'Partager'}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={copyLink}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          copied ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-card border-border/50 hover:border-primary/40 text-muted-foreground hover:text-primary'
        }`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Lien copié !' : 'Copier le lien'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent((title ? title + ' — ' : '') + shareUrl)}`}
        target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title || '')}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20 transition-colors"
      >
        Twitter / X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
        target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600/20 transition-colors"
      >
        Facebook
      </a>
    </div>
  );
}