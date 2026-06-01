import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Sparkles, Loader2, ArrowLeft, X, Link2, Check, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  { value: 'communique', label: 'Communiqué' },
  { value: 'nouveaute', label: 'Nouveauté' },
  { value: 'article', label: 'Article' },
  { value: 'info_artiste', label: 'Info artiste' },
];

const EMPTY_FORM = {
  title: '',
  image_url: '',
  category: 'article',
  excerpt: '',
  content: '',
  publish_date: new Date().toISOString().split('T')[0],
  is_published: true,
};

export default function AdminNews() {
  const [editing, setEditing] = useState(null); // null = list, 'new' or object = form
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState(null);

  const copyArticleLink = async (id) => {
    const url = `${window.location.origin}/actualites/${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const [generating, setGenerating] = useState(null); // 'excerpt' | 'content'
  const [aiContext, setAiContext] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const queryClient = useQueryClient();

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-for-news'],
    queryFn: () => base44.entities.Artist.list('name', 50),
  });

  const { data: news, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => base44.entities.News.list('-created_date'),
    initialData: [],
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
      await queryClient.cancelQueries({ queryKey: ['admin-news'] });
      const prev = queryClient.getQueryData(['admin-news']);
      queryClient.setQueryData(['admin-news'], (old = []) => old.filter(n => n.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(['admin-news'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-news'] }),
  });

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
    setAiContext('');
    setShowAiPanel(false);
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setEditing(item);
    setAiContext('');
    setShowAiPanel(false);
  };

  const handleSave = async () => {
    if (editing && editing !== 'new' && editing.id) {
      await updateMutation.mutateAsync({ id: editing.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: result.file_url }));
  };

  const generateWithAI = async (type) => {
    setGenerating(type);
    const artistInfo = artists.find(a => form.title?.toLowerCase().includes(a.name?.toLowerCase()));
    const prompt = type === 'excerpt'
      ? `Tu es un rédacteur pour le label de musique KKD Music. Rédige un résumé accrocheur (2-3 phrases maximum) pour un article intitulé "${form.title}" dans la catégorie "${form.category}". ${artistInfo ? `L'artiste concerné est ${artistInfo.name} (genre: ${artistInfo.genre || 'non précisé'}, bio: ${artistInfo.biography || 'non renseignée'}).` : ''} ${aiContext ? `Contexte supplémentaire : ${aiContext}` : ''} Réponds uniquement avec le résumé, sans titre ni introduction.`
      : `Tu es un rédacteur professionnel pour le label de musique KKD Music. Rédige un article complet et professionnel sur "${form.title}" (catégorie: ${form.category}). ${artistInfo ? `L'artiste concerné est ${artistInfo.name} (genre: ${artistInfo.genre || 'non précisé'}, bio: ${artistInfo.biography || 'non renseignée'}).` : ''} ${form.excerpt ? `Résumé de l'article : ${form.excerpt}.` : ''} ${aiContext ? `Contexte supplémentaire : ${aiContext}` : ''} Rédige en français, avec un ton dynamique et engageant. Structure l'article avec des paragraphes bien définis. Ne mets pas de titre principal.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setForm(f => ({ ...f, [type === 'excerpt' ? 'excerpt' : 'content']: result }));
    setGenerating(null);
  };

  // ── FORM VIEW ──
  if (editing !== null) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-extrabold">
            {editing === 'new' ? 'Nouvel article' : 'Modifier l\'article'}
          </h1>
        </div>

        {/* AI Panel toggle */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <button
            onClick={() => setShowAiPanel(v => !v)}
            className="flex items-center gap-2 text-primary font-heading font-bold text-sm"
          >
            <Sparkles size={16} />
            Générer avec l'IA
            {showAiPanel ? <X size={14} className="ml-auto" /> : null}
          </button>
          {showAiPanel && (
            <div className="mt-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Contexte supplémentaire pour l'IA (optionnel)</Label>
                <Textarea
                  placeholder="Ex: sortie d'un single le 15 juin, collaboration avec DJ X, ambiance afrobeat..."
                  value={aiContext}
                  onChange={e => setAiContext(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">L'IA utilisera le titre, la catégorie et les infos de l'artiste pour générer le texte.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!form.title || generating === 'excerpt'}
                  onClick={() => generateWithAI('excerpt')}
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  {generating === 'excerpt' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  Générer le résumé
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!form.title || generating === 'content'}
                  onClick={() => generateWithAI('content')}
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  {generating === 'content' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  Générer l'article
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Form fields */}
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
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date de publication</Label>
              <Input type="date" value={form.publish_date || ''} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Image de couverture</Label>
            {form.image_url && <img src={form.image_url} alt="" className="w-32 h-20 object-cover rounded-lg mb-2" />}
            <Input type="file" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Résumé court</Label>
            </div>
            <Textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Résumé affiché dans les listes d'articles..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Contenu de l'article</Label>
            </div>
            <Textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Rédigez votre article ici..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
            <Label>Publié (visible sur le site)</Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 items-center">
          <Button
            onClick={handleSave}
            disabled={!form.title || createMutation.isPending || updateMutation.isPending}
            className="bg-primary hover:bg-primary/80"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : editing === 'new' ? 'Publier l\'article' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
          {editing && editing !== 'new' && editing.id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs gap-1.5"
              onClick={() => copyArticleLink(editing.id)}
            >
              {copiedId === editing.id ? <Check size={12} className="text-green-500" /> : <Link2 size={12} />}
              {copiedId === editing.id ? 'Lien copié !' : 'Copier le lien de l\'article'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
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
            <div key={item.id} className="flex items-center gap-4 bg-card border border-border/50 rounded-lg p-4">
              {item.image_url && <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === item.category)?.label} • {item.is_published ? '✓ Publié' : 'Brouillon'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Copier le lien de l'article"
                  onClick={() => copyArticleLink(item.id)}
                  className={copiedId === item.id ? 'text-green-500' : 'text-muted-foreground'}
                >
                  {copiedId === item.id ? <Check size={14} /> : <Link2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" asChild title="Voir l'article">
                  <a href={`/actualites/${item.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                  </a>
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