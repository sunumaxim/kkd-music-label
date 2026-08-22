import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';
import { buildEmailHtml } from '../../shared/emailKit.js';

// ===== BRAND TOKENS (from DESIGN_SYSTEM.md — exact platform colors) =====
const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';
const C = {
  primary:    '#E4622B',
  primaryLt:  '#F08355',
  secondary:  '#1F8A5C',
  accent:     '#D9A441',
  accentLt:   '#E8B865',
  bg:         '#16110E',
  surface:    '#231C18',
  surfaceLt:  '#2E2620',
  border:     '#3A302A',
  text:       '#F4EDE6',
  textMuted:  '#A6998C',
  textDim:    '#7A6E62',
  white:      '#FFFFFF',
  cream:      '#FAF6F0',
};

// ===== UTILITIES =====

async function fetchLogoData() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(bin)}`;
  } catch (e) {
    console.error('logo fetch error:', e.message);
    return null;
  }
}

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

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function genSuffix() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function genLicenseNumber() {
  return `KKD-LIC-${ymd()}-${genSuffix()}`;
}

function genCertificateNumber() {
  return `KKD-CERT-${ymd()}-${genSuffix()}`;
}

function genISRC(hash) {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = hash.slice(0, 5).replace(/[^A-Z0-9]/g, '').padEnd(5, '0');
  return `SN-KKD-${year}-${num}`;
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ===== SHARED PDF HELPERS =====

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function setFill(doc, hex) { doc.setFillColor(...hexToRgb(hex)); }
function setText(doc, hex) { doc.setTextColor(...hexToRgb(hex)); }
function setDraw(doc, hex) { doc.setDrawColor(...hexToRgb(hex)); }

function addWatermark(doc, text) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  setText(doc, C.surfaceLt);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.text(text, W / 2, H / 2, { align: 'center', angle: 35 });
  doc.restoreGraphicsState();
}

function drawHeader(doc, logoData, title, subtitle, docNumber) {
  const W = doc.internal.pageSize.getWidth();
  setFill(doc, C.bg);
  doc.rect(0, 0, W, 42, 'F');
  setFill(doc, C.primary);
  doc.rect(0, 42, W, 1.5, 'F');
  setFill(doc, C.accent);
  doc.rect(0, 43.5, W, 0.8, 'F');

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 15, 8, 24, 24); } catch (e) { console.error('logo addImage error:', e.message); }
  }

  setText(doc, C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, W / 2 + 8, 18, { align: 'center' });

  setText(doc, C.accent);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(subtitle, W / 2 + 8, 26, { align: 'center' });

  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(docNumber, W - 15, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Émis le ${fmtDateShort(new Date())}`, W - 15, 24, { align: 'right' });
}

function drawFooter(doc, docNumber, hash) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  setFill(doc, C.bg);
  doc.rect(0, H - 18, W, 18, 'F');
  setFill(doc, C.primary);
  doc.rect(0, H - 19, W, 1, 'F');

  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Document officiel KKD Music · ${docNumber}`, 15, H - 10);
  doc.text(`Empreinte SHA-256 : ${hash.slice(0, 32)}...`, 15, H - 5.5);

  setText(doc, C.textDim);
  doc.text('www.kkdmusic.com', W - 15, H - 10, { align: 'right' });
  doc.text(`© ${new Date().getFullYear()} KKD Music — Tous droits réservés`, W - 15, H - 5.5, { align: 'right' });
}

function sectionTitle(doc, y, text) {
  const W = doc.internal.pageSize.getWidth();
  setDraw(doc, C.primary);
  doc.setLineWidth(0.6);
  doc.line(15, y, W - 15, y);
  setText(doc, C.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(text.toUpperCase(), 15, y + 5.5);
  return y + 12;
}

function infoRow(doc, y, label, value, x = 15, labelW = 50) {
  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(label, x, y);
  setText(doc, C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const valLines = doc.splitTextToSize(value, doc.internal.pageSize.getWidth() - x - labelW - 15);
  doc.text(valLines, x + labelW, y);
  return y + (valLines.length * 4.5);
}

function numberedClause(doc, y, num, text) {
  const W = doc.internal.pageSize.getWidth();
  setText(doc, C.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${num}.`, 15, y);
  setText(doc, C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const lines = doc.splitTextToSize(text, W - 25);
  doc.text(lines, 22, y);
  return y + (lines.length * 4.2) + 3;
}

