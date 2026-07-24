/**
 * Shared email + notification helpers for all notify* backend functions.
 * Domain: music.sunumaxim.com
 */
export const SITE_URL = "https://music.sunumaxim.com";
export const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
export const PRIMARY = "#E50000";
export const BG = "#0a0a0a";
export const CARD = "#111111";
export const BORDER = "#222222";

export function buildEmailHtml({ subject, headline, body, cta, extra = "" }) {
  const ctaBlock = cta
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;"><tr><td style="border-radius:6px;background:${PRIMARY};"><a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">${cta.label}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title>
  <style>body{margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif}.wrapper{background:${BG};padding:40px 16px}.card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden}.header{background:${BG};border-bottom:1px solid ${BORDER};padding:28px 40px;text-align:center}.red-bar{height:3px;background:linear-gradient(90deg,${PRIMARY},#ff4444)}.content{padding:40px}.headline{font-size:24px;font-weight:800;color:#ffffff;margin:0 0 20px;line-height:1.3}.body-text{font-size:15px;color:#cccccc;line-height:1.7;margin:0 0 16px}.divider{height:1px;background:${BORDER};margin:28px 0}.footer{background:#0d0d0d;border-top:1px solid ${BORDER};padding:28px 40px;text-align:center}.footer p{margin:4px 0;font-size:12px;color:#999}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Music" style="height:40px;width:auto;"/></div>
    <div class="red-bar"></div>
    <div class="content">
      <h1 class="headline">${headline}</h1>
      <div class="body-text">${body}</div>
      ${ctaBlock}
      ${extra ? `<div class="divider"></div>${extra}` : ""}
    </div>
    <div class="footer">
      <p style="font-size:13px;color:#ddd;font-weight:700;margin-bottom:8px;">KKD Music — SunuMaxim Group</p>
      <p>Maison de disques indépendante · Distribution & Promotion</p>
      <p style="margin-top:8px;"><a href="${SITE_URL}/mon-espace" style="color:${PRIMARY};text-decoration:none;">Gérer mon espace</a> · <a href="${SITE_URL}" style="color:${PRIMARY};text-decoration:none;">music.sunumaxim.com</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} KKD Music. Tous droits réservés.</p>
    </div>
  </div></div></body></html>`;
}

/**
 * Push an in-app notification + email in parallel.
 * opts: { base44, userEmail, title, message, type, link, subject, body }
 */
export async function pushNotification(opts) {
  const { base44, userEmail, title, message, type = "info", link = "/mon-espace", subject, body } = opts;

  // 1) In-app notification — always attempted; must never be blocked by email failures.
  try {
    await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail, title, message, type, link, is_read: false,
    });
  } catch (e) {
    console.error("pushNotification in-app error:", e);
  }

  // 2) Email — best-effort. SendEmail only reaches registered app users; silently skip
  //    external/unregistered addresses so the in-app notification always lands.
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
 * status actually matches the claimed new status. A forged external POST
 * (where the real record is still "en_attente") is rejected, so only genuine
 * admin-driven status changes trigger notifications.
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