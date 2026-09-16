// Google reCAPTCHA Enterprise Integration for KKD Music
import firebaseConfig from '../../firebase-applet-config.json';

export const RECAPTCHA_SITE_KEY = firebaseConfig.recaptchaSiteKey || '6LeWJL8tAAAAAG9HBCl-TxymsCKY0SZ3MNjOXECm';

/**
 * Exécute reCAPTCHA Enterprise pour une action donnée (ex: 'LOGIN', 'REGISTER', 'PASSWORD_RESET')
 * @param {string} action - Nom de l'action pour le score de risque (alphanumérique et underscores)
 * @param {number} timeoutMs - Délai maximal en ms avant abandon pour ne pas bloquer l'utilisateur (défaut: 4000ms)
 * @returns {Promise<string|null>} Token d'attestation reCAPTCHA ou null en cas d'indisponibilité
 */
export async function executeRecaptcha(action = 'LOGIN', timeoutMs = 4000) {
  if (typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    let hasResolved = false;

    // Timer de secours : si le script reCAPTCHA est bloqué (ex: ad-blocker ou réseau lent), ne jamais bloquer l'utilisateur
    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        console.warn(`[reCAPTCHA Enterprise] Délai d'attente dépassé (${timeoutMs}ms) pour l'action: ${action}`);
        resolve(null);
      }
    }, timeoutMs);

    const safeResolve = (token) => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timer);
        resolve(token);
      }
    };

    try {
      if (!window.grecaptcha || !window.grecaptcha.enterprise) {
        // Le script est peut-être en cours de chargement
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts += 1;
          if (window.grecaptcha?.enterprise?.ready) {
            clearInterval(checkInterval);
            window.grecaptcha.enterprise.ready(async () => {
              try {
                const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
                safeResolve(token);
              } catch (err) {
                console.warn('[reCAPTCHA Enterprise] Erreur execute:', err);
                safeResolve(null);
              }
            });
          } else if (attempts >= 20) { // 2 secondes de vérification
            clearInterval(checkInterval);
            safeResolve(null);
          }
        }, 100);
        return;
      }

      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
          safeResolve(token);
        } catch (error) {
          console.warn('[reCAPTCHA Enterprise] Erreur execute:', error);
          safeResolve(null);
        }
      });
    } catch (e) {
      console.warn('[reCAPTCHA Enterprise] Exception:', e);
      safeResolve(null);
    }
  });
}
