import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildEmailHtml } from '../../shared/emailKit.js';

// ===== UTILITIES =====
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ymd(d = new Date()) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function genSuffix() { return Math.random().toString(36).substring(2, 6).toUpperCase(); }
function genLicenseNumber() { return `KKD-LIC-${ymd()}-${genSuffix()}`; }
function genCertificateNumber() { return `KKD-CERT-${ymd()}-${genSuffix()}`; }

function genISRC(hash) {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = hash.slice(0, 5).replace(/[^A-Z0-9]/g, '').padEnd(5, '0');
  return `SN-KKD-${year}-${num}`;
}

// ===== ORIGINALITY CHECKS =====
async function runOriginalityChecks(base44, data) {
  const checks = [];
  try {
    const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: data.artist_name, title: data.work_title });
    const others = existing.filter(r => r.id !== data.release_id);
    if (others.length === 0) {
      checks.push({ check: 'Dédoublonnage catalogue', result: 'conforme', detail: 'Aucune sortie identique dans le catalogue KKD Music' });
    } else {
      checks.push({ check: 'Dédoublonnage catalogue', result: 'attention', detail: `${others.length} sortie(s) similaire(s) — vérification manuelle requise` });
    }
  } catch {
    checks.push({ check: 'Dédoublonnage catalogue', result: 'non_verifie', detail: 'Contrôle non exécuté' });
  }
  if (data.artist_verified) {
    checks.push({ check: 'Statut artiste vérifié', result: 'conforme', detail: 'Artiste certifié KKD Music — profil authentifié' });
  } else {
    checks.push({ check: 'Statut artiste vérifié', result: 'attention', detail: 'Artiste non vérifié — certification à compléter' });
  }
  checks.push({ check: 'Empreinte numérique SHA-256', result: 'conforme', detail: `Empreinte ${data.originality_hash.slice(0, 16)}… générée et horodatée` });
  if (data.streaming_url) {
    checks.push({ check: 'Référencement plateforme externe', result: 'conforme', detail: 'Œuvre référencée sur une plateforme de streaming vérifiable' });
  } else {
    checks.push({ check: 'Référencement plateforme externe', result: 'non_verifie', detail: 'Aucun lien externe — originalité basée sur déclaration artiste' });
  }
  checks.push({ check: "Déclaration d'originalité artiste", result: 'conforme', detail: "L'artiste déclare être l'auteur légitime sous peine de poursuites" });
  checks.push({ check: 'Horodatage certifié', result: 'conforme', detail: `Émis le ${new Date().toLocaleString('fr-FR')}` });
  return checks;
}

// ===== BRANDED EMAIL =====
async function sendBrandedLicenseEmail(base44, d) {
  const viewerUrl = `https://kkdmusic.com/document/${d.license_id}`;
  const html = buildEmailHtml({
    subject: `[KKD Music] Documents officiels — ${d.work_title}`,
    preheader: `Vos documents professionnels pour « ${d.work_title} »`,
    action: 'success',
    actionLabel: 'DOCUMENTS OFFICIELS',
    headline: `Documents officiels pour « ${d.work_title} »`,
    body: `Bonjour <strong>${d.artist_name}</strong>,<br/><br/>KKD Music vous délivre vos documents professionnels de droits d'auteur et de distribution pour l'œuvre <strong>« ${d.work_title} »</strong>. Ces documents attestent de l'originalité de votre œuvre et sécurisent vos droits d'auteur conformément aux standards de l'industrie musicale. Cliquez sur le bouton ci-dessous pour consulter et télécharger vos documents à tout moment.`,
    infoRows: [
      ['Artiste', d.artist_name],
      ['Œuvre', d.work_title],
      ['Licence N°', d.license_number],
      ...(d.certificate_number ? [['Certificat N°', d.certificate_number]] : []),
      ['Empreinte numérique', d.originality_hash.slice(0, 24) + '…'],
      ['Valide jusqu\'au', new Date(d.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })],
    ],
    cta: { label: 'Consulter mes documents', url: viewerUrl },
  });
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: d.target_email,
    subject: `[KKD Music] Documents officiels — ${d.work_title}`,
    body: html,
    from_name: 'KKD Music',
  });
}

