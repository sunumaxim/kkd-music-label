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
    const { license_id } = body;

    if (!license_id) return Response.json({ error: 'ID de licence manquant' }, { status: 400 });

    const license = await base44.asServiceRole.entities.MusicLicense.get(license_id);
    if (!license) return Response.json({ error: 'Licence introuvable' }, { status: 404 });

    // Vérifier que l'utilisateur est admin ou partie prenante de la licence
    const isOwner = license.requested_by_email === user.email
      || license.sent_to_email === user.email
      || license.created_by_id === user.id;
    if (!isOwner && user.role !== 'admin') {
      return Response.json({ error: 'Accès non autorisé à cette licence' }, { status: 403 });
    }

    // Ne pas accepter recipient_email depuis le corps (anti-exfiltration)
    const targetEmail = license.sent_to_email || license.requested_by_email || user.email;
    if (!targetEmail) return Response.json({ error: 'Aucun email destinataire' }, { status: 400 });

    const workTitle = license.release_title || license.video_title || license.artist_name;

    const viewerUrl = `https://kkdmusic.com/document/${license_id}`;
    const docsHtml = `<tr><td style="padding:10px 0;border-bottom:1px solid #3A302A;font-size:13px;color:#A6998C;width:45%;">Documents officiels</td><td style="padding:10px 0;border-bottom:1px solid #3A302A;font-size:14px;color:#F4EDE6;font-weight:600;text-align:right;"><a href="${viewerUrl}" style="color:#D9A441;text-decoration:none;">Consulter & télécharger →</a></td></tr>`;

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