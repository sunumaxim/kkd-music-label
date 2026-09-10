import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { localDb } from "@/api/localStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Shield, Building2, Mic2, Headphones, Sparkles } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleKey) => {
    const user = localDb.switchRole(roleKey);
    if (roleKey === 'admin') {
      window.location.href = "/admin";
    } else if (roleKey === 'label' || roleKey === 'artist') {
      window.location.href = "/mon-espace";
    } else {
      window.location.href = "/musique";
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border/30 p-12">
        <img src={LOGO_URL} alt="KKD Music" className="h-16 w-auto" />
        <div>
          <p className="font-display text-4xl font-extrabold leading-tight">
            Plateforme D2C<br />
            <span className="text-primary">KKD Music</span>
          </p>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-sm">
            Plus puissant que Spotify ou SoundCloud : vente directe sans intermédiaires, licences officielles de synchronisation et billetterie intégrée.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              90% de royalties nettes
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 font-semibold">
              Paiement Wave & OM
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 font-semibold">
              Licences certifiées ISRC
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/50">© 2026 KKD Music — Tous droits réservés</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={LOGO_URL} alt="KKD Music" className="h-12 w-auto" />
          </div>

          <div>
            <h1 className="font-display text-2xl font-extrabold mb-1">Connexion</h1>
            <p className="text-muted-foreground text-sm">Accédez aux espaces Label, Artistes ou Fan</p>
          </div>

          {/* Quick Access Roles Presets */}
          <div className="bg-secondary/40 border border-border/70 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5 text-primary">
                <Sparkles size={14} /> Connexion Rapide Partenaires
              </span>
              <span className="text-[10px] text-muted-foreground">1 clic</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs mb-0.5">
                  <Shield size={14} /> Admin
                </div>
                <div className="text-[10px] text-muted-foreground truncate">Plateforme globale</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('label')}
                className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-0.5">
                  <Building2 size={14} /> Le Label
                </div>
                <div className="text-[10px] text-muted-foreground truncate">KKD Records</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('artist')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-0.5">
                  <Mic2 size={14} /> Artiste
                </div>
                <div className="text-[10px] text-muted-foreground truncate">Sidy Diop</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('fan')}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs mb-0.5">
                  <Headphones size={14} /> Fan / Acheteur
                </div>
                <div className="text-[10px] text-muted-foreground truncate">Moussa Ndiaye</div>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou par identifiants</span></div>
          </div>

          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="admin@kkdmusic.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-10" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</> : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
