/**
 * KKD Music — Email HTML Template Generator (Frontend Preview)
 * Clean, professional, minimal design — matches backend emailKit.js.
 * Single light theme, brand orange accent, no unnecessary colors.
 */

export const SITE_URL = "https://kkdmusic.com";
import { LOGO_SIGNATURE } from '@/lib/logos';
export const LOGO_URL = LOGO_SIGNATURE;

// Single clean theme — all emails use the same simple design
export const EMAIL_THEMES = {
  clean: {
    id: 'clean',
    label: 'Épuré & Professionnel',
    desc: 'Fond clair, accent orange KKD, design minimal',
    bg: '#FAFAF8',
    card: '#FFFFFF',
    cardBorder: '#E5E0D8',
    surface: '#F3F1ED',
    headline: '#1A1714',
    text: '#1A1714',
    textDim: '#9A8E82',
    textMuted: '#6B6258',
    accent: '#E4622B',
    ctaBg: '#E4622B',
    ctaText: '#FFFFFF',
    footerBg: '#FFFFFF',
    footerBorder: '#E5E0D8',
    signatureBorder: '#E5E0D8',
  },
};

// Signataires — kept for admin UI selection
export const SIGNERS = {
  abdoulaye: {
    id: 'abdoulaye',
    name: 'Abdoulaye Sylla',
    role: 'Gestionnaire Principal',
    department: 'KKD Music',
    initials: 'AS',
    avatarText: 'AS',
  },
  madou: {
    id: 'madou',
    name: 'Madou Kane',
    role: 'Président Directeur Général',
    department: 'KKD Music',
    initials: 'MK',
    avatarText: 'MK',
  },
  kkd_music: {
    id: 'kkd_music',
    name: 'KKD Music',
    role: 'Maison de Disques',
    department: 'Direction',
    initials: 'KKD',
    avatarText: 'KKD',
  },
};

// Plateformes — kept for admin UI
export const PLATFORM_DATA = {
  spotify: { name: 'Spotify', bg: '#1DB954', text: '#FFFFFF' },
  apple: { name: 'Apple Music', bg: '#FA243C', text: '#FFFFFF' },
  youtube: { name: 'YouTube', bg: '#FF0000', text: '#FFFFFF' },
  audiomack: { name: 'Audiomack', bg: '#FFA200', text: '#000000' },
  deezer: { name: 'Deezer', bg: '#A238FF', text: '#FFFFFF' },
  boomplay: { name: 'Boomplay', bg: '#00A5FE', text: '#FFFFFF' },
};

