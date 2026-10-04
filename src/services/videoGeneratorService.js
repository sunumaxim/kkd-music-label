// KKD Music — Service de Génération Vidéo, Crédits & Abonnements
import { firestoreService, auth } from '@/lib/firebase';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Formule Découverte',
    badge: 'Gratuit',
    price: 0,
    period: 'Toujours gratuit',
    monthlyCredits: 3,
    description: 'Pour explorer le studio vidéo et publier vos premiers teasers.',
    features: [
      '3 crédits d’essai offerts',
      'Format TikTok 9:16',
      'Presets visuels classiques',
      'Téléchargement MP4 haute fidélité',
      'Filigrane discret KKD Music'
    ],
    popular: false,
    ctaText: 'Formule actuelle'
  },
  {
    id: 'creator',
    name: 'Artiste Créateur',
    badge: 'Recommandé',
    price: 9.99,
    period: 'par mois',
    monthlyCredits: 25,
    description: 'La solution complète pour animer régulièrement vos réseaux sociaux.',
    features: [
      '25 crédits mensuels renouvelés',
      'Multi-formats : TikTok, Reels (9:16) & YouTube (16:9)',
      'Tous les thèmes (Néon, Vinyle, Typographie, Spectre)',
      'Aucun filigrane',
      'Exportation prioritaire accélérée',
      'Support des extraits jusqu’à 60 secondes'
    ],
    popular: true,
    ctaText: 'Choisir Artiste Créateur'
  },
  {
    id: 'pro',
    name: 'Label & Pro',
    badge: 'Illimité',
    price: 24.99,
    period: 'par mois',
    monthlyCredits: 80,
    description: 'Conçu pour les labels, managers et producteurs à fort volume.',
    features: [
      '80 crédits mensuels renouvelés',
      'Tous les ratios et presets vidéo premium',
      'Exports ultra-définis 60 FPS sans filigrane',
      'Partage direct en un clic vers TikTok',
      'Historique cloud illimité des projets',
      'Assistance technique VIP prioritaire'
    ],
    popular: false,
    ctaText: 'Passer en Label Pro'
  }
];

export const CREDIT_PACKS = [
  {
    id: 'pack_10',
    credits: 10,
    price: 4.99,
    title: 'Pack Découverte',
    description: 'Idéal pour 5 à 10 teasers promotionnels',
    bonus: '',
    badge: null
  },
  {
    id: 'pack_30',
    credits: 35, // 30 + 5 bonus
    price: 12.99,
    title: 'Pack Boost Artiste',
    description: 'Pour une campagne de sortie complète sur TikTok & Instagram',
    bonus: '+5 crédits offerts',
    badge: 'Populaire',
    popular: true
  },
  {
    id: 'pack_75',
    credits: 90, // 75 + 15 bonus
    price: 24.99,
    title: 'Pack Label Master',
    description: 'Volume maximal pour clips, teasers et lyric videos',
    bonus: '+15 crédits offerts',
    badge: 'Meilleure valeur'
  }
];

export const VIDEO_FORMATS = [
  {
    id: 'tiktok_9_16',
    label: 'TikTok (9:16)',
    sublabel: 'Idéal pour vidéos courtes et sons tendances',
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16]',
    icon: 'tiktok'
  },
  {
    id: 'reels_9_16',
    label: 'Instagram Reels (9:16)',
    sublabel: 'Format vertical plein écran pour stories et reels',
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16]',
    icon: 'instagram'
  },
  {
    id: 'youtube_16_9',
    label: 'YouTube Paysage (16:9)',
    sublabel: 'Format horizontal pour clips officiels et visualizers',
    width: 1920,
    height: 1080,
    aspectClass: 'aspect-[16/9]',
    icon: 'youtube'
  }
];

export const VIDEO_THEMES = [
  {
    id: 'neon_pulse',
    name: 'Pulse Néon & Énergie',
    description: 'Pochette centrale avec aura néon pulsante et vagues d’ondes dynamiques réactives aux basses',
    accentColor: '#F59E0B',
    secondaryColor: '#EF4444'
  },
  {
    id: 'vinyl_retro',
    name: 'Disque Vinyle Tournant',
    description: 'Effet vinyle 33 tours tournant à 33 RPM avec microsillons, centreur personnalisé et égaliseur discret',
    accentColor: '#EAB308',
    secondaryColor: '#10B981'
  },
  {
    id: 'waveform_bars',
    name: 'Spectre Égaliseur',
    description: 'Barres de fréquences spectrales FFT audio en temps réel avec particules flottantes et glow',
    accentColor: '#06B6D4',
    secondaryColor: '#8B5CF6'
  },
  {
    id: 'kinetic_lyrics',
    name: 'Typographie & Punchlines',
    description: 'Mise en avant des punchlines et paroles synchronisées avec animation cinétique et vibration audio',
    accentColor: '#EC4899',
    secondaryColor: '#F97316'
  },
  {
    id: 'cosmic_aura',
    name: 'Onde Stellaire Cosmique',
    description: 'Anneaux concentriques lumineux qui explosent et ondulent sur les kicks et mélodies',
    accentColor: '#8B5CF6',
    secondaryColor: '#3B82F6'
  }
];

export const DURATION_OPTIONS = [
  { duration: 15, credits: 1, label: '15 secondes (Teaser court)' },
  { duration: 30, credits: 2, label: '30 secondes (TikTok Sound)' },
  { duration: 60, credits: 3, label: '60 secondes (Extrait complet)' }
];

