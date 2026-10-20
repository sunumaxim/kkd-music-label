// Utilitaires de localisation : liens Google Maps / itinéraire, jamais de clé API requise.
export function hasCoords(e) {
  return Number.isFinite(Number(e?.location_lat)) && Number.isFinite(Number(e?.location_lng))
    && (Number(e.location_lat) !== 0 || Number(e.location_lng) !== 0)
    && e?.location_lat !== '' && e?.location_lat != null;
}

function destination(e) {
  if (hasCoords(e)) return `${Number(e.location_lat)},${Number(e.location_lng)}`;
  return [e?.location, e?.city].filter(Boolean).join(', ');
}

export function mapsUrl(e) {
  const q = destination(e);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

export function directionsUrl(e) {
  const q = destination(e);
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : '';
}

export function osmEmbedUrl(e) {
  if (!hasCoords(e)) return '';
  const lat = Number(e.location_lat), lng = Number(e.location_lng), d = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

// Extrait des coordonnées depuis un texte collé (« 13.77, -13.67 » ou lien Google Maps contenant @lat,lng)
export function parseCoords(text) {
  const m = String(text || '').match(/(-?\d{1,2}\.\d{3,})\s*[,;\s]\s*(-?\d{1,3}\.\d{3,})/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// Nettoie un lien saisi par un organisateur : uniquement http(s)
export function safeHttpUrl(u) {
  try {
    const url = new URL(String(u || '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch { return ''; }
}
