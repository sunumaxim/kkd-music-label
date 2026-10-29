import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { confirmTicketPayment } from '../../shared/confirmTicketPayment.ts';

async function verifySignature(rawBody: string, header: string, secret: string) {
  const parts = String(header || '').split(',');
  const timestamp = parts.find((part) => part.trim().startsWith('t='))?.trim().slice(2);
  const signatures = parts
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + rawBody));
  const expected = Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0;
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const secret = Deno.env.get('WAVE_WEBHOOK_SECRET');
    if (!secret) return new Response('Webhook not configured', { status: 503 });

    const rawBody = await req.text();
    const signature = req.headers.get('Wave-Signature') || '';
    if (!(await verifySignature(rawBody, signature, secret))) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event?.type !== 'checkout.session.completed') return Response.json({ received: true });
    const session = event?.data;
    if (!session?.id || session.payment_status !== 'succeeded' || session.checkout_status !== 'complete') {
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);
    const rows = await base44.asServiceRole.entities.Ticket.filter({ wave_checkout_id: String(session.id) });
    const ticket = rows[0];
    if (!ticket) return new Response('Ticket not found', { status: 404 });
    if (ticket.payment_method !== 'wave_api' ||
        session.client_reference !== ticket.id ||
        session.currency !== 'XOF' ||
        Math.round(Number(session.amount)) !== Math.round(Number(ticket.amount))) {
      return new Response('Payment mismatch', { status: 409 });
    }

    await confirmTicketPayment(base44, ticket, String(session.transaction_id || ''));
    return Response.json({ received: true });
  } catch (error) {
    console.error('wavePaymentWebhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
