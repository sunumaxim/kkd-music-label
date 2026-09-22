import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const location = useLocation();
  const targetRedirect = safeReturnTo();
  const isAdminTarget = targetRedirect.startsWith("/admin");

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = targetRedirect;
    } catch (err) {
      setError(err?.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await base44.auth.loginWithProvider("google", targetRedirect);
    } catch (err) {
      if (err?.isCancelled || err?.code === 'auth/popup-closed-by-user') {
        setError("Connexion Google annulée. Vous pouvez réessayer ou utiliser votre email ci-dessous.");
      } else if (err?.code === 'auth/popup-blocked') {
        setError("La fenêtre Google a été bloquée par votre navigateur. Autorisez les pop-ups ou ouvrez l'app en plein écran.");
      } else {
        setError(err?.message || "Échec de la connexion Google.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
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

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <img src={LOGO_URL} alt="KKD Music" className="h-12 w-auto" />
          </div>

          <div>
            <h1 className="font-display text-2xl font-extrabold mb-1">Connexion</h1>
            <p className="text-muted-foreground text-sm">Accédez aux espaces Label, Artistes ou Fan</p>
          </div>

          {isAdminTarget && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
              Veuillez vous authentifier avec vos identifiants administrateur pour accéder au tableau de bord.
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-11 border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center gap-3 font-semibold"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            Continuer avec Google
          </Button>

          {isInsideIframe && (
            <div className="text-center -mt-3">
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Ouvrir en plein écran si le pop-up est restreint
              </button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou avec votre email</span></div>
          </div>

          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="votre-email@exemple.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-10" required />
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
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" disabled={loading || googleLoading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion...</> : "Se connecter"}
            </Button>
          </form>

          <div className="pt-2 text-center text-sm text-muted-foreground space-y-2">
            <p>
              Pas encore de compte ?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Créer un compte</Link>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Connexion sécurisée KKD Music</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}