import { Project, ExportSettings, Clip } from '../types/editor';

export interface RenderProgress {
  progress: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  timeRemaining: string;
  status: string;
}

export interface RenderResult {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  duration: number;
}

export async function renderProjectVideo(
  project: Project,
  settings: ExportSettings,
  onProgress?: (info: RenderProgress) => void
): Promise<RenderResult> {
  const fps = settings.fps || 30;
  const duration = Math.max(1, project.duration);
  const totalFrames = Math.ceil(duration * fps);

  // Determine output dimensions
  let targetWidth = 1080;
  let targetHeight = 1920;

  if (project.aspectRatio === '9:16') {
    if (settings.resolution === '1080p') { targetWidth = 1080; targetHeight = 1920; }
    else if (settings.resolution === '720p') { targetWidth = 720; targetHeight = 1280; }
    else { targetWidth = 480; targetHeight = 854; }
  } else if (project.aspectRatio === '16:9') {
    if (settings.resolution === '1080p') { targetWidth = 1920; targetHeight = 1080; }
    else if (settings.resolution === '720p') { targetWidth = 1280; targetHeight = 720; }
    else { targetWidth = 854; targetHeight = 480; }
  } else if (project.aspectRatio === '1:1') {
    if (settings.resolution === '1080p') { targetWidth = 1080; targetHeight = 1080; }
    else if (settings.resolution === '720p') { targetWidth = 720; targetHeight = 720; }
    else { targetWidth = 480; targetHeight = 480; }
  } else {
    // 4:5
    if (settings.resolution === '1080p') { targetWidth = 1080; targetHeight = 1350; }
    else if (settings.resolution === '720p') { targetWidth = 720; targetHeight = 900; }
    else { targetWidth = 480; targetHeight = 600; }
  }

  // Create offscreen rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Could not create Canvas 2D rendering context');

  // Audio setup
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  try {
    audioContext = new AudioCtxClass();
    audioDestination = audioContext.createMediaStreamDestination();
  } catch (e) {
    console.warn('AudioContext not available for export mixing:', e);
  }

  // Pre-load visual elements
  const loadedElements: Record<string, HTMLVideoElement | HTMLImageElement | HTMLAudioElement> = {};
  for (const clip of project.clips) {
    if (!clip.sourceUrl) continue;
    try {
      if (clip.type === 'video') {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.src = clip.sourceUrl;
        vid.muted = true;
        vid.preload = 'auto';
        await new Promise((resolve) => {
          vid.onloadeddata = resolve;
          vid.onerror = resolve; // Continue on error
          setTimeout(resolve, 2500); // 2.5s timeout safety
        });
        loadedElements[clip.id] = vid;
      } else if (clip.type === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = clip.sourceUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 2500);
        });
        loadedElements[clip.id] = img;
      } else if (clip.type === 'audio' && audioContext && audioDestination) {
        const aud = new Audio();
        aud.crossOrigin = 'anonymous';
        aud.src = clip.sourceUrl;
        try {
          const source = audioContext.createMediaElementSource(aud);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = clip.volume ?? 1;
          source.connect(gainNode);
          gainNode.connect(audioDestination);
        } catch {}
        loadedElements[clip.id] = aud;
      }
    } catch (err) {
      console.warn('Media element preloading warning:', err);
    }
  }

  // Build combined MediaStream
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
  if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
    audioDestination.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
  }

  // Choose supported MIME type
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: settings.quality === 'ultra' ? 8000000 : settings.quality === 'high' ? 5000000 : 3000000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const renderPromise = new Promise<RenderResult>((resolve, reject) => {
    recorder.onstop = () => {
      const ext = settings.format === 'mp4' ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const filename = settings.filename.endsWith(`.${ext}`) ? settings.filename : `${settings.filename}.${ext}`;
      resolve({
        blob,
        url,
        filename,
        size: blob.size,
        duration,
      });
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start(100);
  const startTime = Date.now();

  // Deterministic frame rendering loop
  const step = 1 / fps;
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame * step;

    // 1. Clear background
    ctx.fillStyle = '#08090D';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Render visual clips (videos and images) sorted by track order
    for (const track of project.tracks) {
      if (!track.isVisible || track.isMuted) continue;
      const trackClips = project.clips.filter((c) => c.trackId === track.id);

      for (const clip of trackClips) {
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime <= clipEnd) {
          const localTime = currentTime - clip.startTime + clip.trimStart;

          // Transition calculation
          let alpha = 1;
          const timeFromStart = currentTime - clip.startTime;
          const timeToEnd = clipEnd - currentTime;
          if (clip.transitionIn === 'fade' && timeFromStart < (clip.fadeIn || 0.5)) {
            alpha = timeFromStart / (clip.fadeIn || 0.5);
          } else if (clip.transitionOut === 'fade' && timeToEnd < (clip.fadeOut || 0.5)) {
            alpha = timeToEnd / (clip.fadeOut || 0.5);
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

          // Filters
          const filters = clip.filters || { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 };
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg)`;

          // Transform
          const transform = clip.transform || { scale: 1, positionX: 0, positionY: 0, rotation: 0 };
          ctx.translate(targetWidth / 2 + transform.positionX, targetHeight / 2 + transform.positionY);
          if (transform.rotation) {
            ctx.rotate((transform.rotation * Math.PI) / 180);
          }
          if (transform.scale !== 1) {
            ctx.scale(transform.scale, transform.scale);
          }

          if (clip.type === 'video') {
            const vid = loadedElements[clip.id] as HTMLVideoElement;
            if (vid) {
              vid.currentTime = localTime;
              try {
                // Draw video centered
                const aspect = (vid.videoWidth || 16) / (vid.videoHeight || 9);
                let drawW = targetWidth;
                let drawH = targetWidth / aspect;
                if (drawH < targetHeight) {
                  drawH = targetHeight;
                  drawW = targetHeight * aspect;
                }
                ctx.drawImage(vid, -drawW / 2, -drawH / 2, drawW, drawH);
              } catch {
                drawFallbackPattern(ctx, targetWidth, targetHeight, clip.name);
              }
            } else {
              drawFallbackPattern(ctx, targetWidth, targetHeight, clip.name);
            }
          } else if (clip.type === 'image') {
            const img = loadedElements[clip.id] as HTMLImageElement;
            if (img && img.naturalWidth) {
              const aspect = img.naturalWidth / img.naturalHeight;
              let drawW = targetWidth;
              let drawH = targetWidth / aspect;
              if (drawH < targetHeight) {
                drawH = targetHeight;
                drawW = targetHeight * aspect;
              }
              ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
              drawFallbackPattern(ctx, targetWidth, targetHeight, clip.name);
            }
          }

          ctx.restore();

          // Vignette effect
          if (filters.vignette > 0) {
            const grad = ctx.createRadialGradient(
              targetWidth / 2,
              targetHeight / 2,
              targetWidth * 0.3,
              targetWidth / 2,
              targetHeight / 2,
              targetWidth * 0.8
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }
        }
      }
    }

    // 3. Render Text Overlays
    const textTrack = project.tracks.find((t) => t.type === 'text' && t.isVisible);
    if (textTrack) {
      const textClips = project.clips.filter((c) => c.trackId === textTrack.id && c.type === 'text');
      for (const clip of textClips) {
        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
          const cfg = clip.textConfig;
          if (cfg && cfg.text) {
            ctx.save();
            const scaleFactor = targetWidth / 1080;
            const fontSize = Math.round(cfg.fontSize * scaleFactor);
            const fontName = cfg.isHindi ? 'Noto Sans Devanagari, Plus Jakarta Sans, sans-serif' : 'Plus Jakarta Sans, sans-serif';
            ctx.font = `bold ${fontSize}px ${fontName}`;
            ctx.textAlign = cfg.align || 'center';
            ctx.textBaseline = 'middle';

            let posX = targetWidth / 2;
            if (cfg.align === 'left') posX = targetWidth * 0.1;
            if (cfg.align === 'right') posX = targetWidth * 0.9;

            let posY = targetHeight / 2;
            if (cfg.position === 'top') posY = targetHeight * 0.18;
            if (cfg.position === 'bottom') posY = targetHeight * 0.82;
            if (cfg.position === 'custom' && cfg.customY !== undefined) posY = (targetHeight * cfg.customY) / 100;

            const textMetrics = ctx.measureText(cfg.text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize * 1.3;
            const padding = (cfg.boxPadding || 12) * scaleFactor;

            // Draw background badge box
            if (cfg.backgroundColor && cfg.backgroundColor !== 'transparent') {
              ctx.fillStyle = cfg.backgroundColor;
              let boxX = posX - textWidth / 2 - padding;
              if (cfg.align === 'left') boxX = posX - padding;
              if (cfg.align === 'right') boxX = posX - textWidth - padding;
              const boxY = posY - textHeight / 2 - padding / 2;
              const boxW = textWidth + padding * 2;
              const boxH = textHeight + padding;
              const radius = (cfg.borderRadius || 8) * scaleFactor;

              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, radius);
              ctx.fill();
            }

            // Outline stroke
            if (cfg.outlineColor && cfg.outlineWidth) {
              ctx.strokeStyle = cfg.outlineColor;
              ctx.lineWidth = cfg.outlineWidth * scaleFactor * 2;
              ctx.strokeText(cfg.text, posX, posY);
            }

            // Drop shadow
            if (cfg.shadowColor) {
              ctx.shadowColor = cfg.shadowColor;
              ctx.shadowBlur = (cfg.shadowBlur || 10) * scaleFactor;
            }

            // Fill text
            ctx.fillStyle = cfg.color || '#FFFFFF';
            ctx.fillText(cfg.text, posX, posY);
            ctx.restore();
          }
        }
      }
    }

    // Report progress
    const pct = Math.round(((frame + 1) / totalFrames) * 100);
    const elapsed = (Date.now() - startTime) / 1000;
    const estimatedTotal = (elapsed / (frame + 1)) * totalFrames;
    const remainingSec = Math.max(0, Math.round(estimatedTotal - elapsed));

    if (onProgress) {
      onProgress({
        progress: pct,
        currentFrame: frame + 1,
        totalFrames,
        timeRemaining: `${remainingSec}s`,
        status: frame === totalFrames - 1 ? 'Finalizing audio & video multiplexing...' : `Rendering frame ${frame + 1}/${totalFrames}`,
      });
    }

    // Small delay to allow browser thread to encode
    await new Promise((r) => setTimeout(r, 8));
  }

  recorder.stop();
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
  }

  return renderPromise;
}

function drawFallbackPattern(ctx: CanvasRenderingContext2D, width: number, height: number, label: string) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1E1B4B');
  grad.addColorStop(0.5, '#4C1D95');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 32px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
}
