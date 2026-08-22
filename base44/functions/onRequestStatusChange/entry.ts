/**
 * Notifie le demandeur quand le statut de sa demande de service change
 * (en_cours / accepte / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const TYPE_LABELS = {
  distribution: "Distribution musicale",
  promotion_musique: "Promotion musicale",
  promotion_clip: "Promotion de clip",
  partenariat_label: "Partenariat label",
  collaboration: "Collaboration artistique",
  autre: "Autre demande",
};

const STATUS_CONFIGS = {
  en_cours: {
    title: "Votre demande est en cours de traitement",
    headline: "Demande en cours d'examen",
    action: "info",
    actionLabel: "EN COURS",
    notifType: "info",
    preheader: "Notre équipe examine actuellement votre demande.",
    bodyFn: (d) => `Bonjour <strong>${d.full_name}</strong>,<br><br>Notre équipe examine actuellement votre demande de <strong>${TYPE_LABELS[d.request_type] || d.request_type}</strong>. Vous serez informé(e) dès qu'une décision sera prise.<br><br>Merci de votre patience.`,
  },
  accepte: {
    title: "Votre demande a été acceptée",
    headline: "Demande acceptée !",
    action: "success",
    actionLabel: "ACCEPTÉ",
    notifType: "success",
    preheader: "Félicitations, votre demande a été acceptée.",
    bodyFn: (d) => `Bonjour <strong>${d.full_name}</strong>,<br><br>Félicitations ! L'équipe KKD Music a accepté votre demande de <strong>${TYPE_LABELS[d.request_type] || d.request_type}</strong>.<br><br>Nous prendrons contact avec vous très prochainement pour la suite.`,
  },
  refuse: {
    title: "Mise à jour de votre demande",
    headline: "Mise à jour de votre demande",
    action: "warning",
    actionLabel: "REFUSÉ",
    notifType: "warning",
    preheader: "Votre demande n'a pas pu être retenue.",
    bodyFn: (d) => `Bonjour <strong>${d.full_name}</strong>,<br><br>Après examen, votre demande de <strong>${TYPE_LABELS[d.request_type] || d.request_type}</strong> n'a pas pu être retenue pour le moment.<br><br>N'hésitez pas à soumettre une nouvelle demande ou à nous contacter pour en savoir plus.`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, old_data, changed_fields } = body;

    if (!changed_fields?.includes("status")) return Response.json({ skipped: true });

    const newStatus = data?.status;
    const userEmail = data?.email;

    if (!userEmail || !STATUS_CONFIGS[newStatus]) return Response.json({ skipped: true });
    if (old_data?.status === newStatus) return Response.json({ skipped: true });

    const verified = await verifyStatusChange({ base44, entityName: "ServiceRequest", id: data?.id, field: "status", expected: newStatus });
    if (!verified) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIGS[newStatus];
    const requestType = TYPE_LABELS[data.request_type] || data.request_type;
    const infoRows = [
      ["Type de demande", requestType],
      ["Artiste", data.artist_name],
      ["Organisation", data.organization],
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
      cta: { label: "Voir mes demandes", url: `${SITE_URL}/mon-espace?tab=demandes` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(data)),
      type: cfg.notifType,
      link: "/mon-espace?tab=demandes",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("onRequestStatusChange error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});