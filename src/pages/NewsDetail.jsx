import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import MobileHeader from '@/components/mobile/MobileHeader';
import { PhotoGallery, VideoEmbeds, MusicEmbeds, ExternalLinks, ArticleTags } from '@/components/news/ArticleMediaBlocks';
import CommentsSection from '@/components/shared/CommentsSection';
import PageMeta from '@/components/shared/PageMeta';
import ShareBar from '@/components/shared/ShareBar';
import { slugify, buildShareUrl, extractIdFromSlug } from '@/lib/slugify';

const CATEGORY_LABELS = {
  communique: 'Communiqué',
  nouveaute: 'Nouveauté',
  article: 'Article',
  info_artiste: 'Info Artiste',
};

export default function NewsDetail() {
  const { id: slugParam } = useParams();
  const newsId = extractIdFromSlug(slugParam);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ['news-detail', newsId],
    queryFn: async () => {
      const results = await base44.entities.News.filter({ id: newsId });
      return results[0] || null;
    },
  });

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshArticle = () => {
    queryClient.invalidateQueries({ queryKey: ['news-detail', newsId] });
  };

  const shareUrl = item ? buildShareUrl('/actualites', item.title, item.id) : '';

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
    <div className="min-h-screen pb-24 bg-background">
      <PageMeta
        title={item.title}
        description={item.excerpt || item.content?.slice(0, 160)}
        image={item.image_url}
        url={shareUrl}
        type="article"
      />
      <MobileHeader title={item.title} backPath="/actualites" />

      {/* Hero image */}
      {item.image_url && (
        <div className="relative w-full aspect-[16/7] md:aspect-[21/9] overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Back — desktop */}
        <Link
          to="/actualites"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-8 mb-4 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour aux actualités
        </Link>

        {/* Meta */}
        <div className={`flex items-center gap-3 flex-wrap ${item.image_url ? '-mt-8 relative z-10' : 'mt-8 md:mt-12'} mb-5`}>
          {item.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white bg-primary px-3 py-1.5 rounded-full">
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
        <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
          {item.title}
        </h1>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-lg text-muted-foreground border-l-2 border-primary pl-5 mb-8 italic leading-relaxed">
            {item.excerpt}
          </p>
        )}

        {/* Tags */}
        <ArticleTags tags={item.tags} />

        {/* Divider */}
        <div className="h-px bg-border mb-8" />

        {/* Content */}
        <div className="prose prose-invert prose-sm md:prose-base max-w-none
          prose-headings:font-display prose-headings:font-bold
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-4
          prose-strong:text-foreground
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-ul:my-3 prose-li:my-1
          prose-img:rounded-xl prose-img:my-6
        ">
          <ReactMarkdown>{item.content}</ReactMarkdown>
        </div>

        {/* Media blocks */}
        <PhotoGallery images={item.gallery} />
        <VideoEmbeds videos={item.video_urls} />
        <MusicEmbeds musics={item.music_embeds} />
        <ExternalLinks links={item.links} />

        {/* Share bar */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Partager cet article</p>
          <ShareBar title={item.title} url={shareUrl} />
        </div>

        {/* Comments & likes */}
        <CommentsSection entityType="news" entity={item} onUpdate={refreshArticle} />
      </div>
    </div>
  );
}