import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Lock, ShoppingBag, Loader2 } from 'lucide-react';

export default function BuyCard({ item, itemType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!item?.is_for_sale || !item.price || Number(item.price) <= 0) return null;

  const isInIframe = () => {
    try { return window.self !== window.top; } catch (_) { return true; }
  };

  const handleBuy = async () => {
    setError('');
    if (isInIframe()) {
      alert("Le paiement fonctionne uniquement depuis l'application publiée (pas depuis l'aperçu intégré). Ouvrez l'app dans un onglet.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        item_type: itemType,
        item_id: item.id,
        origin: window.location.origin
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error(res.data?.error || 'Impossible de démarrer le paiement');
      }
    } catch (e) {
      setError(e.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Lock size={16} />
        <span className="text-[11px] font-mono uppercase tracking-widest">Achat exclusif — avant disponibilité officielle</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Achetez et écoutez/regardez ce contenu sur la plateforme KKD à tout moment. Le téléchargement et l'extraction sont désactivés.
      </p>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-2xl font-display font-extrabold">
          {Number(item.price).toLocaleString('fr-FR')} <span className="text-base font-medium">FCFA</span>
        </div>
        <Button onClick={handleBuy} disabled={loading} className="bg-primary hover:bg-primary/80">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Redirection…</>
            : <><ShoppingBag size={16} /> Acheter</>}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Link to="/mes-achats" className="text-xs text-primary hover:underline block">
        Vous avez déjà acheté ? Voir mes achats
      </Link>
    </div>
  );
}