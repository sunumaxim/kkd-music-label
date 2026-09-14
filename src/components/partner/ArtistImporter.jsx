import React from 'react';
import QuickCatalogImporterModal from '@/components/admin/QuickCatalogImporterModal';

/**
 * ArtistImporter — Composant d'importation de contenu pour un artiste.
 * Utilise le moteur unifié QuickCatalogImporterModal qui prend en charge
 * Spotify, Deezer, Apple Music, YouTube avec extraction des featurings et dates.
 */
export default function ArtistImporter({ artist, onClose }) {
  return (
    <QuickCatalogImporterModal
      isOpen={true}
      onClose={onClose}
      initialArtist={artist}
      initialMode="search"
      onSuccess={onClose}
    />
  );
}
