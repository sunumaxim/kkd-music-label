import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Users, UserCheck, Inbox, Music2, Eye, CheckCircle, Loader2,
  Sparkles, Mail, FileText, Video, Calendar, Newspaper
} from 'lucide-react';

const AUDIENCES = [
  { value: 'partners', label: 'Partenaires (comptes users)', icon: Users, desc: 'Utilisateurs rôle "user"' },
  { value: 'artists', label: 'Artistes sous contrat', icon: Music2, desc: 'Invitations actives' },
  { value: 'requests', label: 'Demandeurs de service', icon: Inbox, desc: 'Ayant soumis une demande' },
  { value: 'admins', label: 'Équipe admin', icon: UserCheck, desc: 'Tous les administrateurs' },
  { value: 'all', label: 'Tous', icon: Users, desc: 'Ensemble de la communauté KKD' },
  { value: 'custom', label: 'Adresses personnalisées', icon: Mail, desc: 'Saisir ou coller des emails' },
];

const CONTENT_TYPES = [
  { value: 'release', label: 'Sortie musicale', icon: Music2 },
  { value: 'video', label: 'Clip / Vidéo', icon: Video },
  { value: 'event', label: 'Événement', icon: Calendar },
  { value: 'news', label: 'Article / Actus', icon: Newspaper },
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
    custom_emails: '',
    image_url: '',
  });
  const [contentType, setContentType] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState('compose'); // 'compose' | 'content'

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Fetch content selon le type sélectionné
  const { data: contentList = [] } = useQuery({
    queryKey: ['mailing-content', contentType],
    queryFn: async () => {
      if (!contentType) return [];
      if (contentType === 'release') return base44.entities.Release.list('-release_date', 30);
      if (contentType === 'video') return base44.entities.Video.list('-publish_date', 30);
      if (contentType === 'event') return base44.entities.Event.list('-event_date', 20);
      if (contentType === 'news') return base44.entities.News.filter({ is_published: true });
      return [];
    },
    enabled: !!contentType,
  });

  const handleSelectContent = (item) => {
    setSelectedContent(item);
    // Pré-remplir le formulaire avec les données du contenu
    if (contentType === 'release') {
      update('subject', `🎵 Nouvelle sortie : ${item.title} - ${item.artist_name}`);
      update('headline', `${item.title} est disponible !`);
      update('body', `${item.description || ''}\n\nÉcoutez ${item.title} de ${item.artist_name} sur toutes les plateformes dès maintenant.`);
      update('image_url', item.cover_url || '');
      const link = item.spotify_url || item.apple_music_url || item.youtube_url || item.audiomack_url || '';
      if (link) { update('cta_label', 'Écouter maintenant'); update('cta_url', link); }
    } else if (contentType === 'video') {
      update('subject', `🎬 Nouveau clip : ${item.title}${item.artist_name ? ` par ${item.artist_name}` : ''}`);
      update('headline', `Regardez le nouveau clip "${item.title}"`);
      update('body', item.description || `Le nouveau clip de ${item.artist_name || 'KKD'} est disponible. Ne le manquez pas !`);
      const yt = item.youtube_url || '';
      if (yt) { update('cta_label', 'Regarder le clip'); update('cta_url', yt); }
      const ytId = yt.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/)?.[1];
      if (ytId) update('image_url', `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
      else update('image_url', item.thumbnail_url || '');
    } else if (contentType === 'event') {
      const d = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
      update('subject', `📅 Événement KKD : ${item.title}${d ? ` — ${d}` : ''}`);
      update('headline', item.title);
      update('body', `${item.description || ''}\n\n${d ? `📅 ${d}\n` : ''}${item.location ? `📍 ${item.location}${item.city ? `, ${item.city}` : ''}\n` : ''}`);
      update('image_url', item.image_url || '');
      if (item.ticket_url) { update('cta_label', 'Réserver ma place'); update('cta_url', item.ticket_url); }
    } else if (contentType === 'news') {
      update('subject', `📰 ${item.title}`);
      update('headline', item.title);
      update('body', item.excerpt || item.content?.slice(0, 300) || '');
      update('image_url', item.image_url || '');
    }
  };

  const generateWithAI = async () => {
    if (!form.headline) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un rédacteur email pour KKD Label Group, un label de musique indépendant à Paris. 
Rédige un corps d'email professionnel et engageant pour cette campagne marketing.
Titre/sujet : "${form.headline}"
${selectedContent ? `Contenu concerné : ${JSON.stringify({ type: contentType, title: selectedContent.title || selectedContent.name, artist: selectedContent.artist_name || '' })}` : ''}
Instructions : texte court (3-4 paragraphes max), ton chaleureux et dynamique, en français, sans HTML, sans balises.`,
      response_json_schema: {
        type: 'object',
        properties: { body: { type: 'string' } }
      }
    });
    if (res?.body) update('body', res.body);
    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!form.subject || !form.headline || !form.body) return;
    setSending(true);
    setResult(null);
    const payload = {
      subject: form.subject,
      headline: form.headline,
      body: form.body,
      cta: form.cta_label ? { label: form.cta_label, url: form.cta_url || 'https://kkdmusic.com' } : null,
      audience: form.audience,
      image_url: form.image_url || null,
      custom_emails: form.audience === 'custom' ? form.custom_emails : null,
    };
    const res = await base44.functions.invoke('sendMailingCampaign', payload);
    setSending(false);
    setResult(res.data);
  };

  const selectedAudience = AUDIENCES.find(a => a.value === form.audience);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">Campagne Email</h1>
        <p className="text-sm text-muted-foreground mt-1">Envoyez des emails groupés à votre communauté KKD</p>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${result.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            {result.success ? `✅ Campagne envoyée à ${result.sent} destinataire(s) !` : `❌ Erreur : ${result.error}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
            <button
              onClick={() => setTab('compose')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'compose' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileText size={14} /> Composer
            </button>
            <button
              onClick={() => setTab('content')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'content' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Music2 size={14} /> Contenu plateforme
            </button>
          </div>

          {/* Tab: Contenu plateforme */}
          {tab === 'content' && (
            <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
              <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Sélectionner un contenu à promouvoir</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTENT_TYPES.map(ct => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => { setContentType(ct.value); setSelectedContent(null); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                        contentType === ct.value ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/40 bg-background hover:border-border'
                      }`}
                    >
                      <Icon size={18} />
                      {ct.label}
                    </button>
                  );
                })}
              </div>

              {contentType && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Choisir un élément :</p>
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {contentList.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Aucun élément disponible.</p>
                    ) : contentList.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectContent(item)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                          selectedContent?.id === item.id ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-background/60 hover:border-border'
                        }`}
                      >
                        {(item.cover_url || item.image_url || item.thumbnail_url) && (
                          <img
                            src={item.cover_url || item.image_url || item.thumbnail_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{item.title || item.name}</p>
                          {item.artist_name && <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>}
                        </div>
                        {selectedContent?.id === item.id && <CheckCircle size={14} className="text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                  {selectedContent && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1.5">
                      <CheckCircle size={12} /> Contenu sélectionné — formulaire pré-rempli. Basculez sur "Composer" pour personnaliser.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Composer */}
          {tab === 'compose' && (
            <>
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
                          form.audience === a.value ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-card hover:border-border/70'
                        }`}
                      >
                        <Icon size={15} className={`mt-0.5 shrink-0 ${form.audience === a.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${form.audience === a.value ? 'text-primary' : ''}`}>{a.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emails personnalisés */}
              {form.audience === 'custom' && (
                <div>
                  <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Adresses email (séparées par virgule ou saut de ligne)</Label>
                  <Textarea
                    value={form.custom_emails}
                    onChange={e => update('custom_emails', e.target.value)}
                    placeholder="email1@exemple.com, email2@exemple.com&#10;email3@exemple.com"
                    rows={4}
                    className="bg-card border-border/50 text-sm font-mono"
                  />
                </div>
              )}

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
                <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Titre principal *</Label>
                <Input
                  value={form.headline}
                  onChange={e => update('headline', e.target.value)}
                  placeholder="ex: 🎵 Nos nouvelles sorties sont disponibles !"
                  className="bg-card border-border/50"
                />
              </div>

              {/* Image */}
              <div>
                <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 block">Image dans l'email (URL, optionnel)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={e => update('image_url', e.target.value)}
                    placeholder="https://... (URL d'image)"
                    className="bg-card border-border/50 flex-1 text-sm"
                  />
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border/40 shrink-0" onError={e => e.target.style.display = 'none'} />
                  )}
                </div>
              </div>

              {/* Corps + IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Corps du message *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateWithAI}
                    disabled={!form.headline || aiLoading}
                    className="gap-1.5 h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                  >
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {aiLoading ? 'Génération...' : 'Générer avec IA'}
                  </Button>
                </div>
                <Textarea
                  value={form.body}
                  onChange={e => update('body', e.target.value)}
                  placeholder="Rédigez votre message ici ou cliquez sur « Générer avec IA »…"
                  rows={8}
                  className="bg-card border-border/50 text-sm leading-relaxed"
                />
              </div>

              {/* CTA */}
              <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
                <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Bouton d'action (optionnel)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Texte du bouton</Label>
                    <Input value={form.cta_label} onChange={e => update('cta_label', e.target.value)} placeholder="ex: Écouter maintenant" className="bg-background border-border/50 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">URL de destination</Label>
                    <Input value={form.cta_url} onChange={e => update('cta_url', e.target.value)} placeholder="https://..." className="bg-background border-border/50 text-sm" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setShowPreview(v => !v)} variant="outline" className="gap-2">
              <Eye size={15} /> {showPreview ? 'Masquer' : 'Aperçu'}
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

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border/40 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Conseils</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex gap-2"><span className="text-primary">1.</span> Sélectionnez un contenu → formulaire pré-rempli</p>
              <p className="flex gap-2"><span className="text-primary">2.</span> Cliquez "Générer avec IA" pour le corps du texte</p>
              <p className="flex gap-2"><span className="text-primary">3.</span> Relisez et personnalisez avant d'envoyer</p>
              <p className="flex gap-2"><span className="text-primary">4.</span> Utilisez "Aperçu" pour visualiser le rendu final</p>
            </div>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Design email</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {['Logo KKD Label Group', 'Barre rouge signature', 'Image du contenu', 'Fond sombre #0a0a0a', 'Liens réseaux sociaux'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
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
        <div style={{ background: '#0a0a0a', borderBottom: '1px solid #222', padding: '24px 40px', textAlign: 'center' }}>
          <img src={LOGO_URL} alt="KKD" style={{ height: '36px', width: 'auto' }} />
        </div>
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${PRIMARY}, #ff4444)` }} />
        {form.image_url && (
          <img src={form.image_url} alt="" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
        )}
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