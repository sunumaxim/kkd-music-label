import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArtistGallery({ gallery = [], artistName }) {
  const [lightbox, setLightbox] = useState(null); // index

  if (!gallery.length) return null;

  const prev = () => setLightbox(i => (i - 1 + gallery.length) % gallery.length);
  const next = () => setLightbox(i => (i + 1) % gallery.length);

  return (
    <div>
      <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
        <Camera size={18} className="text-primary" /> Galerie photos
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {gallery.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="aspect-square overflow-hidden rounded-xl group relative"
          >
            <img
              src={url}
              alt={`${artistName} ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={e => { e.stopPropagation(); setLightbox(null); }}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            >
              <X size={24} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
            <motion.img
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={gallery[lightbox]}
              alt={`${artistName} ${lightbox + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={32} />
            </button>
            <div className="absolute bottom-4 text-white/50 text-sm font-mono">
              {lightbox + 1} / {gallery.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}