import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const PRIMARY = "#E50000";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#222222";
const SITE_URL = "https://music.sunumaxim.com";

function buildEmailHtml({ subject, headline, body, cta, extra = '' }) {
  const ctaBlock = cta ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
      <tr><td style="border-radius:6px;background:${PRIMARY};">
        <a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;border-radius:6px;">${cta.label}</a>
      </td></tr>
    </table>` : '';

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
  <style>body{margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif}.wrapper{background:${BG};padding:40px 16px}.card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden}.header{background:${BG};border-bottom:1px solid ${BORDER};padding:28px 40px;text-align:center}.red-bar{height:3px;background:linear-gradient(90deg,${PRIMARY},#ff4444)}.content{padding:40px}.headline{font-size:24px;font-weight:800;color:#ffffff;margin:0 0 20px;line-height:1.3}.body-text{font-size:15px;color:#cccccc;line-height:1.7;margin:0 0 16px}.divider{height:1px;background:${BORDER};margin:28px 0}.footer{background:#0d0d0d;border-top:1px solid ${BORDER};padding:28px 40px;text-align:center}.footer p{margin:4px 0;font-size:12px;color:#999}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header"><img src="${LOGO_URL}" alt="KKD Label Group" style="height:40px;width:auto;"/></div>
    <div class="red-bar"></div>
    <div class="content">
      <h1 class="headline">${headline}</h1>
      <div class="body-text">${body}</div>
      ${ctaBlock}
      ${extra ? `<div class="divider"></div>${extra}` : ''}
    </div>
    <div class="footer">
      <p style="font-size:13px;color:#ddd;font-weight:700;margin-bottom:8px;">KKD Label Group</p>
      <p>Maison de disques indépendante · Distribution & Promotion · Paris, France</p>
      <p style="margin-top:8px;"><a href="${SITE_URL}/mon-espace" style="color:${PRIMARY};text-decoration:none;">Gérer mon espace</a> · <a href="${SITE_URL}" style="color:${PRIMARY};text-decoration:none;">Visiter le site</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} KKD Label Group. Tous droits réservés.</p>
    </div>
  </div></div></body></html>`;
}

const STATUS_CONFIG = {
  approuve: {
    title: 'Votre publication a été approuvée',
    notifType: 'success',
    headline: '✅ Publication approuvée !',
    bodyFn: (pub) => `Bonne nouvelle ! Votre contenu <strong>"${pub.title}"</strong> a été approuvé par l'équipe KKD Label Group.<br><br>Notre équipe va maintenant planifier la publication et la promotion de votre contenu sur nos canaux.`,
  },
  publie: {
    title: 'Votre contenu est maintenant en ligne',
    notifType: 'success',
    headline: '🚀 Contenu publié !',
    bodyFn: (pub) => `Votre contenu <strong>"${pub.title}"</strong> est désormais en ligne et promu par KKD Label Group.<br><br>Retrouvez votre publication sur notre plateforme et partagez-la avec votre communauté !`,
  },
  refuse: {
    title: 'Mise à jour concernant votre publication',
    notifType: 'warning',
    headline: 'Publication non retenue',
    bodyFn: (pub) => `Après examen, votre contenu <strong>"${pub.title}"</strong> n'a pas pu être retenu pour le moment.<br><br>N'hésitez pas à soumettre une nouvelle publication ou à nous contacter pour en savoir plus.`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, changed_fields } = body;

    if (!changed_fields?.includes('status')) return Response.json({ skipped: true });

    const newStatus = data?.status;
    const userEmail = data?.partner_email;

    if (!userEmail || !STATUS_CONFIG[newStatus]) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIG[newStatus];
    const adminNotes = data?.admin_notes;

    const extraBlock = adminNotes
      ? `<p style="font-size:13px;color:#aaa;margin:0 0 6px;">Message de l'équipe KKD :</p><div style="background:#1a1a1a;border-left:3px solid ${PRIMARY};border-radius:6px;padding:14px 18px;font-size:14px;color:#ddd;line-height:1.6;">${adminNotes}</div>`
      : '';

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      headline: cfg.headline,
      body: cfg.bodyFn(data),
      cta: { label: 'Voir mon espace partenaire', url: `${SITE_URL}/mon-espace` },
      extra: extraBlock,
    });

    await Promise.all([
      base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        title: cfg.headline,
        message: cfg.bodyFn(data).replace(/<[^>]+>/g, '').substring(0, 200),
        type: cfg.notifType,
        link: '/mon-espace',
        is_read: false,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: userEmail,
        subject: `KKD Label Group — ${cfg.title}`,
        body: htmlBody,
        from_name: 'KKD Label Group',
      }),
    ]);

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});