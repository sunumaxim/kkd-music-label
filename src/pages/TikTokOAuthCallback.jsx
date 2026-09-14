import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tiktokService } from '@/services';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function TikTokOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Validation de l\'autorisation TikTok en cours...');
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(`Erreur retournée par TikTok : ${errorDescription || error}`);
      if (window.opener) {
        window.opener.postMessage({
          type: 'TIKTOK_AUTH_ERROR',
          error: errorDescription || error,
        }, '*');
      }
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Code d\'autorisation manquant dans la réponse de TikTok.');
      return;
    }

    // Traitement du code OAuth
    try {
      // Échange du code et enregistrement du compte officiel
      const result = tiktokService.handleOAuthSuccess({
        code,
        state,
      });

      setStatus('success');
      setMessage('Connexion TikTok réussie avec succès !');
      setAccountInfo(result.account);

      // Informer la fenêtre parente (panneau d'administration)
      if (window.opener) {
        window.opener.postMessage({
          type: 'TIKTOK_AUTH_SUCCESS',
          account: result.account,
          code,
        }, '*');

        // Fermer automatiquement le popup après 1.5 seconde
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log(e);
          }
        }, 1500);
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Impossible de finaliser la connexion : ${err?.message || 'Erreur inconnue'}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121820] border border-white/10 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.53V7.05a4.85 4.85 0 01-1.02-.36z" />
          </svg>
        </div>

        <h1 className="text-lg font-bold">Autorisation TikTok Login Kit</h1>

        {status === 'processing' && (
          <div className="space-y-3 py-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-gray-300">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-emerald-400">{message}</p>
            {accountInfo && (
              <p className="text-xs text-gray-400">
                Compte lié : <span className="font-mono text-white font-semibold">@{accountInfo.username}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Cette fenêtre va se fermer automatiquement.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm text-red-400 font-medium">{message}</p>
            <p className="text-xs text-gray-400">
              Vous pouvez fermer cette fenêtre et réessayer depuis le panneau d'administration.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                window.location.href = '/admin/social';
              }
            }}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Fermer cette fenêtre
          </button>
        </div>
      </div>
    </div>
  );
}
