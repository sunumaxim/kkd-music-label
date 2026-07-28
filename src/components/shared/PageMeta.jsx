import { useEffect } from 'react';
import { SITE_URL } from '@/lib/slugify';

/**
 * Injects dynamic Open Graph / Twitter meta tags + JSON-LD structured data
 * into <head> for rich previews when sharing links externally.
 * Base44 pre-renders the app for crawlers, so these client-side meta tags are
 * captured in the server snapshot served to WhatsApp / Facebook / X / iMessage.
 */
export default function PageMeta({ title, description, image, url, type = 'website', jsonLd }) {
  useEffect(() => {
    const siteName = 'KKD Music';
    const fullTitle = title ? `${title} — ${siteName}` : siteName;

    document.title = fullTitle;

    const setMeta = (property, content, isName = false) => {
      if (!content) return;
      const attr = isName ? 'name' : 'property';
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const pageUrl = url || `${SITE_URL}${window.location.pathname}`;
    const fallbackDesc = 'Découvrez la musique africaine sur KKD Music — artistes, sorties, vidéos et événements.';

    // Open Graph
    setMeta('og:title', fullTitle);
    setMeta('og:description', description || fallbackDesc);
    setMeta('og:type', type);
    setMeta('og:url', pageUrl);
    setMeta('og:site_name', siteName);
    setMeta('og:locale', 'fr_FR');
    if (image) setMeta('og:image', image);

    // Twitter Card
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary', true);
    setMeta('twitter:title', fullTitle, true);
    setMeta('twitter:description', description || '', true);
    if (image) setMeta('twitter:image', image, true);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    // Structured data (JSON-LD)
    let ld = document.getElementById('kkd-jsonld');
    if (jsonLd) {
      if (!ld) {
        ld = document.createElement('script');
        ld.id = 'kkd-jsonld';
        ld.type = 'application/ld+json';
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify(jsonLd);
    } else if (ld) {
      ld.remove();
    }

    return () => {
      document.title = siteName;
    };
  }, [title, description, image, url, type, jsonLd]);

  return null;
}