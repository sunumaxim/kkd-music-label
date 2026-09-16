import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import PageMeta from '@/components/shared/PageMeta';
import {
  User, Lock, RefreshCw, LogOut, ArrowRight, Music,
  Mail, Phone, MapPin, Camera, Upload, CheckCircle2, ShieldCheck, Trash2
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export default function AccountSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const fileInputRef = useRef(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    city: '',
    country: 'Sénégal',
    bio: '',
    photo_url: '',
  });

  const [photoUploading, setPhotoUploading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || 'Sénégal',
        bio: user.bio || '',
        photo_url: user.photo_url || '',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedFields) => {
      return await base44.auth.updateMe(updatedFields);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-user'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-user'] });
      toast({
        title: 'Profil synchronisé',
        description: 'Vos modifications ont été enregistrées avec succès dans la base de données.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Erreur d’enregistrement',
        description: err?.message || 'Impossible de sauvegarder votre profil dans la base de données.',
        variant: 'destructive',
      });
    },
  });

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier image (JPG, PNG, WebP).',
        variant: 'destructive',
      });
      return;
    }

    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfileData((p) => ({ ...p, photo_url: dataUrl }));
        setPhotoUploading(false);
        toast({
          title: 'Photo prête',
          description: 'Cliquez sur "Enregistrer mon profil" pour sauvegarder la photo dans votre compte.',
        });
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setPhotoUploading(false);
      toast({
        title: 'Erreur',
        description: "Impossible de lire le fichier.",
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit comporter au moins 8 caractères.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erreur de mot de passe',
        description: 'Les deux mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await base44.auth.changePassword(passwordData.newPassword);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre nouveau mot de passe a été enregistré avec succès.',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de modifier le mot de passe.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  // Écran invité si non connecté
  if (!user || !user.email) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <PageMeta title="Connexion requise — KKD Music" description="Accédez à votre compte" />
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <User size={36} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display text-foreground">Vous n'êtes pas connecté</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous ou créez un compte pour gérer votre profil, vos billets ou vos publications.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            Se connecter
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border bg-secondary hover:bg-secondary/80 font-bold transition-all"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const isSuperAdmin = user?.email?.toLowerCase() === 'storesmaxim@gmail.com' || user?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <PageMeta
        title="Mon Compte — KKD Music"
        description="Gérez votre profil, vos informations personnelles et votre sécurité sur KKD Music."
      />

      {/* ── En-tête du profil avec statut base de données ── */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            {profileData.photo_url ? (
              <img
                src={profileData.photo_url}
                alt={user?.full_name || 'Utilisateur'}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white text-3xl font-black shadow-sm">
                {initial}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              title="Changer la photo"
            >
              <Camera size={20} />
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-display font-extrabold text-foreground">
                {user?.full_name || 'Mon Compte'}
              </h1>
              {isSuperAdmin && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} /> Super Administrateur
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <Mail size={13} /> {user?.email}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-foreground font-semibold border border-border">
                {isSuperAdmin ? 'Compte Principal KKD' : user?.account_type === 'partner' ? 'Partenaire Label' : 'Compte Membre'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 size={11} /> Synchronisé Firestore
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await logout(true);
          }}
          className="text-xs h-9 text-destructive hover:bg-destructive/10 border-border gap-2"
        >
          <LogOut size={14} />
          Se déconnecter
        </Button>
      </div>

      {/* ── Section 1 : Modifier le Profil & Photo ── */}
      <form onSubmit={handleProfileSubmit} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <User size={18} className="text-primary" /> Informations du Profil & Photo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mettez à jour vos informations et votre photo de profil prises en compte par la base de données
          </p>
        </div>

        {/* Gestion de la Photo de Profil */}
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-3">
          <Label className="text-xs font-semibold block">Photo de profil</Label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              {profileData.photo_url ? (
                <img
                  src={profileData.photo_url}
                  alt="Photo de profil"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="text-xs h-9 font-medium gap-1.5 border-border bg-card hover:bg-secondary"
              >
                {photoUploading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                Téléverser depuis l'appareil
              </Button>

              {profileData.photo_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileData((p) => ({ ...p, photo_url: '' }))}
                  className="text-xs h-9 text-muted-foreground hover:text-destructive gap-1"
                >
                  <Trash2 size={13} /> Supprimer
                </Button>
              )}
            </div>
          </div>

          {/* Avatars prédéfinis */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground mb-2">Ou sélectionnez un avatar rapide :</p>
            <div className="flex items-center gap-2.5 flex-wrap">
              {AVATAR_OPTIONS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setProfileData((p) => ({ ...p, photo_url: url }))}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                    profileData.photo_url === url
                      ? 'border-primary scale-110 shadow-md ring-2 ring-primary/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Nom complet *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={profileData.full_name}
                onChange={(e) => setProfileData((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Votre prénom et nom"
                className="pl-9 h-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Numéro de téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+221 77 000 00 00"
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Ville & Pays</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profileData.city ? `${profileData.city}, ${profileData.country}` : profileData.country}
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    setProfileData((p) => ({
                      ...p,
                      city: parts[0]?.trim() || '',
                      country: parts[1]?.trim() || p.country || 'Sénégal',
                    }));
                  }}
                  placeholder="Dakar, Sénégal"
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Bio / Présentation</Label>
            <Textarea
              value={profileData.bio}
              onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Quelques mots sur vous ou votre projet artistique..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="bg-primary hover:bg-primary/90 font-bold px-5 h-10 text-sm gap-2"
          >
            {updateProfileMutation.isPending ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              'Enregistrer mon profil'
            )}
          </Button>
        </div>
      </form>

      {/* ── Section 2 : Mot de passe & Sécurité ── */}
      <form onSubmit={handlePasswordChange} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Sécurité & Mot de passe
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modifiez votre mot de passe pour protéger votre compte
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Nouveau mot de passe</Label>
            <Input
              type="password"
              placeholder="Minimum 8 caractères"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
              required
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Confirmer le mot de passe</Label>
            <Input
              type="password"
              placeholder="Répétez le mot de passe"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
              className="h-10"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="outline"
            disabled={passwordLoading}
            className="font-bold border-border h-10 text-sm"
          >
            {passwordLoading ? 'Mise à jour...' : 'Changer mon mot de passe'}
          </Button>
        </div>
      </form>

      {/* ── Section 3 : Passerelle Artiste & Espace Partenaire ── */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-md">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 mb-1">
            <Music size={12} /> Espace Artiste & Créateur
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Vous souhaitez gérer votre profil artiste et publier des morceaux ?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            La réclamation de profil artiste, la publication de titres, la configuration de vos clips et le suivi de vos revenus s’effectuent directement dans le tableau de bord partenaire.
          </p>
        </div>

        <Link
          to="/mon-espace"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md transition-all shrink-0 w-full sm:w-auto"
        >
          Espace Partenaire & Artiste <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
