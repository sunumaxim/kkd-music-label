import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@16.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      return Response.json({ error: `Signature webhook invalide: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const md = session.metadata || {};
      const email = session.customer_details?.email || session.customer_email || '';
      if (email && md.item_type && md.item_id) {
        const existing = await base44.asServiceRole.entities.Purchase.filter({ stripe_session_id: session.id });
        if (!existing.length) {
          await base44.asServiceRole.entities.Purchase.create({
            user_email: email,
            item_type: md.item_type,
            item_id: md.item_id,
            item_title: md.item_title || '',
            artist_name: md.artist_name || '',
            amount: session.amount_total || 0,
            currency: session.currency || 'xof',
            stripe_session_id: session.id,
            status: 'paid'
          });

          // Incrémente le compteur d'achats / précommandes sur le contenu vendu
          try {
            const target = md.item_type === 'release'
              ? base44.asServiceRole.entities.Release
              : md.item_type === 'video'
                ? base44.asServiceRole.entities.Video
                : null;
            if (target) {
              const found = await target.filter({ id: md.item_id });
              if (found[0]) {
                await target.update(md.item_id, { sales_count: (found[0].sales_count || 0) + 1 });
              }
            }
          } catch (e) {
            console.error('sales_count increment error:', e);
          }
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});