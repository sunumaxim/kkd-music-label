/**
 * Notifie l'utilisateur quand sa demande d'accès à un profil artiste
 * change de statut (approuve / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  approuve: {
    title: "Accès artiste accordé",
    headline: "Votre accès artiste est actif !",
    action: "success",
    actionLabel: "APPROUVÉ",
    notifType: "success",
    preheader: "Vous pouvez désormais gérer ce profil artiste.",
    bodyFn: (r) =>
      `Votre demande d'accès au profil de <strong>${r.artist_name}</strong> a été approuvée. Vous pouvez désormais gérer ce profil depuis votre espace partenaire : publications, événements, statistiques et paiements.`,
  },
  refuse: {
    title: "Demande d'accès refusée",
    headline: "Mise à jour de votre demande d'accès",
    action: "warning",
    actionLabel: "REFUSÉ",
    notifType: "warning",
    preheader: "Votre demande d'accès n'a pas pu être accordée.",
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
    if (!STATUS_CONFIG[newStatus]) return Response.json({ skipped: true });
    if (old_data?.status === newStatus) return Response.json({ skipped: true });

    const verified = await verifyStatusChange({ base44, entityName: "ArtistAccessRequest", id: data?.id, field: "status", expected: newStatus });
    if (!verified) return Response.json({ skipped: true });

    const userEmail = verified.user_email;
    if (!userEmail) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIG[newStatus];
    const infoRows = [
      ["Artiste", verified.artist_name],
      ["Demandeur", verified.user_email],
    ];

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      preheader: cfg.preheader,
      action: cfg.action,
      actionLabel: cfg.actionLabel,
      headline: cfg.headline,
      body: cfg.bodyFn(verified),
      infoRows,
      notes: verified.admin_notes,
      notesLabel: "Message de l'équipe KKD",
      cta: { label: "Accéder à mon espace artiste", url: `${SITE_URL}/mon-espace?tab=artiste` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(verified)),
      type: cfg.notifType,
      link: "/mon-espace?tab=artiste",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyAccessRequestStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});