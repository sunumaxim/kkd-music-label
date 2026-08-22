import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildEmailHtml } from '../../shared/emailKit.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { license_id, recipient_email } = body;

    if (!license_id) return Response.json({ error: 'ID de licence manquant' }, { status: 400 });

    const license = await base44.asServiceRole.entities.MusicLicense.get(license_id);
    if (!license) return Response.json({ error: 'Licence introuvable' }, { status: 404 });

    const targetEmail = recipient_email || license.sent_to_email || license.requested_by_email;
    if (!targetEmail) return Response.json({ error: 'Aucun email destinataire' }, { status: 400 });

    const workTitle = license.release_title || license.video_title || license.artist_name;

    const docs = [];
    if (license.document_url) docs.push(['Licence de distribution', license.document_url]);
    if (license.certificate_url) docs.push(["Certificat d'authenticité", license.certificate_url]);

    const docsHtml = docs.length > 0
      ? docs.map(([label, url]) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #3A302A;font-size:13px;color:#A6998C;width:45%;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #3A302A;font-size:14px;color:#F4EDE6;font-weight:600;text-align:right;"><a href="${url}" style="color:#D9A441;text-decoration:none;">Télécharger le PDF →</a></td></tr>`
        ).join('')
      : `<tr><td style="padding:10px 0;font-size:13px;color:#A6998C;">Vos documents sont en cours de finalisation. L'équipe KKD Music vous les transmettra directement. Pour toute question, contactez-nous sur <a href="https://kkdmusic.com" style="color:#D9A441;text-decoration:none;">kkdmusic.com</a>.</td></tr>`;

    const html = buildEmailHtml({
      subject: `[KKD Music] Documents officiels — ${workTitle}`,
      preheader: `Vos documents professionnels pour « ${workTitle} »`,
      action: 'success',
      actionLabel: 'DOCUMENTS OFFICIELS',
      headline: `Documents officiels pour « ${workTitle} »`,
      body: `Bonjour <strong>${license.artist_name}</strong>,<br/><br/>KKD Music vous renvoie vos documents professionnels de droits d'auteur et de distribution pour l'œuvre <strong>« ${workTitle} »</strong>. Ces documents attestent de l'originalité de votre œuvre et sécurisent vos droits d'auteur conformément aux standards de l'industrie musicale. Conservez-les précieusement.`,
      infoRows: [
        ['Artiste', license.artist_name],
        ['Œuvre', workTitle],
        ['Empreinte numérique', (license.originality_hash || '').slice(0, 24) + '…'],
        ['Valide jusqu\'au', license.valid_until ? fmtDate(license.valid_until) : '—'],
      ],
      extra: `<div style="margin:24px 0;"><table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">${docsHtml}</table></div>`,
      cta: { label: 'Voir mon espace', url: 'https://kkdmusic.com/mon-espace' },
    });

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: targetEmail,
        subject: `[KKD Music] Documents officiels — ${workTitle}`,
        body: html,
        from_name: 'KKD Music',
      });
    } catch (emailErr) {
      console.error('SendEmail error:', emailErr.message);
      return Response.json({ error: `Envoi email échoué : ${emailErr.message}` }, { status: 500 });
    }

    await base44.asServiceRole.entities.MusicLicense.update(license_id, {
      status: 'envoye',
      sent_to_email: targetEmail,
      sent_date: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      sent_to: targetEmail,
      license_id,
    });
  } catch (error) {
    console.error('sendLicenseEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}