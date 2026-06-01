import React, { useState } from 'react';
import TikTokPublisher from '@/components/admin/TikTokPublisher';

export default function AdminSocial() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">Réseaux Sociaux</span>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-1">Publication Social Media</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez et déclenchez vos publications sur TikTok et Instagram</p>
      </div>

      {/* Instagram status */}
      <div className="bg-gradient-to-r from-pink-600/10 to-purple-600/10 border border-pink-500/20 rounded-xl p-4 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instagram Business — Connecté ✅</p>
          <p className="text-xs text-muted-foreground">Publication automatique active : nouvelles sorties, événements, articles et vidéos sont publiés automatiquement sur votre feed.</p>
        </div>
      </div>

      {/* TikTok section */}
      <TikTokPublisher />
    </div>
  );
}