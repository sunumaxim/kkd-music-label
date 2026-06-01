import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Check, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import MobileHeader from '@/components/mobile/MobileHeader';

const CATEGORY_LABELS = {
  communique: 'Communiqué',
  nouveaute: 'Nouveauté',
  article: 'Article',
  info_artiste: 'Info Artiste',
};

export default function NewsDetail() {
  const newsId = window.location.pathname.split('/').pop();
  const [copied, setCopied] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: async () => {
      const all = await base44.entities.News.list();
      return all.find(n => n.id === newsId);
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Article introuvable.</p>
        <Link to="/actualites" className="text-primary text-sm">Retour aux actualités</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <MobileHeader title={item.title} backPath="/actualites" />

      {/* Hero image */}
      {item.image_url && (
        <div className="relative w-full aspect-[16/7] md:aspect-[21/9] overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Back link — desktop */}
        <Link
          to="/actualites"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-8 mb-6 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour aux actualités
        </Link>

        {/* Meta */}
        <div className={`flex items-center gap-3 flex-wrap ${item.image_url ? '-mt-6 md:mt-0 relative z-10' : 'mt-8 md:mt-12'} mb-4`}>
          {item.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Tag size={10} />
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
          )}
          {item.publish_date && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Calendar size={10} />
              {format(new Date(item.publish_date), 'dd MMMM yyyy', { locale: fr })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
          {item.title}
        </h1>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-lg text-muted-foreground border-l-2 border-primary pl-4 mb-8 italic leading-relaxed">
            {item.excerpt}
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-border mb-8" />

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none
          prose-headings:font-display prose-headings:font-bold
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
          prose-p:leading-relaxed prose-p:text-foreground/90
          prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown>{item.content}</ReactMarkdown>
        </div>

        {/* Share button */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm text-muted-foreground font-mono">Partager cet article</span>
          <button
            onClick={handleShare}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
              copied
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-card border-border hover:border-primary/50 hover:text-primary'
            }`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>
    </div>
  );
}