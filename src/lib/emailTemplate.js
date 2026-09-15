/**
 * KKD Music — Email HTML Template Generator (V2 Haute Couture)
 * Conçu pour les communications officielles de la direction (Abdoulaye Sylla, Gestionnaire Principal).
 * Compatible avec tous les clients mails (Gmail, Apple Mail, Outlook, Yahoo, Webmail).
 */

export const SITE_URL = "https://kkdmusic.com";
export const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

// Palette & Thèmes graphiques
export const EMAIL_THEMES = {
  prestige_dark: {
    id: 'prestige_dark',
    label: 'Prestige Ébène & Or',
    desc: 'Sombre luxueux, accents or noble et rubis KKD',
    bg: '#0c0a09',
    card: '#181411',
    cardBorder: '#352820',
    headerBg: '#120f0c',
    headerBorder: '#291e17',
    topBar: 'linear-gradient(90deg, #D4AF37 0%, #B91C1C 50%, #D4AF37 100%)',
    badgeBg: 'rgba(212, 175, 55, 0.12)',
    badgeBorder: 'rgba(212, 175, 55, 0.35)',
    badgeText: '#E5B842',
    headline: '#FFFFFF',
    text: '#CBD5E1',
    textDim: '#78716C',
    accent: '#E4622B',
    gold: '#D4AF37',
    ctaBg: '#D4AF37',
    ctaText: '#0F0C0A',
    footerBg: '#0f0c0a',
    footerBorder: '#241b14',
    signatureBorder: '#33261e',
    sealBg: 'rgba(212, 175, 55, 0.10)',
    sealBorder: 'rgba(212, 175, 55, 0.30)',
    sealText: '#D4AF37',
  },
  noble_red: {
    id: 'noble_red',
    label: 'Bordeaux Impérial',
    desc: 'Ambiance feutrée rouge velours & sceau or',
    bg: '#0f0404',
    card: '#1a0808',
    cardBorder: '#421515',
    headerBg: '#140606',
    headerBorder: '#381212',
    topBar: 'linear-gradient(90deg, #8B1515 0%, #D4AF37 50%, #8B1515 100%)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.40)',
    badgeText: '#FCA5A5',
    headline: '#FFFFFF',
    text: '#E2E8F0',
    textDim: '#94A3B8',
    accent: '#EF4444',
    gold: '#D4AF37',
    ctaBg: '#8B1515',
    ctaText: '#FFFFFF',
    footerBg: '#0d0303',
    footerBorder: '#300f0f',
    signatureBorder: '#3b1414',
    sealBg: 'rgba(139, 21, 21, 0.25)',
    sealBorder: 'rgba(212, 175, 55, 0.40)',
    sealText: '#FDE68A',
  },
  gold_luxury: {
    id: 'gold_luxury',
    label: 'Or Impérial VIP',
    desc: 'Luxe absolu, reflets or pur pour annonces exclusives',
    bg: '#0a0906',
    card: '#17140e',
    cardBorder: '#47391f',
    headerBg: '#120f09',
    headerBorder: '#382c16',
    topBar: 'linear-gradient(90deg, #B38728 0%, #FDF498 50%, #DAA520 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.45)',
    badgeText: '#FCD34D',
    headline: '#FFFDF5',
    text: '#E5E7EB',
    textDim: '#9CA3AF',
    accent: '#F59E0B',
    gold: '#FBBF24',
    ctaBg: '#F59E0B',
    ctaText: '#000000',
    footerBg: '#0d0b07',
    footerBorder: '#2e2513',
    signatureBorder: '#3d3019',
    sealBg: 'rgba(251, 191, 36, 0.15)',
    sealBorder: 'rgba(251, 191, 36, 0.45)',
    sealText: '#FDE68A',
  },
  official_white: {
    id: 'official_white',
    label: 'Lettre Blanche Officielle',
    desc: 'Cadre blanc immaculé, bordeaux & or (style contrat)',
    bg: '#F1F5F9',
    card: '#FFFFFF',
    cardBorder: '#8B1515',
    headerBg: '#8B1515',
    headerBorder: '#6B0F0F',
    topBar: 'linear-gradient(90deg, #D4AF37 0%, #B91C1C 50%, #D4AF37 100%)',
    badgeBg: '#FFF5F5',
    badgeBorder: '#FCA5A5',
    badgeText: '#8B1515',
    headline: '#0F172A',
    text: '#334155',
    textDim: '#64748B',
    accent: '#8B1515',
    gold: '#D4AF37',
    ctaBg: '#8B1515',
    ctaText: '#FFFFFF',
    footerBg: '#0F172A',
    footerBorder: '#1E293B',
    signatureBorder: '#E2E8F0',
    sealBg: '#F8FAFC',
    sealBorder: '#CBD5E1',
    sealText: '#8B1515',
  },
  studio_minimal: {
    id: 'studio_minimal',
    label: 'Studio Black & Neon',
    desc: 'Look moderne électro-urbain pour la jeune scène',
    bg: '#05070a',
    card: '#0c111a',
    cardBorder: '#1e293b',
    headerBg: '#090d14',
    headerBorder: '#172033',
    topBar: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 50%, #EC4899 100%)',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    badgeBorder: 'rgba(6, 182, 212, 0.35)',
    badgeText: '#22D3EE',
    headline: '#FFFFFF',
    text: '#94A3B8',
    textDim: '#64748B',
    accent: '#06B6D4',
    gold: '#38BDF8',
    ctaBg: '#06B6D4',
    ctaText: '#000000',
    footerBg: '#070a0f',
    footerBorder: '#172033',
    signatureBorder: '#1e293b',
    sealBg: 'rgba(6, 182, 212, 0.10)',
    sealBorder: 'rgba(6, 182, 212, 0.30)',
    sealText: '#38BDF8',
  }
};

