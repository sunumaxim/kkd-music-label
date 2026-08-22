/**
 * Notifie l'acheteur quand le statut d'un paiement Wave (contenu musical/vidéo)
 * change (valide → contenu débloqué / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  valide: {
    title: "Paiement validé — contenu débloqué",
    headline: "Votre achat est confirmé !",
    action: "success",
    actionLabel: "CONFIRMÉ",
    notifType: "success",
    link: "/mes-achats",
    preheader: "Votre contenu est désormais accessible.",
    bodyFn: (p) =>
      `Votre paiement pour <strong>"${p.item_title}"</strong>${p.artist_name ? ` de <strong>${p.artist_name}</strong>` : ""} a été validé. Votre contenu est désormais accessible dans votre bibliothèque personnelle.`,
  },
  refuse: {
    title: "Paiement non validé",
    headline: "Mise à jour de votre paiement",
    action: "warning",
    actionLabel: "REFUSÉ",
    notifType: "warning",
    link: "/mes-achats",
    preheader: "Votre paiement n'a pas pu être validé.",
    bodyFn: (p) =>
      `Votre paiement pour <strong>"${p.item_title}"</strong> n'a pas pu être validé. Contactez l'équipe KKD Music pour plus d'informations.`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, changed_fields } = body;

    if (!changed_fields?.includes("status")) return Response.json({ skipped: true });

    const newStatus = data?.status;
    const userEmail = data?.user_email;

    if (!userEmail || !STATUS_CONFIG[newStatus]) return Response.json({ skipped: true });
    if (old_data?.status === newStatus) return Response.json({ skipped: true });

    const verified = await verifyStatusChange({ base44, entityName: "WavePayment", id: data?.id, field: "status", expected: newStatus });
    if (!verified) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIG[newStatus];
    const infoRows = [
      ["Contenu", data?.item_title],
      ["Artiste", data?.artist_name],
      ["Montant", data?.amount ? `${data.amount.toLocaleString("fr-FR")} FCFA` : null],
      ["Référence Wave", data?.wave_reference],
    ];

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      preheader: cfg.preheader,
      action: cfg.action,
      actionLabel: cfg.actionLabel,
      headline: cfg.headline,
      body: cfg.bodyFn(data),
      infoRows,
      notes: data?.admin_notes,
      notesLabel: "Message de l'équipe KKD",
      cta: { label: newStatus === "valide" ? "Accéder à ma bibliothèque" : "Voir mon espace", url: `${SITE_URL}${cfg.link}` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(data)),
      type: cfg.notifType,
      link: cfg.link,
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyPaymentStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});