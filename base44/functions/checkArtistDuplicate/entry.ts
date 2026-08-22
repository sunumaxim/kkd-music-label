import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Normalise un nom d'artiste pour la comparaison (supprime accents, ponctuation, espaces)
function normalize(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]/g, '')        // ponctuation, espaces
    .trim();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { artist_name, exclude_id } = body;
    if (!artist_name || !artist_name.trim()) {
      return Response.json({ error: 'Nom manquant' }, { status: 400 });
    }

    const normalized = normalize(artist_name);
    if (normalized.length < 2) {
      return Response.json({ duplicates: [], is_duplicate: false });
    }

    // Récupérer tous les artistes (service role pour couvrir tout le catalogue)
    const allArtists = await base44.asServiceRole.entities.Artist.list('-created_date', 500);
    const duplicates = [];

    for (const artist of allArtists) {
      if (exclude_id && artist.id === exclude_id) continue;
      const artistNorm = normalize(artist.name);
      if (artistNorm.length < 2) continue;

      // Correspondance exacte normalisée
      if (artistNorm === normalized) {
        duplicates.push({
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          photo_url: artist.photo_url,
          is_verified: artist.is_verified,
          match_type: 'exact',
          similarity: 100,
        });
        continue;
      }

      // Correspondance partielle forte (l'un contient l'autre ou distance faible)
      if (artistNorm.includes(normalized) || normalized.includes(artistNorm)) {
        duplicates.push({
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          photo_url: artist.photo_url,
          is_verified: artist.is_verified,
          match_type: 'partial',
          similarity: 80,
        });
        continue;
      }

      // Distance de Levenshtein simple pour les fautes de frappe
      const dist = levenshtein(normalized, artistNorm);
      const maxLen = Math.max(normalized.length, artistNorm.length);
      const similarity = Math.round((1 - dist / maxLen) * 100);
      if (similarity >= 85 && dist <= 3) {
        duplicates.push({
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          photo_url: artist.photo_url,
          is_verified: artist.is_verified,
          match_type: 'fuzzy',
          similarity,
        });
      }
    }

    // Trier par similarité décroissante
    duplicates.sort((a, b) => b.similarity - a.similarity);

    return Response.json({
      duplicates: duplicates.slice(0, 5),
      is_duplicate: duplicates.length > 0,
      exact_match: duplicates.some(d => d.match_type === 'exact'),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Distance de Levenshtein
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}