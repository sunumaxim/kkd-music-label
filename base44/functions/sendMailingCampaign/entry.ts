/**
 * Envoie une campagne email aux partenaires / artistes / admins ou adresses custom.
 * Utilise le kit d'emails partagé (emailKit.js) pour un design unifié.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { SITE_URL, buildEmailHtml } from "../../shared/emailKit.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }

    const {
      subject,
      headline,
      body,
      cta,
      audience,
      image_url,
      custom_emails,
      theme = "prestige_dark",
      badge_label = "COMMUNICATION OFFICIELLE",
      sender = null,
      signer_id = "abdoulaye",
      streaming_links = [],
      is_test = false,
      test_email = null,
      // Nouveaux paramètres contextuels & push
      context_type = null,
      context_meta = null,
      context_notice = null,
      send_push = true,
      push_title = null,
      push_message = null,
    } = await req.json();

    if (!subject || !headline || !body) {
      return Response.json({ error: "subject, headline et body sont requis" }, { status: 400 });
    }

    let recipients = [];

    if (is_test) {
      const targetTest = (test_email || user.email || "").trim();
      if (!targetTest || !targetTest.includes("@")) {
        return Response.json({ error: "Adresse email de test invalide" }, { status: 400 });
      }
      recipients = [{ email: targetTest, name: "Test Admin (Abdoulaye Sylla)" }];
    } else if (audience === "custom") {
      const rawEmails = (custom_emails || "").split(/[\n,]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
      recipients = rawEmails.map((e) => ({ email: e, name: e }));
    } else {
      if (audience === "all" || audience === "partners") {
        const allUsers = await base44.asServiceRole.entities.User.list();
        const partners = allUsers.filter((u) => u.role === "user" && u.email);
        recipients.push(...partners.map((u) => ({ email: u.email, name: u.full_name || u.email })));
      }

      if (audience === "all" || audience === "admins") {
        const allUsers = await base44.asServiceRole.entities.User.list();
        const admins = allUsers.filter((u) => u.role === "admin" && u.email && u.email !== user.email);
        recipients.push(...admins.map((u) => ({ email: u.email, name: u.full_name || u.email })));
      }

      if (audience === "all" || audience === "requests") {
        const requests = await base44.asServiceRole.entities.ServiceRequest.list();
        const seen = new Set();
        for (const r of requests) {
          if (r.email && !seen.has(r.email)) {
            seen.add(r.email);
            recipients.push({ email: r.email, name: r.full_name || r.email });
          }
        }
      }

      if (audience === "all" || audience === "artists") {
        const invites = await base44.asServiceRole.entities.ArtistInvite.filter({ status: "actif" });
        for (const inv of invites) {
          if (inv.email) recipients.push({ email: inv.email, name: inv.artist_name || inv.email });
        }
      }
    }

    const seen = new Set();
    const uniqueRecipients = recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    if (uniqueRecipients.length === 0) {
      return Response.json({ success: true, sent: 0, sent_pushes: 0, message: "Aucun destinataire trouvé" });
    }

    const extraImg = image_url ? `<img src="${image_url}" alt="" style="width:100%;max-height:280px;object-fit:cover;display:block;border-radius:10px;margin-bottom:24px;"/>` : "";

    const htmlBody = buildEmailHtml({
      subject,
      preheader: headline,
      badge_label,
      action: "info",
      actionLabel: badge_label,
      headline,
      body: `<div style="white-space:pre-wrap;">${body}</div>`,
      extra: extraImg,
      cta: cta?.label ? { label: cta.label, url: cta.url || SITE_URL } : null,
      theme,
      sender,
      signer_id,
      streaming_links,
      context_type,
      context_meta,
      context_notice,
      enable_context_card: Boolean(context_type || context_meta),
    });

    const fromName = sender?.name ? `${sender.name} · KKD Music` : "Abdoulaye Sylla · KKD Music";

    let sent = 0;
    const batchSize = 10;
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      await Promise.all(
        batch.map((r) =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: r.email,
            subject,
            body: htmlBody,
            from_name: fromName,
          }).catch((e) => console.error("mailing send skipped:", e?.message || e))
        )
      );
      sent += batch.length;
    }

    // ── RENFORCEMENT PUSH NOTIFICATIONS ──
    // Permet aux mails d'agir avec force sur les notifications push in-app et mobiles/desktop
    let sentPushes = 0;
    if (send_push && uniqueRecipients.length > 0) {
      const pTitle = push_title || subject;
      const cleanBody = (body || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const pMessage = push_message || (headline ? `${headline} : ${cleanBody.slice(0, 110)}...` : cleanBody.slice(0, 140));
      const pLink = cta?.url || (context_type === 'event' ? '/events' : context_type === 'release' ? '/catalogue' : '/mon-espace');
      const pType = context_type === 'event' ? 'event' : context_type === 'release' ? 'release' : 'mailing';

      // Pour les tests, envoyer uniquement au test_email
      const pushTargets = is_test ? [{ email: uniqueRecipients[0].email }] : uniqueRecipients;

      // Créer les notifications in-app par lots
      for (let i = 0; i < pushTargets.length; i += batchSize) {
        const pushBatch = pushTargets.slice(i, i + batchSize);
        await Promise.all(
          pushBatch.map(async (r) => {
            try {
              await base44.asServiceRole.entities.Notification.create({
                user_email: r.email,
                title: pTitle,
                message: pMessage,
                type: pType,
                link: pLink,
                is_read: false,
              });
              sentPushes++;
            } catch (err) {
              // Ignore if user does not exist in Notification table
              console.warn("Push notification creation error for", r.email, err?.message);
            }
          })
        );
      }
    }

    return Response.json({
      success: true,
      sent,
      sent_pushes: sentPushes,
      total: uniqueRecipients.length,
      is_test,
      context_type: context_type || 'standard'
    });
  } catch (error) {
    console.error("sendMailingCampaign error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});