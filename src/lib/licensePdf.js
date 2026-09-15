import { jsPDF } from 'jspdf';

// Logo officiel KKD Music (fourni par la marque)
const LOGO_URL = 'https://media.base44.com/images/public/6a1cbc29f199c6e829efde07/024af26bb_InShot_20260907_090958170.png';
// Cachet électronique & Signature officielle — Madou Kane (PDG & Fondateur KKD Music)
const SIGNATURE_URL = 'https://media.base44.com/images/public/6a1cbc29f199c6e829efde07/dcbcb9b1a_InShot_20260722_181043759.jpg';

// Palette institutionnelle KKD Music
const BRAND = {
  headerRed: '#8B1515',       // Rougeâtre officiel / bordeaux prestigieux
  headerRedDark: '#6B0F0F',   // Teinte sombre pour dégradé / profondeur
  accentRed: '#B91C1C',       // Rouge éclatant de soulignement
  gold: '#D4AF37',            // Or noble (cadres & bordures d'authenticité)
  goldLight: '#FDE68A',       // Or doux pour sous-titres
  goldDark: '#997316',        // Or antique
  bgWhite: '#FFFFFF',         // Fond net & immaculé
  surfaceLight: '#F8FAFC',    // Fond doux des encarts
  surfaceRedLight: '#FFF5F5', // Fond teinté du texte juridique
  borderRed: '#991B1B',       // Bordure cadre principal
  borderRedLight: '#FCA5A5',  // Bordure encart légal
  borderSoft: '#E2E8F0',      // Bordure discrète
  borderGold: '#D4AF37',      // Cadre intérieur or
  textDark: '#0F172A',        // Texte principal haute lisibilité
  textMuted: '#475569',       // Texte secondaire
  textDim: '#64748B',         // Métadonnées secondaires
  greenCert: '#15803D',       // Vert vérifié conforme
};

