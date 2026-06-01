import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ArtistSelector({ value, onChange, placeholder = "Rechercher un artiste..." }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-selector'],
    queryFn: () => base44.entities.Artist.list('name'),
  });

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = artists.find(a => a.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-transparent text-sm text-left hover:bg-secondary/50 transition-colors"
      >
        {selected?.photo_url && (
          <img src={selected.photo_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
        )}
        {!selected?.photo_url && <User size={14} className="text-muted-foreground shrink-0" />}
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.name : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun artiste trouvé</p>
            ) : (
              filtered.map(artist => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => { onChange(artist.id, artist.name); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                >
                  {artist.photo_url ? (
                    <img src={artist.photo_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {artist.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{artist.name}</p>
                    {artist.genre && <p className="text-[11px] text-muted-foreground">{artist.genre}</p>}
                  </div>
                  {value === artist.id && <Check size={14} className="text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}