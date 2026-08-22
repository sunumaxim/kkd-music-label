import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function fmtDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

    const emailBody = `
Bonjour ${license.artist_name},

KKD Music vous délivre vos documents professionnels pour l'œuvre « ${workTitle} ».

${license.document_url ? `📄 LICENCE DE DISTRIBUTION\n${license.document_url}\n\n` : ''}${license.certificate_url ? `🏆 CERTIFICAT D'AUTHENTICITÉ\n${license.certificate_url}\n\n` : ''}Empreinte numérique : ${license.originality_hash}
Valide jusqu'au : ${license.valid_until ? fmtDate(license.valid_until) : 'N/A'}

Ces documents attestent de l'originalité de votre œuvre et autorisent KKD Music à la distribuer sur ses canaux. Conservez-les précieusement.

— KKD Music
    `.trim();

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: targetEmail,
        subject: `[KKD Music] Vos documents professionnels — ${workTitle}`,
        body: emailBody,
      });
    } catch (emailErr) {
      console.error('SendEmail error:', emailErr.message);
      return Response.json({ error: `Envoi email échoué : ${emailErr.message}` }, { status: 500 });
    }

    // Mettre à jour le statut
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