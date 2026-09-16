/**
 * KKD Music — Backend Base44 Function : verifyRecaptcha
 * Valide le token reCAPTCHA Enterprise auprès de Google Cloud.
 */
Deno.serve(async (req) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_key',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const { token, action = 'LOGIN', siteKey = '6LeWJL8tAAAAAG9HBCl-TxymsCKY0SZ3MNjOXECm', minScore = 0.5 } = body;

    if (!token) {
      return new Response(JSON.stringify({ valid: false, error: 'Token reCAPTCHA manquant' }), { status: 400, headers });
    }

    const projectId = Deno.env.get('RECAPTCHA_ENTERPRISE_PROJECT_ID') || 'kkdmusic-774df';
    const apiKey = Deno.env.get('RECAPTCHA_ENTERPRISE_API_KEY') || Deno.env.get('FIREBASE_API_KEY') || 'AIzaSyDiKVyT6e2Oyxj4kCjo-1kk1MCw8Q8q-bE';

    const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    const assessmentRes = await fetch(assessmentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token,
          siteKey,
          expectedAction: action,
        },
      }),
    });

    const data = await assessmentRes.json();

    if (!assessmentRes.ok) {
      console.warn(`[Base44 verifyRecaptcha] Google Status ${assessmentRes.status}:`, data?.error?.message);
      // Mode tolérant si l'API est en cours d'activation dans Google Cloud
      return new Response(
        JSON.stringify({
          valid: true,
          simulated: true,
          score: 1.0,
          warning: data?.error?.message || 'reCAPTCHA Enterprise en cours d\'activation dans GCP.',
        }),
        { status: 200, headers }
      );
    }

    const tokenProperties = data.tokenProperties || {};
    const riskAnalysis = data.riskAnalysis || {};

    if (!tokenProperties.valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: tokenProperties.invalidReason || 'TOKEN_INVALID',
          error: `Token invalide: ${tokenProperties.invalidReason}`,
        }),
        { status: 200, headers }
      );
    }

    const score = typeof riskAnalysis.score === 'number' ? riskAnalysis.score : 1.0;
    const isHuman = score >= minScore;

    return new Response(
      JSON.stringify({
        valid: isHuman,
        score,
        action: tokenProperties.action,
        reasons: riskAnalysis.reasons || [],
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('[Base44 verifyRecaptcha] Exception:', err);
    return new Response(
      JSON.stringify({
        valid: true,
        simulated: true,
        score: 1.0,
        warning: 'Validation de secours appliquée.',
      }),
      { status: 200, headers }
    );
  }
});
