import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@16.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { session_id } = body;
    if (!session_id) return Response.json({ error: 'session_id requis' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Paiement non confirmé' }, { status: 400 });
    }

    const md = session.metadata || {};
    const item_type = md.item_type;
    const item_id = md.item_id;
    const item_title = md.item_title || '';
    const artist_name = md.artist_name || '';
    const email = session.customer_details?.email || session.customer_email || '';

    if (!email || !item_type || !item_id) {
      return Response.json({ error: 'Données de session incomplètes' }, { status: 400 });
    }

    // Crée l'achat s'il n'existe pas déjà
    const existing = await base44.asServiceRole.entities.Purchase.filter({ stripe_session_id: session_id });
    if (!existing.length) {
      await base44.asServiceRole.entities.Purchase.create({
        user_email: email,
        item_type, item_id, item_title, artist_name,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'eur',
        stripe_session_id: session_id,
        status: 'paid'
      });
    }

    const entityApi = item_type === 'release'
      ? base44.asServiceRole.entities.Release
      : base44.asServiceRole.entities.Video;
    const items = await entityApi.filter({ id: item_id });
    const item = items[0];

    let protected_url = null;
    if (item?.protected_file_uri) {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: item.protected_file_uri,
        expires_in: 3600
      });
      protected_url = signed.signed_url;
    }

    return Response.json({
      item_type, item_id, item_title, artist_name,
      cover_url: item?.cover_url || item?.thumbnail_url || null,
      is_video: item_type === 'video',
      protected_url,
      user_email: email
    });
  } catch (error) {
    console.error('redeemPurchase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});