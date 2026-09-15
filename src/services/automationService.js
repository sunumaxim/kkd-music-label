// KKD Music — Moteur d'Automatisations & Relances Contextuelles Intelligentes
// Synchronise les emails contextuels, les alertes d'événements, les sorties musicales
// et les notifications push in-app / web push sans surcharge inutile.

import { base44 } from '@/api/base44Client';
import { localDb } from '@/api/localStore';

const LOGS_STORAGE_KEY = 'kkd_automation_execution_logs_v1';
const SETTINGS_STORAGE_KEY = 'kkd_automation_rules_config_v1';
const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

export const AUTOMATION_TYPES = {
  event_reminder: {
    id: 'event_reminder',
    title: 'Relance Créateurs d\'Événements (J-7, J-3, J-1)',
    desc: "Envoie un rappel contextuel à l'organisateur avec consignes de scan et lien de contrôle de billetterie.",
    badge: 'ÉVÉNEMENT',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  release_broadcast: {
    id: 'release_broadcast',
    title: 'Diffusion Nouvelle Sortie Musicale',
    desc: 'Notifie automatiquement la communauté lors de la mise en ligne d’un single, album ou clip.',
    badge: 'SORTIE MUSICALE',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  follower_alert: {
    id: 'follower_alert',
    title: 'Alerte Abonnés d\'un Artiste',
    desc: 'Notifie directement les fans abonnés lorsqu’un artiste spécifique publie une nouveauté.',
    badge: 'ABONNÉS ARTISTE',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
  feature_announcement: {
    id: 'feature_announcement',
    title: 'Nouveautés & Fonctionnalités Plateforme',
    desc: 'Communique les améliorations aux artistes et labels partenaires de manière ciblée.',
    badge: 'PLATEFORME',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }
};

class AutomationService {
  constructor() {
    this._initSettings();
  }

  _initSettings() {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem(SETTINGS_STORAGE_KEY)) {
        this.saveSettings({
          event_reminder_active: true,
          release_broadcast_active: true,
          follower_alert_active: true,
          feature_announcement_active: true,
          auto_push_enabled: true,
        });
      }
    } catch {
      // Ignore
    }
  }

  getSettings() {
    return this._getSettings();
  }

  _getSettings() {
    try {
      if (typeof window === 'undefined') return {};
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {
        event_reminder_active: true,
        release_broadcast_active: true,
        follower_alert_active: true,
        feature_announcement_active: true,
        auto_push_enabled: true,
      };
    } catch {
      return { event_reminder_active: true, auto_push_enabled: true };
    }
  }

  saveSettings(newSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  }

  _getLogs() {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _addLog(log) {
    try {
      const logs = this._getLogs();
      logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        ...log,
      });
      // Garder les 50 derniers logs
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('kkd:automation_logs_updated'));
    } catch (e) {
      console.warn('[AutomationService] Log error:', e);
    }
  }

  /**
   * Envoie une notification push in-app et Web Push de façon résiliente
   */
  async triggerPushNotification({ email, title, message, link, type = 'info' }) {
    if (!email) return;

    // 1. In-App Notification (Database)
    try {
      if (base44?.entities?.Notification?.create) {
        await base44.entities.Notification.create({
          user_email: email,
          title,
          message,
          type,
          link: link || '/mon-espace',
          is_read: false,
          created_date: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Local fallback
      localDb.insertItem('notifications', {
        id: `notif_${Date.now()}`,
        user_email: email,
        title,
        message,
        type,
        link: link || '/mon-espace',
        is_read: false,
        created_date: new Date().toISOString(),
      });
    }

    // 2. Déclencher Web Push API si l'onglet est actif et permission accordée
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      try {
        new window.Notification(title, {
          body: message,
          icon: LOGO_URL,
        });
      } catch {
        // silencieux
      }
    }

    // Émettre événement DOM pour rafraîchir la cloche de notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:new_notification'));
    }
  }

  /**
   * 1. Analyse les événements approchants et déclenche les relances automatiques
   */
  async scanUpcomingEvents() {
    const executed = [];
    try {
      const events = await base44.entities.Event.list('-date', 100);
      const now = new Date().getTime();

      for (const event of events) {
        if (!event.date) continue;
        const eventDate = new Date(event.date).getTime();
        const diffHours = (eventDate - now) / (1000 * 3600);
        const daysLeft = Math.ceil(diffHours / 24);

        // Si l'événement a lieu dans 7 jours ou moins et est dans le futur
        if (daysLeft >= 0 && daysLeft <= 7) {
          const organizerEmail = event.organizer_email || event.contact_email || 'contact@kkdmusic.com';
          const formattedEventDate = new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          const title = `⚠️ Rappel J-${daysLeft > 0 ? daysLeft : 'J'} : "${event.title}" approche !`;
          const message = `Votre événement "${event.title}" aura lieu le ${formattedEventDate} au ${event.location || 'lieu prévu'}. Pensez à vérifier vos scanners sur controle.kkdmusic.com.`;

          // Envoyer notification push
          await this.triggerPushNotification({
            email: organizerEmail,
            title,
            message,
            link: '/controle-acces',
            type: 'warning',
          });

          // Envoyer email contextuel
          try {
            await base44.functions.invoke('sendMailingCampaign', {
              subject: `⚠️ Relance J-${daysLeft} : Préparation de votre événement "${event.title}"`,
              headline: `Organisation & Contrôle d'accès : ${event.title}`,
              body: `Bonjour,\n\nVotre événement officiel "${event.title}" est programmé pour le ${formattedEventDate} au ${event.location || 'lieu convenu'}.\n\nAfin d'assurer un accueil impeccable du public et la sécurité de votre billetterie :\n• Vos agents peuvent se connecter directement sur l'application de contrôle : controle.kkdmusic.com/controle-acces\n• Les billets électroniques émis comportent des QR codes infalsifiables à signature horodatée.\n\nRestant à vos côtés pour le succès de cet événement.`,
              cta: { label: "Accéder au Scanner de Billets", url: `${window.location.origin}/controle-acces` },
              audience: 'custom',
              custom_emails: organizerEmail,
              theme: 'noble_red',
              badge_label: `RAPPEL ÉVÉNEMENT J-${daysLeft}`,
              signer_id: 'direction',
              sender: {
                name: 'Direction KKD Music',
                role: 'Coordination Événements & Billetterie',
                email: 'contact@kkdmusic.com',
              }
            });
          } catch (e) {
            console.warn('[Automation] Email send skipped:', e?.message || e);
          }

          executed.push({
            type: 'event_reminder',
            target: organizerEmail,
            details: `Relance J-${daysLeft} envoyée pour "${event.title}"`,
          });
        }
      }
    } catch (e) {
      console.warn('[Automation] scanUpcomingEvents error:', e);
    }
    return executed;
  }

  /**
   * 2. Analyse les nouvelles sorties et diffuse l'annonce
   */
  async scanRecentReleases() {
    const executed = [];
    try {
      const releases = await base44.entities.Release.list('-created_date', 5);
      if (releases.length > 0) {
        const latest = releases[0];
        const title = `🎵 Nouveau single disponible : "${latest.title}"`;
        const message = `Découvrez en exclusivité le titre "${latest.title}" de ${latest.artist_name} sur KKD Music.`;

        // Notifier les administrateurs et partenaires
        const users = await base44.entities.User?.list?.() || [];
        const emails = users.slice(0, 5).map(u => u.email).filter(Boolean);

        for (const email of emails) {
          await this.triggerPushNotification({
            email,
            title,
            message,
            link: `/musique/${latest.slug || latest.id}`,
            type: 'success',
          });
        }

        executed.push({
          type: 'release_broadcast',
          target: `${emails.length} utilisateurs`,
          details: `Diffusion du nouveau titre "${latest.title}" (${latest.artist_name})`,
        });
      }
    } catch (e) {
      console.warn('[Automation] scanRecentReleases error:', e);
    }
    return executed;
  }

  /**
   * 3. Exécution globale de toutes les automatisations avec journalisation
   */
  async executeAllAutomations() {
    const results = [];
    const eventsRun = await this.scanUpcomingEvents();
    results.push(...eventsRun);

    const releasesRun = await this.scanRecentReleases();
    results.push(...releasesRun);

    this._addLog({
      action: 'Automatisations & Relances Contextuelles Exécutées',
      count: results.length,
      items: results,
      status: 'succes',
    });

    return {
      success: true,
      executed_count: results.length,
      items: results,
    };
  }

  /**
   * Récupère l'historique d'exécution
   */
  getLogs() {
    return this._getLogs();
  }
}

export const automationService = new AutomationService();
