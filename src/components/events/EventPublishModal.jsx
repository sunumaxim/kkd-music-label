import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarDays, Ticket, Sparkles, Upload,
  ShieldCheck, CheckCircle2, ChevronRight,
  X, Loader2, Award, ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { slugify } from '@/lib/slugify';
import TicketThemePicker from '@/components/events/TicketThemePicker';

const EVENT_TYPES = [
  { id: 'concert', label: 'Concert Live', desc: 'Performance live en salle ou stade' },
  { id: 'festival', label: 'Festival & Open-Air', desc: 'Événement multi-scènes sur plusieurs jours' },
  { id: 'showcase', label: 'Showcase Privé', desc: 'Prestation intimiste ou lancement exclusif' },
  { id: 'rencontre', label: 'Meet & Greet / Conférence', desc: 'Rencontre dédicace, masterclass ou panel' },
];

const PRESET_CATEGORIES = [
  { id: 'standard', name: 'Pass Standard', defaultPrice: 5000, defaultCap: 500, enabled: true, badge: 'Accès Général' },
  { id: 'vip', name: 'Pass VIP', defaultPrice: 15000, defaultCap: 80, enabled: true, badge: 'Coupe-file & Carré VIP' },
  { id: 'carre_or', name: 'Carré Or', defaultPrice: 25000, defaultCap: 30, enabled: false, badge: 'Place Assise Prestige' },
  { id: 'vvip', name: 'Pass VVIP / Backstage', defaultPrice: 50000, defaultCap: 15, enabled: false, badge: 'Accès Loges & Artiste' },
  { id: 'early_bird', name: 'Pass Early Bird', defaultPrice: 3500, defaultCap: 100, enabled: false, badge: 'Tarif Prévente Limité' },
  { id: 'festival', name: 'Pass Festival Complet', defaultPrice: 35000, defaultCap: 200, enabled: false, badge: 'Tous les Jours' },
];

