/**
 * Composant affichant les vidéos TikTok et posts Instagram d'un artiste
 * (lecture via lien public — les connecteurs OAuth permettent d'aller plus loin)
 */
import React, { useState } from 'react';
import { ExternalLink, Play, Instagram, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function TikTokIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

export default function ArtistSocialSync({ artist }) {
  const [activeTab, setActiveTab] = useState('instagram');

  if (!artist?.instagram_url && !artist?.tiktok_url) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-heading font-bold text-lg">Réseaux sociaux</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {artist.instagram_url && (
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'instagram'
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <Instagram size={15} /> Instagram
          </button>
        )}
        {artist.tiktok_url && (
          <button
            onClick={() => setActiveTab('tiktok')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tiktok'
                ? 'bg-slate-500/20 text-slate-200 border border-slate-500/30'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <TikTokIcon size={15} /> TikTok
          </button>
        )}
      </div>

      {/* Instagram panel */}
      {activeTab === 'instagram' && artist.instagram_url && (
        <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Instagram size={18} className="text-pink-400" />
              <div>
                <p className="font-bold text-sm text-pink-300">
                  @{artist.instagram_username || artist.name.toLowerCase().replace(/\s+/g, '')}
                </p>
                <p className="text-xs text-muted-foreground">Compte Instagram officiel</p>
              </div>
            </div>
            <a
              href={artist.instagram_url}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="text-pink-400 border-pink-500/30 gap-1.5 text-xs">
                <ExternalLink size={12} /> Voir le profil
              </Button>
            </a>
          </div>

          {/* Embed du profil Instagram via lien */}
          <div className="bg-black/30 rounded-xl overflow-hidden">
            <iframe
              src={`${artist.instagram_url.replace(/\/$/, '')}/embed`}
              className="w-full"
              style={{ minHeight: '320px', border: 'none' }}
              allowTransparency
              scrolling="no"
              title="Instagram"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Contenu chargé directement depuis Instagram
          </p>
        </div>
      )}

      {/* TikTok panel */}
      {activeTab === 'tiktok' && artist.tiktok_url && (
        <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TikTokIcon size={18} />
              <div>
                <p className="font-bold text-sm text-slate-200">
                  @{artist.tiktok_username || artist.name.toLowerCase().replace(/\s+/g, '')}
                </p>
                <p className="text-xs text-muted-foreground">Compte TikTok officiel</p>
              </div>
            </div>
            <a href={artist.tiktok_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <ExternalLink size={12} /> Voir le profil
              </Button>
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={artist.tiktok_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-black/30 hover:bg-black/50 transition-colors border border-slate-600/20"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                <TikTokIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Voir les vidéos TikTok</p>
                <p className="text-xs text-muted-foreground">Accéder au profil complet</p>
              </div>
              <ExternalLink size={13} className="ml-auto text-muted-foreground" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Pour voir les vidéos TikTok directement ici, l'artiste peut connecter son compte TikTok depuis son espace partenaire.
          </p>
        </div>
      )}
    </div>
  );
}