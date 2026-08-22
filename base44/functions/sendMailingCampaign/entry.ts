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

    const { subject, headline, body, cta, audience, image_url, custom_emails } = await req.json();

    if (!subject || !headline || !body) {
      return Response.json({ error: "subject, headline et body sont requis" }, { status: 400 });
    }

    let recipients = [];

    if (audience === "custom") {
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
      return Response.json({ success: true, sent: 0, message: "Aucun destinataire trouvé" });
    }

    const extraImg = image_url ? `<img src="${image_url}" alt="" style="width:100%;max-height:280px;object-fit:cover;display:block;border-radius:10px;margin-bottom:24px;"/>` : "";

    const htmlBody = buildEmailHtml({
      subject,
      preheader: headline,
      action: "info",
      actionLabel: "ANNONCE",
      headline,
      body: `<div style="white-space:pre-wrap;">${body}</div>`,
      extra: extraImg,
      cta: cta?.label ? { label: cta.label, url: cta.url || SITE_URL } : null,
    });

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
            from_name: "KKD Music",
          }).catch((e) => console.error("mailing send skipped:", e?.message || e))
        )
      );
      sent += batch.length;
    }

    return Response.json({ success: true, sent, total: uniqueRecipients.length });
  } catch (error) {
    console.error("sendMailingCampaign error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});