// Signataires et Entités officielles KKD Music
export const SIGNERS = {
  kkd_music: {
    id: 'kkd_music',
    name: 'KKD Music',
    role: 'Maison de Disques & Distribution',
    department: 'Direction Générale',
    initials: 'KKD',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Tambacounda, Sénégal',
    badge: 'Maison de Disques Officielle',
    avatarText: 'KKD',
  },
  kkd_label: {
    id: 'kkd_label',
    name: 'KKD Label Entertainment',
    role: 'Direction du Label',
    department: 'Production & Édition',
    initials: 'KKD',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Tambacounda, Sénégal',
    badge: 'Label Entertainment Officiel',
    avatarText: 'KKD',
  },
  kkd_distribution: {
    id: 'kkd_distribution',
    name: 'KKD Distribution',
    role: 'Service Distribution & Streaming',
    department: 'Catalogue International',
    initials: 'KD',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Tambacounda, Sénégal',
    badge: 'Distribution Internationale',
    avatarText: 'KD',
  },
  direction: {
    id: 'direction',
    name: 'Direction KKD Music',
    role: 'Direction Générale',
    department: 'Maison de Disques',
    initials: 'KKD',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Tambacounda, Sénégal',
    badge: 'Direction Officielle',
    avatarText: 'KKD',
  },
  abdoulaye: {
    id: 'abdoulaye',
    name: 'Abdoulaye Sylla',
    role: 'Gestionnaire Principal',
    department: 'KKD Music',
    initials: 'AS',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Tambacounda, Sénégal',
    badge: 'Gestionnaire Principal',
    avatarText: 'AS',
  }
};

// Plateformes de streaming
export const PLATFORM_DATA = {
  spotify: { name: 'Spotify', bg: '#1DB954', text: '#FFFFFF', icon: '🎧' },
  apple: { name: 'Apple Music', bg: '#FA243C', text: '#FFFFFF', icon: '🍎' },
  youtube: { name: 'YouTube Music', bg: '#FF0000', text: '#FFFFFF', icon: '▶' },
  audiomack: { name: 'Audiomack', bg: '#FFA200', text: '#000000', icon: '⚡' },
  deezer: { name: 'Deezer', bg: '#A238FF', text: '#FFFFFF', icon: '🟣' },
  boomplay: { name: 'Boomplay', bg: '#00A5FE', text: '#FFFFFF', icon: '🎵' },
};