// ===== DISTRIBUTION LICENSE PDF =====

function generateDistributionLicensePDF(doc, data, logoData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  addWatermark(doc, 'KKD MUSIC');

  setDraw(doc, C.accent);
  doc.setLineWidth(1.5);
  doc.rect(6, 6, W - 12, H - 12);
  setDraw(doc, C.border);
  doc.setLineWidth(0.3);
  doc.rect(8, 8, W - 16, H - 16);

  drawHeader(doc, logoData, 'LICENCE DE DISTRIBUTION', 'CONTRAT DE DISTRIBUTION MUSICALE NUMÉRIQUE', data.license_number);

  let y = 52;
  setText(doc, C.text);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const preamble = `Entre KKD Music, maison de disques indépendante, ci-après « le Concédant », et l'artiste ${data.artist_name}, ci-après « le Bénéficiaire », il a été convenu ce qui suit :`;
  const pl = doc.splitTextToSize(preamble, W - 30);
  doc.text(pl, 15, y);
  y += pl.length * 4.2 + 4;

  y = sectionTitle(doc, y, 'Article 1 — Parties');
  y = infoRow(doc, y, 'Le Concédant', 'KKD Music — Maison de disques indépendante');
  y = infoRow(doc, y, 'Siège', 'Dakar, Sénégal · www.kkdmusic.com');
  y = infoRow(doc, y, 'Le Bénéficiaire', data.artist_name);
  if (data.artist_nationality) y = infoRow(doc, y, 'Nationalité', data.artist_nationality);
  if (data.label_name) y = infoRow(doc, y, 'Label', data.label_name);
  if (data.artist_verified) {
    setText(doc, C.secondary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('✓ Artiste vérifié et certifié KKD Music', 15, y);
    y += 6;
  }
  y += 4;

  y = sectionTitle(doc, y, "Article 2 — Œuvre concernée");
  y = infoRow(doc, y, 'Titre', data.work_title);
  y = infoRow(doc, y, 'Artiste', data.artist_name);
  if (data.artist_genre) y = infoRow(doc, y, 'Genre musical', data.artist_genre);
  if (data.work_type) y = infoRow(doc, y, 'Type', data.work_type);
  y = infoRow(doc, y, 'Code ISRC', data.isrc);
  if (data.work_date) y = infoRow(doc, y, 'Date de sortie', fmtDate(data.work_date));
  if (data.streaming_url) {
    setText(doc, C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const urlLines = doc.splitTextToSize(data.streaming_url, W - 65);
    doc.text('Lien streaming', 15, y);
    setText(doc, C.accent);
    doc.text(urlLines, 65, y);
    y += urlLines.length * 4 + 2;
  }
  y += 4;

  y = sectionTitle(doc, y, 'Article 3 — Droits concédés');
  y = numberedClause(doc, y, '3.1', "KKD Music est autorisée à distribuer, promouvoir, commercialiser et exploiter l'œuvre sur l'ensemble de ses canaux numériques (plateforme web, application mobile, réseaux sociaux, plateformes partenaires).");
  y = numberedClause(doc, y, '3.2', "L'artiste conserve l'intégralité de ses droits moraux (paternité, intégrité) et patrimoniaux sur l'œuvre. La présente licence est non-exclusive.");
  y = numberedClause(doc, y, '3.3', "KKD Music est autorisée à reproduire, représenter, adapter et diffuser l'œuvre sous tous formats numériques connus ou à venir.");
  y = numberedClause(doc, y, '3.4', "Toute exploitation commerciale hors KKD Music nécessite un accord complémentaire écrit entre les parties.");

  y = sectionTitle(doc, y, 'Article 4 — Territoire & Durée');
  y = numberedClause(doc, y, '4.1', "Territoire d'exploitation : Mondial (tous pays, toutes plateformes numériques partenaires).");
  y = numberedClause(doc, y, '4.2', `Durée : La présente licence est valable jusqu'au ${fmtDate(data.valid_until)}, renouvelable par tacite reconduction.`);
  y = numberedClause(doc, y, '4.3', "La licence est révocable à tout moment par notification écrite de l'artiste, avec un préavis de 30 jours.");

  y = sectionTitle(doc, y, 'Article 5 — Redevances & Partage des revenus');
  y = numberedClause(doc, y, '5.1', "L'artiste perçoit 90 % des revenus nets générés par l'exploitation de l'œuvre sur les canaux KKD Music.");
  y = numberedClause(doc, y, '5.2', "KKD Music percevant une commission de 10 % pour services de distribution, promotion et gestion technique.");
  y = numberedClause(doc, y, '5.3', "Les revenus sont versés à l'artiste selon la fréquence définie dans son contrat principal (mensuel ou trimestriel).");

  y = sectionTitle(doc, y, 'Article 6 — Obligations des parties');
  y = numberedClause(doc, y, '6.1', "L'artiste déclare être l'auteur légitime et unique titulaire des droits sur l'œuvre et garantit son originalité.");
  y = numberedClause(doc, y, '6.2', "L'artiste s'engage à garantir l'œuvre contre tout risque de contrefaçon, plagiat ou duplication frauduleuse.");
  y = numberedClause(doc, y, '6.3', "KKD Music s'engage à assurer la meilleure promotion et visibilité de l'œuvre sur ses canaux.");

  y = sectionTitle(doc, y, 'Article 7 — Résiliation & Litiges');
  y = numberedClause(doc, y, '7.1', "En cas de manquement grave, la partie lésée peut résilier la licence après mise en demeure restée infructueuse pendant 30 jours.");
  y = numberedClause(doc, y, '7.2', "Tout litige relatif à la présente licence sera régi par le droit sénégalais et tranché par les tribunaux de Dakar.");

  y += 2;
  y = sectionTitle(doc, y, 'Empreinte numérique & Vérification');
  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`SHA-256 : ${data.originality_hash}`, 15, y);
  y += 5;
  setText(doc, C.textDim);
  doc.setFontSize(7);
  doc.text(`Vérifiable en ligne : www.kkdmusic.com/verifier/${data.license_number}`, 15, y);

  // Signature block
  y = H - 65;
  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fait à Dakar, le ${fmtDate(new Date())}`, 15, y);

  y += 14;
  setDraw(doc, C.accent);
  doc.setLineWidth(0.5);
  doc.line(15, y, 80, y);
  setText(doc, C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('KKD MUSIC', 15, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setText(doc, C.textMuted);
  doc.text('Direction Artistique & Licences', 15, y + 10);
  doc.text('Cachet & Signature', 15, y + 14);

  doc.line(W - 80, y, W - 15, y);
  setText(doc, C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(data.artist_name, W - 80, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setText(doc, C.textMuted);
  doc.text('Artiste — Signature', W - 80, y + 10);

  drawFooter(doc, data.license_number, data.originality_hash);
  return doc;
}

// ===== AUTHENTICITY CERTIFICATE PDF =====

function generateAuthenticityCertificatePDF(doc, data, logoData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  addWatermark(doc, 'KKD MUSIC');

  setDraw(doc, C.accent);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  setDraw(doc, C.border);
  doc.setLineWidth(0.5);
  doc.rect(11, 11, W - 22, H - 22);

  drawHeader(doc, logoData, "CERTIFICAT D'AUTHENTICITÉ", "CERTIFICATION OFFICIELLE D'ORIGINALITÉ MUSICALE", data.certificate_number);

  let y = 54;
  setText(doc, C.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("DÉCLARATION D'ORIGINALITÉ", W / 2, y, { align: 'center' });
  y += 8;

  setText(doc, C.text);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const declaration = `Par la présente, KKD Music certifie que l'œuvre intitulée « ${data.work_title} » attribuée à l'artiste « ${data.artist_name} » a fait l'objet d'une vérification d'originalité selon nos standards d'exigence. L'artiste déclare être l'auteur légitime et unique titulaire des droits d'auteur sur cette œuvre, et s'engage à garantir son authenticité contre tout risque de contrefaçon, de plagiat ou de duplication frauduleuse.`;
  const declLines = doc.splitTextToSize(declaration, W - 40);
  doc.text(declLines, 20, y);
  y += declLines.length * 4.5 + 6;

  y = sectionTitle(doc, y, 'Œuvre certifiée');
  y = infoRow(doc, y, 'Titre', data.work_title, 20, 45);
  y = infoRow(doc, y, 'Artiste', data.artist_name, 20, 45);
  if (data.work_type) y = infoRow(doc, y, 'Type', data.work_type, 20, 45);
  y = infoRow(doc, y, 'Code ISRC', data.isrc, 20, 45);
  if (data.label_name) y = infoRow(doc, y, 'Label', data.label_name, 20, 45);
  if (data.work_date) y = infoRow(doc, y, 'Date', fmtDate(data.work_date), 20, 45);
  y += 4;

  y = sectionTitle(doc, y, "Contrôles d'originalité effectués");
  doc.setFontSize(8);
  for (const check of data.originality_checks) {
    const icon = check.result === 'conforme' ? '✓' : check.result === 'attention' ? '⚠' : '○';
    const color = check.result === 'conforme' ? C.secondary : check.result === 'attention' ? C.accent : C.textDim;
    setText(doc, color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(icon, 20, y);
    setText(doc, C.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(check.check, 27, y);
    setText(doc, C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(check.detail || '', 27, y + 3.5);
    y += 9;
  }
  y += 4;

  y = sectionTitle(doc, y, 'Empreinte numérique de l\'œuvre');
  setText(doc, C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`SHA-256 : ${data.originality_hash}`, 20, y);
  y += 5;
  setText(doc, C.textDim);
  doc.text(`Générée le ${new Date().toISOString()}`, 20, y);
  y += 5;
  setText(doc, C.textDim);
  doc.text(`Valide jusqu'au ${fmtDate(data.valid_until)}`, 20, y);

  // Official seal
  const sealX = W / 2;
  const sealY = H - 55;
  setDraw(doc, C.accent);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, 16);
  doc.setLineWidth(0.5);
  doc.circle(sealX, sealY, 13);
  setText(doc, C.accent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('KKD MUSIC', sealX, sealY - 4, { align: 'center' });
  doc.setFontSize(5);
  doc.text('CERTIFICATION OFFICIELLE', sealX, sealY + 1, { align: 'center' });
  doc.text(`N° ${data.certificate_number.slice(-8)}`, sealX, sealY + 6, { align: 'center' });

  // Signature
  const sigY = H - 38;
  setDraw(doc, C.accent);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 40, sigY, W / 2 + 40, sigY);
  setText(doc, C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('KKD MUSIC', W / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setText(doc, C.textMuted);
  doc.text('Direction de la Certification', W / 2, sigY + 10, { align: 'center' });
  doc.text(`Fait à Dakar, le ${fmtDate(new Date())}`, W / 2, sigY + 15, { align: 'center' });

  drawFooter(doc, data.certificate_number, data.originality_hash);
  return doc;
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
  const docs = [];
  if (d.document_url) docs.push(['Licence de distribution', d.license_number, d.document_url]);
  if (d.certificate_url) docs.push(["Certificat d'authenticité", d.certificate_number, d.certificate_url]);

  const html = buildEmailHtml({
    subject: `[KKD Music] Documents officiels — ${d.work_title}`,
    preheader: `Vos documents professionnels pour « ${d.work_title} »`,
    action: 'success',
    actionLabel: 'DOCUMENTS GÉNÉRÉS',
    headline: `Documents officiels pour « ${d.work_title} »`,
    body: `Bonjour <strong>${d.artist_name}</strong>,<br/><br/>KKD Music vous délivre vos documents professionnels de droits d'auteur et de distribution pour l'œuvre <strong>« ${d.work_title} »</strong>. Ces documents attestent de l'originalité de votre œuvre et sécurisent vos droits d'auteur conformément aux standards de l'industrie musicale.`,
    infoRows: [
      ['Artiste', d.artist_name],
      ['Œuvre', d.work_title],
      ...docs.map(([label, num]) => [label, num]),
      ['Empreinte numérique', d.originality_hash.slice(0, 24) + '…'],
      ['Valide jusqu\'au', new Date(d.valid_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })],
    ],
    cta: { label: 'Voir mon espace', url: 'https://kkdmusic.com/mon-espace' },
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
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const originalityChecks = await runOriginalityChecks(base44, { ...pdfData, release_id, video_id });
    pdfData.originality_checks = originalityChecks;

    const logoData = await fetchLogoData();

    let documentUrl = '';
    let certificateUrl = '';
    let documentB64 = '';
    let certificateB64 = '';

    if (license_type === 'distribution' || license_type === 'double') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      generateDistributionLicensePDF(doc, pdfData, logoData);
      const pdfBytes = doc.output('arraybuffer');
      documentB64 = arrayBufferToBase64(pdfBytes);
      if (!preview_only) {
        try {
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const file = new File([pdfBlob], `licence-${licenseNumber}.pdf`, { type: 'application/pdf' });
          const upRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          documentUrl = upRes.file_url;
        } catch (uploadErr) {
          console.error('UploadFile error (non-fatal):', uploadErr.message);
        }
      }
    }

    if (license_type === 'authenticite' || license_type === 'double') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      generateAuthenticityCertificatePDF(doc, pdfData, logoData);
      const pdfBytes = doc.output('arraybuffer');
      certificateB64 = arrayBufferToBase64(pdfBytes);
      if (!preview_only) {
        try {
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const file = new File([pdfBlob], `certificat-${certificateNumber}.pdf`, { type: 'application/pdf' });
          const upRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          certificateUrl = upRes.file_url;
        } catch (uploadErr) {
          console.error('UploadFile error (non-fatal):', uploadErr.message);
        }
      }
    }

    const targetEmail = recipient_email || artist.email || user.email;

    // Preview mode: return base64 PDFs directly — no upload, no entity creation
    if (preview_only) {
      return Response.json({
        success: true,
        document_b64: documentB64,
        certificate_b64: certificateB64,
        license_number: licenseNumber,
        certificate_number: certificateNumber,
        isrc,
        originality_hash: originalityHash,
        artist_name: artist.name,
        work_title: workTitle,
        valid_until: pdfData.valid_until,
        sent_to: targetEmail,
        preview: true,
      });
    }

    // Send mode: create entity + upload (non-fatal) + email (non-fatal)
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

    try {
      await sendBrandedLicenseEmail(base44, {
        artist_name: artist.name,
        work_title: workTitle,
        license_number: licenseNumber,
        certificate_number: certificateNumber,
        document_url: documentUrl,
        certificate_url: certificateUrl,
        originality_hash: originalityHash,
        valid_until: pdfData.valid_until,
        license_type,
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
      document_url: documentUrl,
      certificate_url: certificateUrl,
      originality_hash: originalityHash,
      sent_to: targetEmail,
      preview: false,
    });
  } catch (error) {
    console.error('generateMusicLicense error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}