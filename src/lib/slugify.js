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
 * Build a share URL using slug
 * e.g. buildShareUrl('/actualites', 'Mon Article Cool', 'id123')
 * → https://domain.com/actualites/mon-article-cool--id123
 */
export function buildShareUrl(basePath, title, id) {
  const slug = slugify(title);
  const suffix = id ? `--${id}` : '';
  return `${window.location.origin}${basePath}/${slug}${suffix}`;
}

/**
 * Extract ID from a slug-based URL param
 * e.g. "mon-article-cool--id123" → "id123"
 * Falls back to the param itself (for old-style numeric/UUID IDs)
 */
export function extractIdFromSlug(slugParam) {
  if (!slugParam) return slugParam;
  // Find last '--' separator and extract everything after it
  const idx = slugParam.lastIndexOf('--');
  if (idx !== -1) {
    const id = slugParam.slice(idx + 2).replace(/^-+/, ''); // trim leading dashes
    if (id) return id;
  }
  return slugParam;
}