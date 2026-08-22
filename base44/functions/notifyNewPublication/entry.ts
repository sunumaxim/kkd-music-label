/**
 * Notifie l'admin quand un partenaire soumet une nouvelle publication
 * + envoie une confirmation au partenaire.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification } from "../../shared/emailKit.js";

const TYPE_LABELS = {
  sortie_musicale: "Single", video_clip: "Clip vidéo", playlist: "Playlist",
  album: "Album", ep: "EP / Mixtape", autre: "Autre",
};

const PLATFORM_LABELS = {
  spotify: "Spotify", apple_music: "Apple Music", youtube: "YouTube",
  audiomack: "Audiomack", amazon_music: "Amazon Music", deezer: "Deezer",
  soundcloud: "SoundCloud", autre: "Autre",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data } = body;

    if (!data?.partner_email) return Response.json({ skipped: true });

    const contentType = TYPE_LABELS[data.content_type] || data.content_type;
    const platform = PLATFORM_LABELS[data.streaming_platform] || "Streaming";
    const infoRows = [
      ["Titre", data.title],
      ["Type", contentType],
      ["Plateforme", platform],
      ["Artiste", data.artist_name],
    ];

    // === Confirmation au partenaire ===
    const partnerHtml = buildEmailHtml({
      subject: "Publication reçue",
      preheader: `Votre ${contentType} "${data.title}" a bien été soumis.`,
      action: "info",
      actionLabel: "REÇU",
      headline: "Publication bien reçue !",
      body: `Bonjour <strong>${data.partner_name || data.partner_email}</strong>,<br><br>Votre publication <strong>"${data.title}"</strong> (${contentType}) a bien été soumise à l'équipe KKD Music.<br><br>Notre équipe va examiner votre contenu et vous informera de la suite donnée.`,
      infoRows,
      cta: { label: "Voir mes publications", url: `${SITE_URL}/mon-espace?tab=publications` },
    });

    await pushNotification({
      base44,
      userEmail: data.partner_email,
      title: "Publication reçue !",
      message: `Votre publication "${data.title}" a bien été soumise. Notre équipe vous répondra prochainement.`,
      type: "info",
      link: "/mon-espace?tab=publications",
      subject: "KKD Music — Publication bien reçue",
      body: partnerHtml,
    });

    // === Notifier les admins ===
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === "admin" && u.email);

    const adminHtml = buildEmailHtml({
      subject: `Nouvelle publication — ${data.title}`,
      preheader: `Nouveau ${contentType} à valider : "${data.title}".`,
      action: "nouveau",
      actionLabel: "NOUVELLE PUBLICATION",
      headline: "Nouvelle publication à valider",
      body: `<strong>${data.partner_name || data.partner_email}</strong> vient de soumettre un nouveau contenu : <strong>"${data.title}"</strong> (${contentType} sur ${platform}).`,
      infoRows,
      notes: data.streaming_link,
      notesLabel: "Lien streaming",
      cta: { label: "Examiner la publication", url: `${SITE_URL}/admin/publications` },
    });

    await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `KKD Admin — Nouvelle publication : ${data.title}`,
          body: adminHtml,
          from_name: "KKD Music",
        }).catch((e) => console.error("admin email skipped:", e?.message || e))
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyNewPublication error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});