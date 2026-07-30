import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { WAVE_PAY_LINK, WAVE_MERCHANT } from '@/lib/wave';
import { Ticket, Loader2, Clock, Upload, Check, LogIn, ShieldCheck, CreditCard } from 'lucide-react';

function WaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
    </svg>
  );
}

export default function TicketPurchase({ event }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState('pay');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ref, setRef] = useState('');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMethod, setPendingMethod] = useState('wave');
  const [squareLoading, setSquareLoading] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const email = me?.email;

  const { data: myTicket } = useQuery({
    queryKey: ['my-ticket', email, event.id],
    queryFn: async () => {
      const list = await base44.entities.Ticket.filter({ event_id: event.id });
      return list[0] || null;
    },
    enabled: !!email,
  });

  React.useEffect(() => { if (me?.full_name) setName(me.full_name); }, [me]);

  const capacityFull = event.ticket_capacity > 0 && (event.tickets_sold || 0) >= event.ticket_capacity;
  const priceStr = `${Number(event.ticket_price || 0).toLocaleString('fr-FR')} FCFA`;

  const handleProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setProof(res.file_url);
    } finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!ref.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.Ticket.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.event_date,
        event_image_url: event.image_url || '',
        artist_name: event.artist_name || '',
        organizer_email: event.organizer_email || '',
        managers: event.managers || [],
        buyer_email: email,
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        amount: Number(event.ticket_price) || 0,
        commission_pct: event.commission_pct || 10,
        wave_reference: ref.trim(),
        proof_file_url: proof || '',
        status: 'en_attente',
      });
      qc.invalidateQueries({ queryKey: ['my-ticket', email, event.id] });
      setStep('pay'); setRef(''); setProof('');
      toast({ title: 'Achat envoyé', description: 'En attente de validation KKD.' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleSquare = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { toast({ title: 'Saisissez votre nom', variant: 'destructive' }); return; }
    setSquareLoading(true);
    try {
      const t = await base44.entities.Ticket.create({
        event_id: event.id,
        event_title: event.title,
        event_date: event.event_date,
        event_image_url: event.image_url || '',
        artist_name: event.artist_name || '',
        organizer_email: event.organizer_email || '',
        managers: event.managers || [],
        buyer_email: email,
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        amount: Number(event.ticket_price) || 0,
        commission_pct: event.commission_pct || 10,
        payment_method: 'square',
        square_order_ref: '',
        wave_reference: '',
        proof_file_url: '',
        status: 'en_attente',
      });
      const res = await base44.functions.invoke('createSquareCheckout', { ticket_id: t.id, origin: window.location.origin });
      if (!res?.url) throw new Error(res?.error || 'URL Square introuvable');
      qc.invalidateQueries({ queryKey: ['my-ticket', email, event.id] });
      window.location.href = res.url;
    } catch (err) {
      toast({ title: 'Erreur Square', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally { setSquareLoading(false); }
  };

  // Billet déjà validé
  if (myTicket?.status === 'valide') {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 flex items-center gap-4">
        <ShieldCheck size={20} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-heading font-bold text-sm">Votre billet est prêt 🎟️</p>
          <p className="text-xs text-muted-foreground">N° {myTicket.ticket_number}</p>
        </div>
        <Link to="/mes-billets">
          <Button size="sm" className="bg-primary gap-2"><Ticket size={14} /> Voir mon billet</Button>
        </Link>
      </div>
    );
  }

  if (myTicket?.status === 'en_attente') {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 flex items-start gap-3">
        <Clock size={18} className="text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-heading font-bold text-sm">Paiement en cours de validation</p>
          <p className="text-xs text-muted-foreground">Réf : {myTicket.wave_reference}. Votre billet QR sera généré dès validation par KKD.</p>
        </div>
      </div>
    );
  }

  if (capacityFull) {
    return (
      <div className="bg-card border border-destructive/30 rounded-2xl p-5 text-center">
        <p className="font-heading font-bold text-destructive">Événement complet</p>
        <p className="text-xs text-muted-foreground">Tous les billets ont été vendus.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Ticket size={16} />
        <span className="text-[11px] font-mono uppercase tracking-widest">Billetterie KKD</span>
      </div>

      <div className="text-2xl font-display font-extrabold">{priceStr}</div>

      {me ? (
        step === 'pay' ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => { setPendingMethod('square'); setStep('confirm'); }} className="bg-primary gap-2">
              <CreditCard size={16} /> Payer par carte (Square)
            </Button>
            <a href={WAVE_PAY_LINK} target="_blank" rel="noreferrer"
              onClick={() => { setPendingMethod('wave'); setStep('confirm'); }}
              className="inline-flex items-center gap-2 px-5 h-9 rounded-full text-white font-bold shadow transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#00A6E8,#0066B3)' }}>
              <WaveIcon /> Payer avec Wave
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium">Confirmez votre achat</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nom sur le billet</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Téléphone (facultatif)</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Vous pouvez acheter pour vous ou pour quelqu'un d'autre — le billet restera dans votre compte.</p>

            {pendingMethod === 'wave' ? (
              <>
                <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Référence transaction Wave" required />
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-xs">
                  <Upload size={14} /> {uploading ? 'Envoi…' : proof ? 'Capture ✓' : 'Capture du reçu (facultatif)'}
                  <input type="file" className="hidden" onChange={handleProof} accept="image/*" />
                </label>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !ref.trim() || !name.trim()} className="bg-primary gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirmer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep('pay')}>Annuler</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Vous serez redirigé vers le paiement sécurisé Square. Votre billet QR est généré automatiquement après confirmation du paiement.</p>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleSquare} disabled={squareLoading || !name.trim()} className="bg-primary gap-2">
                    {squareLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Payer par carte
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep('pay')}>Annuler</Button>
                </div>
              </>
            )}
          </form>
        )
      ) : (
        <Link to="/login" className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-primary text-primary-foreground font-bold">
          <LogIn size={16} /> Se connecter pour acheter
        </Link>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Paiement par carte (Square) ou Wave ({WAVE_MERCHANT}). Lecture sur KKD uniquement. Commission KKD : 10 %.
      </p>
    </div>
  );
}