/**
 * Converts a string to a URL-friendly slug
 * e.g. "Mon Super Album !" → "mon-super-album"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

/**
 * Domaine officiel de la plateforme — utilisé pour les canonical / OG / liens de partage.
 * Les aperçus de partage reposent sur le pré-rendu serveur de Base44 (meta injectées
 * côté client par PageMeta, capturées dans le snapshot servi aux crawlers).
 */
export const SITE_URL = 'https://kkdmusic.com';

/**
 * Build a clean, human-readable entity slug: "mon-titre" (nom seul, sans code/id).
 * Le slug est stocké sur l'entité (champ `slug`) pour une résolution fiable.
 */
export function buildEntitySlug(nameOrTitle, _id) {
  return slugify(nameOrTitle);
}

/**
 * Build a share URL using a clean slug.
 * e.g. buildShareUrl('/musique', 'Mon Titre') → https://kkdmusic.com/musique/mon-titre
 */
export function buildShareUrl(basePath, nameOrTitle) {
  return `${SITE_URL}${basePath}/${slugify(nameOrTitle)}`;
}

/**
 * Build a share URL pointing to the backend share-meta endpoint (legacy fallback).
 * Prefer buildShareUrl() — Base44 pré-rend les routes et sert les bonnes meta aux crawlers.
 */
export function buildSharePreviewUrl(type, slug, appUrl) {
  const base = `${SITE_URL}/functions/shareMeta?type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}`;
  return appUrl ? `${base}&to=${encodeURIComponent(appUrl)}` : base;
}

/**
 * Extract a legacy id from an old-style slug "mon-titre--abc123".
 * Returns null for clean slugs (new format, name only).
 */
export function extractIdFromSlug(slugParam) {
  if (!slugParam) return null;
  const clean = String(slugParam).replace(/\/+$/g, '').trim();
  const idx = clean.lastIndexOf('--');
  if (idx !== -1) {
    const id = clean.slice(idx + 2).replace(/^-+/, '');
    if (id) return id;
  }
  return null;
}