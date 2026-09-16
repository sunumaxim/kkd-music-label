// Vérification côté Backend de Google reCAPTCHA Enterprise
// Valide le token généré par le client auprès de l'API Google Cloud reCAPTCHA Enterprise
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const SITE_KEY = firebaseConfig.recaptchaSiteKey || '6LeWJL8tAAAAAG9HBCl-TxymsCKY0SZ3MNjOXECm';
const DEFAULT_PROJECT_ID = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID || 'kkdmusic-774df';
const DEFAULT_API_KEY = process.env.RECAPTCHA_ENTERPRISE_API_KEY || firebaseConfig.apiKey;

/**
 * Valide un token reCAPTCHA Enterprise auprès des serveurs Google
 * @param {Object} params
 * @param {string} params.token - Token reCAPTCHA généré par le client
 * @param {string} [params.action] - Action attendue (ex: 'LOGIN', 'REGISTER', 'submit')
 * @param {string} [params.siteKey] - Clé de site reCAPTCHA
 * @param {number} [params.minScore] - Score de risque minimal accepté (0.0 à 1.0, défaut 0.5)
 * @returns {Promise<{valid: boolean, score?: number, simulated?: boolean, reason?: string, error?: string}>}
 */
export async function verifyRecaptchaToken({
  token,
  action = 'LOGIN',
  siteKey = SITE_KEY,
  minScore = 0.5,
}) {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Token reCAPTCHA manquant ou invalide',
    };
  }

  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID || DEFAULT_PROJECT_ID;
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY || DEFAULT_API_KEY;

  if (!apiKey) {
    console.warn('[reCAPTCHA Enterprise Backend] Aucune clé API Google configurée.');
    return {
      valid: true,
      simulated: true,
      score: 1.0,
      warning: 'Clé API Google non définie, validation permissive temporaire.',
    };
  }

  try {
    const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    const payload = {
      event: {
        token,
        siteKey: siteKey || SITE_KEY,
        expectedAction: action,
      },
    };

    const response = await fetch(assessmentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || response.statusText;
      console.warn(`[reCAPTCHA Enterprise Backend] Statut Google ${response.status}: ${errorMsg}`);

      // Si l'API n'est pas encore activée sur le projet Google Cloud (ex: kkdmusic-774df)
      if (response.status === 403) {
        console.warn(`[reCAPTCHA Enterprise Backend] Activez l'API reCAPTCHA Enterprise sur : https://console.developers.google.com/apis/api/recaptchaenterprise.googleapis.com/overview?project=${projectId}`);
        return {
          valid: true,
          simulated: true,
          score: 1.0,
          warning: 'API Google reCAPTCHA Enterprise en attente d\'activation dans la console Google Cloud.',
        };
      }

      return {
        valid: false,
        error: errorMsg,
      };
    }

    const tokenProperties = data.tokenProperties || {};
    const riskAnalysis = data.riskAnalysis || {};

    if (!tokenProperties.valid) {
      console.warn('[reCAPTCHA Enterprise Backend] Token invalide selon Google:', tokenProperties.invalidReason);
      return {
        valid: false,
        reason: tokenProperties.invalidReason || 'TOKEN_INVALID',
        error: `Token invalide: ${tokenProperties.invalidReason || 'Inconnu'}`,
      };
    }

    const score = typeof riskAnalysis.score === 'number' ? riskAnalysis.score : 1.0;
    const isHuman = score >= minScore;

    console.info(`[reCAPTCHA Enterprise Backend] Évaluation réussie. Action: ${tokenProperties.action}, Score: ${score}, Valide: ${isHuman}`);

    return {
      valid: isHuman,
      score,
      action: tokenProperties.action,
      reasons: riskAnalysis.reasons || [],
      hostname: tokenProperties.hostname,
    };
  } catch (err) {
    console.error('[reCAPTCHA Enterprise Backend] Erreur réseau lors de l\'évaluation:', err);
    // En cas de panne temporaire du réseau Google, ne pas bloquer l'utilisateur de manière catastrophique
    return {
      valid: true,
      simulated: true,
      score: 1.0,
      warning: 'Échec de connexion aux serveurs Google reCAPTCHA, validation de secours appliquée.',
    };
  }
}
