import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/30">
      {/* Big brand text */}
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-5xl md:text-8xl tracking-tighter from-primary via-red-600 to-primary bg-clip-text text-transparent font-medium">KKD MUSIC

          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 hidden">
          <div>
            <img src={LOGO_URL} alt="KKD Music" className="h-12 w-auto mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Label indépendant dédié à la promotion d'artistes talentueux. 
              Une filiale de SunuMaxim GROUP.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-primary hidden">Navigation</h3>
            <div className="space-y-2">
              {[
              { label: 'Artistes', path: '/artistes' },
              { label: 'Musique', path: '/musique' },
              { label: 'Vidéos', path: '/videos' },
              { label: 'Actualités', path: '/actualites' },
              { label: 'Événements', path: '/evenements' },
              { label: 'Travailler avec nous', path: '/partenaires' }].
              map((link) =>
              <Link
                key={link.path}
                to={link.path}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                
                  {link.label}
                </Link>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-primary">Streaming</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Spotify</p>
              <p>Apple Music</p>
              <p>YouTube Music</p>
              <p>Audiomack</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} KKD Music. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Une filiale de <span className="text-foreground font-medium">SunuMaxim GROUP</span>
          </p>
        </div>
      </div>
    </footer>);

}