// ===== UTILITIES =====
async function fetchImageAsDataUrl(url, mime = 'image/png') {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(bin)}`;
  } catch { return null; }
}

async function fetchLogoData() { return fetchImageAsDataUrl(LOGO_URL, 'image/png'); }
async function fetchSignatureData() { return fetchImageAsDataUrl(SIGNATURE_URL, 'image/jpeg'); }

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

// ===== PDF DRAW HELPERS =====
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function setFill(doc, hex) { doc.setFillColor(...hexToRgb(hex)); }
function setText(doc, hex) { doc.setTextColor(...hexToRgb(hex)); }
function setDraw(doc, hex) { doc.setDrawColor(...hexToRgb(hex)); }

// ===== 1. LE CADRE OFFICIEL DU DOCUMENT =====
function drawDocumentCadre(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Cadre extérieur — Rougeâtre noble (0.8 mm)
  setDraw(doc, BRAND.headerRed);
  doc.setLineWidth(0.8);
  doc.rect(6, 6, W - 12, H - 12, 'D');

  // Cadre intérieur — Filet d'or noble (0.3 mm)
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.3);
  doc.rect(7.6, 7.6, W - 15.2, H - 15.2, 'D');

  // Ornements d'angle (coins de sécurité institutionnels)
  const cornerSize = 4;
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.6);
  // Coin haut-gauche
  doc.line(7.6, 7.6 + cornerSize, 7.6 + cornerSize, 7.6);
  // Coin haut-droit
  doc.line(W - 7.6 - cornerSize, 7.6, W - 7.6, 7.6 + cornerSize);
  // Coin bas-gauche
  doc.line(7.6, H - 7.6 - cornerSize, 7.6 + cornerSize, H - 7.6);
  // Coin bas-droit
  doc.line(W - 7.6 - cornerSize, H - 7.6, W - 7.6, H - 7.6 - cornerSize);
}

// ===== 2. L'EN-TÊTE ROUGEÂTRE (LISIBLE, PRESTIGIEUX) =====
function drawHeader(doc, logoData, title, subtitle, docNumber, dateStr = fmtDate(new Date())) {
  const W = doc.internal.pageSize.getWidth();
  const HEADER_X = 8.5;
  const HEADER_Y = 8.5;
  const HEADER_W = W - 17;
  const HEADER_H = 32;

  // Fond principal en-tête — Rougeâtre officiel élégant
  setFill(doc, BRAND.headerRed);
  doc.rect(HEADER_X, HEADER_Y, HEADER_W, HEADER_H, 'F');

  // Filets inférieurs (or noble + rouge profond)
  setFill(doc, BRAND.gold);
  doc.rect(HEADER_X, HEADER_Y + HEADER_H, HEADER_W, 1, 'F');
  setFill(doc, BRAND.accentRed);
  doc.rect(HEADER_X, HEADER_Y + HEADER_H + 1, HEADER_W, 0.6, 'F');

  // Logo officiel KKD Music (gauche)
  let textStartX = HEADER_X + 8;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', HEADER_X + 5, HEADER_Y + 5.5, 30, 13);
      textStartX = HEADER_X + 40;
    } catch {}
  } else {
    setText(doc, '#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KKD MUSIC', HEADER_X + 6, HEADER_Y + 14);
    setText(doc, BRAND.goldLight);
    doc.setFontSize(7);
    doc.text('LABEL GROUP', HEADER_X + 6, HEADER_Y + 20);
    textStartX = HEADER_X + 38;
  }

  // Titre principal du document (centré avec prestance)
  setText(doc, '#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text(title, W / 2 + 6, HEADER_Y + 13, { align: 'center' });

  // Sous-titre doré / crème doux
  setText(doc, BRAND.goldLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(subtitle, W / 2 + 6, HEADER_Y + 20, { align: 'center' });

  // Bloc de référence à droite (numéro + date)
  const rightX = HEADER_X + HEADER_W - 6;
  setText(doc, '#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(docNumber, rightX, HEADER_Y + 11.5, { align: 'right' });

  setText(doc, '#FEE2E2');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Délivré le ${dateStr}`, rightX, HEADER_Y + 17, { align: 'right' });

  setText(doc, BRAND.goldLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('RÉPUBLIQUE DU SÉNÉGAL', rightX, HEADER_Y + 22.5, { align: 'right' });
}

