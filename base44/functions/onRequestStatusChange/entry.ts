import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATUS_MESSAGES = {
  en_cours: {
    title: '📋 Votre demande est en cours de traitement',
    message: 'L\'équipe KKD Music examine votre demande. Vous serez informé(e) dès qu\'une décision sera prise.',
    type: 'info',
  },
  accepte: {
    title: '✅ Votre demande a été acceptée !',
    message: 'Félicitations ! L\'équipe KKD Music a accepté votre demande. Nous prendrons contact avec vous très prochainement.',
    type: 'success',
  },
  refuse: {
    title: '❌ Votre demande n\'a pas été retenue',
    message: 'Après examen, votre demande n\'a pas pu être retenue pour le moment. N\'hésitez pas à soumettre une nouvelle demande.',
    type: 'warning',
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data, changed_fields } = body;

    // On réagit seulement si le statut a changé
    if (!changed_fields?.includes('status')) {
      return Response.json({ skipped: true });
    }

    const newStatus = data?.status;
    const userEmail = data?.email;

    if (!userEmail || !STATUS_MESSAGES[newStatus]) {
      return Response.json({ skipped: true });
    }

    const notifConfig = STATUS_MESSAGES[newStatus];

    // Créer la notification dans la base
    await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail,
      title: notifConfig.title,
      message: notifConfig.message,
      type: notifConfig.type,
      link: '/mon-espace',
      is_read: false,
    });

    // Envoyer aussi un email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: notifConfig.title.replace(/[✅❌📋]/g, '').trim(),
      body: `
Bonjour,

${notifConfig.message}

Connectez-vous à votre espace partenaire pour suivre l'état de vos demandes :
https://kkdmusic.com/mon-espace

Cordialement,
L'équipe KKD Music
      `.trim(),
      from_name: 'KKD Music',
    });

    return Response.json({ success: true, notified: userEmail, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});