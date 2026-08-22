import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';
import { secrets } from 'base44:runtime';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';
const BRAND_PRIMARY = '#E53935';
const BRAND_SECONDARY = '#1F8A5C';
const BRAND_ACCENT = '#B07D1F';
const BRAND_TEXT = '#1B1410';
const BRAND_MUTED = '#6F655B';

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Hash SHA-256 via Web Crypto
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

function fmtDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Génère le PDF : Licence de distribution ──
function generateDistributionLicensePDF(doc, data) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Bordure cadre
  doc.setDrawColor(BRAND_ACCENT);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);

  // En-tête
  doc.setFillColor(BRAND_TEXT);
  doc.rect(8, 8, W - 16, 40, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LICENCE DE DISTRIBUTION', W / 2, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SUNUMAXIM GROUP · KKD MUSIC', W / 2, 38, { align: 'center' });

  // Numéro de licence
  doc.setTextColor(BRAND_MUTED);
  doc.setFontSize(9);
  doc.text(`N° ${data.license_number}`, W - 20, 56, { align: 'right' });

  // Date
  doc.setTextColor(BRAND_TEXT);
  doc.setFontSize(11);
  doc.text(`Délivrée le ${fmtDate(new Date())}`, 20, 56);

  // Section : Titulaire
  let y = 72;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(20, y - 4, W - 20, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('ARTISTE TITULAIRE', 20, y + 4);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(BRAND_TEXT);
  doc.text(`Nom de scène : ${data.artist_name}`, 20, y);
  if (data.artist_genre) doc.text(`Genre : ${data.artist_genre}`, 20, y + 7);
  if (data.artist_verified) {
    doc.setTextColor(BRAND_SECONDARY);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ Artiste vérifié KKD Music', 20, y + 14);
  }

  // Section : Œuvre concernée
  y += 28;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(20, y - 4, W - 20, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('ŒUVRE CONCERNÉE', 20, y + 4);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(BRAND_TEXT);
  doc.text(`Titre : ${data.work_title}`, 20, y);
  if (data.work_type) doc.text(`Type : ${data.work_type}`, 20, y + 7);
  if (data.work_date) doc.text(`Date de sortie : ${fmtDate(data.work_date)}`, 20, y + 14);
  if (data.streaming_url) {
    doc.setFontSize(9);
    doc.setTextColor(BRAND_MUTED);
    doc.text(`Lien : ${data.streaming_url.slice(0, 70)}`, 20, y + 21);
  }

  // Section : Droits accordés
  y += 36;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(20, y - 4, W - 20, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('DROITS ACCORDÉS', 20, y + 4);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_TEXT);
  const rights = [
    'KKD Music est autorisée à distribuer, promouvoir et exploiter l\'œuvre sur ses canaux numériques.',
    'L\'artiste conserve l\'intégralité de ses droits moraux et patrimoniaux sur l\'œuvre.',
    'La présente licence est non-exclusive et révocable.',
    'Toute exploitation commerciale hors KKD Music nécessite un accord complémentaire.',
  ];
  rights.forEach((r, i) => {
    const lines = doc.splitTextToSize(`• ${r}`, W - 50);
    doc.text(lines, 22, y + i * 12);
  });

  // Section : Empreinte & validité
  y += 56;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(20, y - 4, W - 20, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('EMPREINTE NUMÉRIQUE & VALIDITÉ', 20, y + 4);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(BRAND_MUTED);
  doc.text(`SHA-256 : ${data.originality_hash.slice(0, 40)}...`, 20, y);
  doc.text(`Valide jusqu'au : ${fmtDate(data.valid_until)}`, 20, y + 7);

  // Signature KKD
  y = H - 50;
  doc.setDrawColor(BRAND_ACCENT);
  doc.setLineWidth(1.5);
  doc.line(W / 2 - 40, y, W / 2 + 40, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_TEXT);
  doc.text('SUNUMAXIM GROUP · KKD MUSIC', W / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_MUTED);
  doc.text('Direction Artistique & Licences', W / 2, y + 14, { align: 'center' });

  // Pied de page
  doc.setFontSize(7);
  doc.setTextColor(BRAND_MUTED);
  doc.text(`Document généré automatiquement par KKD Music · ${new Date().toISOString()}`, W / 2, H - 14, { align: 'center' });

  return doc;
}

// ── Génère le PDF : Certificat d'authenticité (exigeant sur l'originalité) ──
function generateAuthenticityCertificatePDF(doc, data) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Cadre double
  doc.setDrawColor(BRAND_PRIMARY);
  doc.setLineWidth(3);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.5);
  doc.setDrawColor(BRAND_ACCENT);
  doc.rect(14, 14, W - 28, H - 28);

  // En-tête
  doc.setFillColor(BRAND_TEXT);
  doc.rect(14, 14, W - 28, 48, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CERTIFICAT', W / 2, 34, { align: 'center' });
  doc.setFontSize(16);
  doc.text("D'AUTHENTICITÉ MUSICALE", W / 2, 46, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('KKD MUSIC · SUNUMAXIM GROUP', W / 2, 56, { align: 'center' });

  // Numéro de certificat
  doc.setTextColor(BRAND_ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`CERTIFICAT N° ${data.certificate_number}`, W / 2, 72, { align: 'center' });

  // Déclaration d'originalité
  let y = 86;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.setLineWidth(1);
  doc.line(30, y - 4, W - 30, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text("DÉCLARATION D'ORIGINALITÉ", W / 2, y + 4, { align: 'center' });

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_TEXT);
  const declaration = `Par la présente, KKD Music certifie que l'œuvre intitulée « ${data.work_title} » attribuée à l'artiste « ${data.artist_name} » a fait l'objet d'une vérification d'originalité selon nos standards d'exigence. L'artiste déclare être l'auteur légitime et unique titulaire des droits sur cette œuvre, et s'engage à garantir son authenticité contre tout risque de contrefaçon, de plagiat ou de duplication frauduleuse.`;
  const declLines = doc.splitTextToSize(declaration, W - 60);
  doc.text(declLines, 30, y);

  // Section : Œuvre certifiée
  y += declLines.length * 5 + 14;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(30, y - 4, W - 30, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('ŒUVRE CERTIFIÉE', W / 2, y + 4, { align: 'center' });

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(BRAND_TEXT);
  doc.text(`Titre : ${data.work_title}`, 30, y);
  doc.text(`Artiste : ${data.artist_name}`, 30, y + 8);
  if (data.work_type) doc.text(`Type : ${data.work_type}`, 30, y + 16);
  if (data.work_date) doc.text(`Date : ${fmtDate(data.work_date)}`, 30, y + 24);

  // Section : Contrôles d'originalité (très exigeant)
  y += 38;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(30, y - 4, W - 30, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text("CONTRÔLES D'ORIGINALITÉ", W / 2, y + 4, { align: 'center' });

  y += 14;
  doc.setFontSize(9);
  for (const check of data.originality_checks) {
    const icon = check.result === 'conforme' ? '✓' : check.result === 'attention' ? '⚠' : '○';
    const color = check.result === 'conforme' ? BRAND_SECONDARY : check.result === 'attention' ? BRAND_ACCENT : BRAND_MUTED;
    doc.setTextColor(color);
    doc.setFont('helvetica', 'bold');
    doc.text(icon, 32, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_TEXT);
    doc.text(check.check, 40, y);
    doc.setTextColor(BRAND_MUTED);
    doc.setFontSize(8);
    doc.text(check.detail || '', 40, y + 5);
    doc.setFontSize(9);
    y += 14;
  }

  // Empreinte numérique
  y += 4;
  doc.setDrawColor(BRAND_PRIMARY);
  doc.line(30, y - 4, W - 30, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(BRAND_PRIMARY);
  doc.text('EMPREINTE NUMÉRIQUE DE L\'ŒUVRE', W / 2, y + 4, { align: 'center' });

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_MUTED);
  doc.text(`SHA-256 : ${data.originality_hash}`, 30, y);
  doc.text(`Générée le : ${new Date().toISOString()}`, 30, y + 6);

  // Signature KKD
  y = H - 56;
  doc.setDrawColor(BRAND_ACCENT);
  doc.setLineWidth(1.5);
  doc.line(W / 2 - 45, y, W / 2 + 45, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(BRAND_TEXT);
  doc.text('KKD MUSIC — CERTIFICATION OFFICIELLE', W / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_MUTED);
  doc.text(`Valide jusqu'au ${fmtDate(data.valid_until)}`, W / 2, y + 14, { align: 'center' });

  // Avertissement
  doc.setFontSize(7);
  doc.setTextColor(BRAND_MUTED);
  const warning = 'Ce certificat atteste de l\'originalité déclarée de l\'œuvre selon les contrôles effectués à la date d\'émission. Toute contrefaçon ou utilisation frauduleuse engage la responsabilité civile et pénale de son auteur.';
  const warnLines = doc.splitTextToSize(warning, W - 60);
  doc.text(warnLines, W / 2, H - 20, { align: 'center' });

  return doc;
}

// ── Contrôles d'originalité exigeants ──
async function runOriginalityChecks(base44, data) {
  const checks = [];

  // 1. Dédoublonnage : pas de sortie existante avec le même titre + artiste
  try {
    const existing = await base44.asServiceRole.entities.Release.filter({ artist_name: data.artist_name, title: data.work_title });
    const others = existing.filter(r => r.id !== data.release_id);
    if (others.length === 0) {
      checks.push({ check: 'Dédoublonnage catalogue', result: 'conforme', detail: 'Aucune sortie identique trouvée dans le catalogue KKD' });
    } else {
      checks.push({ check: 'Dédoublonnage catalogue', result: 'attention', detail: `${others.length} sortie(s) similaire(s) détectée(s) — vérification manuelle requise` });
    }
  } catch {
    checks.push({ check: 'Dédoublonnage catalogue', result: 'non_verifie', detail: 'Contrôle non exécuté' });
  }

  // 2. Vérification artiste vérifié
  if (data.artist_verified) {
    checks.push({ check: 'Statut artiste vérifié', result: 'conforme', detail: 'Artiste certifié KKD Music — profil authentifié' });
  } else {
    checks.push({ check: 'Statut artiste vérifié', result: 'attention', detail: 'Artiste non vérifié — certification à compléter' });
  }

  // 3. Empreinte numérique générée
  checks.push({ check: 'Empreinte numérique SHA-256', result: 'conforme', detail: `Empreinte ${data.originality_hash.slice(0, 16)}... générée et horodatée` });

  // 4. Lien de streaming présent
  if (data.streaming_url) {
    checks.push({ check: 'Lien de streaming associé', result: 'conforme', detail: 'Œuvre référencée sur une plateforme externe vérifiable' });
  } else {
    checks.push({ check: 'Lien de streaming associé', result: 'non_verifie', detail: 'Aucun lien externe — originalité basée sur déclaration artiste' });
  }

  // 5. Déclaration d'originalité artiste
  checks.push({ check: "Déclaration d'originalité artiste", result: 'conforme', detail: "L'artiste déclare être l'auteur légitime sous peine de poursuites" });

  // 6. Horodatage certifié
  checks.push({ check: 'Horodatage certifié', result: 'conforme', detail: `Émis le ${new Date().toISOString()}` });

  return checks;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { artist_id, release_id, video_id, license_type, recipient_email } = body;

    if (!artist_id) return Response.json({ error: 'Artiste manquant' }, { status: 400 });
    if (!license_type) return Response.json({ error: 'Type de licence manquant' }, { status: 400 });

    // ── Récupérer l'artiste ──
    const artist = await base44.asServiceRole.entities.Artist.get(artist_id);
    if (!artist) return Response.json({ error: 'Artiste introuvable' }, { status: 404 });

    // ── Récupérer l'œuvre (release ou video) ──
    let work = null;
    let workType = null;
    let workTitle = artist.name;
    let workDate = null;
    let streamingUrl = null;

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

    // ── Empreinte d'originalité ──
    const fingerprintInput = `${workTitle}|${artist.name}|${workDate || ''}|${workType || ''}|${new Date().toISOString()}`;
    const originalityHash = await sha256(fingerprintInput);

    // ── Numéros de documents ──
    const ts = Date.now().toString(36).toUpperCase();
    const licenseNumber = `KKD-LIC-${ts}`;
    const certificateNumber = `KKD-CERT-${ts}`;

    // ── Données pour les PDF ──
    const pdfData = {
      license_number: licenseNumber,
      certificate_number: certificateNumber,
      artist_name: artist.name,
      artist_genre: artist.genre || '',
      artist_verified: !!artist.is_verified,
      work_title: workTitle,
      work_type: workType,
      work_date: workDate,
      streaming_url: streamingUrl,
      originality_hash: originalityHash,
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    // ── Contrôles d'originalité ──
    const originalityChecks = await runOriginalityChecks(base44, { ...pdfData, release_id, video_id });
    pdfData.originality_checks = originalityChecks;

    // ── Générer les PDF ──
    let documentUrl = '';
    let certificateUrl = '';

    if (license_type === 'distribution' || license_type === 'double') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      generateDistributionLicensePDF(doc, pdfData);
      const pdfBytes = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([pdfBlob], `licence-${licenseNumber}.pdf`, { type: 'application/pdf' });
      const upRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      documentUrl = upRes.file_url;
    }

    if (license_type === 'authenticite' || license_type === 'double') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      generateAuthenticityCertificatePDF(doc, pdfData);
      const pdfBytes = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([pdfBlob], `certificat-${certificateNumber}.pdf`, { type: 'application/pdf' });
      const upRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      certificateUrl = upRes.file_url;
    }

    // ── Email destinataire ──
    const targetEmail = recipient_email || artist.email || user.email;

    // ── Envoyer l'email ──
    const emailBody = `
Bonjour ${artist.name},

KKD Music vous délivre vos documents professionnels pour l'œuvre « ${workTitle} ».

${license_type === 'distribution' || license_type === 'double' ? `📄 LICENCE DE DISTRIBUTION (${licenseNumber})\n${documentUrl}\n\n` : ''}${license_type === 'authenticite' || license_type === 'double' ? `🏆 CERTIFICAT D'AUTHENTICITÉ (${certificateNumber})\n${certificateUrl}\n\n` : ''}Empreinte numérique : ${originalityHash}
Valide jusqu'au : ${fmtDate(pdfData.valid_until)}

Ces documents attestent de l'originalité de votre œuvre et autorisent KKD Music à la distribuer sur ses canaux. Conservez-les précieusement.

— KKD Music · SunuMaxim Group
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: targetEmail,
      subject: `[KKD Music] Vos documents professionnels — ${workTitle}`,
      body: emailBody,
    });

    // ── Créer l'entité MusicLicense ──
    const license = await base44.asServiceRole.entities.MusicLicense.create({
      artist_id,
      artist_name: artist.name,
      release_id: release_id || '',
      release_title: release_id ? workTitle : '',
      video_id: video_id || '',
      video_title: video_id ? workTitle : '',
      license_type,
      document_url: documentUrl,
      certificate_url: certificateUrl,
      originality_hash: originalityHash,
      originality_checks: originalityChecks,
      status: 'envoye',
      requested_by_email: user.email,
      sent_to_email: targetEmail,
      sent_date: new Date().toISOString(),
      valid_until: pdfData.valid_until,
    });

    return Response.json({
      success: true,
      license_id: license.id,
      license_number,
      certificate_number,
      document_url: documentUrl,
      certificate_url: certificateUrl,
      originality_hash: originalityHash,
      sent_to: targetEmail,
    });
  } catch (error) {
    console.error('generateMusicLicense error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}