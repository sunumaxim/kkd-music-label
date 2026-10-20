import React from 'react';
import { ExternalLink, Music2, Youtube } from 'lucide-react';

const PLATFORMS = [
  { key: 'spotify_url', label: 'Spotify' },
  { key: 'apple_music_url', label: 'Apple Music' },
  { key: 'audiomack_url', label: 'Audiomack' },
  { key: 'deezer_url', label: 'Deezer' },
  { key: 'youtube_url', label: 'YouTube' },
];

export default function BuyCard({ item }) {
  const forSale = Boolean(item?.is_for_sale && Number(item?.price) > 0);
  if (!forSale) return null;

  const links = PLATFORMS
    .map((platform) => ({ ...platform, url: item?.[platform.key] }))
    .filter((platform) => typeof platform.url === 'string' && /^https?:\/\//i.test(platform.url));

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary"><Music2 size={18} /></div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Achat direct temporairement suspendu</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pour éviter les paiements non automatisés et les confusions sur les droits, les achats de masters et les licences ne sont pas proposés sur la plateforme pour le moment.
          </p>
        </div>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((platform) => (
            <a
              key={platform.key}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              {platform.key === 'youtube_url' ? <Youtube size={15} /> : <ExternalLink size={15} />}
              Écouter sur {platform.label}
            </a>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Pour une demande professionnelle de licence ou de partenariat, contactez directement KKD Music.
      </p>
    </section>
  );
}
