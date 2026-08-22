/**
 * Notifie l'organisateur (partenaire) quand le statut de validation
 * de son événement change (approuve / refuse / clarification) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  approuve: {
    title: "Événement validé",
    headline: "Votre événement est en ligne !",
    action: "success",
    actionLabel: "VALIDÉ",
    notifType: "success",
    preheader: "Votre événement est désormais visible publiquement.",
    bodyFn: (e) =>
      `Votre événement <strong>"${e.title}"</strong> a été validé par l'équipe KKD Music. Il est désormais visible publiquement sur la plateforme et accessible à tous les fans.`,
  },
  refuse: {
    title: "Événement non validé",
    headline: "Mise à jour de votre événement",
    action: "warning",
    actionLabel: "REFUSÉ",
    notifType: "warning",
    preheader: "Votre événement n'a pas pu être validé pour le moment.",
    bodyFn: (e) =>
      `Votre événement <strong>"${e.title}"</strong> n'a pas pu être validé pour le moment. Consultez les notes de l'équipe ci-dessous pour plus de détails.`,
  },
  clarification_demandee: {
    title: "Précisions demandées — événement",
    headline: "Précisions requises",
    action: "demande",
    actionLabel: "ACTION REQUISE",
    notifType: "demande",
    preheader: "L'équipe KKD a besoin d'informations complémentaires.",
    bodyFn: (e) =>
      `L'équipe KKD Music a besoin d'informations complémentaires pour valider votre événement <strong>"${e.title}"</strong>. Merci de consulter le message ci-dessous et de mettre à jour votre événement.`,
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
    const infoRows = [
      ["Événement", data?.title],
      ["Date", data?.event_date ? new Date(data.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null],
      ["Lieu", data?.location],
      ["Ville", data?.city],
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
      cta: { label: "Gérer mon événement", url: `${SITE_URL}/mon-espace?tab=evenements` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(data)),
      type: cfg.notifType,
      link: "/mon-espace?tab=evenements",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyEventStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});