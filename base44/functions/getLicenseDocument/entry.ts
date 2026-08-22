import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const licenseId = url.searchParams.get('id') || url.pathname.split('/').pop();

    if (!licenseId) return Response.json({ error: 'ID manquant' }, { status: 400 });

    const license = await base44.asServiceRole.entities.MusicLicense.get(licenseId);
    if (!license) return Response.json({ error: 'Document introuvable' }, { status: 404 });

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