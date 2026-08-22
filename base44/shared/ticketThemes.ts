/**
 * Thèmes de design des billets KKD.
 * Utilisé par generateTicketFile (PDF) et le sélecteur de thème frontend.
 * Chaque thème définit: primary (couleur accent), bg (fond principal), sidebar (fond sidebar), label.
 */
export const TICKET_THEMES = {
  classic: {
    label: 'Classic',
    primary: [229, 57, 53],    // rouge KKD
    bg: [6, 6, 6],             // noir profond
    sidebar: [245, 245, 245], // gris clair
    accentText: '#E53935',
    swatch: 'linear-gradient(135deg, #E53935 0%, #8A1C1C 100%)',
  },
  gold: {
    label: 'Gold',
    primary: [212, 175, 55],   // or
    bg: [10, 8, 5],            // noir chaud
    sidebar: [248, 244, 232],  // crème
    accentText: '#D4AF37',
    swatch: 'linear-gradient(135deg, #D4AF37 0%, #8A6D1C 100%)',
  },
  emerald: {
    label: 'Emerald',
    primary: [31, 138, 92],    // vert émeraude
    bg: [6, 18, 12],           // vert noir
    sidebar: [238, 248, 242],  // vert très clair
    accentText: '#1F8A5C',
    swatch: 'linear-gradient(135deg, #1F8A5C 0%, #0D4D2E 100%)',
  },
  royal: {
    label: 'Royal',
    primary: [124, 58, 237],  // violet royal
    bg: [10, 6, 18],           // violet noir
    sidebar: [244, 240, 252],  // violet très clair
    accentText: '#7C3AED',
    swatch: 'linear-gradient(135deg, #7C3AED 0%, #3D1B7A 100%)',
  },
  ocean: {
    label: 'Ocean',
    primary: [14, 165, 233],   // bleu océan
    bg: [6, 16, 26],           // bleu noir
    sidebar: [238, 246, 252], // bleu très clair
    accentText: '#0EA5E9',
    swatch: 'linear-gradient(135deg, #0EA5E9 0%, #0B4A7A 100%)',
  },
} as const;

export type TicketThemeKey = keyof typeof TICKET_THEMES;

export function getTheme(key: string) {
  return TICKET_THEMES[key as TicketThemeKey] || TICKET_THEMES.classic;
}

export const TICKET_THEME_KEYS = Object.keys(TICKET_THEMES);