import React, { useEffect, useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';

const SESSION_KEY = 'kkd_install_dismissed_v1';

function detect() {
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;
  return { isIOS, isStandalone };
}

export default function InstallPrompt() {
  const [state, setState] = useState({ visible: false, mode: 'manual', promptEvent: null });

  useEffect(() => {
    const { isIOS, isStandalone } = detect();
    if (isStandalone) return; // déjà installée
    if (sessionStorage.getItem(SESSION_KEY) === '1') return;

    let captured = null;
    let settled = false;

    const show = (mode, ev) => {
      if (settled) return;
      settled = true;
      setState({ visible: true, mode, promptEvent: ev || null });
    };

    const onBeforeInstall = (e) => {
      e.preventDefault();
      captured = e;
      show('native', e);
    };
    const onInstalled = () => setState((s) => ({ ...s, visible: false }));

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Fallback : iOS / navigateurs sans beforeinstallprompt → instructions adaptées
    const timer = setTimeout(() => {
      if (!captured) show(isIOS ? 'ios' : 'manual', null);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setState((s) => ({ ...s, visible: false }));
  };

  const install = async () => {
    const ev = state.promptEvent;
    if (!ev) return;
    ev.prompt();
    try {
      const choice = await ev.userChoice;
      if (choice && choice.outcome === 'accepted') setState((s) => ({ ...s, visible: false }));
      else dismiss();
    } catch (_) {}
  };

  if (!state.visible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-[60] w-[calc(100%-1rem)] max-w-md">
      <div className="bg-card border border-border/60 shadow-lg rounded-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Smartphone size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm">Installer KKD Music</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {state.mode === 'native'
              ? 'Accédez à la plateforme en un tap, comme une vraie application.'
              : state.mode === 'ios'
              ? "Appuyez sur le bouton Partager puis « Sur l'écran d'accueil »."
              : "Ouvrez le menu du navigateur (⋮) puis « Installer l'application » / « Ajouter à l'écran d'accueil »."}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {state.mode === 'native' ? (
              <button onClick={install} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-transform">
                <Download size={14} /> Installer
              </button>
            ) : state.mode === 'ios' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Share size={14} className="text-primary" /> Partager → Sur l'écran d'accueil
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                Menu <span className="font-bold">⋮</span> → Installer l'application
              </span>
            )}
            <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
              Plus tard
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1 shrink-0" aria-label="Fermer">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}