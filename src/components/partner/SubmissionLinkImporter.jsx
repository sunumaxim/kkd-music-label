import React, { useState } from 'react';
import { resolveMusicLink } from '@/services/musicLinkResolverService';
import { Sparkles, Link2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SubmissionLinkImporter({ onResolved, currentFormat = 'single' }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvedData, setResolvedData] = useState(null);

  const handleAnalyze = async () => {
    const raw = (url || '').trim();
    if (!raw) return;
    setLoading(true);
    setError('');

    try {
      const result = await resolveMusicLink(raw);
      if (!result || !result.success) {
        throw new Error(result?.error || "Impossible d'extraire les données de ce lien musical.");
      }

      setResolvedData(result);
      if (onResolved) {
        onResolved(result);
      }
    } catch (err) {
      setError(err?.message || "Échec de l'analyse du lien. Vérifiez l'URL et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setResolvedData(null);
    setError('');
  };

  return (
    <div className="rounded-2xl bg-[#141822] border border-white/[0.08] p-4 sm:p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Link2 size={16} />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
              Importer via un lien
              <span className="text-[10px] font-normal normal-case text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                1 Clic · Sans fichier obligatoire
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Collez l'URL de votre Single, EP ou Album (Spotify, Deezer, Apple Music, YouTube)
            </p>
          </div>
        </div>

        {resolvedData && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-zinc-400 hover:text-white underline"
          >
            Changer de lien
          </button>
        )}
      </div>

      {/* Input bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            placeholder="https://open.spotify.com/album/... ou https://www.deezer.com/album/..."
            className="w-full bg-[#1b202d] border border-white/[0.1] focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono"
          />
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all shrink-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Analyser le projet
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Resolved preview badge */}
      {resolvedData && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {resolvedData.cover_url && (
              <img
                src={resolvedData.cover_url}
                alt={resolvedData.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/[0.1] shadow"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white truncate">{resolvedData.title}</p>
                <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {resolvedData.format === 'single' ? 'Single' : resolvedData.format === 'ep' ? 'EP' : 'Album'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                {resolvedData.artist_name}
                {resolvedData.featuring ? ` (feat. ${resolvedData.featuring})` : ''}
                {resolvedData.release_year ? ` · ${resolvedData.release_year}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} />
              {resolvedData.tracks?.length > 1
                ? `${resolvedData.tracks.length} morceaux regroupés`
                : 'Piste audio prête'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
