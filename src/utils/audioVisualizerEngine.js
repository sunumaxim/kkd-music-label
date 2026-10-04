// KKD Music — Moteur Audio-Visuel & Pipeline d'Export Vidéo Canvas / MediaRecorder

export class AudioVisualizerEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.options = {
      theme: 'neon_pulse',
      format: 'tiktok_9_16',
      artistName: 'Artiste KKD',
      trackTitle: 'Nouveau Single',
      lyricsText: 'Écoutez maintenant sur KKD Music • Disponible sur toutes les plateformes',
      accentColor: '#F59E0B',
      secondaryColor: '#EF4444',
      hasWatermark: true,
      ...options
    };

    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.mediaStreamDest = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.coverImage = null;
    this.coverLoaded = false;
    this.rotationAngle = 0;
    this.particles = [];
    this.animationFrameId = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.duration = 15;
    this.audioElement = null;

    this.initParticles();
  }

  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  setCoverImage(imageUrl) {
    if (!imageUrl) {
      this.coverImage = null;
      this.coverLoaded = false;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.coverImage = img;
      this.coverLoaded = true;
    };
    img.onerror = () => {
      this.coverLoaded = false;
    };
    img.src = imageUrl;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 0.002 + 0.001,
        speedX: (Math.random() - 0.5) * 0.001,
        opacity: Math.random() * 0.7 + 0.2
      });
    }
  }

  setupAudioContext(audioElement) {
    this.audioElement = audioElement;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (!this.sourceNode && audioElement) {
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
        this.mediaStreamDest = this.audioContext.createMediaStreamDestination();
        
        // Connecter la source vers l'analyseur, la sortie audio et la destination stream d'export
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.analyser.connect(this.mediaStreamDest);
      } catch (err) {
        console.warn('[VisualizerEngine] MediaElementSource notice:', err?.message);
      }
    }
  }

  // Obtenir les moyennes d'énergie par bande
  getAudioMetrics() {
    if (!this.analyser || !this.frequencyData) {
      // Simuler une réactivité élégante si audio non connecté
      const t = Date.now() / 300;
      const fakeBass = Math.abs(Math.sin(t * 1.5)) * 140 + 40;
      const fakeMid = Math.abs(Math.sin(t * 2)) * 100 + 30;
      const fakeTreble = Math.abs(Math.cos(t * 2.5)) * 80 + 20;
      return { bass: fakeBass, mid: fakeMid, treble: fakeTreble, average: (fakeBass + fakeMid + fakeTreble) / 3 };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    const bass = this.frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const mid = this.frequencyData.slice(10, 40).reduce((a, b) => a + b, 0) / 30;
    const treble = this.frequencyData.slice(40, 80).reduce((a, b) => a + b, 0) / 40;
    const average = this.frequencyData.reduce((a, b) => a + b, 0) / this.frequencyData.length;

    return { bass, mid, treble, average };
  }

  // Dessin complet d'une frame sur le Canvas
  drawFrame() {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const isVertical = height > width; // 9:16 vs 16:9
    const metrics = this.getAudioMetrics();

    // Nettoyage fond
    this.ctx.clearRect(0, 0, width, height);

    // 1. Fond dynamique ambiant
    const bgGrad = this.ctx.createRadialGradient(
      width / 2,
      isVertical ? height * 0.42 : height / 2,
      10,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    bgGrad.addColorStop(0, '#161B26');
    bgGrad.addColorStop(0.5, '#0E131E');
    bgGrad.addColorStop(1, '#07090E');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Particules d'ambiance réactives
    this.drawParticles(width, height, metrics);

    // 3. Dessin du preset visuel sélectionné
    switch (this.options.theme) {
      case 'vinyl_retro':
        this.drawVinylPreset(width, height, isVertical, metrics);
        break;
      case 'waveform_bars':
        this.drawWaveformBarsPreset(width, height, isVertical, metrics);
        break;
      case 'kinetic_lyrics':
        this.drawKineticLyricsPreset(width, height, isVertical, metrics);
        break;
      case 'cosmic_aura':
        this.drawCosmicAuraPreset(width, height, isVertical, metrics);
        break;
      case 'neon_pulse':
      default:
        this.drawNeonPulsePreset(width, height, isVertical, metrics);
        break;
    }

    // 4. Overlays textuels (Titre, Artiste, Paroles / Punchline)
    this.drawTypography(width, height, isVertical, metrics);

    // 5. Filigrane KKD Music si requis (formule gratuite)
    if (this.options.hasWatermark) {
      this.drawWatermark(width, height);
    }
  }

  // Animation des particules flottantes
  drawParticles(width, height, metrics) {
    const bassFactor = (metrics.bass / 255) * 1.5;
    this.ctx.save();
    for (const p of this.particles) {
      p.y -= p.speedY * (1 + bassFactor);
      p.x += p.speedX;
      if (p.y < 0) p.y = 1;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;

      const px = p.x * width;
      const py = p.y * height;
      this.ctx.beginPath();
      this.ctx.arc(px, py, p.size * (1 + bassFactor * 0.5), 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity * 0.6})`;
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  // Preset 1: Neon Pulse (Pulsation d'aura néon + barres radiales)
  drawNeonPulsePreset(width, height, isVertical, metrics) {
    const centerX = width / 2;
    const centerY = isVertical ? height * 0.42 : height / 2;
    const baseRadius = isVertical ? width * 0.28 : height * 0.26;
    const pulseScale = 1 + (metrics.bass / 255) * 0.08;
    const currentRadius = baseRadius * pulseScale;

    // Halo lumineux externe
    this.ctx.save();
    const glowGrad = this.ctx.createRadialGradient(
      centerX, centerY, currentRadius * 0.8,
      centerX, centerY, currentRadius * 1.6
    );
    glowGrad.addColorStop(0, `${this.options.accentColor}55`);
    glowGrad.addColorStop(0.5, `${this.options.secondaryColor}22`);
    glowGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = glowGrad;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, currentRadius * 1.6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Barres de spectre radiales
    const barCount = 64;
    const angleStep = (Math.PI * 2) / barCount;
    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * (this.frequencyData?.length || 64));
      const val = this.frequencyData ? this.frequencyData[freqIndex] : (Math.sin(i * 0.4 + Date.now() / 200) * 60 + 60);
      const barHeight = (val / 255) * (baseRadius * 0.5) + 4;

      const angle = i * angleStep;
      const x1 = Math.cos(angle) * (currentRadius + 8);
      const y1 = Math.sin(angle) * (currentRadius + 8);
      const x2 = Math.cos(angle) * (currentRadius + 8 + barHeight);
      const y2 = Math.sin(angle) * (currentRadius + 8 + barHeight);

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = Math.max(2, (width / 500) * 2.5);
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = i % 2 === 0 ? this.options.accentColor : this.options.secondaryColor;
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Pochette d'album centrale
    this.drawCircularCover(centerX, centerY, currentRadius);
  }

  // Preset 2: Vinyle Rétro Tournant
  drawVinylPreset(width, height, isVertical, metrics) {
    const centerX = width / 2;
    const centerY = isVertical ? height * 0.42 : height / 2;
    const vinylRadius = isVertical ? width * 0.38 : height * 0.34;
    const labelRadius = vinylRadius * 0.42;

    this.rotationAngle += 0.012 * (1 + (metrics.bass / 255) * 0.3);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.rotationAngle);

    // Corps du vinyle noir brillant
    this.ctx.beginPath();
    this.ctx.arc(0, 0, vinylRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0B0D11';
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 30;
    this.ctx.fill();

    // Sillons concentriques
    this.ctx.shadowBlur = 0;
    for (let r = labelRadius + 12; r < vinylRadius - 8; r += 12) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Reflets lumineux vinyl (effet anamorphique)
    const sheenGrad = this.ctx.createLinearGradient(-vinylRadius, -vinylRadius, vinylRadius, vinylRadius);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
    sheenGrad.addColorStop(0.5, 'transparent');
    sheenGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
    this.ctx.fillStyle = sheenGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, vinylRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    // Label central avec pochette
    this.drawCircularCover(centerX, centerY, labelRadius, this.rotationAngle);

    // Trou central du spindle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0B0D11';
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  // Preset 3: Spectre Égaliseur (Waveform Bars)
  drawWaveformBarsPreset(width, height, isVertical, metrics) {
    const centerX = width / 2;
    const centerY = isVertical ? height * 0.36 : height * 0.42;
    const coverSize = isVertical ? width * 0.52 : height * 0.45;

    // Pochette carrée avec coins arrondis et ombre profonde
    this.drawRoundedSquareCover(centerX - coverSize / 2, centerY - coverSize / 2, coverSize, 24, metrics);

    // Barres d'égaliseur en bas de la pochette
    const barAreaY = isVertical ? height * 0.62 : height * 0.72;
    const barAreaWidth = isVertical ? width * 0.84 : width * 0.7;
    const startX = (width - barAreaWidth) / 2;
    const barCount = 48;
    const barWidth = (barAreaWidth / barCount) - 3;
    const maxBarHeight = isVertical ? height * 0.12 : height * 0.16;

    this.ctx.save();
    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * (this.frequencyData?.length || 48));
      const val = this.frequencyData ? this.frequencyData[freqIndex] : (Math.sin(i * 0.5 + Date.now() / 250) * 80 + 100);
      const bHeight = Math.max(4, (val / 255) * maxBarHeight);
      const bx = startX + i * (barWidth + 3);
      const by = barAreaY - bHeight / 2;

      // Dégradé de la barre
      const barGrad = this.ctx.createLinearGradient(bx, by, bx, by + bHeight);
      barGrad.addColorStop(0, this.options.accentColor);
      barGrad.addColorStop(1, this.options.secondaryColor);

      this.ctx.fillStyle = barGrad;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, barWidth, bHeight, 4);
      this.ctx.fill();

      // Reflet doux sous la ligne de sol
      this.ctx.fillStyle = `rgba(245, 158, 11, ${val / 1000})`;
      this.ctx.fillRect(bx, barAreaY + bHeight / 2 + 3, barWidth, bHeight * 0.35);
    }
    this.ctx.restore();
  }

  // Preset 4: Typographie & Punchlines cinétiques
  drawKineticLyricsPreset(width, height, isVertical, metrics) {
    const centerX = width / 2;
    const centerY = isVertical ? height * 0.35 : height * 0.4;
    const coverRadius = isVertical ? width * 0.22 : height * 0.22;

    // Pochette en arrière-plan avec pulsation douce
    this.drawCircularCover(centerX, centerY, coverRadius * (1 + (metrics.bass / 255) * 0.05));

    // Onde de fréquence circulaire fine
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, coverRadius * 1.25 + (metrics.mid / 255) * 15, 0, Math.PI * 2);
    this.ctx.strokeStyle = `${this.options.accentColor}88`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Punchline centrale géante animée
    const textY = isVertical ? height * 0.62 : height * 0.72;
    const zoomText = 1 + (metrics.bass / 255) * 0.06;

    this.ctx.save();
    this.ctx.translate(centerX, textY);
    this.ctx.scale(zoomText, zoomText);

    this.ctx.font = `900 ${isVertical ? Math.floor(width * 0.055) : Math.floor(height * 0.055)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.shadowColor = this.options.accentColor;
    this.ctx.shadowBlur = 20;

    const words = (this.options.lyricsText || 'KKD MUSIC EXCLUSIVE').split(' ');
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

    this.ctx.fillText(line1, 0, 0);
    if (line2) {
      this.ctx.font = `700 ${isVertical ? Math.floor(width * 0.045) : Math.floor(height * 0.045)}px sans-serif`;
      this.ctx.fillStyle = this.options.accentColor;
      this.ctx.fillText(line2, 0, 36);
    }

    this.ctx.restore();
  }

  // Preset 5: Cosmic Aura (Ondes gravitationnelles lumineuses)
  drawCosmicAuraPreset(width, height, isVertical, metrics) {
    const centerX = width / 2;
    const centerY = isVertical ? height * 0.42 : height / 2;
    const baseRadius = isVertical ? width * 0.28 : height * 0.26;

    // Cercles d'ondes d'expansion cosmique
    this.ctx.save();
    const ringCount = 5;
    for (let r = 1; r <= ringCount; r++) {
      const ringRadius = baseRadius + r * 22 + (metrics.bass / 255) * (r * 18);
      const alpha = Math.max(0, 0.6 - (r / ringCount) * 0.5);

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = r % 2 === 0 ? `rgba(139, 92, 246, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
      this.ctx.lineWidth = 3 - (r * 0.4);
      this.ctx.stroke();
    }
    this.ctx.restore();

    this.drawCircularCover(centerX, centerY, baseRadius);
  }

  // Pochette circulaire avec gestion du fallback si image non chargée
  drawCircularCover(x, y, radius, rotation = 0) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.clip();

    if (this.coverLoaded && this.coverImage) {
      if (rotation !== 0) {
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.drawImage(this.coverImage, -radius, -radius, radius * 2, radius * 2);
      } else {
        this.ctx.drawImage(this.coverImage, x - radius, y - radius, radius * 2, radius * 2);
      }
    } else {
      // Fallback visuel dégradé KKD Music élégant
      const grad = this.ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
      grad.addColorStop(0, '#D97706');
      grad.addColorStop(1, '#B91C1C');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = `bold ${Math.floor(radius * 0.45)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('KKD', x, y);
    }

    this.ctx.restore();

    // Bordure nette autour de la pochette
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();
  }

  // Pochette carrée avec bords arrondis
  drawRoundedSquareCover(x, y, size, radius, metrics) {
    const pulse = 1 + (metrics.bass / 255) * 0.04;
    const s = size * pulse;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const px = cx - s / 2;
    const py = cy - s / 2;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(px, py, s, s, radius);
    this.ctx.shadowColor = `${this.options.accentColor}66`;
    this.ctx.shadowBlur = 35;
    this.ctx.closePath();
    this.ctx.clip();

    if (this.coverLoaded && this.coverImage) {
      this.ctx.drawImage(this.coverImage, px, py, s, s);
    } else {
      const grad = this.ctx.createLinearGradient(px, py, px + s, py + s);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(1, '#0F172A');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(px, py, s, s);

      this.ctx.fillStyle = '#F59E0B';
      this.ctx.font = `bold ${Math.floor(s * 0.25)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('KKD', cx, cy);
    }
    this.ctx.restore();

    // Contour fin
    this.ctx.beginPath();
    this.ctx.roundRect(px, py, s, s, radius);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  // Typographie du Titre et de l'Artiste
  drawTypography(width, height, isVertical) {
    this.ctx.save();
    this.ctx.textAlign = 'center';

    if (isVertical) {
      // Format TikTok / Reels 9:16 (Texte situé dans le tiers inférieur)
      const titleY = height * 0.74;
      const artistY = height * 0.79;

      // Tag de plateforme ou album
      this.ctx.font = '600 13px sans-serif';
      this.ctx.fillStyle = this.options.accentColor;
      this.ctx.letterSpacing = '2px';
      this.ctx.fillText('NOUVEAU SINGLE SUR KKD MUSIC', width / 2, titleY - 26);

      // Titre de la chanson
      this.ctx.font = '900 28px sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 12;
      this.ctx.fillText(this.options.trackTitle || 'Titre du morceau', width / 2, titleY);

      // Nom de l'artiste
      this.ctx.font = '600 18px sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      this.ctx.fillText(this.options.artistName || 'Artiste Indépendant', width / 2, artistY);

      // Sous-texte ou paroles
      if (this.options.lyricsText && this.options.theme !== 'kinetic_lyrics') {
        this.ctx.font = '500 14px sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.fillText(`“ ${this.options.lyricsText.slice(0, 60)} ”`, width / 2, artistY + 34);
      }
    } else {
      // Format Paysage YouTube 16:9 (Texte situé en bas)
      const titleY = height * 0.84;
      const artistY = height * 0.90;

      this.ctx.font = '900 32px sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText(this.options.trackTitle || 'Titre du morceau', width / 2, titleY);

      this.ctx.font = '600 19px sans-serif';
      this.ctx.fillStyle = this.options.accentColor;
      this.ctx.fillText(this.options.artistName || 'Artiste Indépendant', width / 2, artistY);
    }

    this.ctx.restore();
  }

  // Filigrane discret pour les comptes gratuits
  drawWatermark(width, height) {
    this.ctx.save();
    this.ctx.font = '700 12px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Généré avec KKD Music Studio • kkdmusic.com', width - 24, height - 24);
    this.ctx.restore();
  }

  // Boucle de rendu continue pour l'interface de prévisualisation
  startPreviewLoop() {
    this.isPlaying = true;
    const render = () => {
      this.drawFrame();
      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(render);
      }
    };
    render();
  }

  stopPreviewLoop() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Exportation vidéo MP4 / WebM via MediaRecorder
  async exportVideo({ durationSeconds = 15, onProgress, onComplete, onError }) {
    if (!this.canvas) {
      onError?.(new Error('Canvas non initialisé'));
      return;
    }

    try {
      // Capture du flux Canvas
      const canvasStream = this.canvas.captureStream(30);

      // Création du stream combiné avec l'audio
      let combinedStream;
      if (this.mediaStreamDest) {
        const audioTracks = this.mediaStreamDest.stream.getAudioTracks();
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks
        ]);
      } else {
        combinedStream = canvasStream;
      }

      // Choix du format MIME compatible
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
        audioBitsPerSecond: 192_000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const startTime = Date.now();
      const totalMs = durationSeconds * 1000;

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(99, Math.round((elapsed / totalMs) * 100));
        onProgress?.({
          percent,
          elapsedSeconds: Math.floor(elapsed / 1000),
          totalSeconds: durationSeconds
        });
      }, 250);

      recorder.onstop = () => {
        clearInterval(progressInterval);
        onProgress?.({ percent: 100, elapsedSeconds: durationSeconds, totalSeconds: durationSeconds });

        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        onComplete?.({
          blob,
          videoUrl,
          mimeType,
          duration: durationSeconds,
          filename: `kkd-clip-${this.options.trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${this.options.format}.mp4`
        });
      };

      recorder.start(100);

      // Arrêt automatique au terme de la durée
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, totalMs);

    } catch (err) {
      console.error('[AudioVisualizerEngine export error]:', err);
      onError?.(err);
    }
  }
}
