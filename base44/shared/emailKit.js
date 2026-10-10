/**
 * Shared email + notification helpers for all notify* backend functions.
 * Clean, professional, minimal email design — KKD Music brand.
 * Light background, single orange accent, no unnecessary colors.
 */

export const SITE_URL = "https://kkdmusic.com";
// Logo signature officiel — documents et emails
export const LOGO_URL = "https://media.base44.com/images/public/6a1cbc29f199c6e829efde07/99cb11fce_InShot_20261010_094620549.png";

// Minimal brand palette
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

// Action types — simple colored labels
export const ACTIONS = {
  success:  { color: "#1F8A5C", label: "VALIDÉ" },
  warning:  { color: "#C43C3C", label: "REFUSÉ" },
  info:     { color: "#6B6258", label: "INFO" },
  demande:  { color: "#E4622B", label: "ACTION REQUISE" },
  nouveau:  { color: "#E4622B", label: "NOUVEAU" },
};

function buildActionBadge(action, customLabel) {
  const a = ACTIONS[action];
  if (!a) return "";
  const label = customLabel || a.label;
  return `<div style="display:inline-block;background:${C.surface};border:1px solid ${C.border};border-radius:4px;padding:5px 14px;font-size:11px;font-weight:700;color:${a.color};letter-spacing:0.05em;text-transform:uppercase;margin-bottom:20px;">${label}</div>`;
}

export function buildInfoRows(rows) {
  if (!rows || !rows.length) return "";
  const body = rows
    .filter(([, v]) => v != null && v !== "")
    .map(([label, value]) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.textMuted};">${label}</td><td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:14px;color:${C.text};font-weight:600;text-align:right;">${value}</td></tr>`
    ).join("");
  return `<table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">${body}</table>`;
}

export function buildNotesBlock(notes, label = "Message de l'équipe KKD") {
  if (!notes) return "";
  return `<p style="font-size:13px;color:${C.textMuted};margin:0 0 8px;">${label} :</p><div style="background:${C.surface};border-left:3px solid ${C.primary};border-radius:4px;padding:14px 16px;font-size:14px;color:${C.text};line-height:1.6;">${notes}</div>`;
}

