import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';

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

function fmtDate(d) {
  try { return new Date(d).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }); } catch (_) { return ''; }
}

function fmtDateShort(d) {
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
}

// Génère la valeur du code-barres : date + heure + minute + KKD + SM
function generateBarcodeValue(ticket) {
  const d = new Date(ticket.validated_date || ticket.created_date || Date.now());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}KKDSM`;
}

// Dessine un code-barres visuel (pattern Code 128-like)
function drawBarcode(doc, x, y, w, h, value) {
  const bars = [];
  // Start guard
  bars.push({ w: 2, black: true }); bars.push({ w: 1, black: false });
  // Data
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    for (let j = 0; j < 4; j++) {
      const width = ((code >> (j * 2)) & 3) + 1;
      bars.push({ w: width, black: j % 2 === 0 });
    }
  }
  // Stop guard
  bars.push({ w: 1, black: false }); bars.push({ w: 2, black: true });

  const totalUnits = bars.reduce((s, b) => s + b.w, 0);
  const unitW = w / totalUnits;
  let cx = x;
  doc.setFillColor(255, 255, 255); doc.rect(x, y, w, h, 'F');
  for (const bar of bars) {
    if (bar.black) {
      doc.setFillColor(20, 18, 16);
      doc.rect(cx, y, bar.w * unitW, h, 'F');
    }
    cx += bar.w * unitW;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ticket_number, app_url } = await req.json();
    if (!ticket_number) return Response.json({ error: 'ticket_number requis' }, { status: 400 });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({ ticket_number });
    const ticket = tickets[0];
    if (!ticket) return Response.json({ error: 'Billet introuvable' }, { status: 404 });
    if (ticket.status !== 'valide') return Response.json({ error: 'Billet non validé' }, { status: 400 });

    const events = await base44.asServiceRole.entities.Event.filter({ id: ticket.event_id });
    const ev = events[0];

    const base = (app_url || '').replace(/\/+$/, '');
    const qrData = `${base}/billet/${encodeURIComponent(ticket_number)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=H&margin=0&data=${encodeURIComponent(qrData)}`;

    const [logo, poster, qr] = await Promise.all([
      fetchImage(LOGO_URL),
      fetchImage(ev?.image_url || ticket.event_image_url),
      fetchImage(qrUrl),
    ]);

    // ═══ Design professionnel du billet ═══
    const W = 400, H = 740;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [W, H] });

    // Fond sombre
    doc.setFillColor(18, 16, 14); doc.rect(0, 0, W, H, 'F');

    // Bandes rouges haut/bas
    doc.setFillColor(229, 57, 53); doc.rect(0, 0, W, 7, 'F'); doc.rect(0, H - 7, W, 7, 'F');

    // ── En-tête ──
    if (logo) { try { doc.addImage(logo.data, logo.fmt, 22, 22, 38, 38); } catch (_) {} }
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.text('KKD MUSIC', 70, 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 175, 170);
    doc.text('BILLET OFFICIEL  ·  SunuMaxim GROUP', 70, 52);

    // Séparateur
    doc.setDrawColor(229, 57, 53); doc.setLineWidth(1.5);
    doc.line(22, 70, W - 22, 70);

    // ── Affiche ──
    let py = 82;
    const pw = W - 44, ph = 170;
    if (poster) { try { doc.addImage(poster.data, poster.fmt, 22, py, pw, ph); } catch (_) {} }
    else { doc.setFillColor(40, 36, 32); doc.rect(22, py, pw, ph, 'F'); }
    py += ph + 16;

    // ── Titre événement ──
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(String(ticket.event_title || 'Evenement'), W - 44);
    doc.text(titleLines, 22, py);
    py += titleLines.length * 24;

    // Artiste
    if (ev?.artist_name || ticket.artist_name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(229, 57, 53);
      doc.text(String(ev?.artist_name || ticket.artist_name), 22, py); py += 17;
    }

    // Date + lieu
    doc.setTextColor(190, 185, 180); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    if (ev?.event_date || ticket.event_date) {
      doc.text(fmtDate(ev?.event_date || ticket.event_date), 22, py, { maxWidth: W - 44 }); py += 14;
    }
    if (ev?.location || ev?.city) {
      const locStr = [ev?.city, ev?.location].filter(Boolean).join(' — ');
      doc.text(locStr, 22, py, { maxWidth: W - 44 }); py += 14;
    }
    py += 8;

    // ── QR code + infos ──
    const qrSize = 120;
    const qrX = 22;
    // Fond blanc arrondi pour le QR
    doc.setFillColor(255, 255, 255); doc.roundedRect(qrX - 5, py - 5, qrSize + 10, qrSize + 10, 6, 6, 'F');
    if (qr) { try { doc.addImage(qr.data, qr.fmt, qrX, py, qrSize, qrSize); } catch (_) {} }
    // Logo au centre du QR
    if (logo) {
      const c = 30;
      doc.setFillColor(255, 255, 255); doc.rect(qrX + qrSize / 2 - c / 2 - 1, py + qrSize / 2 - c / 2 - 1, c + 2, c + 2, 'F');
      try { doc.addImage(logo.data, logo.fmt, qrX + qrSize / 2 - c / 2, py + qrSize / 2 - c / 2, c, c); } catch (_) {}
    }

    // Infos à droite du QR
    const ix = qrX + qrSize + 18;
    const iw = W - ix - 22;
    doc.setTextColor(150, 145, 140); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('AU NOM DE', ix, py + 8);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    const nameLines = doc.splitTextToSize(String(ticket.buyer_name || '—'), iw);
    doc.text(nameLines.slice(0, 2), ix, py + 22);

    doc.setTextColor(150, 145, 140); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('PRIX', ix, py + 48);
    doc.setTextColor(229, 57, 53); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(`${Number(ticket.amount || 0).toLocaleString('fr-FR')} FCFA`, ix, py + 62);

    doc.setTextColor(150, 145, 140); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('N° BILLET', ix, py + 78);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(String(ticket.ticket_number || ''), ix, py + 90, { maxWidth: iw });

    py += qrSize + 22;

    // ── Code-barres ──
    const bcValue = generateBarcodeValue(ticket);
    const bcW = W - 44, bcH = 48;
    doc.setFillColor(255, 255, 255); doc.roundedRect(20, py - 3, bcW + 4, bcH + 16, 4, 4, 'F');
    drawBarcode(doc, 22, py, bcW, bcH, bcValue);
    py += bcH + 4;
    doc.setTextColor(40, 36, 32); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(bcValue, W / 2, py, { align: 'center' });
    py += 16;

    // ── Pied de page ──
    doc.setDrawColor(60, 55, 50); doc.setLineWidth(0.5);
    doc.line(22, py, W - 22, py);
    py += 13;
    doc.setTextColor(150, 145, 140); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text("Presentez ce billet a l'entree", W / 2, py, { align: 'center' });
    py += 11;
    doc.setTextColor(120, 115, 110);
    doc.text('KKD Music  —  SunuMaxim GROUP  —  kkdmusic.com', W / 2, py, { align: 'center' });

    const ab = doc.output('arraybuffer');
    return Response.json({ pdf: bufToB64(ab), filename: `billet-${ticket_number}.pdf` });
  } catch (error) {
    console.error('generateTicketFile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});