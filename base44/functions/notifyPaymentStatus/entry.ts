/**
 * Notifie l'acheteur quand le statut d'un paiement Wave (contenu musical/vidéo)
 * change (valide → contenu débloqué / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  valide: {
    title: "Paiement validé — contenu débloqué",
    headline: "✅ Achat confirmé !",
    notifType: "success",
    link: "/mes-achats",
    bodyFn: (p) =>
      `Votre paiement pour <strong>"${p.item_title}"</strong>${p.artist_name ? ` de ${p.artist_name}` : ""} a été validé. Votre contenu est désormais accessible dans votre bibliothèque.`,
  },
  refuse: {
    title: "Paiement non validé",
    headline: "Paiement non validé",
    notifType: "warning",
    link: "/mes-achats",
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
    const notesBlock = data?.admin_notes
      ? `<p style="font-size:13px;color:#aaa;margin:0 0 6px;">Message de l'équipe KKD :</p><div style="background:#1a1a1a;border-left:3px solid #E50000;border-radius:6px;padding:14px 18px;font-size:14px;color:#ddd;line-height:1.6;">${data.admin_notes}</div>`
      : "";

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      headline: cfg.headline,
      body: cfg.bodyFn(data),
      cta: { label: newStatus === "valide" ? "Accéder à ma bibliothèque" : "Voir mon espace", url: `${SITE_URL}${cfg.link}` },
      extra: notesBlock,
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