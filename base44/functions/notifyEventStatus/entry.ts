/**
 * Notifie l'organisateur (partenaire) quand le statut de validation
 * de son événement change (approuve / refuse / clarification) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange, escapeHtml, requireAdmin } from "../../shared/emailKit.js";

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

    // Réservé aux admins : le workflow appelle la fonction en tant qu'admin,
    // tout appelant anonyme ou non-admin est refusé.
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { data, old_data, changed_fields } = body;

    if (!changed_fields?.includes("published_status")) return Response.json({ skipped: true });

    const newStatus = data?.published_status;

    if (!STATUS_CONFIG[newStatus]) return Response.json({ skipped: true });
    if (old_data?.published_status === newStatus) return Response.json({ skipped: true });

    // Récupérer l'enregistrement réel en base (anti-injection email)
    const rec = await verifyStatusChange({ base44, entityName: "Event", id: data?.id, field: "published_status", expected: newStatus });
    if (!rec) return Response.json({ skipped: true });

    const userEmail = rec.organizer_email;
    if (!userEmail) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIG[newStatus];
    // Champs contrôlés par l'utilisateur : échappés avant toute interpolation HTML
    const safe = {
      title: escapeHtml(rec.title),
      location: escapeHtml(rec.location),
      city: escapeHtml(rec.city),
      admin_notes: escapeHtml(rec.admin_notes),
    };
    const infoRows = [
      ["Événement", safe.title],
      ["Date", rec.event_date ? new Date(rec.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null],
      ["Lieu", safe.location],
      ["Ville", safe.city],
    ];

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      preheader: cfg.preheader,
      action: cfg.action,
      actionLabel: cfg.actionLabel,
      headline: cfg.headline,
      body: cfg.bodyFn(safe),
      infoRows,
      notes: safe.admin_notes,
      notesLabel: "Message de l'équipe KKD",
      cta: { label: "Gérer mon événement", url: `${SITE_URL}/mon-espace?tab=evenements` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(rec)),
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