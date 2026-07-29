import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { slugify } from '@/lib/slugify';
import { EmbeddedPlayer } from '@/components/shared/UniversalPlayer';

export default function Artists() {
  const [playingId, setPlayingId] = useState(null);

  const { data: artists, isLoading } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.Artist.list('order', 50),
    initialData: [],
  });

  const playingArtist = artists.find(a => a.id === playingId);
  const streamUrl = playingArtist
    ? playingArtist.spotify_url || playingArtist.audiomack_url || playingArtist.youtube_url || playingArtist.soundcloud_url
    : null;

  return (
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">Le Roster</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
            Nos Artistes
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Découvrez les artistes du label KKD Music. Talent, passion et authenticité.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Aucun artiste pour le moment.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artists.map((artist, i) => {
                const hasStream = !!(artist.spotify_url || artist.audiomack_url || artist.youtube_url || artist.soundcloud_url);
                const isPlaying = playingId === artist.id;
                return (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`group block rounded-xl overflow-hidden border transition-all duration-300 ${
                      isPlaying ? 'border-primary/60' : 'border-transparent hover:border-border/50'
                    }`}>
                      {/* Photo */}
                      <Link to={`/artistes/${artist.slug || slugify(artist.name)}`} className="block">
                        <div className="relative aspect-[3/4] overflow-hidden bg-card">
                          {artist.photo_url ? (
                            <img
                              src={artist.photo_url}
                              alt={artist.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
                              <span className="font-display text-5xl font-bold text-primary/20">
                                {artist.name?.[0]}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="font-heading font-bold text-lg text-white">{artist.name}</h3>
                            {artist.genre && (
                              <p className="text-xs text-white/70 mt-0.5">{artist.genre}</p>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Listen button */}
                      {hasStream && (
                        <div className="bg-card px-3 py-2.5 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setPlayingId(isPlaying ? null : artist.id)}
                            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex-1 justify-center ${
                              isPlaying
                                ? 'bg-primary/20 text-primary'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            <Play size={11} fill="currentColor" />
                            {isPlaying ? 'En écoute...' : 'Écouter'}
                          </button>
                          <Link
                            to={`/artistes/${artist.slug || slugify(artist.name)}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                          >
                            Profil
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Floating mini player */}
            <AnimatePresence>
              {playingId && streamUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      {playingArtist?.photo_url && (
                        <img src={playingArtist.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="text-xs font-medium">{playingArtist?.name}</p>
                        <p className="text-[10px] text-muted-foreground">Lecture en cours</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPlayingId(null)}
                      className="w-7 h-7 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <EmbeddedPlayer url={streamUrl} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}