// ── CONTEXTES OFFICIELS & TYPOLOGIES DE MESSAGES ──
// Permet d'adapter chaque email et document au contexte exact (Sortie, Événement, Contrat, Note)
// pour éliminer toute ambiguïté ou incompréhension chez le destinataire.
export const CONTEXT_TYPES = {
  release: {
    id: 'release',
    label: 'Sortie Musicale Officielle',
    badge: 'SORTIE OFFICIELLE KKD',
    icon: '🎵',
    categoryName: 'Sortie Musicale (Single / EP / Album)',
    categoryDesc: 'Notification de mise à disposition d\'une œuvre au catalogue officiel KKD Music',
    fields: [
      { key: 'track_title', label: 'Titre de l\'œuvre', placeholder: 'Ex: Kora Vibrations (Single)' },
      { key: 'artist_name', label: 'Artiste / Groupe', placeholder: 'Ex: Amadou Diop' },
      { key: 'release_date', label: 'Date de sortie', placeholder: 'Ex: 24 Octobre 2026' },
      { key: 'genre', label: 'Genre musical', placeholder: 'Ex: Afro-fusion / Mbalax moderne' },
      { key: 'isrc', label: 'Réf. Catalogue / ISRC', placeholder: 'Ex: SN-KKD-26-00124' },
      { key: 'platforms', label: 'Plateformes', placeholder: 'Mondial · 150+ plateformes (Spotify, Apple, etc.)' },
    ],
    defaultNotice: "Ce courriel officiel concerne la sortie, l'écoute et la diffusion publique de l'œuvre musicale indiquée. Il ne modifie en rien vos accords contractuels ou licences en cours.",
  },
  event: {
    id: 'event',
    label: 'Événement, Concert & Billetterie',
    badge: 'ÉVÉNEMENT EN DIRECT & BILLETTERIE',
    icon: '🎟️',
    categoryName: 'Événement & Billetterie VIP',
    categoryDesc: 'Concert, showcase privé, festival ou événement officiel avec billetterie',
    fields: [
      { key: 'event_title', label: "Nom de l'événement", placeholder: 'Ex: Grand Showcase Live KKD 2026' },
      { key: 'event_date', label: 'Date & Heure', placeholder: 'Ex: Samedi 14 Novembre 2026 à 20h30' },
      { key: 'venue', label: 'Lieu / Salle', placeholder: 'Ex: Centre Culturel / Espace Scénique' },
      { key: 'city', label: 'Ville & Pays', placeholder: 'Ex: Tambacounda, Sénégal' },
      { key: 'access_type', label: "Catégorie d'accès", placeholder: 'Ex: Carré VIP, Carré Or, Pass Privilège' },
    ],
    defaultNotice: "Présentation du billet officiel KKD Music requise à l'entrée.",
  },
  contract: {
    id: 'contract',
    label: 'Contrat & Certification Juridique',
    badge: 'DOCUMENT OFFICIEL',
    icon: '📜',
    categoryName: 'Contrat & Certification de Droits',
    categoryDesc: 'Notification contractuelle officielle, accord ou certificat de licence',
    fields: [
      { key: 'doc_title', label: "Intitulé de l'accord", placeholder: 'Ex: Contrat de Partenariat & Distribution' },
      { key: 'doc_ref', label: 'Réf. Document', placeholder: 'Ex: KKD-CTR-2026-089' },
      { key: 'beneficiary', label: 'Ayant-droit / Bénéficiaire', placeholder: "Ex: Nom de l'artiste ou du partenaire" },
      { key: 'effective_date', label: "Date d'effet", placeholder: 'Ex: À compter de la signature' },
    ],
    defaultNotice: "Document officiel émis par la Direction de KKD Music.",
  },
  circular: {
    id: 'circular',
    label: 'Note de Service & Circulaire de Direction',
    badge: 'NOTE OFFICIELLE DE DIRECTION',
    icon: '🏛️',
    categoryName: 'Note Officielle de Direction',
    categoryDesc: 'Communication administrative émise par la Direction de KKD Music',
    fields: [
      { key: 'circular_ref', label: 'N° de Référence', placeholder: 'Ex: CIR-KKD-2026-014' },
      { key: 'emitter', label: 'Émetteur', placeholder: 'Direction KKD Music' },
      { key: 'target_group', label: 'Destinataires', placeholder: 'Partenaires & Artistes du label' },
      { key: 'effective_scope', label: "Portée d'application", placeholder: 'Immédiate' },
    ],
    defaultNotice: "Note officielle émise par la Direction de KKD Music (Tambacounda, Sénégal).",
  },
  partnership: {
    id: 'partnership',
    label: 'Partenariat & Distribution',
    badge: 'OPPORTUNITÉ PARTENARIAT',
    icon: '🤝',
    categoryName: 'Partenariat & Distribution',
    categoryDesc: 'Offre formelle de collaboration et distribution',
    fields: [
      { key: 'offer_name', label: 'Programme', placeholder: 'Ex: Partenariat Label & Distribution' },
      { key: 'royalty_split', label: 'Partage royalties', placeholder: '90% versés au créateur' },
      { key: 'territory', label: 'Territoire', placeholder: 'Mondial (150+ plateformes)' },
    ],
    defaultNotice: "Proposition officielle de partenariat KKD Music.",
  },
  video: {
    id: 'video',
    label: 'Clip Vidéo & Production Audiovisuelle',
    badge: 'CLIP OFFICIEL KKD',
    icon: '🎬',
    categoryName: 'Sortie Clip Vidéo',
    categoryDesc: 'Lancement d\'un clip officiel sur les canaux KKD',
    fields: [
      { key: 'clip_title', label: 'Titre du clip', placeholder: 'Ex: Tamba By Night (Clip Officiel)' },
      { key: 'artist_name', label: 'Artiste', placeholder: 'Ex: Ousmane Ba' },
      { key: 'director', label: 'Réalisation', placeholder: 'Ex: KKD Visuals' },
    ],
    defaultNotice: "Vidéo officielle disponible sur les plateformes KKD Music.",
  },
  news: {
    id: 'news',
    label: 'Communiqué de Presse & Actualité',
    badge: 'COMMUNIQUÉ OFFICIEL',
    icon: '📢',
    categoryName: 'Actualité & Communication',
    categoryDesc: 'Annonce officielle de KKD Music',
    fields: [
      { key: 'press_ref', label: 'Référence', placeholder: 'Ex: CP-KKD-2026-09' },
      { key: 'press_topic', label: 'Objet', placeholder: 'Ex: Actualité du label' },
      { key: 'publication_date', label: 'Date', placeholder: 'Ex: Diffusion immédiate' },
    ],
    defaultNotice: "Communiqué officiel émis par la Direction de KKD Music.",
  }
};

