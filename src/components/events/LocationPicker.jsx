import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, X, ExternalLink, Crosshair } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { parseCoords, mapsUrl } from '@/lib/maps';

/**
 * Recherche de lieu « au fil de la frappe » (OpenStreetMap / Nominatim, sans clé API).
 * Le lieu choisi mémorise nom, ville, adresse et coordonnées -> lien cliquable pour les visiteurs.
 * Pour un terrain/village introuvable : saisir le nom à la main, ou coller les coordonnées / un lien Google Maps.
 */
export default function LocationPicker({ value = {}, onChange, placeholder = 'Rechercher un lieu : Tamba, Dakar, Missirah…' }) {
  const [q, setQ] = useState(value.location || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const timer = useRef(null);
  const ctrl = useRef(null);
  const box = useRef(null);

  useEffect(() => { setQ(value.location || ''); }, [value.location]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const search = (text) => {
    clearTimeout(timer.current);
    ctrl.current?.abort();
    setEmpty(false);
    if (text.trim().length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      ctrl.current = new AbortController();
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=fr&q=${encodeURIComponent(text.trim())}`;
        const r = await fetch(url, { signal: ctrl.current.signal });
        const list = r.ok ? await r.json() : [];
        setResults(Array.isArray(list) ? list : []);
        setEmpty(!list.length);
        setOpen(true);
      } catch (e) {
        if (e.name !== 'AbortError') { setResults([]); setEmpty(true); }
      } finally { setLoading(false); }
    }, 450);
  };

  const onType = (text) => {
    setQ(text);
    const c = parseCoords(text);
    // Saisie manuelle : on garde le texte, et on retire un ancien pin devenu faux
    onChange({ location: text, ...(value.location_lat != null && !c ? { location_lat: null, location_lng: null, location_address: '' } : {}) });
    if (c) { onChange({ location: value.location || '', location_lat: c.lat, location_lng: c.lng }); setResults([]); setOpen(false); return; }
    search(text);
  };

  const pick = (r) => {
    const a = r.address || {};
    const name = r.name || r.display_name.split(',')[0];
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state || '';
    onChange({
      location: name,
      city: city || value.city || '',
      location_lat: parseFloat(r.lat),
      location_lng: parseFloat(r.lon),
      location_address: r.display_name,
    });
    setQ(name); setOpen(false); setResults([]);
  };

  const pinned = Number.isFinite(Number(value.location_lat)) && value.location_lat != null && value.location_lat !== '';

  return (
    <div ref={box} className="relative space-y-2">
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => onType(e.target.value)} onFocus={() => results.length && setOpen(true)} placeholder={placeholder} className="pl-9 pr-9" autoComplete="off" />
        {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && (results.length > 0 || empty) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button type="button" key={r.place_id} onClick={() => pick(r)} className="w-full text-left px-3 py-2.5 hover:bg-secondary flex gap-2 items-start border-b border-border/40 last:border-0">
              <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-snug">
                <b>{r.name || r.display_name.split(',')[0]}</b>
                <span className="block text-xs text-muted-foreground line-clamp-1">{r.display_name}</span>
              </span>
            </button>
          ))}
          {empty && (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Aucun résultat. Gardez votre texte : les visiteurs seront dirigés via Google Maps. Pour un point précis, collez ici les coordonnées (ex : 13.7708, -13.6673) ou un lien Google Maps.
            </p>
          )}
        </div>
      )}

      {pinned ? (
        <div className="flex flex-wrap items-center gap-2 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 px-3 py-2">
          <Crosshair size={13} /> Position enregistrée ({Number(value.location_lat).toFixed(4)}, {Number(value.location_lng).toFixed(4)})
          <a href={mapsUrl(value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline ml-1"><ExternalLink size={12} />Vérifier</a>
          <button type="button" className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => onChange({ location_lat: null, location_lng: null, location_address: '' })}><X size={12} />Retirer le pin</button>
        </div>
      ) : (
        value.location && <p className="text-[11px] text-muted-foreground">Sans position GPS, le lien ouvrira une recherche Google Maps sur « {[value.location, value.city].filter(Boolean).join(', ')} ».</p>
      )}
    </div>
  );
}
