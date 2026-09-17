/**
 * Notifie le partenaire quand le statut de sa publication change
 * (approuve / publie / refuse) — in-app + email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, verifyStatusChange } from "../../shared/emailKit.js";

const STATUS_CONFIG = {
  approuve: {
    title: "Votre publication a été approuvée",
    headline: "Publication approuvée !",
    action: "success",
    actionLabel: "APPROUVÉ",
    notifType: "success",
    preheader: "Notre équipe va planifier la publication de votre contenu.",
    bodyFn: (pub) => `Bonne nouvelle ! Votre contenu <strong>"${pub.title}"</strong> a été approuvé par l'équipe KKD Music.<br><br>Notre équipe va maintenant planifier la publication et la promotion de votre contenu sur nos canaux.`,
  },
  publie: {
    title: "Votre contenu est maintenant en ligne",
    headline: "Votre contenu est en ligne !",
    action: "success",
    actionLabel: "PUBLIÉ",
    notifType: "success",
    preheader: "Votre contenu est désormais visible par tous les fans.",
    bodyFn: (pub) => `Votre contenu <strong>"${pub.title}"</strong> est désormais en ligne et promu par KKD Music.<br><br>Retrouvez votre publication sur notre plateforme et partagez-la avec votre communauté !`,
  },
  refuse: {
    title: "Mise à jour concernant votre publication",
    headline: "Mise à jour de votre publication",
    action: "warning",
    actionLabel: "REFUSÉ",
    notifType: "warning",
    preheader: "Votre contenu n'a pas pu être retenu pour le moment.",
    bodyFn: (pub) => `Après examen, votre contenu <strong>"${pub.title}"</strong> n'a pas pu être retenu pour le moment.<br><br>N'hésitez pas à soumettre une nouvelle publication ou à nous contacter pour en savoir plus.`,
  },
};

const TYPE_LABELS = {
  sortie_musicale: "Single", video_clip: "Clip vidéo", playlist: "Playlist",
  album: "Album", ep: "EP / Mixtape", autre: "Autre",
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

    // Récupérer l'enregistrement réel en base (anti-injection email)
    const rec = await verifyStatusChange({ base44, entityName: "PartnerPublication", id: data?.id, field: "status", expected: newStatus });
    if (!rec) return Response.json({ skipped: true });

    const userEmail = rec.partner_email;
    if (!userEmail) return Response.json({ skipped: true });

    const cfg = STATUS_CONFIG[newStatus];
    const contentType = TYPE_LABELS[rec.content_type] || rec.content_type || "Contenu";
    const infoRows = [
      ["Titre", rec.title],
      ["Type", contentType],
      ["Artiste", rec.artist_name],
    ];

    const htmlBody = buildEmailHtml({
      subject: cfg.title,
      preheader: cfg.preheader,
      action: cfg.action,
      actionLabel: cfg.actionLabel,
      headline: cfg.headline,
      body: cfg.bodyFn(rec),
      infoRows,
      notes: rec.admin_notes,
      notesLabel: "Message de l'équipe KKD",
      cta: { label: "Voir mes publications", url: `${SITE_URL}/mon-espace?tab=publications` },
    });

    await pushNotification({
      base44,
      userEmail,
      title: cfg.headline,
      message: stripHtml(cfg.bodyFn(rec)),
      type: cfg.notifType,
      link: "/mon-espace?tab=publications",
      subject: `KKD Music — ${cfg.title}`,
      body: htmlBody,
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    console.error("notifyPublicationStatus error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});