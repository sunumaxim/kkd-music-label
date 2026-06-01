import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Music, Video, Radio, Handshake, Globe, Upload } from 'lucide-react';

const requestTypes = [
  { value: 'distribution', label: 'Distribution musicale', icon: Globe, desc: 'Distribuer votre musique sur Spotify, Apple Music, Audiomack et plus via KKD.' },
  { value: 'promotion_musique', label: 'Promotion musicale', icon: Music, desc: 'Faire promouvoir votre sortie musicale sur nos plateformes et réseaux.' },
  { value: 'promotion_clip', label: 'Promotion de clip vidéo', icon: Video, desc: 'Mettre en avant votre clip vidéo auprès de notre audience.' },
  { value: 'partenariat_label', label: 'Partenariat label', icon: Handshake, desc: 'Établir un partenariat entre votre label et KKD Music.' },
  { value: 'collaboration', label: 'Collaboration artistique', icon: Radio, desc: 'Proposer une collaboration entre vos artistes et ceux de KKD Music.' },
  { value: 'autre', label: 'Autre demande', icon: Music, desc: 'Toute autre demande de prestation ou de service.' },
];

export default function Partnership() {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', organization: '',
    request_type: '', artist_name: '', genre: '', description: '', music_link: ''
  });
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(result.file_url);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Optimistic: show success immediately, then persist
    setSubmitted(true);
    base44.entities.ServiceRequest.create({ ...form, file_url: fileUrl }).finally(() => {
      setSubmitting(false);
    });
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h2 className="font-display text-3xl font-extrabold mb-3">Demande envoyée !</h2>
          <p className="text-muted-foreground mb-8">
            Notre équipe a bien reçu votre demande et vous contactera dans les plus brefs délais à l'adresse <strong>{form.email}</strong>.
          </p>
          <Button onClick={() => { setSubmitted(false); setForm({ full_name: '', email: '', phone: '', organization: '', request_type: '', artist_name: '', genre: '', description: '', music_link: '' }); setFileUrl(''); setSelectedType(null); }}>
            Soumettre une nouvelle demande
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
        <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
        <div className="max-w-4xl mx-auto relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Travailler avec KKD</span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-4">
              Demande de Prestation
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Vous êtes un artiste, un label ou un prestataire ? Soumettez votre demande et notre équipe vous répondra rapidement.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Service type selector */}
        {!form.request_type && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h2 className="font-heading font-bold text-lg mb-6 text-center">Choisissez votre type de demande</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => { handleChange('request_type', type.value); setSelectedType(type); }}
                    className="text-left p-5 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-sm mb-1">{type.label}</h3>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Form */}
        {form.request_type && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {selectedType && (
              <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <selectedType.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">{selectedType.label}</p>
                  <button onClick={() => { handleChange('request_type', ''); setSelectedType(null); }} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Changer de type →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary">Vos informations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Nom complet *</Label>
                    <Input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} placeholder="Votre nom complet" required />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Email *</Label>
                    <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="email@exemple.com" required />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Téléphone</Label>
                    <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+33 6 00 00 00 00" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Label / Organisation</Label>
                    <Input value={form.organization} onChange={e => handleChange('organization', e.target.value)} placeholder="Nom du label ou de votre structure" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary">Informations artistiques</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Nom de l'artiste</Label>
                    <Input value={form.artist_name} onChange={e => handleChange('artist_name', e.target.value)} placeholder="Nom de scène de l'artiste" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Genre musical</Label>
                    <Input value={form.genre} onChange={e => handleChange('genre', e.target.value)} placeholder="Afrobeat, Hip-Hop, R&B…" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Lien vers votre musique / clip</Label>
                  <Input value={form.music_link} onChange={e => handleChange('music_link', e.target.value)} placeholder="YouTube, SoundCloud, Spotify, Audiomack…" />
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-primary">Détail de la demande</h3>
                <div>
                  <Label className="text-sm mb-1.5 block">Description *</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="Décrivez en détail votre demande, vos objectifs, votre projet…"
                    rows={5}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Joindre un fichier (EPK, musique, présentation…)</Label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-secondary hover:bg-secondary/80 text-sm transition-colors">
                      <Upload size={16} />
                      {uploading ? 'Téléchargement…' : fileUrl ? 'Fichier joint ✓' : 'Choisir un fichier'}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.mp3,.mp4,.jpg,.png,.zip" />
                    </label>
                    {fileUrl && <span className="text-xs text-primary">Fichier joint avec succès</span>}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-bold">
                {submitting ? 'Envoi en cours…' : 'Soumettre ma demande'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe KKD Music. Vos données sont traitées en toute confidentialité.
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}