import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { SITE_URL, buildEmailHtml, pushNotification } from "../../shared/emailKit.js";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Réservé admin' }, { status: 403 });

    const db = base44.asServiceRole;
    const body = await req.json();

    const ensureCredit = async (email) => {
      let c = (await db.entities.VideoCredit.filter({ user_email: email }))[0];
      if (!c) c = await db.entities.VideoCredit.create({ user_email: email, balance: 0, total_purchased: 0, total_used: 0 });
      return c;
    };

    // Mode 1 : valider un achat Wave
    if (body.purchase_id) {
      const purchase = (await db.entities.VideoCreditPurchase.filter({ id: body.purchase_id }))[0];
      if (!purchase) return Response.json({ error: 'Achat introuvable' }, { status: 404 });
      if (purchase.status === 'valide') return Response.json({ success: true, already_validated: true });

      const c = await ensureCredit(purchase.user_email);
      await db.entities.VideoCredit.update(c.id, {
        balance: (c.balance || 0) + (purchase.credits || 0),
        total_purchased: (c.total_purchased || 0) + (purchase.credits || 0),
      });
      await db.entities.VideoCreditPurchase.update(purchase.id, { status: 'valide' });

      await pushNotification({
        base44, userEmail: purchase.user_email,
        title: 'Crédits vidéo ajoutés !',
        message: `${purchase.credits} crédit(s) vidéo ajoutés à votre compte. Votre paiement a été validé.`,
        type: 'success', link: '/studio-video',
        subject: 'KKD Music — Crédits vidéo ajoutés',
        body: buildEmailHtml({
          subject: 'Crédits vidéo ajoutés', preheader: `${purchase.credits} crédits ajoutés`,
          action: 'success', actionLabel: 'CRÉDITS AJOUTÉS',
          headline: 'Vos crédits vidéo sont prêts !',
          body: `Votre paiement a été validé. <strong>${purchase.credits} crédit(s)</strong> vidéo ont été ajoutés à votre compte. Vous pouvez dès maintenant générer vos vidéos animées dans le Studio Vidéo IA.`,
          infoRows: [['Crédits ajoutés', purchase.credits], ['Pack', purchase.pack_label || '—'], ['Montant', `${Number(purchase.amount || 0).toLocaleString('fr-FR')} FCFA`]],
          cta: { label: 'Ouvrir le Studio Vidéo', url: `${SITE_URL}/studio-video` },
        }),
      });
      return Response.json({ success: true, credits_added: purchase.credits });
    }

    // Mode 2 : refuser un achat
    if (body.refuse_purchase_id) {
      await db.entities.VideoCreditPurchase.update(body.refuse_purchase_id, { status: 'refuse' });
      return Response.json({ success: true, refused: true });
    }

    // Mode 3 : octroi manuel de crédits
    if (body.user_email && body.credits) {
      const credits = Number(body.credits);
      const c = await ensureCredit(body.user_email);
      await db.entities.VideoCredit.update(c.id, {
        balance: (c.balance || 0) + credits,
        total_purchased: (c.total_purchased || 0) + credits,
      });
      await pushNotification({
        base44, userEmail: body.user_email,
        title: 'Crédits vidéo offerts',
        message: `${credits} crédit(s) vidéo ajoutés à votre compte par l'équipe KKD Music.`,
        type: 'success', link: '/studio-video', subject: 'KKD Music — Crédits vidéo offerts',
        body: buildEmailHtml({
          subject: 'Crédits vidéo offerts', preheader: `${credits} crédits offerts`,
          action: 'success', actionLabel: 'CADEAU KKD',
          headline: 'Un cadeau de KKD Music !',
          body: `L'équipe KKD Music vous a crédité <strong>${credits} crédit(s)</strong> vidéo. À utiliser dans le Studio Vidéo IA pour créer vos clips animés.`,
          cta: { label: 'Ouvrir le Studio Vidéo', url: `${SITE_URL}/studio-video` },
        }),
      });
      return Response.json({ success: true, credits_added: credits });
    }

    return Response.json({ error: 'Paramètres invalides' }, { status: 400 });
  } catch (error) {
    console.error('[approveVideoCredits] fatal', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}