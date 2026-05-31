import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Code de vérification invalide.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try { await base44.auth.resendOtp(email); } catch {}
  };

  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <img src={LOGO_URL} alt="KKD Music" className="h-12 w-auto mx-auto mb-8" />
          <h1 className="font-display text-2xl font-extrabold mb-1">Vérification email</h1>
          <p className="text-muted-foreground text-sm mb-8">Un code a été envoyé à <strong>{email}</strong></p>
          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Vérification...</> : "Vérifier"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Vous n'avez pas reçu le code ?{" "}
            <button onClick={handleResend} className="text-primary font-medium hover:underline">Renvoyer</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-card border-r border-border/30 p-12">
        <img src={LOGO_URL} alt="KKD Music" className="h-16 w-auto" />
        <div>
          <p className="font-display text-4xl font-extrabold leading-tight">
            Rejoignez<br /><span className="text-primary">KKD Music</span>
          </p>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed max-w-xs">
            Créez votre compte et accédez à l'écosystème KKD Music en tant qu'artiste ou partenaire.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/50">© 2026 KKD Music — Tous droits réservés</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={LOGO_URL} alt="KKD Music" className="h-14 w-auto" />
          </div>
          <h1 className="font-display text-2xl font-extrabold mb-1">Créer un compte</h1>
          <p className="text-muted-foreground text-sm mb-8">Rejoignez la famille KKD Music</p>

          <Button variant="outline" className="w-full h-11 text-sm font-medium mb-6" onClick={() => base44.auth.loginWithProvider("google", "/")}>
            <GoogleIcon className="w-4 h-4 mr-2" />
            Continuer avec Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou</span></div>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11" required autoFocus />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/80 font-bold" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Création...</> : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}