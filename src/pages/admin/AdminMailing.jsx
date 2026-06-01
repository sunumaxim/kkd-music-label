import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Users, UserCheck, Inbox, Music2, Eye, CheckCircle, Loader2,
  ChevronDown, ChevronUp
} from 'lucide-react';

const AUDIENCES = [
  { value: 'partners', label: 'Partenaires (comptes utilisateurs)', icon: Users, desc: 'Tous les utilisateurs avec le rôle "user"' },
  { value: 'artists', label: 'Artistes sous contrat actif', icon: Music2, desc: 'Artistes ayant une invitation active' },
  { value: 'requests', label: 'Demandeurs de service', icon: Inbox, desc: 'Personnes ayant soumis une demande de prestation' },
  { value: 'admins', label: 'Équipe admin', icon: UserCheck, desc: 'Tous les administrateurs' },
  { value: 'all', label: 'Tous', icon: Users, desc: 'Partenaires + artistes + demandeurs + admins' },
];

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function AdminMailing() {
  const [form, setForm] = useState({
    subject: '',
    headline: '',
    body: '',
    cta_label: '',
    cta_url: '',
    audience: 'partners',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSend = async () => {
    if (!form.subject || !form.headline || !form.body) return;
    setSending(true);
    setResult(null);
    const res = await base44.functions.invoke('sendMailingCampaign', {
      subject: form.subject,
      headline: form.headline,
      body: form.body,
      cta: form.cta_label ? { label: form.cta_label, url: form.cta_url || 'https://kkdmusic.com' } : null,
      audience: form.audience,
    });
    setSending(false);
    setResult(res.data);
  };

  const selectedAudience = AUDIENCES.find(a => a.value === form.audience);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">Campagne Email</h1>
        <p className="text-sm text-muted-foreground mt-1">Envoyez des emails groupés aux partenaires, artistes ou à l'ensemble de la communauté KKD</p>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${result.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <CheckCircle size={18} />
          <p className="text-sm font-medium">
            {result.success ? `✅ Campagne envoyée à ${result.sent} destinataire(s) avec succès !` : `❌ Erreur : ${result.error}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-5">
          {/* Audience */}
          <div>
            <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3 block">Destinataires</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AUDIENCES.map(a => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.value}
                    onClick={() => update('audience', a.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      form.audience === a.value
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/40 bg-card hover:border-border/70'
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${form.audience === a.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-sm font-medium ${form.audience === a.value ? 'text-primary' : ''}`}>{a.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Sujet de l'email *</Label>
            <Input
              value={form.subject}
              onChange={e => update('subject', e.target.value)}
              placeholder="ex: Nouveautés KKD Label Group — Juin 2025"
              className="bg-card border-border/50"
            />
          </div>

          {/* Titre principal */}
          <div>
            <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Titre principal de l'email *</Label>
            <Input
              value={form.headline}
              onChange={e => update('headline', e.target.value)}
              placeholder="ex: 🎵 Nos nouvelles sorties sont disponibles !"
              className="bg-card border-border/50"
            />
          </div>

          {/* Corps */}
          <div>
            <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Corps du message *</Label>
            <Textarea
              value={form.body}
              onChange={e => update('body', e.target.value)}
              placeholder="Rédigez votre message ici…&#10;&#10;Vous pouvez utiliser plusieurs paragraphes."
              rows={8}
              className="bg-card border-border/50 text-sm leading-relaxed"
            />
          </div>

          {/* CTA optionnel */}
          <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Bouton d'action (optionnel)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Texte du bouton</Label>
                <Input
                  value={form.cta_label}
                  onChange={e => update('cta_label', e.target.value)}
                  placeholder="ex: Écouter maintenant"
                  className="bg-background border-border/50 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">URL de destination</Label>
                <Input
                  value={form.cta_url}
                  onChange={e => update('cta_url', e.target.value)}
                  placeholder="https://..."
                  className="bg-background border-border/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setShowPreview(v => !v)}
              variant="outline"
              className="gap-2"
            >
              <Eye size={15} />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !form.subject || !form.headline || !form.body}
              className="gap-2 flex-1 sm:flex-none"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Envoi en cours…' : `Envoyer à : ${selectedAudience?.label}`}
            </Button>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-card border border-border/40 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Design de l'email</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0"></div>
                <span>Logo KKD Label Group</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0"></div>
                <span>Barre rouge signature</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0"></div>
                <span>Fond sombre #0a0a0a</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0"></div>
                <span>Signature KKD Label Group</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0"></div>
                <span>Liens réseaux sociaux</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Notifications automatiques</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex gap-2"><span className="text-green-400">✓</span> Nouvelle demande → admin + confirmation client</p>
              <p className="flex gap-2"><span className="text-green-400">✓</span> Changement statut demande → client notifié</p>
              <p className="flex gap-2"><span className="text-green-400">✓</span> Nouvelle publication → admin alerté</p>
              <p className="flex gap-2"><span className="text-green-400">✓</span> Publication approuvée/publiée/refusée → partenaire</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && form.headline && (
        <div className="mt-8">
          <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">Aperçu de l'email</p>
          <div className="border border-border/40 rounded-xl overflow-hidden shadow-2xl">
            <EmailPreview form={form} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmailPreview({ form }) {
  const PRIMARY = "#E50000";
  const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

  return (
    <div style={{ background: '#0a0a0a', padding: '32px 16px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', maxWidth: '560px', margin: '0 auto', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#0a0a0a', borderBottom: '1px solid #222', padding: '24px 40px', textAlign: 'center' }}>
          <img src={LOGO_URL} alt="KKD" style={{ height: '36px', width: 'auto' }} />
        </div>
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${PRIMARY}, #ff4444)` }} />

        {/* Content */}
        <div style={{ padding: '36px 40px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 18px', lineHeight: '1.3' }}>
            {form.headline || 'Titre de votre email'}
          </h1>
          <p style={{ fontSize: '15px', color: '#ccc', lineHeight: '1.7', margin: '0', whiteSpace: 'pre-wrap' }}>
            {form.body || 'Corps du message…'}
          </p>
          {form.cta_label && (
            <div style={{ textAlign: 'center', marginTop: '28px' }}>
              <a href={form.cta_url || '#'} style={{ display: 'inline-block', background: PRIMARY, color: '#fff', padding: '13px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
                {form.cta_label}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#0d0d0d', borderTop: '1px solid #222', padding: '24px 40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '12px' }}>
            {['Site web', 'Instagram', 'YouTube'].map(s => (
              <a key={s} href="#" style={{ display: 'inline-block', margin: '0 8px', fontSize: '12px', color: '#999', textDecoration: 'none' }}>{s}</a>
            ))}
          </div>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#ddd', fontWeight: '700' }}>KKD Label Group</p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>Maison de disques indépendante · Paris, France</p>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#999' }}>© {new Date().getFullYear()} KKD Label Group. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}