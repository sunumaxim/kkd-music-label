/**
 * Notifie l'admin quand un partenaire soumet une nouvelle publication
 * + envoie une confirmation au partenaire.
 * Anti-injection : toutes les données proviennent de l'entité en base (data.id),
 * jamais du corps de la requête.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, escapeHtml } from "../../shared/emailKit.js";

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

    // Réservé aux admins : le workflow appelle la fonction en tant qu'admin créateur,
    // tout autre appelant (anonyme ou non-admin) est refusé.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) return Response.json({ error: "Non autorisé" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Réservé admin" }, { status: 403 });

    const body = await req.json();
    const { data } = body;

    // Récupérer l'enregistrement réel en base (anti-injection email)
    if (!data?.id) return Response.json({ skipped: true });
    const records = await base44.asServiceRole.entities.PartnerPublication.filter({ id: data.id });
    const rec = records[0];
    if (!rec) return Response.json({ skipped: true });
    if (!rec.partner_email) return Response.json({ skipped: true });

    // Champs contrôlés par le partenaire : échappés avant toute interpolation HTML
    const contentType = TYPE_LABELS[rec.content_type] || rec.content_type;
    const platform = PLATFORM_LABELS[rec.streaming_platform] || "Streaming";
    const safeTitle = escapeHtml(rec.title);
    const safePartner = escapeHtml(rec.partner_name || rec.partner_email);
    const safeType = escapeHtml(contentType);
    const safePlatform = escapeHtml(platform);
    const safeLink = escapeHtml(rec.streaming_link);
    const infoRows = [
      ["Titre", safeTitle],
      ["Type", safeType],
      ["Plateforme", safePlatform],
      ["Artiste", escapeHtml(rec.artist_name)],
    ];

    // === Confirmation au partenaire ===
    const partnerHtml = buildEmailHtml({
      subject: "Publication reçue",
      preheader: `Votre ${safeType} "${safeTitle}" a bien été soumis.`,
      action: "info",
      actionLabel: "REÇU",
      headline: "Publication bien reçue !",
      body: `Bonjour <strong>${safePartner}</strong>,<br><br>Votre publication <strong>"${safeTitle}"</strong> (${safeType}) a bien été soumise à l'équipe KKD Music.<br><br>Notre équipe va examiner votre contenu et vous informera de la suite donnée.`,
      infoRows,
      cta: { label: "Voir mes publications", url: `${SITE_URL}/mon-espace?tab=publications` },
    });

    await pushNotification({
      base44,
      userEmail: rec.partner_email,
      title: "Publication reçue !",
      message: `Votre publication "${rec.title}" a bien été soumise. Notre équipe vous répondra prochainement.`,
      type: "info",
      link: "/mon-espace?tab=publications",
      subject: "KKD Music — Publication bien reçue",
      body: partnerHtml,
    });

    // === Notifier les admins ===
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === "admin" && u.email);

    const adminHtml = buildEmailHtml({
      subject: `Nouvelle publication — ${safeTitle}`,
      preheader: `Nouveau ${safeType} à valider : "${safeTitle}".`,
      action: "nouveau",
      actionLabel: "NOUVELLE PUBLICATION",
      headline: "Nouvelle publication à valider",
      body: `<strong>${safePartner}</strong> vient de soumettre un nouveau contenu : <strong>"${safeTitle}"</strong> (${safeType} sur ${safePlatform}).`,
      infoRows,
      notes: safeLink,
      notesLabel: "Lien streaming",
      cta: { label: "Examiner la publication", url: `${SITE_URL}/admin/publications` },
    });

    await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `KKD Admin — Nouvelle publication : ${safeTitle}`,
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