const LOCAL_STORAGE_KEY_CREDITS = 'kkd_video_credits_cache';
const LOCAL_STORAGE_KEY_SUB = 'kkd_video_sub_cache';
const LOCAL_STORAGE_KEY_PROJECTS = 'kkd_video_projects_cache';

export const videoGeneratorService = {
  // Obtenir le solde de crédits de l'utilisateur
  getUserCredits(user) {
    if (typeof user?.video_credits === 'number') {
      return user.video_credits;
    }
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_CREDITS);
      if (cached !== null) return parseInt(cached, 10);
    } catch (_) {}
    return 3; // 3 crédits d'accueil par défaut
  },

  // Obtenir le statut d'abonnement
  getUserSubscription(user) {
    const planId = user?.subscription_tier || (() => {
      try {
        return localStorage.getItem(LOCAL_STORAGE_KEY_SUB) || 'free';
      } catch (_) {
        return 'free';
      }
    })();
    return SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  },

  // Déduire des crédits pour une génération vidéo
  async deductCredits(user, creditsToDeduct, description = 'Génération de vidéo musicale') {
    const currentCredits = this.getUserCredits(user);
    if (currentCredits < creditsToDeduct) {
      throw new Error(`Solde insuffisant : il vous faut ${creditsToDeduct} crédit(s), vous en avez ${currentCredits}.`);
    }

    const newCredits = Math.max(0, currentCredits - creditsToDeduct);

    // Mise à jour cache local
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CREDITS, String(newCredits));
    } catch (_) {}

    // Mise à jour Firestore si utilisateur connecté
    const userId = user?.id || user?.uid || auth?.currentUser?.uid;
    const userEmail = user?.email || auth?.currentUser?.email;

    if (userId) {
      try {
        await firestoreService.setDocument('users', userId, {
          video_credits: newCredits,
          total_videos_generated: (user?.total_videos_generated || 0) + 1
        });

        // Enregistrer la transaction
        await firestoreService.addDocument('creditTransactions', {
          user_id: userId,
          user_email: userEmail || '',
          type: 'video_generation_spend',
          credits: -creditsToDeduct,
          amount_eur: 0,
          description,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[VideoGeneratorService] Firestore deduct sync notice:', err?.message);
      }
    }

    return newCredits;
  },

  // Recharger des crédits (achat de pack)
  async purchaseCreditPack(user, packId) {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) throw new Error('Pack de crédits introuvable');

    const currentCredits = this.getUserCredits(user);
    const newCredits = currentCredits + pack.credits;

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CREDITS, String(newCredits));
    } catch (_) {}

    const userId = user?.id || user?.uid || auth?.currentUser?.uid;
    const userEmail = user?.email || auth?.currentUser?.email;

    if (userId) {
      try {
        await firestoreService.setDocument('users', userId, {
          video_credits: newCredits
        });

        await firestoreService.addDocument('creditTransactions', {
          user_id: userId,
          user_email: userEmail || '',
          type: 'top_up_purchase',
          credits: pack.credits,
          amount_eur: pack.price,
          description: `Achat ${pack.title} (${pack.credits} crédits)`,
          pack_id: packId,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[VideoGeneratorService] Firestore purchase sync notice:', err?.message);
      }
    }

    return { success: true, newCredits, pack };
  },

  // Souscrire ou modifier un abonnement
  async subscribeToPlan(user, planId) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Forfait d’abonnement introuvable');

    const currentCredits = this.getUserCredits(user);
    const newCredits = currentCredits + plan.monthlyCredits;

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SUB, planId);
      localStorage.setItem(LOCAL_STORAGE_KEY_CREDITS, String(newCredits));
    } catch (_) {}

    const userId = user?.id || user?.uid || auth?.currentUser?.uid;
    const userEmail = user?.email || auth?.currentUser?.email;

    if (userId) {
      try {
        await firestoreService.setDocument('users', userId, {
          subscription_tier: planId,
          video_credits: newCredits,
          subscription_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        await firestoreService.addDocument('creditTransactions', {
          user_id: userId,
          user_email: userEmail || '',
          type: 'subscription_grant',
          credits: plan.monthlyCredits,
          amount_eur: plan.price,
          description: `Activation abonnement ${plan.name} (+${plan.monthlyCredits} crédits)`,
          plan_id: planId,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[VideoGeneratorService] Firestore sub sync notice:', err?.message);
      }
    }

    return { success: true, plan, newCredits };
  },

  // Enregistrer un projet vidéo dans Firestore et local
  async saveProject(projectData) {
    const userId = projectData.user_id || auth?.currentUser?.uid || 'guest';
    const payload = {
      ...projectData,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    // Sauvegarde cache local pour accès immédiat
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS) || '[]');
      const updated = [payload, ...existing.filter(p => p.id !== payload.id)].slice(0, 30);
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    } catch (_) {}

    if (userId !== 'guest') {
      try {
        const res = await firestoreService.addDocument('videoProjects', payload);
        return { id: res.id, ...payload };
      } catch (err) {
        console.warn('[VideoGeneratorService] Firestore save project notice:', err?.message);
      }
    }

    return { id: `local_${Date.now()}`, ...payload };
  },

  // Récupérer l'historique des vidéos générées
  async getUserProjects(userId) {
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS) || '[]');
    } catch (_) {}

    if (!userId || userId === 'guest') return localList;

    try {
      const remoteList = await firestoreService.getCollection('videoProjects');
      const filtered = remoteList.filter(p => p.user_id === userId);
      if (filtered.length > 0) {
        return filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }
    } catch (err) {
      console.warn('[VideoGeneratorService] Get user projects error:', err?.message);
    }

    return localList;
  }
};