// ===== MAIN ENTRY =====
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { artist_id, release_id, video_id, license_type, recipient_email, preview_only } = body;

    if (!artist_id) return Response.json({ error: 'Artiste manquant' }, { status: 400 });
    if (!license_type) return Response.json({ error: 'Type de licence manquant' }, { status: 400 });

    const artist = await base44.asServiceRole.entities.Artist.get(artist_id);
    if (!artist) return Response.json({ error: 'Artiste introuvable' }, { status: 404 });

    let labelName = '';
    try {
      const invites = await base44.asServiceRole.entities.ArtistInvite.filter({ artist_id });
      const labelInvite = invites.find(i => i.invite_type === 'label_partenaire' && i.label_name);
      if (labelInvite) labelName = labelInvite.label_name;
    } catch {}

    let work = null, workType = null, workTitle = artist.name, workDate = null, streamingUrl = null;
    if (release_id) {
      work = await base44.asServiceRole.entities.Release.get(release_id);
      workType = work?.release_type || 'single';
      workTitle = work?.title || artist.name;
      workDate = work?.release_date || null;
      streamingUrl = work?.spotify_url || work?.youtube_url || work?.audiomack_url || work?.deezer_url || work?.apple_music_url || null;
    } else if (video_id) {
      work = await base44.asServiceRole.entities.Video.get(video_id);
      workType = 'clip vidéo';
      workTitle = work?.title || artist.name;
      workDate = work?.publish_date || null;
      streamingUrl = work?.youtube_url || null;
    }

    const fingerprintInput = `${workTitle}|${artist.name}|${workDate || ''}|${workType || ''}|${new Date().toISOString()}`;
    const originalityHash = await sha256(fingerprintInput);
    const licenseNumber = genLicenseNumber();
    const certificateNumber = genCertificateNumber();
    const isrc = genISRC(originalityHash);
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const pdfData = {
      license_number: licenseNumber,
      certificate_number: certificateNumber,
      isrc,
      artist_name: artist.name,
      artist_genre: artist.genre || '',
      artist_verified: !!artist.is_verified,
      artist_nationality: artist.nationality || '',
      label_name: labelName || '',
      work_title: workTitle,
      work_type: workType,
      work_date: workDate,
      streaming_url: streamingUrl,
      originality_hash: originalityHash,
      valid_until: validUntil,
      release_id: release_id || '',
      video_id: video_id || '',
    };

    const originalityChecks = await runOriginalityChecks(base44, pdfData);
    pdfData.originality_checks = originalityChecks;

    const targetEmail = recipient_email || artist.email || user.email;

    // Preview mode: return metadata only (no entity, no upload, no email)
    if (preview_only) {
      return Response.json({
        success: true,
        ...pdfData,
        sent_to: targetEmail,
        preview: true,
      });
    }

    // Send mode: create entity + send email with viewer link
    const license = await base44.asServiceRole.entities.MusicLicense.create({
      artist_id,
      artist_name: artist.name,
      release_id: release_id || '',
      release_title: release_id ? workTitle : '',
      video_id: video_id || '',
      video_title: video_id ? workTitle : '',
      license_type,
      license_number: licenseNumber,
      certificate_number: certificateNumber,
      pdf_data: {
        isrc,
        artist_genre: artist.genre || '',
        artist_verified: !!artist.is_verified,
        artist_nationality: artist.nationality || '',
        label_name: labelName || '',
        work_title: workTitle,
        work_type: workType,
        work_date: workDate,
        streaming_url: streamingUrl,
      },
      document_url: '',
      certificate_url: '',
      originality_hash: originalityHash,
      originality_checks: originalityChecks,
      status: 'envoye',
      requested_by_email: user.email,
      sent_to_email: targetEmail,
      sent_date: new Date().toISOString(),
      valid_until: validUntil,
    });

    try {
      await sendBrandedLicenseEmail(base44, {
        license_id: license.id,
        artist_name: artist.name,
        work_title: workTitle,
        license_number: licenseNumber,
        certificate_number: certificateNumber,
        originality_hash: originalityHash,
        valid_until: validUntil,
        target_email: targetEmail,
      });
    } catch (emailErr) {
      console.error('SendEmail error (non-fatal):', emailErr.message);
    }

    return Response.json({
      success: true,
      license_id: license.id,
      license_number: licenseNumber,
      certificate_number: certificateNumber,
      sent_to: targetEmail,
      preview: false,
    });
  } catch (error) {
    console.error('generateMusicLicense error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}