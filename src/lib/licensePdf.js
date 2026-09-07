import { jsPDF } from 'jspdf';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

// Brand palette (header/footer — image de marque)
const BRAND = {
  primary: '#E4622B', secondary: '#1F8A5C', accent: '#D9A441',
  bg: '#16110E', surface: '#231C18', border: '#3A302A',
  text: '#F4EDE6', textMuted: '#A6998C', textDim: '#7A6E62',
};
// Document body palette (simple, lisible, fond clair)
const DOC = {
  bg: '#FFFFFF', text: '#1B1410', textMuted: '#6F655B',
  border: '#E6DFD6', label: '#9A8E82', accent: '#B07D1F',
};

// ===== UTILITIES =====
async function fetchLogoData() {
  try {
    const res = await fetch(LOGO_URL, { mode: 'cors' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(bin)}`;
  } catch { return null; }
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

// ===== PDF HELPERS =====
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function setFill(doc, hex) { doc.setFillColor(...hexToRgb(hex)); }
function setText(doc, hex) { doc.setTextColor(...hexToRgb(hex)); }
function setDraw(doc, hex) { doc.setDrawColor(...hexToRgb(hex)); }

// ===== EN-TÊTE DE MARQUE (bande sombre + logo + accent) =====
function drawHeader(doc, logoData, title, subtitle, docNumber) {
  const W = doc.internal.pageSize.getWidth();
  // Bande sombre de marque
  setFill(doc, BRAND.bg); doc.rect(0, 0, W, 38, 'F');
  // Lignes accent de marque
  setFill(doc, BRAND.primary); doc.rect(0, 38, W, 1.5, 'F');
  setFill(doc, BRAND.accent); doc.rect(0, 39.5, W, 0.8, 'F');
  // Logo
  if (logoData) { try { doc.addImage(logoData, 'PNG', 15, 7, 22, 22); } catch {} }
  // Titre du document
  setText(doc, BRAND.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title, W / 2 + 6, 16, { align: 'center' });
  setText(doc, BRAND.accent); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(subtitle, W / 2 + 6, 23, { align: 'center' });
  // Numéro de document (à droite)
  setText(doc, BRAND.textMuted); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(docNumber, W - 15, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`Émis le ${fmtDateShort(new Date())}`, W - 15, 22, { align: 'right' });
}

// ===== PIED DE PAGE DE MARQUE (bande sombre + logo + infos) =====
function drawFooter(doc, docNumber, hash) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  // Lignes accent de marque
  setFill(doc, BRAND.accent); doc.rect(0, H - 19.5, W, 0.8, 'F');
  setFill(doc, BRAND.primary); doc.rect(0, H - 18, W, 1, 'F');
  // Bande sombre de marque
  setFill(doc, BRAND.bg); doc.rect(0, H - 18, W, 18, 'F');
  // Logo miniature
  // (pas de second logo pour éviter surcharge — texte de marque à la place)
  setText(doc, BRAND.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('KKD MUSIC', 15, H - 11);
  setText(doc, BRAND.textMuted); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.text(`Document officiel · ${docNumber}`, 15, H - 6);
  setText(doc, BRAND.textDim); doc.setFontSize(6);
  doc.text(`Empreinte SHA-256 : ${hash.slice(0, 28)}...`, 15, H - 2.5);
  setText(doc, BRAND.textMuted); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('www.kkdmusic.com', W - 15, H - 11, { align: 'right' });
  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.text(`© ${new Date().getFullYear()} KKD Music — Dakar, Sénégal`, W - 15, H - 6, { align: 'right' });
  doc.text('Tous droits réservés', W - 15, H - 2.5, { align: 'right' });
}

// ===== CORPS DU DOCUMENT (simple, lisible, fond clair) =====
function sectionTitle(doc, y, text) {
  const W = doc.internal.pageSize.getWidth();
  setDraw(doc, BRAND.primary); doc.setLineWidth(0.5); doc.line(15, y, W - 15, y);
  setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(text.toUpperCase(), 15, y + 5);
  return y + 11;
}

function infoRow(doc, y, label, value, x = 15, labelW = 48) {
  setText(doc, DOC.label); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text(label, x, y);
  setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  const valLines = doc.splitTextToSize(value, doc.internal.pageSize.getWidth() - x - labelW - 15);
  doc.text(valLines, x + labelW, y);
  return y + (valLines.length * 4.5);
}

function numberedClause(doc, y, num, text) {
  const W = doc.internal.pageSize.getWidth();
  setText(doc, DOC.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(`${num}.`, 15, y);
  setText(doc, DOC.text); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  const lines = doc.splitTextToSize(text, W - 25);
  doc.text(lines, 22, y);
  return y + (lines.length * 4.2) + 3;
}

// ===== LICENCE DE DISTRIBUTION PDF =====
function generateDistributionLicensePDF(doc, data, logoData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  // Fond clair pour tout le document
  setFill(doc, DOC.bg); doc.rect(0, 0, W, H, 'F');
  drawHeader(doc, logoData, 'LICENCE DE DISTRIBUTION', 'CONTRAT DE DISTRIBUTION MUSICALE NUMÉRIQUE', data.license_number);

  let y = 50;
  setText(doc, DOC.textMuted); doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5);
  const preamble = `Entre KKD Music, maison de disques indépendante, ci-après « le Concédant », et l'artiste ${data.artist_name}, ci-après « le Bénéficiaire », il a été convenu ce qui suit :`;
  const pl = doc.splitTextToSize(preamble, W - 30);
  doc.text(pl, 15, y); y += pl.length * 4.2 + 4;

  y = sectionTitle(doc, y, 'Article 1 — Parties');
  y = infoRow(doc, y, 'Le Concédant', 'KKD Music — Maison de disques indépendante');
  y = infoRow(doc, y, 'Siège', 'Dakar, Sénégal · www.kkdmusic.com');
  y = infoRow(doc, y, 'Le Bénéficiaire', data.artist_name);
  if (data.artist_nationality) y = infoRow(doc, y, 'Nationalité', data.artist_nationality);
  if (data.label_name) y = infoRow(doc, y, 'Label', data.label_name);
  if (data.artist_verified) {
    setText(doc, BRAND.secondary); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('✓ Artiste vérifié et certifié KKD Music', 15, y); y += 6;
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
    setText(doc, DOC.label); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Lien streaming', 15, y);
    setText(doc, DOC.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    const urlLines = doc.splitTextToSize(data.streaming_url, W - 65);
    doc.text(urlLines, 63, y); y += urlLines.length * 4 + 2;
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
  setText(doc, DOC.label); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`SHA-256 : ${data.originality_hash}`, 15, y); y += 5;
  setText(doc, DOC.textMuted); doc.setFontSize(7);
  doc.text(`Vérifiable en ligne : www.kkdmusic.com/document/${data.license_id || ''}`, 15, y);

  // Signatures
  y = H - 62;
  setText(doc, DOC.textMuted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`Fait à Dakar, le ${fmtDate(new Date())}`, 15, y);
  y += 14;
  setDraw(doc, DOC.border); doc.setLineWidth(0.4); doc.line(15, y, 80, y);
  setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('KKD MUSIC', 15, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setText(doc, DOC.textMuted);
  doc.text('Direction Artistique & Licences', 15, y + 10);
  doc.text('Cachet & Signature', 15, y + 14);
  doc.line(W - 80, y, W - 15, y);
  setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(data.artist_name, W - 80, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setText(doc, DOC.textMuted);
  doc.text('Artiste — Signature', W - 80, y + 10);
  drawFooter(doc, data.license_number, data.originality_hash);
  return doc;
}

// ===== CERTIFICAT D'AUTHENTICITÉ PDF =====
function generateAuthenticityCertificatePDF(doc, data, logoData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  // Fond clair pour tout le document
  setFill(doc, DOC.bg); doc.rect(0, 0, W, H, 'F');
  drawHeader(doc, logoData, "CERTIFICAT D'AUTHENTICITÉ", "CERTIFICATION OFFICIELLE D'ORIGINALITÉ MUSICALE", data.certificate_number);

  let y = 52;
  setText(doc, BRAND.primary); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text("DÉCLARATION D'ORIGINALITÉ", W / 2, y, { align: 'center' }); y += 8;

  setText(doc, DOC.text); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
  const declaration = `Par la présente, KKD Music certifie que l'œuvre intitulée « ${data.work_title} » attribuée à l'artiste « ${data.artist_name} » a fait l'objet d'une vérification d'originalité selon nos standards d'exigence. L'artiste déclare être l'auteur légitime et unique titulaire des droits d'auteur sur cette œuvre, et s'engage à garantir son authenticité contre tout risque de contrefaçon, de plagiat ou de duplication frauduleuse.`;
  const declLines = doc.splitTextToSize(declaration, W - 40);
  doc.text(declLines, 20, y); y += declLines.length * 4.5 + 6;

  y = sectionTitle(doc, y, 'Œuvre certifiée');
  y = infoRow(doc, y, 'Titre', data.work_title, 20, 45);
  y = infoRow(doc, y, 'Artiste', data.artist_name, 20, 45);
  if (data.work_type) y = infoRow(doc, y, 'Type', data.work_type, 20, 45);
  y = infoRow(doc, y, 'Code ISRC', data.isrc, 20, 45);
  if (data.label_name) y = infoRow(doc, y, 'Label', data.label_name, 20, 45);
  if (data.work_date) y = infoRow(doc, y, 'Date', fmtDate(data.work_date), 20, 45);
  y += 4;

  y = sectionTitle(doc, y, "Contrôles d'originalité effectués");
  for (const check of (data.originality_checks || [])) {
    const icon = check.result === 'conforme' ? '✓' : check.result === 'attention' ? '⚠' : '○';
    const color = check.result === 'conforme' ? BRAND.secondary : check.result === 'attention' ? BRAND.accent : DOC.textMuted;
    setText(doc, color); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(icon, 20, y);
    setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(check.check, 27, y);
    setText(doc, DOC.textMuted); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(check.detail || '', 27, y + 3.5); y += 9;
  }
  y += 4;

  y = sectionTitle(doc, y, 'Empreinte numérique de l\'œuvre');
  setText(doc, DOC.label); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`SHA-256 : ${data.originality_hash}`, 20, y); y += 5;
  setText(doc, DOC.textMuted); doc.text(`Générée le ${new Date().toISOString()}`, 20, y); y += 5;
  setText(doc, DOC.textMuted); doc.text(`Valide jusqu'au ${fmtDate(data.valid_until)}`, 20, y);

  // Sceau
  const sealX = W / 2, sealY = H - 58;
  setDraw(doc, BRAND.accent); doc.setLineWidth(1.5); doc.circle(sealX, sealY, 16);
  doc.setLineWidth(0.5); doc.circle(sealX, sealY, 13);
  setText(doc, BRAND.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('KKD MUSIC', sealX, sealY - 4, { align: 'center' });
  doc.setFontSize(5);
  doc.text('CERTIFICATION OFFICIELLE', sealX, sealY + 1, { align: 'center' });
  doc.text(`N° ${data.certificate_number.slice(-8)}`, sealX, sealY + 6, { align: 'center' });

  // Signature
  const sigY = H - 40;
  setDraw(doc, DOC.border); doc.setLineWidth(0.4); doc.line(W / 2 - 40, sigY, W / 2 + 40, sigY);
  setText(doc, DOC.text); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('KKD MUSIC', W / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setText(doc, DOC.textMuted);
  doc.text('Direction de la Certification', W / 2, sigY + 10, { align: 'center' });
  doc.text(`Fait à Dakar, le ${fmtDate(new Date())}`, W / 2, sigY + 15, { align: 'center' });
  drawFooter(doc, data.certificate_number, data.originality_hash);
  return doc;
}

// ===== PUBLIC API =====
export { sha256, genLicenseNumber, genCertificateNumber, genISRC, fetchLogoData };

export function docToBlobUrl(doc) {
  const pdfBytes = doc.output('arraybuffer');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export async function generatePdfBlobs(pdfData, licenseType) {
  const logoData = await fetchLogoData();
  const result = {};
  if (licenseType === 'distribution' || licenseType === 'double') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    generateDistributionLicensePDF(doc, pdfData, logoData);
    result.license_url = docToBlobUrl(doc);
  }
  if (licenseType === 'authenticite' || licenseType === 'double') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    generateAuthenticityCertificatePDF(doc, pdfData, logoData);
    result.certificate_url = docToBlobUrl(doc);
  }
  return result;
}

export async function buildPdfDataFromBackend(resData) {
  return {
    license_number: resData.license_number,
    certificate_number: resData.certificate_number,
    isrc: resData.isrc,
    artist_name: resData.artist_name,
    artist_genre: resData.artist_genre || '',
    artist_verified: !!resData.artist_verified,
    artist_nationality: resData.artist_nationality || '',
    label_name: resData.label_name || '',
    work_title: resData.work_title,
    work_type: resData.work_type || '',
    work_date: resData.work_date || '',
    streaming_url: resData.streaming_url || '',
    originality_hash: resData.originality_hash,
    originality_checks: resData.originality_checks || [],
    valid_until: resData.valid_until,
    license_id: resData.license_id || '',
  };
}