export default function EventPublishModal({ isOpen, onClose, user }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [publishedEvent, setPublishedEvent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'concert',
    event_date: '',
    doors_open_time: '19:00',
    location: '',
    city: 'Dakar',
    description: '',
    image_url: '',
    stream_url: '',
    ticket_url: '',
    artist_name: user?.full_name || '',
    artist_id: '',
    // Billetterie
    is_ticketed: true,
    ticket_theme: 'classic',
    // Catégories configurables
    categories: PRESET_CATEGORIES,
    // Gestionnaires de scan
    managersText: user?.email || '',
    commission_pct: 10,
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['artists-events-publish'],
    queryFn: () => base44.entities.Artist.list('name', 200),
    initialData: [],
  });

  const setField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const updateCategory = (id, field, val) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, [field]: val } : c)
    }));
  };

  const handleFlyerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFlyer(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      if (res?.file_url) {
        setField('image_url', res.file_url);
        toast({ title: 'Affiche enregistrée', description: 'Visuel officiel chargé avec succès.' });
      }
    } catch (err) {
      toast({ title: "Erreur d'upload", description: err.message, variant: 'destructive' });
    } finally {
      setUploadingFlyer(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Titre requis', description: "Veuillez renseigner le titre de l'événement.", variant: 'destructive' });
      return false;
    }
    if (!formData.event_date) {
      toast({ title: 'Date requise', description: 'Veuillez définir la date et heure du concert.', variant: 'destructive' });
      return false;
    }
    if (!formData.location.trim()) {
      toast({ title: 'Lieu requis', description: 'Indiquez la salle, le stade ou le lieu du concert.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const managers = formData.managersText
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const eventSlug = slugify(formData.title);

      // Extract active ticket categories
      const activeCategories = formData.categories
        .filter(c => c.enabled)
        .map(c => ({
          id: c.id,
          name: c.name,
          price: Number(c.defaultPrice) || 0,
          capacity: Number(c.defaultCap) || 0,
          badge: c.badge,
        }));

      const primaryCategory = activeCategories[0] || { price: 5000, capacity: 500 };

      const payload = {
        title: formData.title.trim(),
        slug: eventSlug,
        event_type: formData.event_type,
        event_date: new Date(formData.event_date).toISOString(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        stream_url: formData.stream_url.trim() || undefined,
        ticket_url: formData.ticket_url.trim() || undefined,
        is_ticketed: !!formData.is_ticketed,
        ticket_price: primaryCategory.price,
        ticket_capacity: primaryCategory.capacity,
        ticket_categories: activeCategories,
        tickets_sold: 0,
        ticket_theme: formData.ticket_theme || 'classic',
        managers,
        artist_id: formData.artist_id || undefined,
        artist_name: formData.artist_name || undefined,
        organizer_email: user?.email || '',
        organizer_name: user?.full_name || user?.email || '',
        published_status: 'approuve',
        commission_pct: Number(formData.commission_pct) || 10,
        likes_count: 0,
        comments: [],
      };

      const newRecord = await base44.entities.Event.create(payload);
      setPublishedEvent(newRecord);
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      setStep(4);
      toast({
        title: 'Concert programmé avec succès !',
        description: `"${formData.title}" est prêt pour la billetterie et le contrôle d'accès.`,
      });
    } catch (err) {
      toast({
        title: 'Erreur lors de la création',
        description: err.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden text-foreground my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Programmer un Événement & Billetterie
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                  Organisateur
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Billets sécurisés par QR code & code-barres, jauge et catégories de pass</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div className="px-6 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>1</span>
              <span className={step === 1 ? 'text-foreground font-bold' : 'text-muted-foreground'}>Lieu & Horaires</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>2</span>
              <span className={step === 2 ? 'text-foreground font-bold' : 'text-muted-foreground'}>Affiche & Artiste</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>3</span>
              <span className={step === 3 ? 'text-foreground font-bold' : 'text-muted-foreground'}>Billets & Design</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {/* STEP 1: General Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Nom de l'événement / Concert *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="ex : Festival Panafricain des Rythmes 2026"
                  className="mt-1.5 bg-background border-border text-base font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Type d'événement</Label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setField('event_type', e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-xl bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Date & Heure de début *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setField('event_date', e.target.value)}
                    className="mt-1.5 bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Lieu / Salle *</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="ex : Esplanade du Grand Théâtre"
                    className="mt-1.5 bg-background border-border"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Ville & Pays *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="ex : Dakar, Sénégal"
                    className="mt-1.5 bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Description de l'événement</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Présentation des têtes d'affiches, première partie, conditions d'accès, vestiaire..."
                  className="mt-1.5 bg-background border-border min-h-[90px] text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Artiste & Affiche */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Artiste principal / Organisateur</Label>
                <Input
                  value={formData.artist_name}
                  onChange={(e) => setField('artist_name', e.target.value)}
                  placeholder="Nom de l'artiste ou groupe"
                  className="mt-1.5 bg-background border-border"
                />
                {artists.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-1">Suggestions :</span>
                    {artists.slice(0, 6).map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setField('artist_name', a.name);
                          setField('artist_id', a.id);
                        }}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Flyer upload */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">
                  Affiche Officielle (Visuel imprimé sur les billets PDF et QR codes)
                </Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Affiche"
                      className="w-36 aspect-[3/4] rounded-2xl object-cover border border-border shadow-md"
                    />
                  ) : (
                    <div className="w-36 aspect-[3/4] rounded-2xl bg-secondary border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs p-3 text-center">
                      <CalendarDays size={26} className="mb-2 opacity-50" />
                      <span>Aucune affiche</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer hover:bg-primary/90 transition-colors">
                      {uploadingFlyer ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      <span>{uploadingFlyer ? 'Téléversement...' : "Uploader l'affiche HD"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFlyerUpload}
                        disabled={uploadingFlyer}
                        className="hidden"
                      />
                    </label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setField('image_url', e.target.value)}
                      placeholder="Ou URL directe de l'image (https://...)"
                      className="bg-background border-border text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Cette image apparaît directement au centre du QR code et sur le ticket certifié.
                    </p>
                  </div>
                </div>
              </div>

              {/* Teaser or Live stream link */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Lien YouTube du Teaser ou Replay Live (optionnel)</Label>
                <Input
                  value={formData.stream_url}
                  onChange={(e) => setField('stream_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1.5 bg-background border-border text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Billetterie & Catégories de Tickets & Design */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-display font-black text-foreground text-sm flex items-center gap-2">
                      <Ticket size={16} className="text-primary" /> Activer la Billetterie Électronique Sécurisée
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Génère des billets avec QR code cryptographique et code-barres, contrôlables à la porte d'entrée.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_ticketed}
                    onCheckedChange={(v) => setField('is_ticketed', v)}
                  />
                </div>

                {formData.is_ticketed && (
                  <div className="pt-4 border-t border-border space-y-5">
                    {/* Choix du Thème graphique du billet */}
                    <div className="space-y-2">
                      <TicketThemePicker
                        value={formData.ticket_theme}
                        onChange={(theme) => setField('ticket_theme', theme)}
                      />
                    </div>

                    {/* Configuration des Catégories de Pass */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Award size={14} className="text-primary" /> Catégories de Billets & Tarifs (FCFA)
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {formData.categories.filter(c => c.enabled).length} active(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.categories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              cat.enabled
                                ? 'bg-card border-primary/30 shadow-xs ring-1 ring-primary/10'
                                : 'bg-secondary/30 border-border/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <div>
                                <span className="font-bold text-xs text-foreground block">{cat.name}</span>
                                <span className="text-[10px] text-muted-foreground">{cat.badge}</span>
                              </div>
                              <Switch
                                checked={cat.enabled}
                                onCheckedChange={(val) => updateCategory(cat.id, 'enabled', val)}
                              />
                            </div>

                            {cat.enabled && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="text-[10px] uppercase font-mono text-muted-foreground block">Prix (FCFA)</label>
                                  <Input
                                    type="number"
                                    value={cat.defaultPrice}
                                    onChange={(e) => updateCategory(cat.id, 'defaultPrice', e.target.value)}
                                    className="h-8 text-xs font-bold bg-background border-border mt-0.5"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-mono text-muted-foreground block">Jauge / Quota</label>
                                  <Input
                                    type="number"
                                    value={cat.defaultCap}
                                    onChange={(e) => updateCategory(cat.id, 'defaultCap', e.target.value)}
                                    className="h-8 text-xs bg-background border-border mt-0.5"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contrôleurs de porte autorisés */}
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" /> Contrôleurs de porte autorisés (emails séparés par des virgules)
                </Label>
                <Textarea
                  value={formData.managersText}
                  onChange={(e) => setField('managersText', e.target.value)}
                  placeholder="agent1@securite.com, controlleur@festival.sn"
                  className="bg-background border-border text-xs min-h-[60px]"
                />
                <p className="text-[11px] text-muted-foreground">
                  Ces utilisateurs auront accès au scanner de billets sur leur smartphone dans l'espace Contrôle d'Accès.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && publishedEvent && (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl font-black text-foreground">Événement Programmé & Billetterie Prête !</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Votre événement est en ligne. Vous pouvez maintenant suivre les ventes, générer des pass guichet et scanner les entrées.
                </p>
              </div>

              {publishedEvent.image_url && (
                <div className="max-w-[200px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-md">
                  <img src={publishedEvent.image_url} alt={publishedEvent.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => {
                    onClose();
                    window.location.href = `/evenements/${publishedEvent.slug || publishedEvent.id}`;
                  }}
                  className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow-sm"
                >
                  Voir la page de l'événement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    window.location.href = `/controle-acces?event=${publishedEvent.id}`;
                  }}
                  className="border-border rounded-xl gap-1.5"
                >
                  <ScanLine size={15} /> Contrôle d'accès & Scanner
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {step < 4 && (
          <div className="px-6 py-4 bg-secondary/40 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-muted-foreground hover:text-foreground"
              >
                Précédent
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && validateStep1()) setStep(2);
                  if (step === 2) setStep(3);
                }}
                className="bg-primary text-white font-bold px-5 rounded-xl"
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Création en cours...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" /> Lancer l'Événement & Billets
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}