import React from 'react';
import { motion } from 'framer-motion';
import { Music, MapPin, LayoutGrid, List, Images } from 'lucide-react';

export default function FanGalleryFilters({ posts, filterArtist, filterEvent, setFilterArtist, setFilterEvent, viewMode, setViewMode }) {
  const artists = [...new Set(posts.map(p => p.artist_name).filter(Boolean))].sort();
  const events = [...new Set(posts.map(p => p.event_name).filter(Boolean))].sort();

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* View mode + counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Images size={15} className="text-primary" />
          <span><span className="text-foreground font-bold">{posts.length}</span> moment{posts.length > 1 ? 's' : ''} partagé{posts.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          <button
            onClick={() => setViewMode('masonry')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'masonry' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            title="Mosaïque"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            title="Liste"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Artist filter */}
        {artists.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Music size={9}/> Artiste</span>
            <button
              onClick={() => setFilterArtist('')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!filterArtist ? 'bg-primary text-white border-primary' : 'border-border/40 text-muted-foreground hover:border-primary/40'}`}
            >
              Tous
            </button>
            {artists.map(a => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterArtist(a === filterArtist ? '' : a)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterArtist === a ? 'bg-primary text-white border-primary' : 'border-border/40 text-muted-foreground hover:border-primary/40'}`}
              >
                {a}
              </motion.button>
            ))}
          </div>
        )}

        {/* Event filter */}
        {events.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1"><MapPin size={9}/> Événement</span>
            {events.map(e => (
              <motion.button
                key={e}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterEvent(e === filterEvent ? '' : e)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterEvent === e ? 'bg-accent text-accent-foreground border-accent' : 'border-border/40 text-muted-foreground hover:border-accent/40'}`}
              >
                {e}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}