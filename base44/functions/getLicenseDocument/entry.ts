import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const url = new URL(req.url);
    const licenseId = url.searchParams.get('id') || url.pathname.split('/').pop();

    if (!licenseId) return Response.json({ error: 'ID manquant' }, { status: 400 });

    const license = await base44.asServiceRole.entities.MusicLicense.get(licenseId);
    if (!license) return Response.json({ error: 'Document introuvable' }, { status: 404 });

    // Vérifier que l'utilisateur est admin ou partie prenante de la licence
    const isOwner = license.requested_by_email === user.email
      || license.sent_to_email === user.email
      || license.created_by_id === user.id;
    if (!isOwner && user.role !== 'admin') {
      return Response.json({ error: 'Accès non autorisé à ce document' }, { status: 403 });
    }

    return Response.json({
      success: true,
      license_id: license.id,
      license_number: license.license_number || '',
      certificate_number: license.certificate_number || '',
      license_type: license.license_type,
      artist_name: license.artist_name,
      work_title: license.release_title || license.video_title || license.artist_name,
      originality_hash: license.originality_hash || '',
      originality_checks: license.originality_checks || [],
      valid_until: license.valid_until || '',
      pdf_data: license.pdf_data || {},
      status: license.status,
    });
  } catch (error) {
    console.error('getLicenseDocument error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}