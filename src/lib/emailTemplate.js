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

// Signataires officiels KKD Music
export const SIGNERS = {
  abdoulaye: {
    id: 'abdoulaye',
    name: 'Abdoulaye Sylla',
    role: 'Gestionnaire Principal',
    department: 'Direction des Opérations & Distribution',
    initials: 'AS',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Dakar & Missira, Sénégal',
    badge: 'Gestionnaire Principal KKD Music',
    avatarText: 'AS',
  },
  madou: {
    id: 'madou',
    name: 'Madou Kane',
    role: 'Président Directeur Général & Fondateur',
    department: 'Direction Générale KKD Music Label Group',
    initials: 'MK',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Dakar & Tambacounda, Sénégal',
    badge: 'Président Fondateur KKD Music',
    avatarText: 'MK',
  },
  direction: {
    id: 'direction',
    name: 'Direction Générale KKD Music',
    role: 'Comité de Direction',
    department: 'Maison de Disques & Distribution Internationale',
    initials: 'KKD',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Dakar, République du Sénégal',
    badge: 'Direction Générale Certifiée',
    avatarText: 'KKD',
  },
  ar: {
    id: 'ar',
    name: 'Cellule A&R & Relations Artistes',
    role: 'Développement Artistique',
    department: 'Sélection, Licences & Promotion',
    initials: 'A&R',
    phone: '+221 77 000 00 00',
    email: 'contact@kkdmusic.com',
    location: 'Dakar, Sénégal',
    badge: 'A&R Talent Hub',
    avatarText: 'A&R',
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
      { key: 'event_title', label: 'Nom de l\'événement', placeholder: 'Ex: Grand Showcase VIP KKD Music 2026' },
      { key: 'event_date', label: 'Date & Heure', placeholder: 'Ex: Samedi 14 Novembre 2026 à 20h30' },
      { key: 'venue', label: 'Lieu / Salle', placeholder: 'Ex: Grand Théâtre National Doudou Ndiaye Rose' },
      { key: 'city', label: 'Ville & Pays', placeholder: 'Ex: Dakar, Sénégal' },
      { key: 'access_type', label: 'Catégorie d\'accès', placeholder: 'Ex: Carré VIP, Carré Or, Pass Privilège' },
      { key: 'doors_open', label: 'Ouverture des portes', placeholder: 'Ex: 19h00 (Contrôle électronique nominatif)' },
    ],
    defaultNotice: "Ce courriel officiel constitue un avis de billetterie ou une invitation officielle. Tout accès sur place requiert la présentation du billet sécurisé officiel KKD Music.",
  },
  contract: {
    id: 'contract',
    label: 'Contrat & Certification Juridique',
    badge: 'DOCUMENT JURIDIQUE OFFICIEL',
    icon: '📜',
    categoryName: 'Contrat & Certification de Droits',
    categoryDesc: 'Notification contractuelle officielle, avenant ou certificat de licence',
    fields: [
      { key: 'doc_title', label: 'Intitulé de l\'accord', placeholder: 'Ex: Contrat de Partenariat & Distribution Exclusive' },
      { key: 'doc_ref', label: 'Réf. Document', placeholder: 'Ex: KKD-CTR-2026-089A' },
      { key: 'beneficiary', label: 'Ayant-droit / Titulaire', placeholder: 'Ex: Nom de l\'artiste ou du label partenaire' },
      { key: 'effective_date', label: 'Date d\'effet', placeholder: 'Ex: À compter du 1er Novembre 2026' },
      { key: 'royalties_rate', label: 'Rétrocession garantie', placeholder: 'Ex: 90% des royalties nettes perçues' },
      { key: 'legal_status', label: 'Statut du document', placeholder: 'Ex: Scellé et certifié électroniquement' },
    ],
    defaultNotice: "Ce courriel officiel émane du secrétariat juridique de KKD Music et se rattache directement à l'exécution de l'accord contractuel visé ci-dessus.",
  },
  circular: {
    id: 'circular',
    label: 'Note de Service & Circulaire de Direction',
    badge: 'NOTE DU GESTIONNAIRE PRINCIPAL',
    icon: '🏛️',
    categoryName: 'Note Officielle de Direction',
    categoryDesc: 'Communication administrative de service émise par Abdoulaye Sylla',
    fields: [
      { key: 'circular_ref', label: 'N° de Circulaire', placeholder: 'Ex: CIR-KKD-DIR-2026-014' },
      { key: 'emitter', label: 'Signataire émetteur', placeholder: 'Abdoulaye Sylla, Gestionnaire Principal' },
      { key: 'target_group', label: 'Destinataires visés', placeholder: 'Ex: Ensemble des artistes et partenaires du label' },
      { key: 'effective_scope', label: 'Portée d\'application', placeholder: 'Ex: Immédiate — Exercice 2026/2027' },
      { key: 'urgency', label: 'Degré de priorité', placeholder: 'Ex: Information réglementaire obligatoire' },
    ],
    defaultNotice: "Note administrative émise sous l'autorité du Gestionnaire Principal de KKD Music. Les directives et dispositions énoncées s'appliquent à tous les ayants droit concernés.",
  },
  partnership: {
    id: 'partnership',
    label: 'Partenariat B2B & Distribution Mondiale',
    badge: 'OPPORTUNITÉ PARTENARIAT B2B',
    icon: '🤝',
    categoryName: 'Partenariat & Distribution Label',
    categoryDesc: 'Offre formelle de collaboration avec 90% de royalties pour les labels et artistes',
    fields: [
      { key: 'offer_name', label: 'Programme B2B', placeholder: 'Ex: Partenariat Label Affilié KKD' },
      { key: 'royalty_split', label: 'Rémunération garantie', placeholder: '90% des royalties versées au partenaire' },
      { key: 'territory', label: 'Couverture territoriale', placeholder: 'Mondiale (150+ plateformes de streaming)' },
      { key: 'services_included', label: 'Services compris', placeholder: 'Distribution DSP, ISRC/UPC, Déclarations SACEM/SODAV' },
      { key: 'deadline', label: 'Période d\'adhésion', placeholder: 'Ex: Clôture des sessions au 30 du mois' },
    ],
    defaultNotice: "Cette proposition de partenariat respecte le barème transparent de KKD Music (90% de rétrocession nette) pour un accompagnement d'excellence.",
  },
  video: {
    id: 'video',
    label: 'Clip Vidéo & Production Audiovisuelle',
    badge: 'CLIP OFFICIEL KKD',
    icon: '🎬',
    categoryName: 'Première & Clip Officiel',
    categoryDesc: 'Lancement d\'un clip ou contenu audiovisuel exclusif sur les canaux KKD',
    fields: [
      { key: 'clip_title', label: 'Titre du clip', placeholder: 'Ex: Dakar By Night (Clip Officiel 4K)' },
      { key: 'artist_name', label: 'Artiste principal', placeholder: 'Ex: Ousmane Ba' },
      { key: 'director', label: 'Réalisation', placeholder: 'Ex: KKD Visuals Studios' },
      { key: 'video_format', label: 'Résolution & Son', placeholder: 'Ultra HD 4K · Master Audio HQ' },
      { key: 'channel', label: 'Diffuseur officiel', placeholder: 'Chaîne YouTube KKD Music Officielle' },
    ],
    defaultNotice: "Œuvre audiovisuelle produite ou distribuée sous licence exclusive KKD Music. Reproduction ou diffusion non autorisée strictement interdite.",
  },
  news: {
    id: 'news',
    label: 'Communiqué de Presse & Actualité',
    badge: 'COMMUNIQUÉ DE PRESSE OFFICIEL',
    icon: '📢',
    categoryName: 'Presse & Relations Publiques',
    categoryDesc: 'Annonce institutionnelle officielle destinée aux médias et partenaires',
    fields: [
      { key: 'press_ref', label: 'Réf. Communiqué', placeholder: 'Ex: CP-KKD-2026-09' },
      { key: 'press_topic', label: 'Sujet officiel', placeholder: 'Ex: Bilan annuel et expansion régionale' },
      { key: 'press_contact', label: 'Relations Médias', placeholder: 'presse@kkdmusic.com · +221 77 000 00 00' },
      { key: 'publication_date', label: 'Date d\'embargo / parution', placeholder: 'Ex: Diffusion immédiate' },
    ],
    defaultNotice: "Document officiel validé par la Direction de la Communication de KKD Music Label Group pour diffusion auprès des médias accrédités.",
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
  signer_id = 'abdoulaye',
  custom_signer = null,
  streaming_links = [],
  highlight_box = null,
  show_signature = true,
  // Nouveaux paramètres contextuels anti-incompréhension :
  context_type = null,
  context_meta = null,
  context_notice = null,
  enable_context_card = true,
}) {
  const T = EMAIL_THEMES[theme] || EMAIL_THEMES.prestige_dark;
  const S = custom_signer || SIGNERS[signer_id] || SIGNERS.abdoulaye;
  const isWhiteTheme = theme === 'official_white';
  const ctxDef = CONTEXT_TYPES[context_type];

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

  // ── CARTOUCHE DE CONTEXTE OFFICIEL & ANTI-AMBIGUÏTÉ ──
  // S'adapte au titre, à l'événement ou au document pour éviter toute mauvaise compréhension
  let contextCardHtml = '';
  if (enable_context_card && (ctxDef || (context_meta && Object.keys(context_meta).length > 0))) {
    const metaEntries = [];
    if (context_meta && typeof context_meta === 'object') {
      if (Array.isArray(context_meta)) {
        metaEntries.push(...context_meta);
      } else {
        // Objets { key: value }
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
        <div style="background:${isWhiteTheme ? '#F8FAFC' : 'rgba(0,0,0,0.35)'}; border:1.5px solid ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}; border-left:4px solid ${T.gold}; border-radius:10px; padding:18px 20px; margin:24px 0 28px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}; padding-bottom:10px; margin-bottom:12px;">
            <div style="font-size:11px; font-weight:800; color:${T.gold}; text-transform:uppercase; letter-spacing:0.08em;">
              ${ctxDef ? `${ctxDef.icon} FICHE CONTEXTUELLE : ${ctxDef.categoryName.toUpperCase()}` : '📌 FICHE CONTEXTUELLE OFFICIELLE'}
            </div>
            <div style="font-size:10px; color:${T.textDim}; font-family:monospace; font-weight:600;">
              REF: KKD-${(context_type || 'OFF').toUpperCase()}-${new Date().getFullYear()}
            </div>
          </div>
          ${metaEntries.length > 0 ? `
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
              ${metaEntries.map((m, idx) => `
                <tr>
                  <td style="padding:6px 0; border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}`}; font-size:12.5px; color:${T.textDim}; width:40%; vertical-align:top;">
                    ${m.label} :
                  </td>
                  <td style="padding:6px 0; border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}`}; font-size:13px; font-weight:700; color:${T.headline}; text-align:right; vertical-align:top;">
                    ${m.value}
                  </td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          ${noticeText ? `
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed ${isWhiteTheme ? '#E2E8F0' : T.cardBorder}; font-size:11px; color:${isWhiteTheme ? '#64748B' : T.textDim}; line-height:1.55; font-style:italic;">
              🛡️ <strong style="color:${isWhiteTheme ? '#334155' : T.gold}; font-style:normal;">Portée officielle & clarté d'objet :</strong> ${noticeText}
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
    .header { background:${T.headerBg}; border-bottom:1px solid ${T.headerBorder}; padding:26px 36px; text-align:center; }
    .header-logo { height:42px; width:auto; display:inline-block; }
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
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper">
    <div class="card">
      
      <!-- Top Accent Bar -->
      <div class="top-bar"></div>

      <!-- Header de marque -->
      <div class="header">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          <tr>
            <td style="text-align:center;">
              <img src="${LOGO_URL}" alt="KKD Music" class="header-logo" style="${isWhiteTheme ? 'filter: brightness(0) invert(1);' : ''}" />
              <div style="font-size:10px; font-weight:800; color:${isWhiteTheme ? '#FDE68A' : T.gold}; letter-spacing:0.18em; text-transform:uppercase; margin-top:8px;">
                KKD MUSIC LABEL GROUP · MAISON DE DISQUES
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

      <!-- Footer officiel -->
      <div class="footer">
        <div class="social-links">
          <a href="${SITE_URL}">Site officiel</a>
          <a href="https://instagram.com/kkdmusic">Instagram</a>
          <a href="https://youtube.com/@kkdmusic">YouTube</a>
          <a href="https://open.spotify.com">Spotify</a>
        </div>
        <div style="height:1px; background:${T.footerBorder}; margin:16px 0;"></div>
        <p style="font-size:12.5px; color:${T.headline}; font-weight:800; margin-bottom:6px;">KKD MUSIC LABEL GROUP</p>
        <p>Direction Générale & Management : Abdoulaye Sylla · Missira, Tambacounda & Dakar, Sénégal</p>
        <p style="margin-top:10px;">
          <a href="${SITE_URL}/mon-espace">Mon compte & préférences</a> · <a href="${SITE_URL}/mentions-legales">Mentions légales</a>
        </p>
        <p style="margin-top:8px; font-size:10.5px; color:${T.textDim};">
          © ${new Date().getFullYear()} KKD Music. Tous droits réservés · Protection internationale des droits d'auteur.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}
