import { useEffect } from 'react';

/**
 * Injects dynamic Open Graph / Twitter meta tags into <head>
 * for rich previews when sharing links externally.
 */
export default function PageMeta({ title, description, image, url, type = 'website' }) {
  useEffect(() => {
    const siteName = 'KKD Music';
    const fullTitle = title ? `${title} — ${siteName}` : siteName;

    // <title>
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

    const pageUrl = url || window.location.href;

    // Open Graph
    setMeta('og:title', fullTitle);
    setMeta('og:description', description || 'Découvrez la musique africaine sur KKD Music — artistes, sorties, vidéos et événements.');
    setMeta('og:type', type);
    setMeta('og:url', pageUrl);
    setMeta('og:site_name', siteName);
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

    return () => {
      document.title = siteName;
    };
  }, [title, description, image, url, type]);

  return null;
}