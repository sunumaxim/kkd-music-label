import React, { useRef, useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Loader2, ScanLine } from 'lucide-react';

const SCANNER_ID = 'kkd-qr-scanner';

/**
 * Scanner QR code caméra — wrapper React autour de html5-qrcode.
 * - Démarre automatiquement la caméra arrière
 * - `onScan(decodedText)` appelé à chaque QR détecté (cooldown 4s)
 * - `paused` bloque temporairement le scan (pendant l'affichage du résultat)
 */
export default function QrScanner({ onScan, paused = false }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const lastScanRef = useRef(0);

  // Refs pour éviter les stale closures dans le callback du scanner
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  pausedRef.current = paused;
  onScanRef.current = onScan;

  useEffect(() => {
    let mounted = true;
    let scanner = null;

    const onDecoded = (decodedText) => {
      if (pausedRef.current) return;
      const now = Date.now();
      if (now - lastScanRef.current < 4000) return; // cooldown anti-double-scan
      lastScanRef.current = now;
      onScanRef.current(decodedText);
    };

    (async () => {
      try {
        scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          onDecoded,
          () => {} // ignore per-frame decode errors
        );
        if (mounted) setStatus('scanning');
      } catch (err) {
        if (mounted) {
          setStatus('error');
          setErrorMsg(
            err?.message?.includes('Permission')
              ? 'Accès caméra refusé. Autorisez la caméra dans les réglages du navigateur.'
              : 'Caméra inaccessible. Vérifiez les permissions.'
          );
        }
      }
    })();

    return () => {
      mounted = false;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
  }, [retryCount]);

  return (
    <div className="relative">
      <div id={SCANNER_ID} className="w-full rounded-2xl overflow-hidden bg-black aspect-square" />

      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-black">
          <Loader2 size={28} className="animate-spin mb-2" />
          <p className="text-xs">Activation caméra…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-black p-6 text-center">
          <CameraOff size={32} className="mb-3" />
          <p className="text-xs mb-3 max-w-[200px]">{errorMsg}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-4 py-1.5 bg-white/15 rounded-lg text-xs font-medium hover:bg-white/25 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {status === 'scanning' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-52 h-52 border-2 border-white/60 rounded-2xl relative overflow-hidden">
            <div className="absolute left-2 right-2 h-0.5 bg-primary shadow-lg animate-scan-line" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      )}

      {paused && status === 'scanning' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
          <div className="text-white/70 text-center">
            <ScanLine size={24} className="mx-auto mb-1" />
            <p className="text-[11px]">Reprise…</p>
          </div>
        </div>
      )}
    </div>
  );
}