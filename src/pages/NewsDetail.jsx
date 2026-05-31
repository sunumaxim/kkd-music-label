import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function NewsDetail() {
  const newsId = window.location.pathname.split('/').pop();

  const { data: item, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: async () => {
      const all = await base44.entities.News.list();
      return all.find(n => n.id === newsId);
    },
  });

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
    <div className="min-h-screen px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <Link to="/actualites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} /> Retour aux actualités
        </Link>

        {item.image_url && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-card mb-8">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          {item.category && (
            <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
              {item.category.replace('_', ' ')}
            </span>
          )}
          {item.publish_date && (
            <span className="text-xs font-mono text-muted-foreground">
              {format(new Date(item.publish_date), 'dd MMMM yyyy', { locale: fr })}
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mb-8">
          {item.title}
        </h1>

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{item.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}