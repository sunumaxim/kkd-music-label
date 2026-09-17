/**
 * Shared email + notification helpers for all notify* backend functions.
 * Brand-aligned premium email system — single source of truth.
 * Design: warm dark theme from KKD Music brand (DESIGN_SYSTEM.md).
 */

// ===== BRAND TOKENS (from DESIGN_SYSTEM.md) =====
export const SITE_URL = "https://kkdmusic.com";
export const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

const C = {
  primary:    "#E4622B",
  primaryLt:  "#F08355",
  secondary:  "#1F8A5C",
  accent:     "#D9A441",
  destructive: "#C43C3C",
  bg:         "#16110E",
  surface:    "#231C18",
  surfaceLt:  "#2E2620",
  border:     "#3A302A",
  text:       "#F4EDE6",
  textMuted:  "#A6998C",
  textDim:    "#7A6E62",
};

// ===== ACTION TYPES — color-coded badges per email purpose =====
export const ACTIONS = {
  success:  { color: C.secondary,  label: "VALIDÉ",   bg: "rgba(31,138,92,0.12)",  border: "rgba(31,138,92,0.35)" },
  warning:  { color: C.destructive,label: "REFUSÉ",   bg: "rgba(196,60,60,0.12)",  border: "rgba(196,60,60,0.35)" },
  info:     { color: C.accent,     label: "INFO",    bg: "rgba(217,164,65,0.12)", border: "rgba(217,164,65,0.35)" },
  demande:  { color: C.primary,    label: "ACTION REQUISE", bg: "rgba(228,98,43,0.12)", border: "rgba(228,98,43,0.35)" },
  nouveau:  { color: C.primary,    label: "NOUVEAU",  bg: "rgba(228,98,43,0.12)",  border: "rgba(228,98,43,0.35)" },
};

/**
 * Build a styled badge block for the email action type.
 * @param {string} action — key from ACTIONS (success/warning/info/demande/nouveau)
 * @param {string} [customLabel] — override the default badge label
 */
function buildActionBadge(action, customLabel) {
  const a = ACTIONS[action];
  if (!a) return "";
  const label = customLabel || a.label;
  return `<div style="display:inline-block;background:${a.bg};border:1px solid ${a.border};border-radius:20px;padding:6px 16px;font-size:11px;font-weight:700;color:${a.color};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:24px;">${label}</div>`;
}

/**
 * Build structured info rows (label → value) as a table.
 * @param {Array<[string,string]>} rows — [[label, value], ...]
 */
export function buildInfoRows(rows) {
  if (!rows || !rows.length) return "";
  const body = rows
    .filter(([, v]) => v != null && v !== "")
    .map(([label, value]) =>
      `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.textMuted};width:45%;">${label}</td><td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:14px;color:${C.text};font-weight:600;text-align:right;">${value}</td></tr>`
    ).join("");
  return `<table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">${body}</table>`;
}

/**
 * Build a highlighted notes/message block (admin notes, clarification message, etc.)
 */
export function buildNotesBlock(notes, label = "Message de l'équipe KKD") {
  if (!notes) return "";
  return `<p style="font-size:13px;color:${C.textMuted};margin:0 0 8px;">${label} :</p><div style="background:${C.surfaceLt};border-left:3px solid ${C.primary};border-radius:6px;padding:16px 18px;font-size:14px;color:${C.text};line-height:1.65;">${notes}</div>`;
}

/**
 * Main email HTML builder — premium branded template.
 * @param {{ subject:string, preheader?:string, action?:string, actionLabel?:string, headline:string, body:string, cta?:{label:string,url:string}, infoRows?:Array, notes?:string, notesLabel?:string, extra?:string, theme?:string, sender?:object, signer_id?:string, streaming_links?:Array, highlight_box?:object, badge_label?:string }} opts
 */
