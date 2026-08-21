import { base44 } from '@/api/base44Client';
import { slugify, extractIdFromSlug } from './slugify';

/**
 * Résout une entité par slug, ID legacy, ID brut, ou titre slugifié.
 * Stratégie ordonnée :
 *   1. ID legacy (format "slug--id")
 *   2. Slug exact (champ `slug` de l'entité)
 *   3. ID brut (si le paramètre ressemble à un ID Base44)
 *   4. Match par titre/nom slugifié (liste + comparaison locale)
 *
 * Si l'entité est trouvée via le fallback par titre mais n'a pas de slug,
 * le slug est automatiquement persisté pour les futures recherches.
 *
 * @param {string} entityName  — Nom de l'entité SDK (Release, Video, Artist, Event, News)
 * @param {string} slugParam   — Paramètre URL brut (slug, "slug--id", ou ID)
 * @param {string} nameField   — Champ utilisé pour le match par titre ('title' ou 'name')
 * @returns {Promise<Object|null>}
 */
export async function resolveEntityBySlug(entityName, slugParam, nameField = 'title') {
  if (!slugParam) return null;

  const entity = base44.entities[entityName];
  const slug = slugify(slugParam);
  const legacyId = String(slugParam).includes('--') ? extractIdFromSlug(slugParam) : null;

  // 1. ID legacy (format slug--id)
  if (legacyId) {
    try {
      const results = await entity.filter({ id: legacyId });
      if (results[0]) return results[0];
    } catch (_) {}
  }

  // 2. Slug exact (si non vide)
  if (slug) {
    try {
      const bySlug = (await entity.filter({ slug }))[0];
      if (bySlug) return bySlug;
    } catch (_) {}
  }

  // 3. ID brut (si le paramètre ressemble à un ID Base44 — hex long)
  if (slugParam.length >= 20 && /^[a-f0-9]+$/i.test(slugParam)) {
    try {
      const byId = await entity.get(slugParam);
      if (byId) return byId;
    } catch (_) {}
  }

  // 4. Match par titre/nom slugifié (fallback)
  try {
    const all = await entity.list('-created_date', 500);
    const found = all.find((r) => slugify(r[nameField]) === slug);
    if (found) {
      // Auto-persist slug for future direct lookups
      if (!found.slug) entity.update(found.id, { slug }).catch(() => {});
      return found;
    }
  } catch (_) {}

  return null;
}