// Studio Vidéo IA — durées et formats
// La plateforme génère des clips de 8s max ; une vidéo de 30/45/60s est obtenue
// en assemblant plusieurs clips (4, 6 ou 8) lus séquentiellement côté frontend.
export const VIDEO_DURATIONS = [
  { value: 30, label: '30 secondes', clips: 4 },
  { value: 45, label: '45 secondes', clips: 6 },
  { value: 60, label: '60 secondes', clips: 8 },
];

export const VIDEO_ASPECTS = [
  { value: '16:9', label: 'Paysage (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
];

// Conservé pour rétro-compatibilité (système de crédits retiré)
export const VIDEO_PACKS = [
  { id: 'decouverte', label: 'Pack Découverte', credits: 3, amount: 0, unit: 'Gratuit', desc: 'Supprimé' },
];
export const packById = (id) => VIDEO_PACKS.find((p) => p.id === id);
export const creditsForDuration = () => 0;