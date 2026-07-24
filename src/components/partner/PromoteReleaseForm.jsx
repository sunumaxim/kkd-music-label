import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Megaphone, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Formulaire de demande de mise en avant payante (partenaire / artiste).
 * Le paiement (Orange Money / Wave) est traité hors-ligne par l'équipe KKD,
 * l'admin valide ensuite la demande au cas par cas.
 */
export default function PromoteReleaseForm({ user, onClose }) {
  const [releaseId, setReleaseId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [streamingLink, setStreamingLink] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [targetSection, setTargetSection] = useState('hero');
  const [requestedDays, setRequestedDays] = useState(7);
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: invite } = useQuery({
    queryKey: ['promote-invite', user?.email],
    queryFn: async () => (await base44.entities.ArtistInvite.filter({ email: user.email }))[0] || null,
    enabled: !!user?.email,
  });
  const linkedArtistId = invite?.artist_id;

  const { data: artist } = useQuery({
    queryKey: ['promote-artist', linkedArtistId],
    queryFn: async () => (await base44.entities.Artist.filter({ id: linkedArtistId }))[0] || null,
    enabled: !!linkedArtistId,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['promote-releases', artist?.name],
    queryFn: () => base44.entities.Release.filter({ artist_name: artist.name }, '-release_date', 50),
    enabled: !!artist?.name,
  });

  const selectedRelease = releases.find((r) => r.id === releaseId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = selectedRelease?.title || manualTitle;
    if (!title) return;
    setSubmitting(true);
    try {
      await base44.entities.SponsoredPlacement.create({
        partner_email: user.email,
        partner_name: user.full_name || user.email,
        artist_name: selectedRelease?.artist_name || artistName || artist?.name || '',
        release_id: selectedRelease?.id || '',
        release_title: title,
        cover_url: selectedRelease?.cover_url || coverUrl || '',
        streaming_link:
          selectedRelease?.spotify_url || selectedRelease?.youtube_url || streamingLink || '',
        target_section: targetSection,
        requested_days: Number(requestedDays),
        payment_method: paymentMethod,
        payment_status: 'en_attente',
        status: 'en_attente',
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
        <h3 className="font-heading font-bold text-lg mb-2">Demande envoyée !</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          Votre demande de mise en avant ({requestedDays} jours) sera examinée par l'équipe KKD Music.
          Le règlement via {paymentMethod === 'wave' ? 'Wave' : 'Orange Money'} se fera hors-ligne —
          nos équipes vous contacteront.
        </p>
        <Button onClick={onClose}>Fermer</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
          <Megaphone size={18} className="text-primary" /> Promouvoir ma sortie
        </h2>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        La plateforme est gratuite. Cette mise en avant est optionnelle et payante —
        votre sortie apparaîtra dans le carrousel « Mis en avant » de l'accueil après validation par notre équipe.
      </p>

      <div className="space-y-2">
        <Label>Sortie à promouvoir</Label>
        {releases.length > 0 ? (
          <select
            value={releaseId}
            onChange={(e) => setReleaseId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">— Choisir parmi mes sorties —</option>
            {releases.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-muted-foreground italic">Aucune sortie liée — saisissez les infos manuellement.</p>
        )}
      </div>

      {!selectedRelease && (
        <>
          <div className="space-y-2">
            <Label>Titre de la sortie *</Label>
            <Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Ex : Nouveau single" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Artiste</Label>
              <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Nom de l'artiste" />
            </div>
            <div className="space-y-2">
              <Label>Lien d'écoute</Label>
              <Input value={streamingLink} onChange={(e) => setStreamingLink(e.target.value)} placeholder="Spotify / YouTube…" />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Emplacement</Label>
        <div className="grid grid-cols-3 gap-2">
          {[{ k: 'hero', l: 'À la une' }, { k: 'trending', l: 'Tendances' }, { k: 'both', l: 'Les deux' }].map((o) => (
            <button
              type="button"
              key={o.k}
              onClick={() => setTargetSection(o.k)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                targetSection === o.k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Durée</Label>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setRequestedDays(d)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                requestedDays === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {d} jours
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Moyen de paiement</Label>
        <div className="grid grid-cols-2 gap-2">
          {[{ k: 'orange_money', l: 'Orange Money' }, { k: 'wave', l: 'Wave' }].map((o) => (
            <button
              type="button"
              key={o.k}
              onClick={() => setPaymentMethod(o.k)}
              className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                paymentMethod === o.k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
          Envoyer la demande
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}