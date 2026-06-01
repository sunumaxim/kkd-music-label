/**
 * Envoie une campagne email aux partenaires / artistes / admins
 * Appelé par l'admin depuis la page AdminMailing
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const PRIMARY = "#E50000";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#222222";
const SITE_URL = "https://kkdmusic.com";

function buildEmailHtml({ subject, headline, body, cta }) {
  const ctaBlock = cta?.label ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;"><tr><td style="border-radius:6px;background:${PRIMARY};"><a href="${cta.url || SITE_URL}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${cta.label}</a></td></tr></table>` : '';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${subject}</title>
  <style>body{margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif}.wrapper{background:${BG};padding:40px 16px}.card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden}.header{background:${BG};border-bottom:1px solid ${BORDER};padding:28px 40px;text-align:center}.red-bar{height:3px;background:linear-gradient(90deg,${PRIMARY},#ff4444)}.content{padding:40px}.headline{font-size:24px;font-weight:800;color:#fff;margin:0 0 20px;line-height:1.3}.body-text{font-size:15px;color:#ccc;line-height:1.7;white-space:pre-wrap}.footer{background:#0d0d0d;border-top:1px solid ${BORDER};padding:28px 40px;text-align:center}.footer p{margin:4px 0;font-size:12px;color:#999}.social a{display:inline-block;margin:0 8px;font-size:12px;color:#999;text-decoration:none}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Label Group" style="height:40px;width:auto;"/></div>
    <div class="red-bar"></div>
    <div class="content">
      <h1 class="headline">${headline}</h1>
      <div class="body-text">${body}</div>
      ${ctaBlock}
    </div>
    <div class="footer">
      <div class="social" style="margin-bottom:16px;">
        <a href="${SITE_URL}">Site web</a>
        <a href="https://instagram.com/kkdlabelgroup">Instagram</a>
        <a href="https://youtube.com/@kkdlabelgroup">YouTube</a>
      </div>
      <p style="font-size:13px;color:#ddd;font-weight:700;margin-bottom:6px;">KKD Label Group</p>
      <p>Maison de disques indépendante · Distribution & Promotion · Paris, France</p>
      <p style="margin-top:10px;"><a href="${SITE_URL}/mon-espace" style="color:${PRIMARY};text-decoration:none;">Gérer mes préférences</a></p>
      <p>© ${new Date().getFullYear()} KKD Label Group. Tous droits réservés.</p>
    </div>
  </div></div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { subject, headline, body, cta, audience } = await req.json();

    if (!subject || !headline || !body) {
      return Response.json({ error: 'subject, headline et body sont requis' }, { status: 400 });
    }

    // Construire la liste des destinataires selon l'audience choisie
    let recipients = [];

    if (audience === 'all' || audience === 'partners') {
      // Partenaires = utilisateurs avec role "user" (artistes invités)
      const allUsers = await base44.asServiceRole.entities.User.list();
      const partners = allUsers.filter(u => u.role === 'user' && u.email);
      recipients.push(...partners.map(u => ({ email: u.email, name: u.full_name || u.email })));
    }

    if (audience === 'all' || audience === 'admins') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const admins = allUsers.filter(u => u.role === 'admin' && u.email && u.email !== user.email);
      recipients.push(...admins.map(u => ({ email: u.email, name: u.full_name || u.email })));
    }

    if (audience === 'requests') {
      // Toutes les personnes ayant soumis une demande
      const requests = await base44.asServiceRole.entities.ServiceRequest.list();
      const seen = new Set();
      for (const r of requests) {
        if (r.email && !seen.has(r.email)) {
          seen.add(r.email);
          recipients.push({ email: r.email, name: r.full_name || r.email });
        }
      }
    }

    if (audience === 'artists') {
      // Artistes ayant une invitation active
      const invites = await base44.asServiceRole.entities.ArtistInvite.filter({ status: 'actif' });
      for (const inv of invites) {
        if (inv.email) recipients.push({ email: inv.email, name: inv.artist_name || inv.email });
      }
    }

    // Déduplique
    const seen = new Set();
    const uniqueRecipients = recipients.filter(r => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    if (uniqueRecipients.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'Aucun destinataire trouvé' });
    }

    const htmlBody = buildEmailHtml({ subject, headline, body, cta });

    // Envoi par lots de 10 pour ne pas surcharger
    let sent = 0;
    const batchSize = 10;
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      await Promise.all(batch.map(r =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: r.email,
          subject: subject,
          body: htmlBody,
          from_name: 'KKD Label Group',
        })
      ));
      sent += batch.length;
    }

    return Response.json({ success: true, sent, total: uniqueRecipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});