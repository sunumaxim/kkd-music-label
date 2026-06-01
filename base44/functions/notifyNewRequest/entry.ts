/**
 * Notifie l'admin + envoie une confirmation au demandeur quand une nouvelle demande de service est créée
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const PRIMARY = "#E50000";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#222222";
const SITE_URL = "https://kkdmusic.com";

function buildEmailHtml({ subject, headline, body, cta, extra = '' }) {
  const ctaBlock = cta ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
      <tr><td style="border-radius:6px;background:${PRIMARY};">
        <a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-radius:6px;">${cta.label}</a>
      </td></tr>
    </table>` : '';

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>${subject}</title>
  <style>body{margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif}.wrapper{background:${BG};padding:40px 16px}.card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden}.header{background:${BG};border-bottom:1px solid ${BORDER};padding:28px 40px;text-align:center}.red-bar{height:3px;background:linear-gradient(90deg,${PRIMARY},#ff4444)}.content{padding:40px}.headline{font-size:22px;font-weight:800;color:#ffffff;margin:0 0 20px;line-height:1.3}.body-text{font-size:15px;color:#cccccc;line-height:1.7;margin:0 0 16px}.info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px}.info-label{color:#777}.info-value{color:#ddd;font-weight:600;text-align:right}.footer{background:#0d0d0d;border-top:1px solid ${BORDER};padding:28px 40px;text-align:center}.footer p{margin:4px 0;font-size:12px;color:#999}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Label Group" style="height:40px;width:auto;"/></div>
    <div class="red-bar"></div>
    <div class="content">
      <h1 class="headline">${headline}</h1>
      <div class="body-text">${body}</div>
      ${ctaBlock}
      ${extra ? `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>${extra}` : ''}
    </div>
    <div class="footer">
      <p style="font-size:13px;color:#ddd;font-weight:700;margin-bottom:6px;">KKD Label Group</p>
      <p>Maison de disques indépendante · Paris, France</p>
      <p style="margin-top:8px;"><a href="${SITE_URL}" style="color:${PRIMARY};text-decoration:none;">kkdmusic.com</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} KKD Label Group. Tous droits réservés.</p>
    </div>
  </div></div></body></html>`;
}

const TYPE_LABELS = {
  distribution: 'Distribution musicale',
  promotion_musique: 'Promotion musicale',
  promotion_clip: 'Promotion de clip',
  partenariat_label: 'Partenariat label',
  collaboration: 'Collaboration artistique',
  autre: 'Autre demande',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    if (!data?.email) return Response.json({ skipped: true });

    const requestType = TYPE_LABELS[data.request_type] || data.request_type;
    const infoRows = [
      ['Type de demande', requestType],
      data.artist_name ? ['Artiste', data.artist_name] : null,
      data.organization ? ['Organisation', data.organization] : null,
      data.genre ? ['Genre musical', data.genre] : null,
    ].filter(Boolean);

    const infoBlock = infoRows.map(([label, value]) =>
      `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>`
    ).join('');

    // Email de confirmation au demandeur
    const confirmHtml = buildEmailHtml({
      subject: 'Demande bien reçue — KKD Label Group',
      headline: 'Votre demande a été reçue !',
      body: `Bonjour <strong>${data.full_name}</strong>,<br><br>Nous avons bien reçu votre demande de <strong>${requestType}</strong>. Notre équipe l'examine et vous contactera dans les meilleurs délais.<br><br>Voici le récapitulatif de votre demande :`,
      extra: infoBlock + (data.description ? `<div style="margin-top:16px;background:#1a1a1a;border-left:3px solid ${PRIMARY};border-radius:6px;padding:14px 18px;font-size:14px;color:#ddd;line-height:1.6;">${data.description}</div>` : ''),
      cta: { label: 'Suivre ma demande', url: `${SITE_URL}/mon-espace` },
    });

    // Notif in-app
    await base44.asServiceRole.entities.Notification.create({
      user_email: data.email,
      title: '📩 Demande bien reçue !',
      message: `Votre demande de ${requestType} a été enregistrée. Nous reviendrons vers vous très prochainement.`,
      type: 'info',
      link: '/mon-espace',
      is_read: false,
    });

    // Email confirmation client
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.email,
      subject: 'KKD Label Group — Votre demande a bien été reçue',
      body: confirmHtml,
      from_name: 'KKD Label Group',
    });

    // Récupérer les admins pour les notifier
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin' && u.email);

    const adminHtml = buildEmailHtml({
      subject: `Nouvelle demande — ${data.full_name}`,
      headline: `📬 Nouvelle demande : ${requestType}`,
      body: `<strong>${data.full_name}</strong> (${data.email}) vient de soumettre une demande de <strong>${requestType}</strong>.`,
      extra: infoBlock + (data.description ? `<div style="margin-top:16px;background:#1a1a1a;border-left:3px solid ${PRIMARY};border-radius:6px;padding:14px 18px;font-size:14px;color:#ddd;line-height:1.6;">${data.description}</div>` : ''),
      cta: { label: 'Voir la demande', url: `${SITE_URL}/admin/demandes` },
    });

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `KKD Admin — Nouvelle demande de ${data.full_name}`,
        body: adminHtml,
        from_name: 'KKD Label Group',
      })
    ));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});