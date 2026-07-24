/**
 * Notifie l'organisateur (partenaire) quand le statut de validation
 * de son événement change (approuve / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  approuve: {
    title: "Événement validé",
    headline: "✅ Événement validé !",
    notifType: "success",
    bodyFn: (e) =>
      `Votre événement <strong>"${e.title}"</strong> a été validé par l'équipe KKD Music. Il est désormais visible publiquement sur la plateforme.`,
  },
  refuse: {
    title: "Événement non validé",
    headline: "Événement non retenu",
    notifType: "warning",
    bodyFn: (e) =>
      `Votre événement <strong>"${e.title}"</strong> n'a pas pu être validé pour le moment. Consultez les notes de l'équipe si disponibles.`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, changed_fields } = body;

    if (!changed_fields?.includes("published_status")) return Response.json({ skipped: true });

    const newStatus = data?.published_status;
    const userEmail = data?.organizer_email;

    if (!userEmail || !STATUS_CONFIG[newStatus]) return Response.json({ skipped: true });
    if (old_data?.published_status === newStatus) return Response.json({ skipped: true });

    const verified = await verifyStatusChange({ base44, entityName: "Event", id: data?.id, field: "published_status", expected: newStatus });
    if (!verified) return Response.json({ skipped: true });

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
      link: newStatus === "approuve" ? `/evenements` : "/mon-espace",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyEventStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});