export function buildEmailHtml(opts) {
  const {
    subject,
    preheader = "",
    action,
    actionLabel,
    headline,
    body,
    cta,
    infoRows,
    notes,
    notesLabel,
    extra = "",
    theme = "prestige_dark",
    sender = null,
    signer_id = "abdoulaye",
    streaming_links = [],
    highlight_box = null,
    badge_label,
    context_type = null,
    context_meta = null,
    context_notice = null,
    enable_context_card = true,
  } = opts;

  // Configuration de thème
  const isWhite = theme === "official_white";
  const isRed = theme === "noble_red";
  const isGold = theme === "gold_luxury";

  let cardBg = C.surface;
  let cardBorder = C.border;
  let textMain = C.text;
  let textMuted = C.textMuted;
  let topBarGrad = `linear-gradient(90deg, #D4AF37, #B91C1C, #D4AF37)`;
  let headerBg = C.bg;
  let ctaBg = "#D4AF37";
  let ctaColor = "#0E0C0B";

  if (isWhite) {
    cardBg = "#FFFFFF";
    cardBorder = "#8B1515";
    textMain = "#0F172A";
    textMuted = "#475569";
    topBarGrad = `linear-gradient(90deg, #D4AF37, #8B1515, #D4AF37)`;
    headerBg = "#8B1515";
    ctaBg = "#8B1515";
    ctaColor = "#FFFFFF";
  } else if (isRed) {
    cardBg = "#1a0808";
    cardBorder = "#421515";
    topBarGrad = `linear-gradient(90deg, #8B1515, #D4AF37, #8B1515)`;
    ctaBg = "#8B1515";
    ctaColor = "#FFFFFF";
  } else if (isGold) {
    cardBg = "#17140e";
    cardBorder = "#47391f";
    topBarGrad = `linear-gradient(90deg, #B38728, #FDF498, #DAA520)`;
    ctaBg = "#F59E0B";
    ctaColor = "#000000";
  }

  const badgeText = badge_label || (action ? (actionLabel || (ACTIONS[action]?.label)) : null);
  const badge = badgeText ? `<div style="display:inline-block;background:${isWhite ? '#FFF5F5' : 'rgba(212,175,55,0.12)'};border:1px solid ${isWhite ? '#FCA5A5' : 'rgba(212,175,55,0.35)'};border-radius:20px;padding:6px 16px;font-size:11px;font-weight:700;color:${isWhite ? '#8B1515' : '#E5B842'};letter-spacing:0.06em;text-transform:uppercase;margin-bottom:24px;">${badgeText}</div>` : "";
  const rowsBlock = infoRows ? `<div style="margin:24px 0;">${buildInfoRows(infoRows)}</div>` : "";
  const notesB = notes ? `<div style="margin:24px 0;">${buildNotesBlock(notes, notesLabel)}</div>` : "";

  // Cartouche de contexte officiel anti-ambiguïté
  let contextCardHtml = "";
  if (enable_context_card && (context_type || (context_meta && Object.keys(context_meta).length > 0))) {
    const metaEntries = [];
    if (context_meta && typeof context_meta === 'object') {
      if (Array.isArray(context_meta)) {
        metaEntries.push(...context_meta);
      } else {
        Object.entries(context_meta).forEach(([k, v]) => {
          if (v && String(v).trim()) {
            metaEntries.push({ label: k.replace(/_/g, ' ').toUpperCase(), value: String(v) });
          }
        });
      }
    }
    const notice = context_notice || "Communication certifiée par la Direction Générale KKD Music. Les termes énoncés font foi auprès des services du label.";
    contextCardHtml = `
      <div style="background:${isWhite ? '#F8FAFC' : 'rgba(0,0,0,0.35)'};border:1.5px solid ${isWhite ? '#E2E8F0' : cardBorder};border-left:4px solid #D4AF37;border-radius:10px;padding:16px 18px;margin:20px 0 24px 0;">
        <div style="font-size:11px;font-weight:800;color:#D4AF37;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
          📌 FICHE CONTEXTUELLE OFFICIELLE · ${(context_type || 'COMMUNICATION').toUpperCase()}
        </div>
        ${metaEntries.length > 0 ? `
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
            ${metaEntries.map((m, idx) => `
              <tr>
                <td style="padding:5px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhite ? '#E2E8F0' : cardBorder}`};font-size:12px;color:${textMuted};width:40%;">${m.label} :</td>
                <td style="padding:5px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px dashed ${isWhite ? '#E2E8F0' : cardBorder}`};font-size:12.5px;font-weight:700;color:${textMain};text-align:right;">${m.value}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        ${notice ? `
          <div style="margin-top:10px;padding-top:8px;border-top:1px dashed ${isWhite ? '#E2E8F0' : cardBorder};font-size:11px;color:${isWhite ? '#64748B' : textMuted};line-height:1.5;font-style:italic;">
            🛡️ <strong style="color:${isWhite ? '#334155' : '#D4AF37'};font-style:normal;">Objet de clarté :</strong> ${notice}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Liens streaming
  let streamingBlock = "";
  if (streaming_links && streaming_links.length > 0) {
    const valid = streaming_links.filter((l) => l && l.url);
    if (valid.length > 0) {
      const platformColors = {
        spotify: "#1DB954",
        apple: "#FA243C",
        youtube: "#FF0000",
        audiomack: "#FFA200",
        deezer: "#A238FF",
        boomplay: "#00A5FE",
      };
      const platformNames = {
        spotify: "Spotify",
        apple: "Apple Music",
        youtube: "YouTube",
        audiomack: "Audiomack",
        deezer: "Deezer",
        boomplay: "Boomplay",
      };
      streamingBlock = `
        <div style="margin:24px 0;padding:16px;background:${isWhite ? '#F8FAFC' : 'rgba(0,0,0,0.25)'};border:1px solid ${cardBorder};border-radius:8px;text-align:center;">
          <div style="font-size:10.5px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Disponible en streaming</div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
            ${valid.map(l => `
              <td style="padding:3px 4px;">
                <a href="${l.url}" target="_blank" style="display:inline-block;padding:7px 12px;background:${platformColors[l.platform] || '#333'};color:#ffffff;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;">
                  ${platformNames[l.platform] || l.platform}
                </a>
              </td>
            `).join('')}
          </tr></table>
        </div>
      `;
    }
  }

  // Signature officielle (Abdoulaye Sylla / Madou Kane)
  const signerObj = sender || (signer_id === "madou" ? {
    name: "Madou Kane",
    role: "Président Directeur Général & Fondateur",
    dept: "Direction Générale KKD Music Label Group",
    initials: "MK",
  } : {
    name: "Abdoulaye Sylla",
    role: "Gestionnaire Principal",
    dept: "Direction des Opérations & Distribution",
    initials: "AS",
  });

  const signatureBlock = `
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${cardBorder};">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="width:50px;vertical-align:top;padding-right:12px;">
            <div style="width:44px;height:44px;border-radius:50%;background:${isWhite ? '#8B1515' : 'rgba(212,175,55,0.15)'};border:1.5px solid #D4AF37;text-align:center;line-height:42px;font-weight:900;color:${isWhite ? '#FFFFFF' : '#D4AF37'};font-size:15px;">
              ${signerObj.initials || 'AS'}
            </div>
          </td>
          <td style="vertical-align:top;">
            <div style="font-size:14.5px;font-weight:800;color:${textMain};">${signerObj.name}</div>
            <div style="font-size:11.5px;font-weight:700;color:${isWhite ? '#8B1515' : '#E4622B'};margin-top:2px;">${signerObj.role}</div>
            <div style="font-size:10.5px;color:${textMuted};margin-top:1px;">${signerObj.dept || 'KKD Music Label Group'} · Dakar, Sénégal</div>
            <div style="margin-top:6px;">
              <span style="display:inline-block;background:${isWhite ? '#F8FAFC' : 'rgba(212,175,55,0.1)'};border:1px solid #D4AF37;border-radius:10px;padding:2px 8px;font-size:9.5px;font-weight:700;color:${isWhite ? '#8B1515' : '#D4AF37'};">
                ✓ Communication certifiée KKD Music
              </span>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const ctaBlock = cta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;"><tr><td style="border-radius:8px;background:${ctaBg};"><a href="${cta.url}" style="display:inline-block;padding:13px 30px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:800;color:${ctaColor};text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;border-radius:8px;">${cta.label}</a></td></tr></table>`
    : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta http-equiv="X-UA-Compatible" content="IE=edge"/><title>${subject}</title>
  <style>
    body{margin:0;padding:0;background:${isWhite ? '#F1F5F9' : C.bg};font-family:'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;}
    .wrapper{background:${isWhite ? '#F1F5F9' : C.bg};padding:32px 16px}
    .card{background:${cardBg};border:1px solid ${cardBorder};border-radius:14px;max-width:600px;margin:0 auto;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.25)}
    .header{background:${headerBg};border-bottom:1px solid ${cardBorder};padding:26px 36px;text-align:center}
    .header img{height:40px;width:auto}
    .accent-bar{height:3px;background:${topBarGrad}}
    .content{padding:34px 38px 28px}
    .headline{font-size:23px;font-weight:800;color:${textMain};margin:0 0 18px;line-height:1.3;letter-spacing:-0.3px}
    .body-text{font-size:15px;color:${textMuted};line-height:1.7;margin:0 0 16px}
    .body-text strong{color:${textMain};font-weight:700}
    .divider{height:1px;background:${cardBorder};margin:26px 0}
    .footer{background:${isWhite ? '#0F172A' : C.bg};border-top:1px solid ${cardBorder};padding:26px 36px;text-align:center}
    .footer p{margin:4px 0;font-size:11.5px;color:${isWhite ? '#94A3B8' : C.textDim}}
    .footer .brand{font-size:13px;color:#ffffff;font-weight:700;margin-bottom:8px}
    .social a{display:inline-block;margin:0 10px;font-size:12px;color:${isWhite ? '#CBD5E1' : C.textMuted};text-decoration:none}
    .social a:hover{color:#E4622B}
    @media(max-width:600px){
      .content,.header,.footer{padding-left:22px!important;padding-right:22px!important}
      .headline{font-size:20px!important}
    }
  </style></head>
  <body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper"><div class="card">
    <div class="accent-bar"></div>
    <div class="header"><img src="${LOGO_URL}" alt="KKD Music" style="${isWhite ? 'filter: brightness(0) invert(1);' : ''}"/></div>
    <div class="content">
      ${badge}
      <h1 class="headline">${headline}</h1>
      ${contextCardHtml}
      <div class="body-text">${body}</div>
      ${rowsBlock}
      ${notesB}
      ${streamingBlock}
      ${extra ? `<div class="divider"></div>${extra}` : ""}
      ${ctaBlock}
      ${signatureBlock}
    </div>
    <div class="footer">
      <div class="social" style="margin-bottom:14px;">
        <a href="${SITE_URL}">Site web</a>
        <a href="https://instagram.com/kkdmusic">Instagram</a>
        <a href="https://youtube.com/@kkdmusic">YouTube</a>
        <a href="https://open.spotify.com">Spotify</a>
      </div>
      <p class="brand">KKD Music</p>
      <p>Maison de disques & distribution · Direction Générale : Abdoulaye Sylla · Dakar, Sénégal</p>
      <p style="margin-top:10px;"><a href="${SITE_URL}/mon-espace" style="color:#D4AF37;text-decoration:none;">Gérer mon espace</a> · <a href="${SITE_URL}" style="color:#D4AF37;text-decoration:none;">kkdmusic.com</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} KKD Music. Tous droits réservés.</p>
    </div>
  </div></div>
  </body></html>`;
}

/**
 * Push an in-app notification + email in parallel.
 * opts: { base44, userEmail, title, message, type, link, subject, body }
 */
export async function pushNotification(opts) {
  const { base44, userEmail, title, message, type = "info", link = "/mon-espace", subject, body } = opts;

  try {
    await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail, title, message, type, link, is_read: false,
    });
  } catch (e) {
    console.error("pushNotification in-app error:", e);
  }

  if (subject && body) {
    base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail, subject, body, from_name: "KKD Music",
    }).catch((e) => console.error("pushNotification email skipped:", e?.message || e));
  }
}

export function stripHtml(s) {
  return (s || "").replace(/<[^>]+>/g, "").substring(0, 200);
}

/**
 * Anti-falsification : re-fetch the real entity record and confirm its current
 * status actually matches the claimed new status.
 * opts: { base44, entityName, id, field, expected }
 */
export async function verifyStatusChange({ base44, entityName, id, field, expected }) {
  if (!id || !field || !expected) return null;
  try {
    const records = await base44.asServiceRole.entities[entityName].filter({ id });
    const rec = records && records[0];
    if (rec && rec[field] === expected) return rec;
    return null;
  } catch (e) {
    console.error(`verifyStatusChange(${entityName}) error:`, e);
    return null;
  }
}