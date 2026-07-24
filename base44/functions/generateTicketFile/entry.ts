import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { jsPDF } from 'npm:jspdf@4.2.1';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function fetchImage(url) {
  if (!url) return null;
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

    const W = 380, H = 620;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [W, H] });

    doc.setFillColor(10, 10, 14); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(230, 0, 0); doc.rect(0, 0, W, 8, 'F'); doc.rect(0, H - 8, W, 8, 'F');

    if (logo) { try { doc.addImage(logo.data, logo.fmt, 24, 28, 38, 38); } catch (_) {} }
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('KKD MUSIC', 72, 42);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(180, 180, 180);
    doc.text('Billet officiel', 72, 56);

    let py = 86;
    if (poster) { try { doc.addImage(poster.data, poster.fmt, 24, py, W - 48, 140); } catch (_) {} }
    else { doc.setFillColor(40, 40, 48); doc.rect(24, py, W - 48, 140, 'F'); }
    py += 140 + 18;

    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text(String(ticket.event_title || 'Événement'), 24, py, { maxWidth: W - 48 });
    py += 24;
    if (ev?.artist_name || ticket.artist_name) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(230, 0, 0);
      doc.text(String(ev?.artist_name || ticket.artist_name), 24, py); py += 16;
    }
    doc.setTextColor(200, 200, 200); doc.setFontSize(11);
    if (ev?.event_date || ticket.event_date) { doc.text(fmtDate(ev?.event_date || ticket.event_date), 24, py, { maxWidth: W - 48 }); py += 14; }
    if (ev?.location || ev?.city) { doc.text([ev?.city, ev?.location].filter(Boolean).join(' — '), 24, py, { maxWidth: W - 48 }); py += 14; }
    py += 8;

    const qrSize = 150; const qx = (W - qrSize) / 2;
    if (qr) { try { doc.addImage(qr.data, qr.fmt, qx, py, qrSize, qrSize); } catch (_) {} }
    else { doc.setFillColor(255, 255, 255); doc.rect(qx, py, qrSize, qrSize, 'F'); }
    if (poster) {
      const c = 44;
      doc.setFillColor(255, 255, 255); doc.rect(qx + qrSize / 2 - c / 2 - 2, py + qrSize / 2 - c / 2 - 2, c + 4, c + 4, 'F');
      try { doc.addImage(poster.data, poster.fmt, qx + qrSize / 2 - c / 2, py + qrSize / 2 - c / 2, c, c); } catch (_) {}
    }
    py += qrSize + 16;

    doc.setTextColor(230, 0, 0); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(String(ticket.ticket_number), W / 2, py, { align: 'center' }); py += 14;
    doc.setTextColor(255, 255, 255); doc.setFontSize(11);
    doc.text(`Au nom de : ${ticket.buyer_name || '—'}`, W / 2, py, { align: 'center' }); py += 14;
    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text(`${Number(ticket.amount || 0).toLocaleString('fr-FR')} FCFA · Présentez ce billet à l'entrée`, W / 2, py, { align: 'center' }); py += 12;
    doc.text('KKD Music — SunuMaxim GROUP', W / 2, py, { align: 'center' });

    const ab = doc.output('arraybuffer');
    return Response.json({ pdf: bufToB64(ab), filename: `billet-${ticket_number}.pdf` });
  } catch (error) {
    console.error('generateTicketFile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});