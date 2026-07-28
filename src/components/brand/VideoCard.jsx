import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function VideoCard({ video: v }) {
  const id = getYouTubeId(v.youtube_url);
  const thumb = v.thumbnail_url || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null);
  return (
    <Link to={`/videos/${v.id}`} className="block h-full">
      <article className="kkd-card-video">
        <div className="kkd-card-video-media">
          {thumb && <img src={thumb} alt={v.title} loading="lazy" />}
          <span className="kkd-card-video-play">
            <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
          </span>
          <span className="kkd-card-video-dur">{v.video_type ? v.video_type.replace('_', ' ') : 'Clip'}</span>
        </div>
        <div className="kkd-card-video-body">
          <h3 className="kkd-card-video-title">{v.title}</h3>
          {v.artist_name && <p className="kkd-card-video-artist">{v.artist_name}</p>}
        </div>
      </article>
    </Link>
  );
}