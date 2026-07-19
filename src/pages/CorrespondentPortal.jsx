import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, VideoOff, Circle, Square, Loader2, Check, Radio, Calendar, MapPin, LogIn, AlertCircle } from 'lucide-react';

export default function CorrespondentPortal() {
  const { token } = useParams();
  const qc = useQueryClient();
  const [authed, setAuthed] = useState(null);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['correspondent', token],
    queryFn: () => base44.functions.invoke('correspondentPortalAction', { token, action: 'load' }),
    enabled: !!token,
  });
  const invite = data?.invite || null;
  const event = data?.event || null;

  const accept = async () => {
    setAccepting(true);
    try {
      await base44.functions.invoke('correspondentPortalAction', { token, action: 'accept' });
      qc.invalidateQueries({ queryKey: ['correspondent', token] });
    } finally { setAccepting(false); }
  };

  const startCamera = async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) { setError('Caméra inaccessible : ' + e.message); }
  };
  const stopCamera = () => {
    if (recording) stopRecording();
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
  };
  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    try {
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setRecording(false);
        setUploading(true);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        try {
          const file = new File([blob], `corresp-${Date.now()}.webm`, { type: 'video/webm' });
          const res = await base44.integrations.Core.UploadFile({ file });
          await base44.functions.invoke('correspondentPortalAction', { token, action: 'capture', video_url: res.file_url });
          setDone(true);
        } catch (e) { setError('Échec envoi : ' + e.message); }
        finally { setUploading(false); }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) { setError('Enregistrement impossible : ' + e.message); }
  };
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  };
  useEffect(() => () => { if (stream) stream.getTracks().forEach(t => t.stop()); }, [stream]);

  if (isLoading || authed === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle size={28} className="text-destructive" />
        <p className="text-sm">Invitation introuvable ou expirée.</p>
      </div>
    );
  }

  const accepted = invite.status && invite.status !== 'invite';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/15 to-primary/10 border-b border-red-500/20 px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-red-500 text-xs font-mono uppercase tracking-widest mb-1">
            <Radio size={14} /> Correspondant KKD
          </div>
          <h1 className="font-heading font-bold text-xl">{event?.title || invite.event_title || 'Invitation'}</h1>
          {event && (
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {event.event_date && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(event.event_date).toLocaleString('fr-FR')}</span>}
              {event.location && <span className="flex items-center gap-1"><MapPin size={11} /> {event.location}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {!authed ? (
          <div className="bg-card border border-border/50 rounded-xl p-5 text-center space-y-3">
            <LogIn size={24} className="text-primary mx-auto" />
            <p className="text-sm">Connecte-toi pour accepter l'invitation et filmer l'événement.</p>
            <button onClick={() => base44.auth.redirectToLogin()} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Se connecter</button>
          </div>
        ) : !accepted ? (
          <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous êtes invité à couvrir cet événement pour KKD Music. Acceptez pour configurer et filmer en direct.
            </p>
            <button
              onClick={accept}
              disabled={accepting}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {accepting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Accepter l\'invitation'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-green-500"><Check size={14} /> Invitation acceptée — prêt à filmer.</div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!stream && <div className="absolute inset-0 flex items-center justify-center text-white/40"><Camera size={28} /></div>}
              {recording && <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full"><Circle size={8} fill="currentColor" /> REC</div>}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {done && <p className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> Vidéo envoyée — le direct est en ligne !</p>}
            <div className="grid grid-cols-2 gap-2">
              {!stream ? (
                <button onClick={startCamera} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium"><Camera size={14} /> Activer caméra</button>
              ) : (
                <button onClick={stopCamera} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-secondary text-sm font-medium"><VideoOff size={14} /> Couper</button>
              )}
              {!recording ? (
                <button onClick={startRecording} disabled={!stream} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40"><Circle size={12} fill="currentColor" /> Enregistrer</button>
              ) : (
                <button onClick={stopRecording} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg bg-foreground text-background text-sm font-medium"><Square size={12} fill="currentColor" /> Stop</button>
              )}
            </div>
            {uploading && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Envoi vers le studio…</p>}
            <p className="text-[11px] text-muted-foreground">Filmez votre séquence — elle passe en direct sur KKD et l'administrateur gère les commentaires.</p>
          </>
        )}
      </div>
    </div>
  );
}