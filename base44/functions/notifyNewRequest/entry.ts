/**
 * Notifie l'admin + envoie une confirmation au demandeur quand une nouvelle
 * demande de service est créée.
 * Anti-injection : toutes les données proviennent de l'entité en base (data.id),
 * jamais du corps de la requête.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml, stripHtml, pushNotification } from "../../shared/emailKit.js";

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
    const body = await req.json();
    const { data } = body;

    // Récupérer l'enregistrement réel en base (anti-injection email)
    if (!data?.id) return Response.json({ skipped: true });
    const records = await base44.asServiceRole.entities.ServiceRequest.filter({ id: data.id });
    const rec = records[0];
    if (!rec) return Response.json({ skipped: true });
    if (!rec.email) return Response.json({ skipped: true });

    const requestType = TYPE_LABELS[rec.request_type] || rec.request_type;
    const infoRows = [
      ["Type de demande", requestType],
      ["Artiste", rec.artist_name],
      ["Organisation", rec.organization],
      ["Genre musical", rec.genre],
    ];

    // === Email de confirmation au demandeur ===
    const confirmHtml = buildEmailHtml({
      subject: "Demande bien reçue",
      preheader: `Votre demande de ${requestType} a été enregistrée.`,
      action: "info",
      actionLabel: "REÇU",
      headline: "Votre demande a été reçue !",
      body: `Bonjour <strong>${rec.full_name}</strong>,<br><br>Nous avons bien reçu votre demande de <strong>${requestType}</strong>. Notre équipe l'examine et vous contactera dans les meilleurs délais.<br><br>Voici le récapitulatif de votre demande :`,
      infoRows,
      notes: rec.description,
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
      subject: `Nouvelle demande — ${rec.full_name}`,
      preheader: `Nouvelle demande de ${requestType} reçue.`,
      action: "nouveau",
      actionLabel: "NOUVELLE DEMANDE",
      headline: `Nouvelle demande : ${requestType}`,
      body: `<strong>${rec.full_name}</strong> (${rec.email}) vient de soumettre une nouvelle demande de <strong>${requestType}</strong>.`,
      infoRows,
      notes: rec.description,
      notesLabel: "Message du demandeur",
      cta: { label: "Examiner la demande", url: `${SITE_URL}/admin/demandes` },
    });

    await Promise.all(
      admins.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `KKD Admin — Nouvelle demande de ${rec.full_name}`,
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