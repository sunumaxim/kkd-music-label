import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Pencil, Trash2, Sparkles, Loader2, ArrowLeft, X,
  Link2, Check, ExternalLink, Image, Video, Music2, Tag,
  Upload, Globe, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORIES = [
  { value: 'communique', label: 'Communiqué' },
  { value: 'nouveaute', label: 'Nouveauté' },
  { value: 'article', label: 'Article' },
  { value: 'info_artiste', label: 'Info artiste' },
];

const EMPTY_FORM = {
  title: '',
  image_url: '',
  gallery: [],
  category: 'article',
  excerpt: '',
  content: '',
  tags: [],
  publish_date: new Date().toISOString().split('T')[0],
  is_published: true,
  video_urls: [],
  music_embeds: [],
  links: [],
};

// ── Mini section collapsible ──
function Section({ icon: Icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-card hover:bg-secondary/50 transition-colors text-sm font-heading font-bold"
      >
        <Icon size={14} className="text-primary" />
        {label}
        {open ? <ChevronUp size={14} className="ml-auto text-muted-foreground" /> : <ChevronDown size={14} className="ml-auto text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-3 border-t border-border/40">{children}</div>}
    </div>
  );
}

export default function AdminNews() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [aiContext, setAiContext] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState('');
  const queryClient = useQueryClient();

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-for-news'],
    queryFn: () => base44.entities.Artist.list('name', 50),
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.News.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); setEditing(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.News.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.News.delete(id),
    onMutate: async (id) => {
      const prev = queryClient.getQueryData(['admin-news']);
      queryClient.setQueryData(['admin-news'], (old = []) => old.filter(n => n.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(['admin-news'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-news'] }),
  });

  const copyArticleLink = async (id) => {
    await navigator.clipboard.writeText(`${window.location.origin}/actualites/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditing('new'); setAiContext(''); setShowAiPanel(false); setTagInput(''); };
  const openEdit = (item) => { setForm({ ...EMPTY_FORM, ...item }); setEditing(item); setAiContext(''); setShowAiPanel(false); setTagInput(''); };

  const handleSave = async () => {
    const data = { ...form };
    if (editing && editing !== 'new' && editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading('cover');
    const result = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: result.file_url }));
    setUploading('');
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading('gallery');
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setForm(f => ({ ...f, gallery: [...(f.gallery || []), ...urls] }));
    setUploading('');
  };

  const removeGalleryImg = (idx) => setForm(f => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (t && !form.tags?.includes(t)) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    }
    setTagInput('');
  };

  const addVideoUrl = () => setForm(f => ({ ...f, video_urls: [...(f.video_urls || []), ''] }));
  const updateVideoUrl = (i, val) => setForm(f => { const arr = [...(f.video_urls || [])]; arr[i] = val; return { ...f, video_urls: arr }; });
  const removeVideoUrl = (i) => setForm(f => ({ ...f, video_urls: f.video_urls.filter((_, j) => j !== i) }));

  const addMusic = () => setForm(f => ({ ...f, music_embeds: [...(f.music_embeds || []), ''] }));
  const updateMusic = (i, val) => setForm(f => { const arr = [...(f.music_embeds || [])]; arr[i] = val; return { ...f, music_embeds: arr }; });
  const removeMusic = (i) => setForm(f => ({ ...f, music_embeds: f.music_embeds.filter((_, j) => j !== i) }));

  const addLink = () => setForm(f => ({ ...f, links: [...(f.links || []), { label: '', url: '' }] }));
  const updateLink = (i, key, val) => setForm(f => { const arr = [...(f.links || [])]; arr[i] = { ...arr[i], [key]: val }; return { ...f, links: arr }; });
  const removeLink = (i) => setForm(f => ({ ...f, links: f.links.filter((_, j) => j !== i) }));

  const generateWithAI = async (type) => {
    setGenerating(type);
    const artistInfo = artists.find(a => form.title?.toLowerCase().includes(a.name?.toLowerCase()));
    const prompt = type === 'excerpt'
      ? `Tu es un rédacteur pour KKD Music. Rédige un résumé accrocheur (2-3 phrases max) pour "${form.title}" catégorie "${form.category}". ${artistInfo ? `Artiste: ${artistInfo.name}.` : ''} ${aiContext || ''} Réponds uniquement avec le résumé.`
      : `Tu es rédacteur professionnel KKD Music. Rédige un article complet sur "${form.title}" (${form.category}). ${artistInfo ? `Artiste: ${artistInfo.name}, genre: ${artistInfo.genre || ''}.` : ''} ${form.excerpt || ''} ${aiContext || ''} En français, ton dynamique. Structure avec paragraphes. Pas de titre principal.`;
    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setForm(f => ({ ...f, [type === 'excerpt' ? 'excerpt' : 'content']: result }));
    setGenerating(null);
  };

  // ── FORM ──
  if (editing !== null) {
    return (
      <div className="max-w-3xl space-y-5 pb-16">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">
            {editing === 'new' ? 'Nouvel article' : "Modifier l'article"}
          </h1>
          {editing && editing !== 'new' && editing.id && (
            <button
              type="button"
              onClick={() => copyArticleLink(editing.id)}
              className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copiedId === editing.id ? <Check size={12} className="text-green-500" /> : <Link2 size={12} />}
              {copiedId === editing.id ? 'Copié !' : 'Copier le lien'}
            </button>
          )}
        </div>

        {/* IA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <button type="button" onClick={() => setShowAiPanel(v => !v)} className="flex items-center gap-2 text-primary font-heading font-bold text-sm w-full">
            <Sparkles size={16} /> Générer avec l'IA
            {showAiPanel ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
          </button>
          {showAiPanel && (
            <div className="mt-3 space-y-3">
              <Textarea
                placeholder="Contexte supplémentaire (ex: sortie d'un single, collab, date…)"
                value={aiContext}
                onChange={e => setAiContext(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!form.title || generating === 'excerpt'} onClick={() => generateWithAI('excerpt')} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
                  {generating === 'excerpt' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  Générer le résumé
                </Button>
                <Button size="sm" variant="outline" disabled={!form.title || generating === 'content'} onClick={() => generateWithAI('content')} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
                  {generating === 'content' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  Générer l'article
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Champs de base */}
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Titre *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de l'article" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date de publication</Label>
              <Input type="date" value={form.publish_date || ''} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Résumé court</Label>
            <Textarea value={form.excerpt || ''} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="2-3 phrases d'accroche..." rows={2} />
          </div>
          <div>
            <Label className="mb-1.5 block">Contenu de l'article (Markdown)</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Rédigez l'article ici... Utilisez **gras**, ## Titres, > Citations" rows={14} className="font-mono text-sm" />
          </div>
        </div>

        {/* Image de couverture */}
        <Section icon={Image} label="Image de couverture">
          {form.image_url && <img src={form.image_url} alt="" className="w-full max-h-40 object-cover rounded-lg mb-2" />}
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-border rounded-lg hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {uploading === 'cover' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading === 'cover' ? 'Envoi...' : 'Choisir une image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>
        </Section>

        {/* Galerie photos */}
        <Section icon={Image} label={`Galerie photos (${form.gallery?.length || 0})`}>
          {form.gallery?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.gallery.map((url, i) => (
                <div key={i} className="relative group w-20 h-14">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => removeGalleryImg(i)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-border rounded-lg hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {uploading === 'gallery' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading === 'gallery' ? 'Envoi...' : 'Ajouter des photos (sélection multiple)'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          </label>
        </Section>

        {/* Vidéos YouTube */}
        <Section icon={Video} label={`Vidéos YouTube (${form.video_urls?.length || 0})`}>
          {form.video_urls?.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input value={url} onChange={e => updateVideoUrl(i, e.target.value)} placeholder="https://youtube.com/watch?v=..." className="text-sm" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeVideoUrl(i)}><X size={14} /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addVideoUrl} className="text-xs gap-1.5">
            <Plus size={12} /> Ajouter une vidéo
          </Button>
        </Section>

        {/* Musiques */}
        <Section icon={Music2} label={`Musiques (Spotify / YouTube / SoundCloud) (${form.music_embeds?.length || 0})`}>
          {form.music_embeds?.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input value={url} onChange={e => updateMusic(i, e.target.value)} placeholder="https://open.spotify.com/track/... ou YouTube..." className="text-sm" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeMusic(i)}><X size={14} /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMusic} className="text-xs gap-1.5">
            <Plus size={12} /> Ajouter une musique
          </Button>
        </Section>

        {/* Liens externes */}
        <Section icon={Globe} label={`Liens externes (${form.links?.length || 0})`}>
          {form.links?.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} placeholder="Libellé (ex: Voir sur Spotify)" className="text-sm w-2/5" />
              <Input value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="https://..." className="text-sm flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(i)}><X size={14} /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLink} className="text-xs gap-1.5">
            <Plus size={12} /> Ajouter un lien
          </Button>
        </Section>

        {/* Tags */}
        <Section icon={Tag} label="Tags / Mots-clés" defaultOpen>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.tags?.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs font-mono bg-secondary px-3 py-1 rounded-full">
                #{tag}
                <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))} className="hover:text-destructive ml-1"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="ex: afrobeat, sortie, collaboration..."
              className="text-sm"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>Ajouter</Button>
          </div>
        </Section>

        {/* Publié */}
        <div className="flex items-center gap-2 pt-2">
          <Switch checked={!!form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
          <Label>Publié (visible sur le site)</Label>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSave} disabled={!form.title || createMutation.isPending || updateMutation.isPending} className="bg-primary hover:bg-primary/80">
            {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : editing === 'new' ? "Publier l'article" : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
        </div>
      </div>
    );
  }

  // ── LIST ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-extrabold">Actualités</h1>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/80">
          <Plus size={16} className="mr-1" /> Rédiger un article
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}</div>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun article. Cliquez sur "Rédiger un article".</p>
      ) : (
        <div className="space-y-2">
          {news.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-xl p-4">
              {item.image_url && <img src={item.image_url} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === item.category)?.label}</span>
                  <span className={`text-xs font-mono ${item.is_published ? 'text-green-500' : 'text-yellow-500'}`}>{item.is_published ? '● Publié' : '○ Brouillon'}</span>
                  {item.tags?.length > 0 && <span className="text-xs text-muted-foreground">{item.tags.length} tag{item.tags.length > 1 ? 's' : ''}</span>}
                  {item.video_urls?.length > 0 && <span className="text-xs text-muted-foreground">{item.video_urls.length} vidéo{item.video_urls.length > 1 ? 's' : ''}</span>}
                  {item.gallery?.length > 0 && <span className="text-xs text-muted-foreground">{item.gallery.length} photo{item.gallery.length > 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" title="Copier le lien" onClick={() => copyArticleLink(item.id)} className={copiedId === item.id ? 'text-green-500' : 'text-muted-foreground'}>
                  {copiedId === item.id ? <Check size={14} /> : <Link2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" asChild title="Voir l'article">
                  <a href={`/actualites/${item.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /></a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm('Supprimer cet article ?')) deleteMutation.mutate(item.id); }}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}