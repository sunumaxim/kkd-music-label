// Tarifs Studio Vidéo IA — 1 crédit = 1 génération vidéo animée
export const VIDEO_PACKS = [
  { id: 'decouverte', label: 'Pack Découverte', credits: 3, amount: 3000, unit: '1 000 F / vidéo', desc: 'Pour tester le studio' },
  { id: 'createur', label: 'Pack Créateur', credits: 10, amount: 8000, unit: '800 F / vidéo', desc: 'Le plus populaire', popular: true },
  { id: 'studio', label: 'Pack Studio', credits: 25, amount: 15000, unit: '600 F / vidéo', desc: 'Meilleur tarif vidéo' },
];

// Coût en crédits selon la durée (adapté à la consommation plateforme)
export const VIDEO_DURATIONS = [
  { value: 4, label: '4 secondes', credits: 1 },
  { value: 6, label: '6 secondes', credits: 1 },
  { value: 8, label: '8 secondes', credits: 2 },
];

export const VIDEO_ASPECTS = [
  { value: '16:9', label: 'Paysage (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
];

export const packById = (id) => VIDEO_PACKS.find((p) => p.id === id);
export const creditsForDuration = (d) => VIDEO_DURATIONS.find((x) => x.value === Number(d))?.credits || 1;