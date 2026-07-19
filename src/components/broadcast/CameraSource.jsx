import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Video, VideoOff, Circle, Square, Loader2 } from 'lucide-react';

export default function CameraSource({ onChange }) {
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startCamera = async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      setError('Caméra / micro inaccessible : ' + (e.message || 'autorisation refusée'));
    }
  };

  const stopCamera = () => {
    if (recording) stopRecording();
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    try {
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const objUrl = URL.createObjectURL(blob);
        setRecordedUrl(objUrl);
        setUploading(true);
        try {
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
          const res = await base44.integrations.Core.UploadFile({ file });
          onChange({ source_video_url: res.file_url });
        } catch (err) {
          setError('Upload échoué : ' + err.message);
        } finally {
          setUploading(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError('Enregistrement impossible : ' + e.message);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  useEffect(() => () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!stream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
            <Camera size={28} />
            <span className="text-xs">Caméra inactive</span>
          </div>
        )}
        {recording && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-mono px-2 py-1 rounded-full">
            <Circle size={8} fill="currentColor" /> REC
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        {!stream ? (
          <button onClick={startCamera} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
            <Camera size={14} /> Activer la caméra
          </button>
        ) : (
          <button onClick={stopCamera} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm font-medium">
            <VideoOff size={14} /> Couper
          </button>
        )}
        {!recording ? (
          <button onClick={startRecording} disabled={!stream} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40">
            <Circle size={12} fill="currentColor" /> Enregistrer
          </button>
        ) : (
          <button onClick={stopRecording} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium">
            <Square size={12} fill="currentColor" /> Stop
          </button>
        )}
      </div>

      {uploading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Upload de l'enregistrement…</p>
      )}
      {recordedUrl && !uploading && (
        <p className="text-xs text-green-500 flex items-center gap-1.5"><Video size={12} /> Enregistrement prêt à diffuser.</p>
      )}
      <p className="text-[11px] text-muted-foreground">Filmez, puis l'enregistrement est téléversé et disponible comme source du direct.</p>
    </div>
  );
}