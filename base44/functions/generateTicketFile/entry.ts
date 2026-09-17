import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';
import { getTheme } from '../../shared/ticketThemes.ts';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function isBlockedHost(host) {
  host = String(host || '').toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = +v4[1], b = +v4[2];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }
  if (host.includes(':')) {
    if (host === '::1' || host === '::' || host.startsWith('0:0:0:0:0:0:0:1')) return true;
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true;
  }
  return false;
}
function isSafeUrl(raw) {
  try { const u = new URL(raw); if (u.protocol !== 'http:' && u.protocol !== 'https:') return false; return !isBlockedHost(u.hostname); }
  catch (_) { return false; }
}

async function fetchImage(url) {
  if (!url) return null;
  if (!isSafeUrl(url)) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || 'image/png';
    const buf = await r.arrayBuffer();
    const fmt = ct.includes('jpeg') || ct.includes('jpg') ? 'JPEG' : 'PNG';
    return { data: 'data:' + ct + ';base64,' + bufToB64(buf), fmt };
  } catch (_) { return null; }
}

function fmtDateParts(d) {
  try {
    const date = new Date(d);
    const days = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'];
    const months = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEP','OCT','NOV','DÉC'];
    return {
      dayName: days[date.getDay()],
      day: String(date.getDate()).padStart(2,'0'),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      time: String(date.getHours()).padStart(2,'0') + 'H' + String(date.getMinutes()).padStart(2,'0'),
      shortDate: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    };
  } catch(_) { return null; }
}

