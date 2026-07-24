import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@16.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { item_type, item_id, origin } = body;

    if (!item_type || !item_id) {
      return Response.json({ error: 'item_type et item_id sont requis' }, { status: 400 });
    }
    if (!['release', 'video'].includes(item_type)) {
      return Response.json({ error: 'Type de contenu invalide' }, { status: 400 });
    }

    const entityApi = item_type === 'release'
      ? base44.asServiceRole.entities.Release
      : base44.asServiceRole.entities.Video;

    const items = await entityApi.filter({ id: item_id });
    const item = items[0];
    if (!item) return Response.json({ error: 'Contenu introuvable' }, { status: 404 });

    if (!item.is_for_sale || !item.price || Number(item.price) <= 0) {
      return Response.json({ error: "Ce contenu n'est pas en vente" }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const title = item.title || 'Contenu KKD Music';
    const artistName = item.artist_name || '';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'xof',
          unit_amount: Math.round(Number(item.price)),
          product_data: { name: artistName ? `${title} — ${artistName}` : title }
        }
      }],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        item_type,
        item_id,
        item_title: String(title).slice(0, 500),
        artist_name: String(artistName).slice(0, 500)
      },
      success_url: `${origin}/mes-achats?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/mes-achats?canceled=1`
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});