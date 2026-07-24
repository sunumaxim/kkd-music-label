/**
 * Notifie l'admin quand un partenaire soumet une nouvelle publication
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const PRIMARY = "#E50000";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#222222";
const SITE_URL = "https://music.sunumaxim.com";

function buildEmailHtml({ subject, headline, body, cta, extra = '' }) {
  const ctaBlock = cta ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;"><tr><td style="border-radius:6px;background:${PRIMARY};"><a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${cta.label}</a></td></tr></table>` : '';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${subject}</title>
  <style>body{margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif}.wrapper{background:${BG};padding:40px 16px}.card{background:${CARD};border:1px solid ${BORDER};border-radius:12px;max-width:600px;margin:0 auto;overflow:hidden}.header{background:${BG};border-bottom:1px solid ${BORDER};padding:28px 40px;text-align:center}.red-bar{height:3px;background:linear-gradient(90deg,${PRIMARY},#ff4444)}.content{padding:40px}.headline{font-size:22px;font-weight:800;color:#fff;margin:0 0 20px;line-height:1.3}.body-text{font-size:15px;color:#ccc;line-height:1.7;margin:0 0 16px}.footer{background:#0d0d0d;border-top:1px solid ${BORDER};padding:28px 40px;text-align:center}.footer p{margin:4px 0;font-size:12px;color:#999}</style></head>
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
      <p>© ${new Date().getFullYear()} KKD Label Group. Tous droits réservés.</p>
    </div>
  </div></div></body></html>`;
}

const TYPE_LABELS = {
  sortie_musicale: 'Single', video_clip: 'Clip vidéo', playlist: 'Playlist',
  album: 'Album', ep: 'EP / Mixtape', autre: 'Autre',
};

const PLATFORM_LABELS = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube: 'YouTube',
  audiomack: 'Audiomack', amazon_music: 'Amazon Music', deezer: 'Deezer',
  soundcloud: 'SoundCloud', autre: 'Autre',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    if (!data?.partner_email) return Response.json({ skipped: true });

    const contentType = TYPE_LABELS[data.content_type] || data.content_type;
    const platform = PLATFORM_LABELS[data.streaming_platform] || 'Streaming';

    // Confirmation au partenaire
    const partnerHtml = buildEmailHtml({
      subject: 'Publication reçue — KKD Label Group',
      headline: '📬 Publication bien reçue !',
      body: `Bonjour <strong>${data.partner_name || data.partner_email}</strong>,<br><br>Votre publication <strong>"${data.title}"</strong> (${contentType}) a bien été soumise à l'équipe KKD Label Group.<br><br>Notre équipe va examiner votre contenu et vous informera de la suite donnée.`,
      extra: `<table style="width:100%;font-size:14px;color:#ccc;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#777;">Titre</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#ddd;font-weight:600;text-align:right;">${data.title}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#777;">Type</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#ddd;font-weight:600;text-align:right;">${contentType}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#777;">Plateforme</td><td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:#ddd;font-weight:600;text-align:right;">${platform}</td></tr>
        ${data.artist_name ? `<tr><td style="padding:8px 0;color:#777;">Artiste</td><td style="padding:8px 0;color:#ddd;font-weight:600;text-align:right;">${data.artist_name}</td></tr>` : ''}
      </table>`,
      cta: { label: 'Voir mon espace partenaire', url: `${SITE_URL}/mon-espace` },
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.partner_email,
      subject: 'KKD Label Group — Publication bien reçue',
      body: partnerHtml,
      from_name: 'KKD Label Group',
    });

    // Notif in-app
    await base44.asServiceRole.entities.Notification.create({
      user_email: data.partner_email,
      title: '📬 Publication reçue !',
      message: `Votre publication "${data.title}" a bien été soumise. Notre équipe vous répondra prochainement.`,
      type: 'info',
      link: '/mon-espace',
      is_read: false,
    });

    // Notifier les admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin' && u.email);

    const adminHtml = buildEmailHtml({
      subject: `Nouvelle publication — ${data.title}`,
      headline: `🎵 Nouvelle publication à valider`,
      body: `<strong>${data.partner_name || data.partner_email}</strong> vient de soumettre un nouveau contenu : <strong>"${data.title}"</strong> (${contentType} sur ${platform}).`,
      cta: { label: 'Voir les publications', url: `${SITE_URL}/admin/publications` },
      extra: data.streaming_link ? `<p style="font-size:13px;color:#aaa;margin:0 0 6px;">Lien streaming :</p><a href="${data.streaming_link}" style="color:${PRIMARY};font-size:14px;">${data.streaming_link}</a>` : '',
    });

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `KKD Admin — Nouvelle publication : ${data.title}`,
        body: adminHtml,
        from_name: 'KKD Label Group',
      })
    ));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});