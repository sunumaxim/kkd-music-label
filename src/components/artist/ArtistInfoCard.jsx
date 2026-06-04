import React from 'react';
import { Calendar, MapPin, Users, Music2, Globe, ExternalLink } from 'lucide-react';

export default function ArtistInfoCard({ artist }) {
  const rows = [
    { icon: Music2, label: 'Genre', value: artist.genre },
    { icon: Calendar, label: 'Né(e) le', value: artist.birth_date ? new Date(artist.birth_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
    { icon: MapPin, label: 'Lieu de naissance', value: artist.birth_place },
    { icon: Globe, label: 'Nationalité', value: artist.nationality },
    { icon: Music2, label: 'Label', value: artist.label },
    { icon: Calendar, label: 'Actif depuis', value: artist.active_since },
  ].filter(r => r.value);

  const hasMembers = artist.group_members?.length > 0;
  const hasAssociated = artist.associated_acts?.length > 0;

  if (!rows.length && !hasMembers && !hasAssociated && !artist.wikipedia_url && !artist.website_url) return null;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider">Informations</h3>
      
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={14} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMembers && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Membres du groupe</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {artist.group_members.map((m, i) => (
              <span key={i} className="text-xs bg-secondary rounded-full px-2.5 py-1">{m}</span>
            ))}
          </div>
        </div>
      )}

      {hasAssociated && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Artistes associés</p>
          <div className="flex flex-wrap gap-1.5">
            {artist.associated_acts.map((a, i) => (
              <span key={i} className="text-xs bg-secondary rounded-full px-2.5 py-1">{a}</span>
            ))}
          </div>
        </div>
      )}

      {(artist.wikipedia_url || artist.website_url) && (
        <div className="flex flex-col gap-2 pt-1 border-t border-border/30">
          {artist.wikipedia_url && (
            <a href={artist.wikipedia_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink size={12} /> Wikipedia
            </a>
          )}
          {artist.website_url && (
            <a href={artist.website_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Globe size={12} /> Site officiel
            </a>
          )}
        </div>
      )}
    </div>
  );
}