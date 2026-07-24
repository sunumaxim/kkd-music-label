/**
 * Notifie l'utilisateur quand sa demande d'accès à un profil artiste
 * change de statut (approuve / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  approuve: {
    title: "Accès artiste accordé",
    headline: "✅ Accès artiste accordé !",
    notifType: "success",
    bodyFn: (r) =>
      `Votre demande d'accès au profil de <strong>${r.artist_name}</strong> a été approuvée. Vous pouvez désormais gérer ce profil depuis votre espace partenaire.`,
  },
  refuse: {
    title: "Demande d'accès refusée",
    headline: "Demande d'accès refusée",
    notifType: "warning",
    bodyFn: (r) =>
      `Votre demande d'accès au profil de <strong>${r.artist_name}</strong> n'a pas pu être accordée. Contactez l'équipe KKD Music pour plus d'informations.`,
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

    const cfg = STATUS_CONFIG[newStatus];
    const notesBlock = data?.admin_notes
      ? `<p style="font-size:13px;color:#aaa;margin:0 0 6px;">Message de l'équipe KKD :</p><div style="background:#1a1a1a;border-left:3px solid #E50000;border-radius:6px;padding:14px 18px;font-size:14px;color:#ddd;line-height:1.6;">${data.admin_notes}</div>`
      : "";

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      headline: cfg.headline,
      body: cfg.bodyFn(data),
      cta: { label: "Voir mon espace partenaire", url: `${SITE_URL}/mon-espace` },
      extra: notesBlock,
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(data)),
      type: cfg.notifType,
      link: "/mon-espace",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyAccessRequestStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});