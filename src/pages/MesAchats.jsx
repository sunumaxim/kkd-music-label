import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProtectedPlayer from '@/components/marketplace/ProtectedPlayer';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Music, Film, Loader2, Mail, Play, ListMusic, Shuffle } from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';

export default function MesAchats() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(() => localStorage.getItem('kkd_purchase_email') || '');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('audio');
  const loaded = useRef(false);
  const player = usePlayer();

  const buildTrack = (p) => ({
    key: p.item_id,
    title: p.item_title,
    artist_name: p.artist_name,
    cover_url: p.cover_url,
    audio_url: p.protected_url,
    item_id: p.item_id,
    item_type: p.item_type,
  });
  const audioPurchases = purchases.filter((p) => !p.is_video && p.protected_url);
  const videoPurchases = purchases.filter((p) => p.is_video && p.protected_url);
  const playAll = () => { if (audioPurchases.length) player.playQueue(audioPurchases.map(buildTrack), 0); };
  const shuffleAll = () => {
    if (!audioPurchases.length) return;
    const shuffled = [...audioPurchases].sort(() => Math.random() - 0.5);
    player.setShuffle(true);
    player.playQueue(shuffled.map(buildTrack), 0);
  };

  const loadPurchases = async (emailArg) => {
    const em = (emailArg || email || '').trim();
    if (!em) return;
    setLoading(true);
    localStorage.setItem('kkd_purchase_email', em);
    try {
      const res = await base44.functions.invoke('getMyPurchases', { user_email: em });
      setPurchases(res.data?.purchases || []);
    } catch (e) {
      setMessage(e.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  // Rachat automatique après retour Stripe
  useEffect(() => {
    const sid = params.get('session_id');
    if (!sid) return;
    setRedeeming(true);
    base44.functions.invoke('redeemPurchase', { session_id: sid })
      .then((r) => {
        if (r.data?.user_email) {
          setEmail(r.data.user_email);
          localStorage.setItem('kkd_purchase_email', r.data.user_email);
          setMessage('Achat confirmé ! Votre contenu est disponible ci-dessous.');
          loadPurchases(r.data.user_email);
        } else {
          setMessage(r.data?.error || "Impossible de confirmer l'achat.");
        }
      })
      .catch((e) => setMessage(e.message || 'Erreur lors de la confirmation.'))
      .finally(() => setRedeeming(false));
  }, []);

  // Chargement initial si email déjà connu et pas de retour Stripe
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (email && !params.get('session_id')) loadPurchases(email);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader title="Mes achats" backPath="/" />
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mb-2">Mes achats</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Retrouvez vos contenus exclusifs et écoutez-les sur la plateforme KKD à tout moment.
        </p>

        {/* Recherche par email */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadPurchases(); }}
              placeholder="Email utilisé lors de l'achat"
              className="pl-9"
            />
          </div>
          <Button onClick={() => loadPurchases()} disabled={loading || !email}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Afficher'}
          </Button>
        </div>

        {redeeming && (
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Loader2 size={16} className="animate-spin" /> Confirmation de votre achat…
          </div>
        )}
        {message && <p className="text-sm text-primary mb-4">{message}</p>}

        {!loading && !redeeming && email && purchases.length === 0 && (
          <p className="text-muted-foreground text-sm">Aucun achat pour cet email.</p>
        )}

        {/* Onglets bibliothèque */}
        {purchases.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setTab('audio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'audio' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              <Music size={15} /> Musique <span className="text-xs opacity-70">{audioPurchases.length}</span>
            </button>
            <button
              onClick={() => setTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${tab === 'video' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              <Film size={15} /> Vidéos <span className="text-xs opacity-70">{videoPurchases.length}</span>
            </button>
            {tab === 'audio' && audioPurchases.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={shuffleAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                >
                  <Shuffle size={16} /> Aléatoire
                </button>
                <button
                  onClick={playAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <ListMusic size={16} /> Tout écouter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Liste filtrée */}
        <div className="space-y-4">
          {purchases.length > 0 && (tab === 'audio' ? audioPurchases : videoPurchases).map((p, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    {p.is_video ? <Film size={18} className="text-primary" /> : <Music size={18} className="text-primary" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold truncate">{p.item_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.artist_name} • {p.is_video ? 'Clip' : 'Sortie'} • {Number(p.amount || 0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>
              {p.is_video ? (
                <ProtectedPlayer url={p.protected_url} isVideo title={p.item_title} />
              ) : p.protected_url ? (
                <button
                  onClick={() => player.playTrack(buildTrack(p))}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors w-full"
                >
                  <Play size={15} /> Écouter sur KKD
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">Contenu non disponible.</p>
              )}
            </div>
          ))}
          {purchases.length > 0 && (tab === 'audio' ? audioPurchases : videoPurchases).length === 0 && (
            <p className="text-muted-foreground text-sm">Aucun contenu dans cette section.</p>
          )}
        </div>

        <Link to="/" className="text-sm text-primary hover:underline mt-6 inline-block">← Retour à l'accueil</Link>
      </div>
    </div>
  );
}