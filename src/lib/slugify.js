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
 * Build a unique, remarkable entity slug: "mon-titre--<id>"
 * The slugified name gives readability; the id (mixed digits + letters)
 * guarantees uniqueness and lets the detail page fetch the exact record.
 */
export function buildEntitySlug(title, id) {
  const slug = slugify(title);
  if (!id) return slug;
  return `${slug}--${id}`;
}

/**
 * Build a share URL using slug
 * e.g. buildShareUrl('/actualites', 'Mon Article Cool', 'abc123')
 * → https://domain.com/actualites/mon-article-cool--abc123
 */
export function buildShareUrl(basePath, title, id) {
  return `${window.location.origin}${basePath}/${buildEntitySlug(title, id)}`;
}

/**
 * Extract ID from a slug-based URL param
 * e.g. "mon-article-cool--abc123" → "abc123"
 * Falls back to the param itself (old-style numeric/UUID IDs)
 */
export function extractIdFromSlug(slugParam) {
  if (!slugParam) return slugParam;
  const clean = String(slugParam).replace(/\/+$/g, '').trim();
  // Find last '--' separator and extract everything after it
  const idx = clean.lastIndexOf('--');
  if (idx !== -1) {
    const id = clean.slice(idx + 2).replace(/^-+/, ''); // trim leading dashes
    if (id) return id;
  }
  return clean;
}