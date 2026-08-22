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
 * @param {{ subject:string, preheader?:string, action?:string, actionLabel?:string, headline:string, body:string, cta?:{label:string,url:string}, infoRows?:Array, notes?:string, notesLabel?:string, extra?:string }} opts
 */
export function buildEmailHtml(opts) {
  const { subject, preheader = "", action, actionLabel, headline, body, cta, infoRows, notes, notesLabel, extra = "" } = opts;

  const badge = action ? buildActionBadge(action, actionLabel) : "";
  const rowsBlock = infoRows ? `<div style="margin:24px 0;">${buildInfoRows(infoRows)}</div>` : "";
  const notesB = notes ? `<div style="margin:24px 0;">${buildNotesBlock(notes, notesLabel)}</div>` : "";

  const ctaBlock = cta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;"><tr><td style="border-radius:10px;background:${C.primary};"><a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#0E0C0B;text-decoration:none;letter-spacing:0.04em;text-transform:uppercase;border-radius:10px;">${cta.label}</a></td></tr></table>`
    : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta http-equiv="X-UA-Compatible" content="IE=edge"/><title>${subject}</title>
  <style>
    body{margin:0;padding:0;background:${C.bg};font-family:'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;}
    .wrapper{background:${C.bg};padding:32px 16px}
    .card{background:${C.surface};border:1px solid ${C.border};border-radius:14px;max-width:600px;margin:0 auto;overflow:hidden}
    .header{background:${C.bg};border-bottom:1px solid ${C.border};padding:28px 40px;text-align:center}
    .header img{height:38px;width:auto}
    .accent-bar{height:3px;background:linear-gradient(90deg,${C.primary},${C.accent},${C.secondary})}
    .content{padding:36px 40px 32px}
    .headline{font-size:23px;font-weight:800;color:${C.text};margin:0 0 18px;line-height:1.3;letter-spacing:-0.3px}
    .body-text{font-size:15px;color:${C.textMuted};line-height:1.7;margin:0 0 16px}
    .body-text strong{color:${C.text};font-weight:700}
    .divider{height:1px;background:${C.border};margin:28px 0}
    .footer{background:${C.bg};border-top:1px solid ${C.border};padding:28px 40px;text-align:center}
    .footer p{margin:4px 0;font-size:12px;color:${C.textDim}}
    .footer .brand{font-size:13px;color:${C.text};font-weight:700;margin-bottom:8px}
    .social a{display:inline-block;margin:0 10px;font-size:12px;color:${C.textMuted};text-decoration:none}
    .social a:hover{color:${C.primary}}
    @media(max-width:600px){
      .content,.header,.footer{padding-left:24px!important;padding-right:24px!important}
      .headline{font-size:20px!important}
    }
  </style></head>
  <body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&nbsp;&nbsp;</div>` : ''}
  <div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Music"/></div>
    <div class="accent-bar"></div>
    <div class="content">
      ${badge}
      <h1 class="headline">${headline}</h1>
      <div class="body-text">${body}</div>
      ${rowsBlock}
      ${notesB}
      ${extra ? `<div class="divider"></div>${extra}` : ""}
      ${ctaBlock}
    </div>
    <div class="footer">
      <div class="social" style="margin-bottom:14px;">
        <a href="${SITE_URL}">Site web</a>
        <a href="https://instagram.com/kkdmusic">Instagram</a>
        <a href="https://youtube.com/@kkdmusic">YouTube</a>
        <a href="https://open.spotify.com">Spotify</a>
      </div>
      <p class="brand">KKD Music</p>
      <p>Maison de disques indépendante · Distribution & Promotion</p>
      <p style="margin-top:10px;"><a href="${SITE_URL}/mon-espace" style="color:${C.primary};text-decoration:none;">Gérer mon espace</a> · <a href="${SITE_URL}" style="color:${C.primary};text-decoration:none;">kkdmusic.com</a></p>
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
  if (!id || !field || !expected) return false;
  try {
    const records = await base44.asServiceRole.entities[entityName].filter({ id });
    const rec = records && records[0];
    return !!rec && rec[field] === expected;
  } catch (e) {
    console.error(`verifyStatusChange(${entityName}) error:`, e);
    return false;
  }
}