/**
 * Main email HTML builder — clean, minimal, professional.
 * All theme variants are ignored; every email uses the same simple design.
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
    theme = "clean",
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

  // Badge
  const badgeText = badge_label || (action ? (actionLabel || (ACTIONS[action]?.label)) : null);
  const badge = badgeText ? `<div style="display:inline-block;background:${C.surface};border:1px solid ${C.border};border-radius:4px;padding:5px 14px;font-size:11px;font-weight:700;color:${C.primary};letter-spacing:0.05em;text-transform:uppercase;margin-bottom:20px;">${badgeText}</div>` : "";

  // Info rows
  const rowsBlock = infoRows ? `<div style="margin:20px 0;">${buildInfoRows(infoRows)}</div>` : "";
  const notesB = notes ? `<div style="margin:20px 0;">${buildNotesBlock(notes, notesLabel)}</div>` : "";

  // Context card — clean info table
  let contextCardHtml = "";
  if (enable_context_card && (context_type || (context_meta && Object.keys(context_meta).length > 0))) {
    const metaEntries = [];
    if (context_meta && typeof context_meta === 'object') {
      if (Array.isArray(context_meta)) {
        metaEntries.push(...context_meta);
      } else {
        Object.entries(context_meta).forEach(([k, v]) => {
          if (v && String(v).trim()) {
            metaEntries.push({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) });
          }
        });
      }
    }
    const notice = context_notice || "";
    contextCardHtml = `
      <div style="background:${C.surface};border:1px solid ${C.border};border-radius:8px;padding:16px 18px;margin:20px 0;">
        ${metaEntries.length > 0 ? `
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
            ${metaEntries.map((m, idx) => `
              <tr>
                <td style="padding:6px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px solid ${C.border}`};font-size:13px;color:${C.textMuted};width:40%;">${m.label}</td>
                <td style="padding:6px 0;border-bottom:${idx === metaEntries.length - 1 ? 'none' : `1px solid ${C.border}`};font-size:13px;font-weight:600;color:${C.text};text-align:right;">${m.value}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        ${notice ? `<p style="margin-top:10px;padding-top:8px;border-top:1px solid ${C.border};font-size:12px;color:${C.textMuted};line-height:1.5;">${notice}</p>` : ''}
      </div>
    `;
  }

  // Streaming links — simple uniform buttons
  let streamingBlock = "";
  if (streaming_links && streaming_links.length > 0) {
    const valid = streaming_links.filter((l) => l && l.url);
    if (valid.length > 0) {
      const platformNames = {
        spotify: "Spotify", apple: "Apple Music", youtube: "YouTube",
        audiomack: "Audiomack", deezer: "Deezer", boomplay: "Boomplay",
      };
      streamingBlock = `
        <div style="margin:20px 0;padding:14px;background:${C.surface};border:1px solid ${C.border};border-radius:8px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:${C.textMuted};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Disponible en streaming</div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
            ${valid.map(l => `
              <td style="padding:3px 4px;">
                <a href="${l.url}" target="_blank" style="display:inline-block;padding:7px 14px;background:${C.primary};color:#ffffff;border-radius:4px;font-size:12px;font-weight:600;text-decoration:none;">
                  ${platformNames[l.platform] || l.platform}
                </a>
              </td>
            `).join('')}
          </tr></table>
        </div>
      `;
    }
  }

  // Signature — simple text, no avatar
  const signerObj = sender || (signer_id === "madou" ? {
    name: "Madou Kane", role: "Président Directeur Général & Fondateur",
  } : {
    name: "Abdoulaye Sylla", role: "Gestionnaire Principal",
  });

  const signatureBlock = `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid ${C.border};">
      <div style="font-size:14px;font-weight:700;color:${C.text};">${signerObj.name}</div>
      <div style="font-size:12px;color:${C.textMuted};margin-top:2px;">${signerObj.role} · KKD Music</div>
    </div>
  `;

  // CTA button
  const ctaBlock = cta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;"><tr><td style="border-radius:6px;background:${C.primary};"><a href="${cta.url}" style="display:inline-block;padding:12px 28px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;border-radius:6px;">${cta.label}</a></td></tr></table>`
    : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title>
  <style>
    body{margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;}
    .wrapper{background:${C.bg};padding:24px 12px}
    .card{background:${C.card};border:1px solid ${C.border};border-radius:8px;max-width:560px;margin:0 auto;overflow:hidden}
    .header{padding:28px 32px;text-align:center;border-bottom:1px solid ${C.border}}
    .header img{height:40px;width:auto}
    .content{padding:28px 32px 24px}
    .headline{font-size:22px;font-weight:700;color:${C.text};margin:0 0 16px;line-height:1.3}
    .body-text{font-size:15px;color:${C.text};line-height:1.65;margin:0 0 14px}
    .body-text strong{font-weight:700}
    .footer{padding:22px 32px;text-align:center;border-top:1px solid ${C.border}}
    .footer p{margin:3px 0;font-size:11px;color:${C.textDim}}
    .footer a{color:${C.primary};text-decoration:none}
    @media(max-width:600px){
      .content,.header,.footer{padding-left:20px!important;padding-right:20px!important}
      .headline{font-size:19px!important}
    }
  </style></head>
  <body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Music"/></div>
    <div class="content">
      ${badge}
      <h1 class="headline">${headline}</h1>
      ${contextCardHtml}
      <div class="body-text" style="white-space:pre-wrap;">${body}</div>
      ${rowsBlock}
      ${notesB}
      ${streamingBlock}
      ${extra ? extra : ""}
      ${ctaBlock}
      ${signatureBlock}
    </div>
    <div class="footer">
      <p style="font-size:12px;font-weight:700;color:${C.text};margin-bottom:4px;">KKD Music</p>
      <p>Maison de disques & distribution · Dakar, Sénégal</p>
      <p><a href="${SITE_URL}">kkdmusic.com</a> · <a href="${SITE_URL}/mon-espace">Mon espace</a></p>
      <p style="margin-top:6px;">© ${new Date().getFullYear()} KKD Music. Tous droits réservés.</p>
    </div>
  </div></div>
  </body></html>`;
}

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