// ===== 3. ENCADRÉ DU TEXTE JURIDIQUE (DROITS D'AUTEUR & AUTHENTICITÉ) =====
function drawLegalNotice(doc, y) {
  const W = doc.internal.pageSize.getWidth();
  const boxX = 11;
  const boxW = W - 22;
  const boxH = 14;

  // Fond rosé très léger & épuré
  setFill(doc, BRAND.surfaceRedLight);
  doc.rect(boxX, y, boxW, boxH, 'F');

  // Bordure fine
  setDraw(doc, BRAND.borderRedLight);
  doc.setLineWidth(0.35);
  doc.rect(boxX, y, boxW, boxH, 'D');

  // Barre d'accent rouge sur la gauche
  setFill(doc, BRAND.headerRed);
  doc.rect(boxX, y, 1.6, boxH, 'F');

  // Titre juridique
  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text("AVIS JURIDIQUE & PROTECTION DES DROITS D'AUTEUR — LOI N° 2008-09", boxX + 4, y + 4.2);

  // Corps du texte juridique concis et précis
  setText(doc, BRAND.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  const legalText = "Document officiel attestant de l'authenticité de l'œuvre musicale, de la titularité des droits moraux et patrimoniaux et de l'intégrité du master audio/vidéo conformément à la législation internationale sur la propriété intellectuelle (OMPI/BSDA). L'empreinte numérique SHA-256 et l'horodatage enregistrés au registre officiel KKD Music font foi. Toute contrefaçon, reproduction non autorisée ou exploitation illicite expose le contrevenant à des poursuites judiciaires.";
  const lines = doc.splitTextToSize(legalText, boxW - 8);
  doc.text(lines, boxX + 4, y + 8);

  return y + boxH + 4;
}

// ===== 4. PIED DE PAGE PRESTIGIEUX =====
function drawFooter(doc, logoData, docNumber, hash) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const FOOTER_H = 17;
  const FOOTER_Y = H - 25;
  const FOOTER_X = 8.5;
  const FOOTER_W = W - 17;

  // Ligne d'accent supérieure
  setFill(doc, BRAND.gold);
  doc.rect(FOOTER_X, FOOTER_Y - 0.8, FOOTER_W, 0.5, 'F');
  setFill(doc, BRAND.headerRed);
  doc.rect(FOOTER_X, FOOTER_Y - 0.3, FOOTER_W, 0.4, 'F');

  // Bande de pied de page sobre et élégante
  setFill(doc, '#181113');
  doc.rect(FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H, 'F');

  // Gauche : Logo ou mention de marque
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', FOOTER_X + 4, FOOTER_Y + 3.5, 18, 7.5);
    } catch {}
  }
  setText(doc, '#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('KKD MUSIC LABEL GROUP', FOOTER_X + 24, FOOTER_Y + 7);
  setText(doc, '#94A3B8');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Plateforme de distribution & gestion des droits artistiques · kkdmusic.com', FOOTER_X + 24, FOOTER_Y + 11.5);

  // Centre/Droite : Empreinte SHA-256 & Copyright
  const rightX = FOOTER_X + FOOTER_W - 4;
  setText(doc, BRAND.goldLight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`N° Réf : ${docNumber}`, rightX, FOOTER_Y + 6.5, { align: 'right' });

  setText(doc, '#CBD5E1');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Empreinte SHA-256 : ${(hash || '').slice(0, 30)}...`, rightX, FOOTER_Y + 11, { align: 'right' });

  setText(doc, '#94A3B8');
  doc.setFontSize(6);
  doc.text(`© ${new Date().getFullYear()} KKD Music — Dakar, Sénégal · Tous droits réservés`, rightX, FOOTER_Y + 14.5, { align: 'right' });
}

// ===== 5. CACHET ÉLECTRONIQUE ET SIGNATURE (MADOU KANE) =====
/**
 * Pose le cachet électronique et la signature officielle de Madou Kane
 * avec son titre de PDG, propre, net et parfaitement centré ou posé.
 */
function drawOfficialStampAndSignature(doc, signatureData, x, y, width = 46, height = 21, showRole = true) {
  // 1. Image du cachet électronique avec signature et nom
  if (signatureData) {
    try {
      doc.addImage(signatureData, 'JPEG', x, y, width, height);
    } catch {
      // Fallback textuel de sécurité
      setDraw(doc, BRAND.headerRed);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, width, height, 2, 2, 'D');
    }
  }

  // 2. Filet de signature
  const lineY = y + height + 1.5;
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.4);
  doc.line(x, lineY, x + width, lineY);

  if (showRole) {
    // 3. Mentions sous le cachet
    setText(doc, BRAND.textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Madou Kane', x + width / 2, lineY + 4.5, { align: 'center' });

    setText(doc, BRAND.headerRed);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Président Directeur Général (PDG) & Fondateur', x + width / 2, lineY + 8.5, { align: 'center' });

    setText(doc, BRAND.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text('KKD Music Label Group · Direction Générale', x + width / 2, lineY + 12, { align: 'center' });

    setText(doc, BRAND.textDim);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.2);
    doc.text('Cachet officiel & signature certifiée apposés', x + width / 2, lineY + 15.5, { align: 'center' });
  }

  return lineY + 18;
}

// ===== 6. GÉNÉRATION DU CERTIFICAT D'AUTHENTICITÉ PDF =====
function generateAuthenticityCertificatePDF(doc, data, logoData, signatureData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Fond blanc immaculé
  setFill(doc, BRAND.bgWhite);
  doc.rect(0, 0, W, H, 'F');

  // Cadre officiel prestigieux
  drawDocumentCadre(doc);

  // En-tête rougeâtre
  drawHeader(
    doc,
    logoData,
    "CERTIFICAT D'AUTHENTICITÉ",
    "CERTIFICATION OFFICIELLE D'ORIGINALITÉ MUSICALE & PROPRIÉTÉ INTELLECTUELLE",
    data.certificate_number,
    fmtDate(data.work_date || new Date())
  );

  // Encart juridique droits d'auteur
  let y = drawLegalNotice(doc, 44);

  // ── DÉCLARATION SOLENNELLE D'AUTHENTICITÉ ──
  const declBoxX = 11;
  const declBoxW = W - 22;
  setFill(doc, '#F8FAFC');
  setDraw(doc, BRAND.borderSoft);
  doc.setLineWidth(0.3);
  doc.rect(declBoxX, y, declBoxW, 20, 'FD');

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("DÉCLARATION SOLENNELLE D'AUTHENTICITÉ", declBoxX + 4, y + 5);

  setText(doc, BRAND.textDark);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.6);
  const declText = `Par la présente, la direction de KKD Music certifie et atteste que l'œuvre intitulée « ${data.work_title || 'Œuvre Musicale'} », interprétée et créée par l'artiste « ${data.artist_name || 'Artiste'} », a fait l'objet d'un audit de conformité et d'authenticité rigoureux. L'artiste est légitimement reconnu unique titulaire des droits d'auteur moraux et patrimoniaux sur le master déposé, garanti libre de tout plagiat, contrefaçon ou atteinte aux tiers.`;
  const declLines = doc.splitTextToSize(declText, declBoxW - 8);
  doc.text(declLines, declBoxX + 4, y + 9.5);

  y += 24;

  // ── TABLEAU DÉTAILLÉ DE L'ŒUVRE CERTIFIÉE ──
  setDraw(doc, BRAND.headerRed);
  doc.setLineWidth(0.5);
  doc.line(11, y, W - 11, y);

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("1. CARACTÉRISTIQUES OFFICIELLES DU MASTER CERTIFIÉ", 11, y + 4.5);
  y += 7;

  // Grille 2 colonnes métadonnées
  const gridX = 11;
  const gridW = W - 22;
  const colW = gridW / 2;
  const rowH = 6;

  setFill(doc, '#F8FAFC');
  setDraw(doc, BRAND.borderSoft);
  doc.rect(gridX, y, gridW, rowH * 3 + 2, 'FD');

  // Colonne 1
  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Titre certifié :", gridX + 3, y + 4.5);
  setText(doc, BRAND.textDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text(data.work_title || '—', gridX + 28, y + 4.5);

  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Artiste principal :", gridX + 3, y + 4.5 + rowH);
  setText(doc, BRAND.textDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text(data.artist_name || '—', gridX + 28, y + 4.5 + rowH);

  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Genre musical :", gridX + 3, y + 4.5 + rowH * 2);
  setText(doc, BRAND.textDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(data.artist_genre || 'Afrobeats / Urbain', gridX + 28, y + 4.5 + rowH * 2);

  // Colonne 2
  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Code ISRC :", gridX + colW + 3, y + 4.5);
  setText(doc, BRAND.headerRed); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text(data.isrc || genISRC(data.originality_hash || 'KKD01'), gridX + colW + 28, y + 4.5);

  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Type d'œuvre :", gridX + colW + 3, y + 4.5 + rowH);
  setText(doc, BRAND.textDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(data.work_type || 'Master Audio Numérique (Single)', gridX + colW + 28, y + 4.5 + rowH);

  setText(doc, BRAND.textDim); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text("Date d'effet :", gridX + colW + 3, y + 4.5 + rowH * 2);
  setText(doc, BRAND.textDark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(fmtDate(data.work_date || new Date()), gridX + colW + 28, y + 4.5 + rowH * 2);

  y += (rowH * 3) + 7;

  // ── AUDIT DE CONFORMITÉ & CONTRÔLES D'ORIGINALITÉ ──
  setDraw(doc, BRAND.headerRed);
  doc.setLineWidth(0.5);
  doc.line(11, y, W - 11, y);

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("2. AUDIT DE CONFORMITÉ & STANDARDS DE CONTRÔLE D'ORIGINALITÉ", 11, y + 4.5);
  y += 7;

  const defaultChecks = [
    { title: "Intégrité spectrale du Master Audio", detail: "Fichier master brut vérifié conforme sans compression dégradante ni altération de fréquences." },
    { title: "Originalité vocale & textuelle", detail: "Audit d'absence de plagiat sur les plateformes numériques et banques de données musicales." },
    { title: "Titularité exclusive des droits moraux", detail: "L'artiste garantit être l'unique auteur-compositeur et détenteur légitime des masters." },
    { title: "Protection cryptographique & Empreinte SHA-256", detail: "Génération d'un hash unique garantissant la non-falsification de l'œuvre dans le temps." },
  ];

  const checks = (data.originality_checks && data.originality_checks.length > 0)
    ? data.originality_checks.map(c => ({ title: c.check, detail: c.detail || 'Audit de sécurité validé conforme.' }))
    : defaultChecks;

  checks.slice(0, 4).forEach((chk) => {
    // Puce verte de validation
    setText(doc, BRAND.greenCert);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text("✓", 12, y + 3.5);

    // Titre du contrôle
    setText(doc, BRAND.textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(chk.title, 17, y + 3.5);

    // Badge statut "CONFORME"
    setFill(doc, '#DCFCE7');
    setDraw(doc, '#86EFAC');
    doc.setLineWidth(0.25);
    doc.rect(W - 38, y, 27, 4.5, 'FD');
    setText(doc, BRAND.greenCert);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text("CONFORME", W - 24.5, y + 3.2, { align: 'center' });

    // Détail
    setText(doc, BRAND.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(chk.detail, 17, y + 7.5);

    y += 9.5;
  });

  y += 2;

  // ── EMPREINTE NUMÉRIQUE & SÉCURITÉ CRYPTOGRAPHIQUE ──
  const hashBoxX = 11;
  const hashBoxW = W - 22;
  setFill(doc, '#F1F5F9');
  setDraw(doc, BRAND.borderSoft);
  doc.rect(hashBoxX, y, hashBoxW, 11, 'FD');

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text("EMPREINTE CRYPTOGRAPHIQUE OFFICIELLE (SHA-256) :", hashBoxX + 3, y + 4.2);

  setText(doc, BRAND.textDark);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(data.originality_hash || '9F82A4C2E113B094C8E7F0123456789ABCDEF0123456789ABCDEF0123456789A', hashBoxX + 3, y + 8.5);

  y += 15;

  // ── CACHET ÉLECTRONIQUE ET SIGNATURE OFFICIELLE DU PDG (MADOU KANE) ──
  // Le cachet est centré, mis en valeur avec sa signature officielle et son nom
  const stampW = 50;
  const stampH = 22;
  const stampX = (W - stampW) / 2;

  drawOfficialStampAndSignature(doc, signatureData, stampX, y, stampW, stampH, true);

  // Pied de page
  drawFooter(doc, logoData, data.certificate_number, data.originality_hash);

  return doc;
}

// ===== 7. GÉNÉRATION DE LA LICENCE DE DISTRIBUTION PDF =====
function generateDistributionLicensePDF(doc, data, logoData, signatureData) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Fond blanc immaculé
  setFill(doc, BRAND.bgWhite);
  doc.rect(0, 0, W, H, 'F');

  // Cadre officiel prestigieux
  drawDocumentCadre(doc);

  // En-tête rougeâtre
  drawHeader(
    doc,
    logoData,
    "LICENCE DE DISTRIBUTION OFFICIELLE",
    "CONTRAT DE DISTRIBUTION MUSICALE NUMÉRIQUE & CONCESSION DE DROITS",
    data.license_number,
    fmtDate(data.work_date || new Date())
  );

  // Encart juridique droits d'auteur
  let y = drawLegalNotice(doc, 44);

  // ── SYNTHÈSE DES PARTIES & DE L'ŒUVRE ──
  const summaryX = 11;
  const summaryW = W - 22;
  setFill(doc, '#F8FAFC');
  setDraw(doc, BRAND.borderSoft);
  doc.rect(summaryX, y, summaryW, 16, 'FD');

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("ENTRE LES SOUSSIGNÉS :", summaryX + 3, y + 4.5);

  setText(doc, BRAND.textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text("• Le Concédant : KKD Music Label Group (Dakar, Sénégal · Direction Générale : Madou Kane)", summaryX + 3, y + 8.5);
  doc.text(`• Le Bénéficiaire / Artiste : ${data.artist_name || 'Artiste'} (Représentant légal de l'œuvre « ${data.work_title || 'Titre'} » · ISRC : ${data.isrc || genISRC(data.originality_hash || 'KKD')})`, summaryX + 3, y + 12.5);

  y += 20;

  // ── ARTICLES CONTRACTUELS CLAIRS & LISIBLES (GRILLE 2 COLONNES OU COMPACTE) ──
  setDraw(doc, BRAND.headerRed);
  doc.setLineWidth(0.5);
  doc.line(11, y, W - 11, y);

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("CLAUSES & STIPULATIONS DE LA LICENCE DE DISTRIBUTION", 11, y + 4.5);
  y += 7;

  const clauses = [
    {
      num: "Article 1",
      title: "Concession de licence numérique",
      text: "L'artiste concède à KKD Music le droit non-exclusif de reproduire, diffuser, commercialiser et promouvoir l'œuvre musicale sur sa plateforme web, mobile et l'ensemble de ses réseaux partenaires mondiaux."
    },
    {
      num: "Article 2",
      title: "Préservation des droits d'auteur moraux",
      text: "L'artiste conserve l'intégralité de sa propriété intellectuelle et de ses droits moraux inaliénables (paternité, respect de l'intégrité de l'œuvre). KKD Music s'interdit toute modification sans autorisation préalable."
    },
    {
      num: "Article 3",
      title: "Rémunération & Répartition des revenus",
      text: "L'artiste perçoit 90 % des revenus nets issus de l'exploitation payante ou du streaming de l'œuvre. KKD Music perçoit une commission de distribution de 10 % au titre des frais d'hébergement, promotion et gestion."
    },
    {
      num: "Article 4",
      title: "Garantie d'originalité & Non-contrefaçon",
      text: "L'artiste certifie sur l'honneur être l'auteur et l'ayant-droit légitime du master, et garantit l'œuvre contre toute éviction, contrefaçon, revendication de tiers ou violation des droits voisins."
    },
    {
      num: "Article 5",
      title: "Territoire & Durée d'exploitation",
      text: `La présente licence est conclue pour le territoire mondial, valable jusqu'au ${fmtDate(data.valid_until)}, renouvelable par tacite reconduction et révocable sur préavis écrit de 30 jours.`
    },
    {
      num: "Article 6",
      title: "Droit applicable & Règlement des litiges",
      text: "La présente licence est régie par la législation sénégalaise relative aux droits d'auteur (Loi 2008-09) et les traités de l'OMPI. Tout litige sera soumis à la compétence exclusive des tribunaux de Dakar."
    }
  ];

  // Affichage 2 colonnes pour un équilibre visuel d'une perfection absolue
  const colW2 = (W - 26) / 2;
  const startY = y;
  let leftY = startY;
  let rightY = startY;

  clauses.forEach((cl, idx) => {
    const isLeft = idx % 2 === 0;
    const currentX = isLeft ? 11 : 15 + colW2;
    const curY = isLeft ? leftY : rightY;

    // Numéro et titre
    setText(doc, BRAND.headerRed);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${cl.num} — ${cl.title}`, currentX, curY + 3);

    // Texte de la clause
    setText(doc, BRAND.textDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    const lines = doc.splitTextToSize(cl.text, colW2);
    doc.text(lines, currentX, curY + 6.8);

    const nextY = curY + 7 + (lines.length * 3.3) + 3;
    if (isLeft) leftY = nextY; else rightY = nextY;
  });

  y = Math.max(leftY, rightY) + 2;

  // ── EMPREINTE CRYPTOGRAPHIQUE SHA-256 ──
  const hashBoxX = 11;
  const hashBoxW = W - 22;
  setFill(doc, '#F1F5F9');
  setDraw(doc, BRAND.borderSoft);
  doc.rect(hashBoxX, y, hashBoxW, 9, 'FD');

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text("EMPREINTE SHA-256 CERTIFIÉE :", hashBoxX + 3, y + 3.8);

  setText(doc, BRAND.textDark);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.text(`${data.originality_hash || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}  •  Vérifiable sur kkdmusic.com`, hashBoxX + 3, y + 7.2);

  y += 14;

  // ── DOUBLE SIGNATURE OFFICIELLE (KKD MUSIC & ARTISTE) ──
  // Colonne Gauche : Cachet électronique et signature officielle de Madou Kane
  const sigColW = (W - 28) / 2;
  const sigLeftX = 11;
  const sigRightX = 17 + sigColW;

  // Signataire KKD Music
  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("POUR LE CONCÉDANT (KKD MUSIC)", sigLeftX, y);

  // Appliquer le cachet électronique avec signature et nom de Madou Kane
  drawOfficialStampAndSignature(doc, signatureData, sigLeftX + 4, y + 2, 44, 20, true);

  // Signataire Artiste
  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("POUR LE BÉNÉFICIAIRE (L'ARTISTE)", sigRightX, y);

  // Espace signature artiste
  const artSigY = y + 2;
  setFill(doc, '#F8FAFC');
  setDraw(doc, BRAND.borderSoft);
  doc.setLineWidth(0.3);
  doc.rect(sigRightX, artSigY, sigColW - 4, 20, 'FD');

  setText(doc, BRAND.textDim);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.text("« Lu, approuvé et certifié conforme »", sigRightX + 4, artSigY + 5);

  setDraw(doc, BRAND.borderSoft);
  doc.line(sigRightX + 4, artSigY + 15, sigRightX + sigColW - 8, artSigY + 15);

  const artLineY = artSigY + 21;
  setText(doc, BRAND.textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.artist_name || 'Artiste Ayant-Droit', sigRightX + (sigColW - 4) / 2, artLineY + 4.5, { align: 'center' });

  setText(doc, BRAND.headerRed);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text("Artiste & Titulaire des Droits d'Auteur", sigRightX + (sigColW - 4) / 2, artLineY + 8.5, { align: 'center' });

  setText(doc, BRAND.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`Fait à Dakar, le ${fmtDate(new Date())}`, sigRightX + (sigColW - 4) / 2, artLineY + 12, { align: 'center' });

  // Pied de page
  drawFooter(doc, logoData, data.license_number, data.originality_hash);

  return doc;
}

// ===== PUBLIC EXPORTS =====
export { sha256, genLicenseNumber, genCertificateNumber, genISRC, fetchLogoData, fetchSignatureData };

export function docToBlobUrl(doc) {
  const pdfBytes = doc.output('arraybuffer');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export async function generatePdfBlobs(pdfData, licenseType) {
  const [logoData, signatureData] = await Promise.all([fetchLogoData(), fetchSignatureData()]);
  const result = {};

  if (licenseType === 'distribution' || licenseType === 'double') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    generateDistributionLicensePDF(doc, pdfData, logoData, signatureData);
    result.license_url = docToBlobUrl(doc);
  }

  if (licenseType === 'authenticite' || licenseType === 'double') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    generateAuthenticityCertificatePDF(doc, pdfData, logoData, signatureData);
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