// Context types — kept for admin UI
export const CONTEXT_TYPES = {
  release: {
    id: 'release', label: 'Sortie Musicale', badge: 'SORTIE OFFICIELLE', icon: '🎵',
    title: 'Sortie Musicale', subtitle: 'Single / EP / Album',
    fields: [
      { key: 'track_title', label: 'Titre' },
      { key: 'artist_name', label: 'Artiste' },
      { key: 'release_date', label: 'Date de sortie' },
      { key: 'genre', label: 'Genre' },
      { key: 'isrc', label: 'ISRC' },
      { key: 'platforms', label: 'Plateformes' },
    ],
    defaultNotice: "Ce courriel concerne la sortie et l'écoute de l'œuvre musicale indiquée.",
  },
  event: {
    id: 'event', label: 'Événement & Billetterie', badge: 'ÉVÉNEMENT', icon: '🎟️',
    title: 'Événement', subtitle: 'Concert & Billetterie',
    fields: [
      { key: 'event_title', label: "Nom de l'événement" },
      { key: 'event_date', label: 'Date & Heure' },
      { key: 'venue', label: 'Lieu' },
      { key: 'city', label: 'Ville' },
      { key: 'access_type', label: "Catégorie d'accès" },
    ],
    defaultNotice: "Présentation du billet officiel KKD Music requise à l'entrée.",
  },
  contract: {
    id: 'contract', label: 'Contrat & Certification', badge: 'DOCUMENT OFFICIEL', icon: '📜',
    title: 'Contrat', subtitle: 'Certification de droits',
    fields: [
      { key: 'doc_title', label: "Intitulé" },
      { key: 'doc_ref', label: 'Référence' },
      { key: 'beneficiary', label: 'Bénéficiaire' },
      { key: 'effective_date', label: "Date d'effet" },
    ],
    defaultNotice: "Document officiel émis par la Direction de KKD Music.",
  },
  circular: {
    id: 'circular', label: 'Note de Direction', badge: 'NOTE OFFICIELLE', icon: '🏛️',
    title: 'Note de Direction', subtitle: 'Communication administrative',
    fields: [
      { key: 'circular_ref', label: 'N° de Référence' },
      { key: 'emitter', label: 'Émetteur' },
      { key: 'target_group', label: 'Destinataires' },
      { key: 'effective_scope', label: "Portée" },
    ],
    defaultNotice: "Note officielle émise par la Direction de KKD Music.",
  },
  partnership: {
    id: 'partnership', label: 'Partenariat', badge: 'PARTENARIAT', icon: '🤝',
    title: 'Partenariat', subtitle: 'Distribution & Collaboration',
    fields: [
      { key: 'offer_name', label: 'Programme' },
      { key: 'royalty_split', label: 'Partage royalties' },
      { key: 'territory', label: 'Territoire' },
    ],
    defaultNotice: "Proposition officielle de partenariat KKD Music.",
  },
  video: {
    id: 'video', label: 'Clip Vidéo', badge: 'CLIP OFFICIEL', icon: '🎬',
    title: 'Clip Vidéo', subtitle: 'Production audiovisuelle',
    fields: [
      { key: 'clip_title', label: 'Titre du clip' },
      { key: 'artist_name', label: 'Artiste' },
      { key: 'director', label: 'Réalisation' },
    ],
    defaultNotice: "Vidéo officielle disponible sur les plateformes KKD Music.",
  },
  news: {
    id: 'news', label: 'Communiqué de Presse', badge: 'COMMUNIQUÉ', icon: '📢',
    title: 'Actualité', subtitle: 'Communication officielle',
    fields: [
      { key: 'press_ref', label: 'Référence' },
      { key: 'press_topic', label: 'Objet' },
      { key: 'publication_date', label: 'Date' },
    ],
    defaultNotice: "Communiqué officiel émis par la Direction de KKD Music.",
  },
};

// Minimal palette — matches backend
const C = {
  primary:   "#E4622B",
  bg:        "#FAFAF8",
  card:      "#FFFFFF",
  border:    "#E5E0D8",
  surface:   "#F3F1ED",
  text:      "#1A1714",
  textMuted: "#6B6258",
  textDim:   "#9A8E82",
};

/**
 * Build clean, minimal email HTML — matches backend emailKit.js output.
 */