function generateBarcodeValue(ticket) {
  const d = new Date(ticket.validated_date || ticket.created_date || Date.now());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}KKDSM`;
}

function drawBarcode(doc, x, y, w, h, value) {
  const bars = [];
  bars.push({ w: 2, black: true }); bars.push({ w: 1, black: false });
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    for (let j = 0; j < 4; j++) {
      const width = ((code >> (j * 2)) & 3) + 1;
      bars.push({ w: width, black: j % 2 === 0 });
    }
  }
  bars.push({ w: 1, black: false }); bars.push({ w: 2, black: true });
  const totalUnits = bars.reduce((s, b) => s + b.w, 0);
  const unitW = w / totalUnits;
  let cx = x;
  doc.setFillColor(255, 255, 255); doc.rect(x - 2, y - 2, w + 4, h + 4, 'F');
  for (const bar of bars) {
    if (bar.black) {
      doc.setFillColor(20, 18, 16);
      doc.rect(cx, y, bar.w * unitW, h, 'F');
    }
    cx += bar.w * unitW;
  }
}

// ── Simple vector icons ──
function drawIconCalendar(doc, x, y, s, c) {
  doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(1);
  doc.roundedRect(x, y + s * 0.22, s, s * 0.78, 1, 1, 'S');
  doc.line(x + s * 0.22, y, x + s * 0.22, y + s * 0.28);
  doc.line(x + s * 0.78, y, x + s * 0.78, y + s * 0.28);
  doc.line(x, y + s * 0.32, x + s, y + s * 0.32);
}
function drawIconClock(doc, x, y, s, c) {
  doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(1);
  doc.circle(x + s / 2, y + s / 2, s / 2 - 0.5, 'S');
  doc.line(x + s / 2, y + s / 2, x + s / 2, y + s * 0.18);
  doc.line(x + s / 2, y + s / 2, x + s * 0.78, y + s / 2);
}
function drawIconPin(doc, x, y, s, c) {
  doc.setFillColor(c[0], c[1], c[2]);
  const cx = x + s / 2, cy = y + s * 0.35, r = s * 0.32;
  doc.circle(cx, cy, r, 'F');
  doc.triangle(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy + r * 0.7, cx, y + s, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r * 0.38, 'F');
}

function drawCertifiedStamp(doc, cx, cy, r, color) {
  const c = color || [229, 57, 53];
  doc.setDrawColor(c[0], c[1], c[2]);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.circle(cx, cy, r, 'F');
  doc.circle(cx, cy, r, 'S');
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, r - 2.5, 'S');
  doc.setTextColor(c[0], c[1], c[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.text('★ ARTISTE ★', cx, cy - 5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('KKDmusic', cx, cy + 1, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('CERTIFIÉ', cx, cy + 7, { align: 'center' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { ticket_number } = await req.json();
    if (!ticket_number) return Response.json({ error: 'ticket_number requis' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ ticket_number });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    // Autoriser les billets "en_attente" (vierges, à activer) et "valide" (activés)
    if (ticket.status !== 'valide' && ticket.status !== 'en_attente') return Response.json({ error: 'Billet non validé' }, { status: 400 });

    const isBlank = ticket.status === 'en_attente';

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];

    // Vérifier l'autorisation : acheteur, organisateur, manager ou admin
    const isBuyer = ticket.buyer_email && ticket.buyer_email === user.email;
    const isOrganizer = ev && ev.organizer_email === user.email;
    const isManager = ev && Array.isArray(ev.managers) && ev.managers.includes(user.email);
    const isAdmin = user.role === 'admin';
    if (!isBuyer && !isOrganizer && !isManager && !isAdmin) {
      return Response.json({ error: 'Accès non autorisé à ce billet' }, { status: 403 });
    }

    // Fetch artist photo (priority: artist photo_url > artist cover_url > event poster)
    let artistPhotoUrl = null;
    let artistName = ev?.artist_name || ticket.artist_name || '';
    let artistVerified = false;
    if (ev?.artist_id) {
      try {
        const artists = await base44.asServiceRole.entities.Artist.filter({ id: ev.artist_id });
        if (artists[0]) {
          artistPhotoUrl = artists[0].photo_url || artists[0].cover_url;
          artistName = artists[0].name || artistName;
          artistVerified = !!artists[0].is_verified;
        }
      } catch (_) {}
    }

    // Utiliser l'URL officielle de l'application (non contrôlable par l'appelant)
    const base = 'https://kkdmusic.com';
    // QR sécurisé : inclut le hash de sécurité pour empêcher la falsification
    const hashParam = ticket.security_hash ? `?h=${ticket.security_hash}` : '';
    const qrData = `${base}/billet/${encodeURIComponent(ticket_number)}${hashParam}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&margin=0&data=${encodeURIComponent(qrData)}`;

    const [logo, artistPhoto, eventPoster, qr] = await Promise.all([
      fetchImage(LOGO_URL),
      fetchImage(artistPhotoUrl),
      fetchImage(ev?.image_url || ticket.event_image_url),
      fetchImage(qrUrl),
    ]);

    const bgImage = artistPhoto || eventPoster;
    const dp = fmtDateParts(ev?.event_date || ticket.event_date);
    const barcodeValue = generateBarcodeValue(ticket);

    const eventTypeMap = { concert: 'CONCERT', festival: 'FESTIVAL', showcase: 'SHOWCASE', rencontre: 'RENCONTRE' };
    const eventTypeLabel = eventTypeMap[ev?.event_type] || 'CONCERT';

    // ═══ Layout constants ═══
    const theme = getTheme(ev?.ticket_theme || 'classic');
    const W = 780, H = 460;
    const FOOTER_H = 52;
    const TICKET_H = H - FOOTER_H;
    const MAIN_W = 540;
    const SIDE_W = W - MAIN_W;
    const R = 10;
    const RED = theme.primary;       // couleur accent du thème
    const BG = theme.bg;             // fond principal du thème
    const SIDEBAR_BG = theme.sidebar; // fond sidebar du thème

    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });

    // White base
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // ═══════════════════════════════════════
    // MAIN SECTION (left — themed bg + artist image)
    // ═══════════════════════════════════════
    doc.setFillColor(BG[0], BG[1], BG[2]);
    doc.roundedRect(0, 0, MAIN_W, TICKET_H, R, R, 'F');

    // Artist image as background (clipped to rounded rect)
    if (bgImage) {
      try {
        doc.saveGraphicsState();
        doc.roundedRect(0, 0, MAIN_W, TICKET_H, R, R);
        doc.clip();
        doc.discardPath();
        doc.addImage(bgImage.data, bgImage.fmt, 0, 0, MAIN_W, TICKET_H, undefined, 'FAST');
        doc.restoreGraphicsState();
      } catch (_) {
        try { doc.addImage(bgImage.data, bgImage.fmt, 0, 0, MAIN_W, TICKET_H, undefined, 'FAST'); } catch (_2) {}
      }
    }

    // Dark overlay for text readability
    let overlayApplied = false;
    try {
      doc.setGState(new doc.GState({ opacity: 0.55 }));
      doc.setFillColor(BG[0], BG[1], BG[2]);
      doc.rect(0, 0, MAIN_W, TICKET_H, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      overlayApplied = true;
    } catch (_) {}
    if (!overlayApplied && !bgImage) {
      doc.setFillColor(BG[0], BG[1], BG[2]);
      doc.rect(0, 0, MAIN_W, TICKET_H, 'F');
    }

    // Red top stripe
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.rect(0, 0, MAIN_W, 4, 'F');

    // ── Logo + PRÉSENTE ──
    const padL = 28;
    let logoW = 30, logoH = 30;
    if (logo) { try { doc.addImage(logo.data, logo.fmt, padL, 18, logoW, logoH); } catch (_) {} }
    const textX = padL + (logo ? logoW + 8 : 0);
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
    doc.text('KKD', textX, 34);
    doc.setTextColor(255, 255, 255);
    doc.text('music', textX + 33, 34);
    doc.setTextColor(170, 170, 170);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('PRÉSENTE', textX, 46);

    // ── Title area ──
    let y = 118;
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(eventTypeLabel, padL, y);

    y += 30;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(34);
    const artistUpper = (artistName || ticket.event_title || 'ÉVÉNEMENT').toUpperCase();
    const nameLines = doc.splitTextToSize(artistUpper, MAIN_W - padL * 2);
    doc.text(nameLines.slice(0, 2), padL, y);
    y += nameLines.length > 1 ? 38 : 22;

    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(20);
    doc.text('En Live', padL, y);

    // ── Date / Time / Location ──
    y = 252;
    if (dp) {
      drawIconCalendar(doc, padL, y - 10, 11, RED);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      doc.text(`${dp.dayName} / ${dp.day} ${dp.month} ${dp.year}`, padL + 16, y);
      drawIconClock(doc, padL, y + 4, 11, RED);
      doc.setTextColor(210, 210, 210);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(dp.time, padL + 16, y + 14);

      const rx = 280;
      drawIconPin(doc, rx, y - 10, 11, RED);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      const locStr = [ev?.location, ev?.city].filter(Boolean).join(' — ').toUpperCase() || 'LIEU À CONFIRMER';
      const locLines = doc.splitTextToSize(locStr, MAIN_W - rx - padL);
      doc.text(locLines.slice(0, 2), rx + 16, y);
    }

    // ── Disclaimer ──
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(isBlank ? 'À ACTIVER PAR SCAN QR AVANT L\'ÉVÉNEMENT' : 'BILLET VALIDE POUR UNE SEULE ENTRÉE', padL, 298);

    // ── Bottom bar (3 sections) ──
    const barY = 314, barH = 70;
    try {
      doc.setGState(new doc.GState({ opacity: 0.65 }));
      doc.setFillColor(0, 0, 0);
      doc.rect(0, barY, MAIN_W, barH, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (_) {
      doc.setFillColor(0, 0, 0);
      doc.rect(0, barY, MAIN_W, barH, 'F');
    }

    doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.5);
    const s1 = MAIN_W / 3, s2 = MAIN_W * 2 / 3;
    doc.line(s1, barY + 10, s1, barY + barH - 10);
    doc.line(s2, barY + 10, s2, barY + barH - 10);

    // CATÉGORIE
    doc.setTextColor(140, 140, 140); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('CATÉGORIE', s1 / 2, barY + 24, { align: 'center' });
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('STANDARD', s1 / 2, barY + 46, { align: 'center' });

    // PRIX
    doc.setTextColor(140, 140, 140); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('PRIX', (s1 + s2) / 2, barY + 24, { align: 'center' });
    const priceStr = Number(ticket.amount || 0).toLocaleString('fr-FR');
    doc.setTextColor(RED[0], RED[1], RED[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(priceStr, (s1 + s2) / 2 - 8, barY + 46, { align: 'center' });
    doc.setTextColor(255, 255, 255); doc.setFontSize(8);
    doc.text('FCFA', (s1 + s2) / 2 + priceStr.length * 3.5 + 2, barY + 46, { align: 'left' });

    // N° TICKET
    doc.setTextColor(140, 140, 140); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('N° TICKET', (s2 + MAIN_W) / 2, barY + 24, { align: 'center' });
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(String(ticket.ticket_number || ''), (s2 + MAIN_W) / 2, barY + 44, { align: 'center' });

    // ── Certified stamp ──
    drawCertifiedStamp(doc, MAIN_W - 42, barY - 28, 24, RED);

    // ═══════════════════════════════════════
    // SIDEBAR (right — themed light)
    // ═══════════════════════════════════════
    doc.setFillColor(SIDEBAR_BG[0], SIDEBAR_BG[1], SIDEBAR_BG[2]);
    doc.roundedRect(MAIN_W, 0, SIDE_W, TICKET_H, R, R, 'F');

    // Notched perforation (semi-circular cutouts for ticket stub effect)
    doc.setFillColor(255, 255, 255);
    doc.circle(MAIN_W, 0, 9, 'F');
    doc.circle(MAIN_W, TICKET_H, 9, 'F');
    // Dashed perforation line between notches
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5);
    doc.setLineDashPattern([3, 3], 0);
    doc.line(MAIN_W, 12, MAIN_W, TICKET_H - 12);
    doc.setLineDashPattern([], 0);

    const sx = MAIN_W + 14;
    const sw = SIDE_W - 28;
    let sy = 18;

    // Red pill "TICKET OFFICIEL" or "À ACTIVER" for blank tickets
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.roundedRect(sx, sy, sw, 18, 9, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text(isBlank ? 'À ACTIVER' : 'TICKET OFFICIEL', MAIN_W + SIDE_W / 2, sy + 12.5, { align: 'center' });
    sy += 28;

    // Info list
    const infoItems = [
      { label: 'N° TICKET', value: String(ticket.ticket_number || '') },
      { label: 'NOM', value: isBlank ? '—' : (ticket.buyer_name || '—').toUpperCase() },
      { label: 'TÉLÉPHONE', value: isBlank ? '—' : (ticket.buyer_phone || '—') },
      { label: 'DATE', value: dp ? `${dp.day} ${dp.month} ${dp.year}` : '—' },
      { label: 'HEURE', value: dp ? dp.time : '—' },
      { label: 'LIEU', value: (ev?.location || ev?.city || '—').toUpperCase() },
    ];

    for (const item of infoItems) {
      doc.setTextColor(125, 125, 125); doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text(item.label, sx, sy);
      doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(item.value, sw);
      doc.text(lines.slice(0, 2), sx, sy + 10);
      sy += 10 + Math.min(lines.length, 2) * 9 + 4;
    }

    // QR code
    sy = 222;
    const qrSize = 68;
    const qrX = MAIN_W + (SIDE_W - qrSize) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 4, sy - 4, qrSize + 8, qrSize + 8, 4, 4, 'F');
    if (qr) { try { doc.addImage(qr.data, qr.fmt, qrX, sy, qrSize, qrSize); } catch (_) {} }
    if (logo) {
      const c = 16;
      doc.setFillColor(255, 255, 255);
      doc.rect(qrX + qrSize / 2 - c / 2 - 1, sy + qrSize / 2 - c / 2 - 1, c + 2, c + 2, 'F');
      try { doc.addImage(logo.data, logo.fmt, qrX + qrSize / 2 - c / 2, sy + qrSize / 2 - c / 2, c, c); } catch (_) {}
    }
    sy += qrSize + 8;

    // "SCANNER POUR VÉRIFIER" / "SCANNER POUR ACTIVER" button
    doc.setFillColor(20, 20, 20);
    doc.roundedRect(sx, sy, sw, 15, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.text(isBlank ? 'SCANNER POUR ACTIVER' : 'SCANNER POUR VÉRIFIER', MAIN_W + SIDE_W / 2, sy + 10, { align: 'center' });
    sy += 22;

    // Barcode
    drawBarcode(doc, sx, sy, sw, 24, barcodeValue);
    sy += 26;
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
    doc.text(barcodeValue, MAIN_W + SIDE_W / 2, sy + 2, { align: 'center' });

    // Red social footer bar
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.rect(MAIN_W, TICKET_H - 22, SIDE_W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('@KKDmusic', MAIN_W + 12, TICKET_H - 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.text('kkdmusic.com', MAIN_W + SIDE_W - 12, TICKET_H - 8, { align: 'right' });

    // ═══════════════════════════════════════
    // GLOBAL FOOTER (simplified social bar)
    // ═══════════════════════════════════════
    doc.setFillColor(BG[0], BG[1], BG[2]);
    doc.rect(0, TICKET_H, W, FOOTER_H, 'F');

    // Red top accent on footer
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.rect(0, TICKET_H, W, 2, 'F');

    // Centered social info
    const fy = TICKET_H + FOOTER_H / 2;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('@KKDmusic', W / 2 - 55, fy + 3, { align: 'center' });
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('\u2022', W / 2, fy + 3, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('kkdmusic.com', W / 2 + 55, fy + 3, { align: 'center' });

    // Red bottom line
    doc.setFillColor(RED[0], RED[1], RED[2]);
    doc.rect(0, H - 3, W, 3, 'F');

    const ab = doc.output('arraybuffer');
    return Response.json({ pdf: bufToB64(ab), filename: `billet-${ticket_number}.pdf` });
  } catch (error) {
    console.error('generateTicketFile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});