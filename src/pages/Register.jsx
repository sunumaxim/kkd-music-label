import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, ExternalLink, Shield, KeyRound } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Étape OTP (register → OTP → verifyOtp → connexion)
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
  const targetRedirect = safeReturnTo();

  const startResendCooldown = () => {
    setResendCooldown(30);
    const t = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({
        email: email.trim(),
        password,
        full_name: fullName.trim()
      });
      // register ne connecte pas — passage à l'étape OTP
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use' || err?.message?.includes('already')) {
        setError("Cette adresse email est déjà enregistrée. Veuillez vous connecter.");
      } else if (err?.code === 'auth/weak-password') {
        setError("Le mot de passe est trop faible. Veuillez choisir au moins 6 caractères.");
      } else {
        setError(err?.message || "Échec de l'inscription. Veuillez vérifier vos données.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpCode || otpCode.trim().length < 6) {
      setError("Veuillez saisir le code à 6 chiffres reçu par email.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email: email.trim(), otpCode: otpCode.trim() });
      if (res?.access_token) {
        await base44.auth.setToken(res.access_token);
      }
      window.location.href = targetRedirect;
    } catch (err) {
      setError(err?.message || "Code de validation incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await base44.auth.resendOtp(email.trim());
      startResendCooldown();
    } catch (err) {
      setError(err?.message || "Impossible de renvoyer le code.");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await base44.auth.loginWithProvider("google", targetRedirect);
    } catch (err) {
      if (err?.isCancelled || err?.code === 'auth/popup-closed-by-user') {
        setError("Inscription Google annulée. Vous pouvez réessayer ou créer votre compte ci-dessous.");
      } else if (err?.code === 'auth/popup-blocked') {
        setError("La fenêtre pop-up a été bloquée par votre navigateur. Autorisez les pop-ups ou ouvrez l'app en plein écran.");
      } else {
        setError(err?.message || "Échec de l'inscription avec Google.");
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
            Rejoignez<br /><span className="text-primary">KKD Music</span>
          </p>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-xs">
            Créez votre compte et accédez à l'écosystème KKD Music en tant qu'artiste, fan ou partenaire.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/50">© 2026 KKD Music — Tous droits réservés</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={LOGO_URL} alt="KKD Music" className="h-14 w-auto" />
          </div>

          {step === "form" && (
            <>
              <h1 className="font-display text-2xl font-extrabold mb-1">Créer un compte</h1>
              <p className="text-muted-foreground text-sm mb-6">Rejoignez la famille KKD Music</p>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm font-medium mb-4"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GoogleIcon className="w-4 h-4 mr-2" />
                )}
                Continuer avec Google
              </Button>

              {isInsideIframe && (
                <div className="text-center mb-6 -mt-2">
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Ouvrir en plein écran si le pop-up est restreint
                  </button>
                </div>
              )}

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou avec votre email</span></div>
              </div>

              {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Ex. Amadou Diallo"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="pl-10 h-11"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" disabled={loading || googleLoading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création du compte...</> : "Créer mon compte"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="font-display text-2xl font-extrabold mb-1">Validez votre compte</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Un code de validation à 6 chiffres a été envoyé à <strong className="text-foreground">{email}</strong>.
              </p>

              {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Code de validation</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-11 tracking-widest text-center text-lg font-mono font-bold"
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Validation...</> : "Valider et se connecter"}
                </Button>
              </form>

              <div className="text-center mt-4 text-sm">
                {resendCooldown > 0 ? (
                  <span className="text-muted-foreground text-xs">Renvoyer le code dans {resendCooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResendOtp} className="text-primary font-medium hover:underline text-sm">
                    Renvoyer le code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep("form"); setOtpCode(""); setError(""); }}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                ← Modifier mes informations
              </button>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70 pt-6">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Inscription sécurisée KKD Music</span>
          </div>
        </div>
      </div>
    </div>
  );
}