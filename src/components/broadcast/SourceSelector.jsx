import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio, Film, Link2, Search, Check, Video as VideoIcon, Camera, Upload } from 'lucide-react';
import CameraSource from './CameraSource';
import FileSource from './FileSource';

export default function SourceSelector({ source_type, stream_url, source_video_ids = [], source_video_url, onChange }) {
  const [search, setSearch] = useState('');
  const { data: videos = [] } = useQuery({
    queryKey: ['broadcast-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100),
  });
  const selected = new Set(source_video_ids);
  const filtered = videos.filter(v =>
    !search || v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.artist_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVideo = (id) => {
    const next = selected.has(id) ? source_video_ids.filter(x => x !== id) : [...source_video_ids, id];
    onChange({ source_video_ids: next });
  };

  const TYPES = [
    { value: 'live_stream', label: 'Flux live', icon: Link2 },
    { value: 'video_replay', label: 'Catalogue', icon: Film },
    { value: 'camera', label: 'Caméra', icon: Camera },
    { value: 'file_upload', label: 'Fichier', icon: Upload },
  ];

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Radio size={16} className="text-primary" /> Source du direct
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map(t => {
          const Icon = t.icon;
          const active = source_type === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onChange({ source_type: t.value })}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-xs font-medium transition-all ${
                active ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {source_type === 'live_stream' && (
        <div>
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Lien du flux (YouTube Live)
          </label>
          <input
            value={stream_url || ''}
            onChange={e => onChange({ stream_url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      )}

      {source_type === 'video_replay' && (
        <div>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une vidéo…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary text-sm border border-border/50 focus:border-primary/50 outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucune vidéo.</p>}
            {filtered.map(v => {
              const isSel = selected.has(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggleVideo(v.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                    isSel ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                    <VideoIcon size={13} className="text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.artist_name}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isSel ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isSel ? <Check size={12} /> : <Film size={11} />}
                  </div>
                </button>
              );
            })}
          </div>
          {source_video_ids.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {source_video_ids.length} vidéo{source_video_ids.length > 1 ? 's' : ''} sélectionnée{source_video_ids.length > 1 ? 's' : ''} (lecture en file)
            </p>
          )}
        </div>
      )}

      {source_type === 'camera' && <CameraSource onChange={onChange} />}

      {source_type === 'file_upload' && (
        <FileSource source_video_url={source_video_url} onChange={onChange} />
      )}
    </div>
  );
}