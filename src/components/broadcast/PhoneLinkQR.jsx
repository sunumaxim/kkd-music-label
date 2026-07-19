import React from 'react';
import { QrCode, RefreshCw, Smartphone } from 'lucide-react';

export default function PhoneLinkQR({ phone_token, onGenerate, onRefresh, refreshing }) {
  const url = phone_token ? `${window.location.origin}/studio/phone/${phone_token}` : null;
  const qr = phone_token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`
    : null;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Smartphone size={16} className="text-primary" /> Connexion téléphone
      </h3>
      {!phone_token ? (
        <button
          onClick={onGenerate}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-primary/10 border border-primary/40 text-primary text-sm font-medium"
        >
          <QrCode size={15} /> Générer le lien téléphone
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <img src={qr} alt="QR téléphone" className="w-44 h-44 rounded-lg bg-white p-2" />
          <p className="text-[11px] text-muted-foreground text-center">
            Scanne ce QR avec ton téléphone, connecte-toi, filme et envoie la vidéo au studio.
          </p>
          <code className="text-[10px] text-muted-foreground break-all text-center">{url}</code>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-medium"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Actualiser la source
          </button>
        </div>
      )}
    </div>
  );
}