/**
 * Construit un email HTML de prestige pour KKD Music
 */
export function buildEmailHtml({
  subject,
  preheader = '',
  headline,
  body,
  cta,
  image_url,
  extra = '',
  theme = 'prestige_dark',
  badge_label = 'COMMUNICATION OFFICIELLE',
  signer_id = 'kkd_music',
  custom_signer = null,
  streaming_links = [],
  highlight_box = null,
  show_signature = true,
  // Paramètres d'adaptation du logo :
  logo_size = 'standard', // 'compact' | 'standard' | 'large'
  logo_style = 'clean', // 'clean' | 'badge' | 'subtle_glow' | 'minimal'
  // Nouveaux paramètres contextuels anti-incompréhension épurés :
  context_type = null,
  context_meta = null,
  context_notice = null,
  enable_context_card = true,
}) {
  const T = EMAIL_THEMES[theme] || EMAIL_THEMES.prestige_dark;
  const S = custom_signer || SIGNERS[signer_id] || SIGNERS.kkd_music;
  const isWhiteTheme = theme === 'official_white';
  const ctxDef = CONTEXT_TYPES[context_type];

  // Dimensionnement adaptatif du logo
  const sizeMap = {
    compact: { height: 34, maxH: 40, subSize: 9.5, pad: '20px 28px' },
    standard: { height: 46, maxH: 52, subSize: 10.5, pad: '26px 32px' },
    large: { height: 58, maxH: 66, subSize: 11, pad: '30px 36px' },
  };
  const SIZ = sizeMap[logo_size] || sizeMap.standard;

  // Style visuel du logo
  let logoWrapperStyle = 'display:inline-block;';
  let logoImgStyle = '';

  if (logo_style === 'badge') {
    logoWrapperStyle = `display:inline-block; padding:8px 18px; border-radius:12px; background:${isWhiteTheme ? '#8B1515' : 'rgba(255,255,255,0.06)'}; border:1px solid ${isWhiteTheme ? '#6B0F0F' : T.cardBorder};`;
    if (isWhiteTheme) logoImgStyle = 'filter: brightness(0) invert(1);';
  } else if (logo_style === 'subtle_glow') {
    logoWrapperStyle = `display:inline-block; padding:6px 12px;`;
    logoImgStyle = `filter: drop-shadow(0 2px 8px ${T.gold}50);`;
  } else if (logo_style === 'minimal') {
    logoWrapperStyle = `display:inline-block; padding:4px 8px; opacity:0.92;`;
    if (isWhiteTheme) logoImgStyle = 'filter: brightness(0);';
  } else {
    // 'clean' (default)
    if (isWhiteTheme) {
      logoWrapperStyle = `display:inline-block; padding:6px 14px; border-radius:10px; background:#8B1515;`;
      logoImgStyle = 'filter: brightness(0) invert(1);';
    } else {
      logoWrapperStyle = `display:inline-block;`;
      logoImgStyle = 'filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));';
    }
  }

  // Sous-titre officiel adapté à l'entité et à l'objet
  let logoSubtext = 'KKD MUSIC · TAMBACOUNDA, SÉNÉGAL';
  if (context_type === 'release') logoSubtext = 'KKD MUSIC · SORTIE OFFICIELLE';
  else if (context_type === 'event') logoSubtext = 'KKD MUSIC · ÉVÉNEMENT & BILLETTERIE';
  else if (context_type === 'contract') logoSubtext = 'KKD LABEL ENTERTAINMENT · JURIDIQUE';
  else if (context_type === 'partnership') logoSubtext = 'KKD DISTRIBUTION · PARTENARIAT';
  else if (context_type === 'circular') logoSubtext = 'KKD MUSIC · DIRECTION DU LABEL';

  // Badge en-tête contextuel
  const finalBadge = badge_label || (ctxDef ? ctxDef.badge : 'COMMUNICATION OFFICIELLE');
  const badgeHtml = finalBadge ? `
    <div style="display:inline-block; background:${T.badgeBg}; border:1px solid ${T.badgeBorder}; border-radius:20px; padding:6px 16px; font-size:11px; font-weight:800; color:${T.badgeText}; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:20px;">
      ${ctxDef ? `${ctxDef.icon} ` : ''}${finalBadge}
    </div>
  ` : '';

  // Image d'illustration ou pochette
  const imageHtml = image_url ? `
    <div style="margin: 0 0 28px 0; border-radius:10px; overflow:hidden; border:1px solid ${T.cardBorder};">
      <img src="${image_url}" alt="" style="width:100%; max-height:300px; object-fit:cover; display:block;" />
    </div>
  ` : '';

  // ── CARTOUCHE DE CONTEXTE OFFICIEL ÉPURÉ ──
  let contextCardHtml = '';
  if (enable_context_card && (ctxDef || (context_meta && Object.keys(context_meta).length > 0))) {
    const metaEntries = [];
    if (context_meta && typeof context_meta === 'object') {
      if (Array.isArray(context_meta)) {
        metaEntries.push(...context_meta);
      } else {
        const fieldDefs = ctxDef?.fields || [];
        Object.entries(context_meta).forEach(([k, v]) => {
          if (v && String(v).trim()) {
            const fDef = fieldDefs.find(f => f.key === k);
            metaEntries.push({ label: fDef?.label || k, value: String(v) });
          }
        });
      }
    }

    const noticeText = context_notice || ctxDef?.defaultNotice;

    if (metaEntries.length > 0 || noticeText) {
      contextCardHtml = `
        <div style="background:${isWhiteTheme ? '#F8FAFC' : 'rgba(0,0,0,0.30)'}; border:1px solid ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}; border-left:3px solid ${T.gold}; border-radius:8px; padding:16px 18px; margin:20px 0 24px 0;">
          <div style="font-size:11px; font-weight:800; color:${T.gold}; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px;">
            ${ctxDef ? `${ctxDef.icon} ${ctxDef.categoryName.toUpperCase()}` : '📌 INFORMATIONS OFFICIELLES'}
          </div>
          ${metaEntries.length > 0 ? `
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
              ${metaEntries.map((m, idx) => `
                <tr>
                  <td style="padding:5px 0; border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}`}; font-size:12px; color:${T.textDim}; width:38%; vertical-align:top;">
                    ${m.label} :
                  </td>
                  <td style="padding:5px 0; border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}`}; font-size:12.5px; font-weight:700; color:${T.headline}; text-align:right; vertical-align:top;">
                    ${m.value}
                  </td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          ${noticeText ? `
            <div style="margin-top:10px; padding-top:8px; border-top:1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}; font-size:11px; color:${isWhiteTheme ? '#64748B' : T.textDim}; line-height:1.5;">
              ℹ️ ${noticeText}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Bloc d'information ou fiche méta (morceau, date, lieu...)
  let highlightHtml = '';
  if (highlight_box && (highlight_box.title || highlight_box.items?.length)) {
    const items = highlight_box.items || [];
    highlightHtml = `
      <div style="background:${isWhiteTheme ? '#F8FAFC' : 'rgba(0,0,0,0.25)'}; border:1px solid ${T.cardBorder}; border-left:3px solid ${T.gold}; border-radius:8px; padding:16px 18px; margin:24px 0;">
        ${highlight_box.title ? `<div style="font-size:12px; font-weight:800; color:${T.gold}; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">${highlight_box.title}</div>` : ''}
        ${items.map(it => `
          <div style="font-size:13px; color:${T.text}; margin:4px 0;">
            <strong style="color:${T.headline};">${it.label} :</strong> ${it.value}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Boutons des plateformes de streaming
  let streamingHtml = '';
  if (streaming_links && streaming_links.length > 0) {
    const validLinks = streaming_links.filter(l => l && l.url);
    if (validLinks.length > 0) {
      streamingHtml = `
        <div style="margin:28px 0 20px 0; padding:18px; background:${isWhiteTheme ? '#F8FAFC' : 'rgba(0,0,0,0.30)'}; border-radius:10px; border:1px solid ${T.cardBorder}; text-align:center;">
          <div style="font-size:11px; font-weight:800; color:${T.gold}; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">
            Disponible sur toutes les plateformes de streaming
          </div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              ${validLinks.map(l => {
                const info = PLATFORM_DATA[l.platform] || { name: l.platform, bg: '#333333', text: '#FFFFFF', icon: '▶' };
                return `
                  <td style="padding:4px 5px;">
                    <a href="${l.url}" target="_blank" style="display:inline-block; background:${info.bg}; color:${info.text}; padding:8px 14px; border-radius:6px; font-size:11px; font-weight:700; text-decoration:none; white-space:nowrap; letter-spacing:0.02em;">
                      ${info.icon} ${info.name}
                    </a>
                  </td>
                `;
              }).join('')}
            </tr>
          </table>
        </div>
      `;
    }
  }

  // Bouton d'action principal CTA
  const ctaBlock = cta && cta.label ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto 16px;">
      <tr>
        <td style="border-radius:8px; background:${T.ctaBg}; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
          <a href="${cta.url || SITE_URL}" target="_blank" style="display:inline-block; padding:14px 34px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:14px; font-weight:800; color:${T.ctaText}; text-decoration:none; letter-spacing:0.04em; text-transform:uppercase; border-radius:8px;">
            ${cta.label}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  // Signature officielle d'Abdoulaye Sylla ou signataire choisi
  let signatureHtml = '';
  if (show_signature && S) {
    signatureHtml = `
      <div style="margin-top:36px; padding-top:22px; border-top:1px solid ${T.signatureBorder};">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          <tr>
            <td style="width:52px; vertical-align:top; padding-right:14px;">
              <div style="width:48px; height:48px; border-radius:50%; background:${isWhiteTheme ? '#8B1515' : 'rgba(212, 175, 55, 0.15)'}; border:1.5px solid ${T.gold}; text-align:center; line-height:46px; font-weight:900; color:${isWhiteTheme ? '#FFFFFF' : T.gold}; font-size:15px; letter-spacing:0.02em;">
                ${S.avatarText || S.initials || 'AS'}
              </div>
            </td>
            <td style="vertical-align:top;">
              <div style="font-size:15px; font-weight:800; color:${T.headline}; letter-spacing:-0.2px;">${S.name}</div>
              <div style="font-size:12px; font-weight:700; color:${T.accent}; margin-top:2px;">${S.role}</div>
              <div style="font-size:11px; color:${T.textDim}; margin-top:1px;">${S.department} · KKD Music</div>
              <div style="margin-top:8px;">
                <span style="display:inline-block; background:${T.sealBg}; border:1px solid ${T.sealBorder}; border-radius:12px; padding:3px 10px; font-size:10px; font-weight:700; color:${T.sealText};">
                  ✓ Communication officielle certifiée KKD Music
                </span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:${T.bg}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust:100%; }
    .wrapper { background:${T.bg}; padding:32px 14px; }
    .card { background:${T.card}; border:1px solid ${T.cardBorder}; border-radius:14px; max-width:600px; margin:0 auto; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.35); }
    .header { background:${T.headerBg}; border-bottom:1px solid ${T.headerBorder}; padding:${SIZ.pad}; text-align:center; }
    .header-logo { height:${SIZ.height}px; max-height:${SIZ.maxH}px; max-width:240px; width:auto; display:inline-block; }
    .top-bar { height:3px; background:${T.topBar}; }
    .content { padding:36px 38px 28px; }
    .headline { font-size:24px; font-weight:900; color:${T.headline}; margin:0 0 18px; line-height:1.28; letter-spacing:-0.4px; }
    .body-text { font-size:15px; color:${T.text}; line-height:1.72; margin:0 0 16px; }
    .body-text strong { color:${T.headline}; font-weight:700; }
    .divider { height:1px; background:${T.cardBorder}; margin:28px 0; }
    .footer { background:${T.footerBg}; border-top:1px solid ${T.footerBorder}; padding:28px 36px; text-align:center; }
    .footer p { margin:4px 0; font-size:11.5px; color:${T.textDim}; }
    .footer a { color:${T.accent}; text-decoration:none; }
    .social-links { margin:14px 0 10px; }
    .social-links a { display:inline-block; margin:0 10px; font-size:12px; color:${T.textDim}; text-decoration:none; font-weight:600; }
    .social-links a:hover { color:${T.accent}; }
    @media (max-width:600px) {
      .wrapper { padding:16px 8px !important; }
      .content, .header, .footer { padding-left:20px !important; padding-right:20px !important; }
      .headline { font-size:20px !important; }
      .body-text { font-size:14.5px !important; }
      .header-logo { height:${Math.max(30, SIZ.height - 8)}px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper">
    <div class="card">
      
      <!-- Top Accent Bar -->
      <div class="top-bar"></div>

      <!-- Header de marque avec logo redimensionné et adapté au thème/objet -->
      <div class="header">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          <tr>
            <td style="text-align:center;">
              <div style="${logoWrapperStyle}">
                <img src="${LOGO_URL}" alt="KKD Music" class="header-logo" style="${logoImgStyle}" />
              </div>
              <div style="font-size:${SIZ.subSize}px; font-weight:800; color:${isWhiteTheme ? '#8B1515' : T.gold}; letter-spacing:0.18em; text-transform:uppercase; margin-top:8px;">
                ${logoSubtext}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Corps du message -->
      <div class="content">
        ${badgeHtml}
        ${headline ? `<h1 class="headline">${headline}</h1>` : ''}
        ${contextCardHtml}
        ${imageHtml}
        <div class="body-text" style="white-space:pre-wrap;">${body}</div>
        ${highlightHtml}
        ${streamingHtml}
        ${ctaBlock}
        ${extra ? `<div class="divider"></div>${extra}` : ''}
        ${signatureHtml}
      </div>

      <!-- Footer épuré officiel Tambacounda -->
      <div class="footer">
        <div class="social-links">
          <a href="${SITE_URL}">Site officiel</a>
          <a href="https://instagram.com/kkdmusic">Instagram</a>
          <a href="https://youtube.com/@kkdmusic">YouTube</a>
          <a href="https://open.spotify.com">Spotify</a>
        </div>
        <div style="height:1px; background:${T.footerBorder}; margin:16px 0;"></div>
        <p style="font-size:12.5px; color:${T.headline}; font-weight:800; margin-bottom:4px;">KKD MUSIC</p>
        <p>Tambacounda, Sénégal · Contact officiel : contact@kkdmusic.com</p>
        <p style="margin-top:10px;">
          <a href="${SITE_URL}/mon-espace">Mon espace sécurisé</a> · <a href="${SITE_URL}/mentions-legales">Mentions légales</a>
        </p>
        <p style="margin-top:8px; font-size:10.5px; color:${T.textDim};">
          © ${new Date().getFullYear()} KKD Music. Tous droits réservés.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