export function buildEmailHtml({
  subject,
  preheader = '',
  headline,
  body,
  cta,
  image_url,
  extra = '',
  theme = 'clean',
  badge_label = '',
  signer_id = 'abdoulaye',
  custom_signer = null,
  streaming_links = [],
  show_signature = true,
  context_type = null,
  context_meta = null,
  context_notice = null,
  enable_context_card = true,
}) {
  const S = custom_signer || SIGNERS[signer_id] || SIGNERS.abdoulaye;

  // Badge
  const badge = badge_label ? `
    <div style="display:inline-block;background:${C.surface};border:1px solid ${C.border};border-radius:4px;padding:5px 14px;font-size:11px;font-weight:700;color:${C.primary};letter-spacing:0.05em;text-transform:uppercase;margin-bottom:20px;">${badge_label}</div>
  ` : '';

  // Image
  const imageHtml = image_url ? `
    <div style="margin:0 0 20px 0;border-radius:8px;overflow:hidden;">
      <img src="${image_url}" alt="" style="width:100%;max-height:280px;object-fit:cover;display:block;" />
    </div>
  ` : '';

  // Context card — clean info table
  let contextCardHtml = '';
  if (enable_context_card && (context_type || (context_meta && Object.keys(context_meta).length > 0))) {
    const metaEntries = [];
    if (context_meta && typeof context_meta === 'object') {
      if (Array.isArray(context_meta)) {
        metaEntries.push(...context_meta);
      } else {
        const ctxDef = CONTEXT_TYPES[context_type];
        const fieldDefs = ctxDef?.fields || [];
        Object.entries(context_meta).forEach(([k, v]) => {
          if (v && String(v).trim()) {
            const fDef = fieldDefs.find(f => f.key === k);
            metaEntries.push({ label: fDef?.label || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) });
          }
        });
      }
    }
    const notice = context_notice || CONTEXT_TYPES[context_type]?.defaultNotice;
    if (metaEntries.length > 0 || notice) {
      contextCardHtml = `
        <div style="background:${C.surface};border:1px solid ${C.border};border-radius:8px;padding:16px 18px;margin:20px 0;">
          ${metaEntries.length > 0 ? `
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
              ${metaEntries.map((m, idx) => `
                <tr>
                  <td style="padding:6px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px solid ${C.border}`};font-size:13px;color:${C.textMuted};width:40%;vertical-align:top;">${m.label}</td>
                  <td style="padding:6px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px solid ${C.border}`};font-size:13px;font-weight:600;color:${C.text};text-align:right;vertical-align:top;">${m.value}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          ${notice ? `<p style="margin-top:10px;padding-top:8px;border-top:1px solid ${C.border};font-size:12px;color:${C.textMuted};line-height:1.5;">${notice}</p>` : ''}
        </div>
      `;
    }
  }

  // Streaming links — uniform orange buttons
  let streamingHtml = '';
  if (streaming_links && streaming_links.length > 0) {
    const validLinks = streaming_links.filter(l => l && l.url);
    if (validLinks.length > 0) {
      streamingHtml = `
        <div style="margin:20px 0;padding:14px;background:${C.surface};border:1px solid ${C.border};border-radius:8px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Disponible en streaming</div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
            ${validLinks.map(l => {
              const info = PLATFORM_DATA[l.platform] || { name: l.platform };
              return `
                <td style="padding:3px 4px;">
                  <a href="${l.url}" target="_blank" style="display:inline-block;padding:7px 14px;background:${C.primary};color:#ffffff;border-radius:4px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">
                    ${info.name}
                  </a>
                </td>
              `;
            }).join('')}
          </tr></table>
        </div>
      `;
    }
  }

  // CTA button
  const ctaBlock = cta && cta.label ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
      <tr>
        <td style="border-radius:6px;background:${C.primary};">
          <a href="${cta.url || SITE_URL}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;border-radius:6px;">
            ${cta.label}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  // Signature — simple text
  let signatureHtml = '';
  if (show_signature && S) {
    signatureHtml = `
      <div style="margin-top:28px;padding-top:18px;border-top:1px solid ${C.border};">
        <div style="font-size:14px;font-weight:700;color:${C.text};">${S.name}</div>
        <div style="font-size:12px;color:${C.textMuted};margin-top:2px;">${S.role} · KKD Music</div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:${C.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; -webkit-text-size-adjust:100%; }
    .wrapper { background:${C.bg}; padding:24px 12px; }
    .card { background:${C.card}; border:1px solid ${C.border}; border-radius:8px; max-width:560px; margin:0 auto; overflow:hidden; }
    .header { padding:28px 32px; text-align:center; border-bottom:1px solid ${C.border}; }
    .header img { height:40px; width:auto; }
    .content { padding:28px 32px 24px; }
    .headline { font-size:22px; font-weight:700; color:${C.text}; margin:0 0 16px; line-height:1.3; }
    .body-text { font-size:15px; color:${C.text}; line-height:1.65; margin:0 0 14px; }
    .body-text strong { font-weight:700; }
    .footer { padding:22px 32px; text-align:center; border-top:1px solid ${C.border}; }
    .footer p { margin:3px 0; font-size:11px; color:${C.textDim}; }
    .footer a { color:${C.primary}; text-decoration:none; }
    @media (max-width:600px) {
      .wrapper { padding:12px 6px !important; }
      .content, .header, .footer { padding-left:20px !important; padding-right:20px !important; }
      .headline { font-size:19px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="KKD Music" />
      </div>
      <div class="content">
        ${badge}
        ${headline ? `<h1 class="headline">${headline}</h1>` : ''}
        ${contextCardHtml}
        ${imageHtml}
        <div class="body-text" style="white-space:pre-wrap;">${body}</div>
        ${streamingHtml}
        ${ctaBlock}
        ${extra ? extra : ''}
        ${signatureHtml}
      </div>
      <div class="footer">
        <p style="font-size:12px;font-weight:700;color:${C.text};margin-bottom:4px;">KKD Music</p>
        <p>Maison de disques & distribution · Dakar, Sénégal</p>
        <p><a href="${SITE_URL}">kkdmusic.com</a> · <a href="${SITE_URL}/mon-espace">Mon espace</a></p>
        <p style="margin-top:6px;">© ${new Date().getFullYear()} KKD Music. Tous droits réservés.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}