/**
 * Notifie l'admin + envoie une confirmation au demandeur quand une nouvelle
 * demande de service est créée.
 * Anti-injection : toutes les données proviennent de l'entité en base (data.id),
 * jamais du corps de la requête.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification, escapeHtml } from "../../shared/emailKit.js";

const TYPE_LABELS = {
  distribution: "Distribution musicale",
  promotion_musique: "Promotion musicale",
  promotion_clip: "Promotion de clip",
  partenariat_label: "Partenariat label",
  collaboration: "Collaboration artistique",
  autre: "Autre demande",
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
    const records = await base44.asServiceRole.entities.ServiceRequest.filter({ id: data.id });
    const rec = records[0];
    if (!rec) return Response.json({ skipped: true });
    if (!rec.email) return Response.json({ skipped: true });

    // Champs contrôlés par l'utilisateur : échappés avant toute interpolation HTML
    const requestType = TYPE_LABELS[rec.request_type] || rec.request_type;
    const safeType = escapeHtml(requestType);
    const safeName = escapeHtml(rec.full_name);
    const safeMessage = escapeHtml(rec.description);
    const infoRows = [
      ["Type de demande", safeType],
      ["Artiste", escapeHtml(rec.artist_name)],
      ["Organisation", escapeHtml(rec.organization)],
      ["Genre musical", escapeHtml(rec.genre)],
    ];

    // === Email de confirmation au demandeur ===
    const confirmHtml = buildEmailHtml({
      subject: "Demande bien reçue",
      preheader: `Votre demande de ${safeType} a été enregistrée.`,
      action: "info",
      actionLabel: "REÇU",
      headline: "Votre demande a été reçue !",
      body: `Bonjour <strong>${safeName}</strong>,<br><br>Nous avons bien reçu votre demande de <strong>${safeType}</strong>. Notre équipe l'examine et vous contactera dans les meilleurs délais.<br><br>Voici le récapitulatif de votre demande :`,
      infoRows,
      notes: safeMessage,
      notesLabel: "Votre message",
      cta: { label: "Suivre ma demande", url: `${SITE_URL}/mon-espace?tab=demandes` },
    });

    await pushNotification({
      base44,
      userEmail: rec.email,
      title: "Demande bien reçue !",
      message: `Votre demande de ${requestType} a été enregistrée. Nous reviendrons vers vous très prochainement.`,
      type: "info",
      link: "/mon-espace?tab=demandes",
      subject: "KKD Music — Votre demande a bien été reçue",
      body: confirmHtml,
    });

    // === Notifier les admins ===
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === "admin" && u.email);

    const adminHtml = buildEmailHtml({
      subject: `Nouvelle demande — ${safeName}`,
      preheader: `Nouvelle demande de ${safeType} reçue.`,
      action: "nouveau",
      actionLabel: "NOUVELLE DEMANDE",
      headline: `Nouvelle demande : ${safeType}`,
      body: `<strong>${safeName}</strong> (${escapeHtml(rec.email)}) vient de soumettre une nouvelle demande de <strong>${safeType}</strong>.`,
      infoRows,
      notes: safeMessage,
      notesLabel: "Message du demandeur",
      cta: { label: "Examiner la demande", url: `${SITE_URL}/admin/demandes` },
    });

    await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `KKD Admin — Nouvelle demande de ${safeName}`,
          body: adminHtml,
          from_name: "KKD Music",
        }).catch((e) => console.error("admin email skipped:", e?.message || e))
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("notifyNewRequest error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});