import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Project, Clip } from '../types/editor';
import { Language, translations } from '../utils/i18n';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Upload, 
  Smartphone, 
  Monitor, 
  Square,
  Type
} from 'lucide-react';

interface PreviewPlayerProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  language?: Language;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onDropFiles?: (files: FileList) => void;
  onSelectClip?: (clipId: string) => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  project,
  currentTime,
  isPlaying,
  language = 'en',
  onTimeUpdate,
  onTogglePlay,
  onDropFiles,
  onSelectClip,
}) => {
  const t = translations[language] || translations.en;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Cached media elements
  const mediaCache = useRef<Record<string, HTMLVideoElement | HTMLImageElement>>({});

  // Aspect ratio dimensions for canvas
  const getCanvasDimensions = useCallback(() => {
    switch (project.aspectRatio) {
      case '9:16':
        return { width: 720, height: 1280 };
      case '16:9':
        return { width: 1280, height: 720 };
      case '1:1':
        return { width: 900, height: 900 };
      case '4:5':
        return { width: 720, height: 900 };
      default:
        return { width: 720, height: 1280 };
    }
  }, [project.aspectRatio]);

  // Load and cache active visual clips
  useEffect(() => {
    project.clips.forEach((clip) => {
      if (!clip.sourceUrl) return;
      if (!mediaCache.current[clip.id]) {
        if (clip.type === 'video') {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.src = clip.sourceUrl;
          video.muted = true; // muted in preview canvas; audio handled separately
          video.preload = 'auto';
          video.playsInline = true;
          mediaCache.current[clip.id] = video;
        } else if (clip.type === 'image') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = clip.sourceUrl;
          mediaCache.current[clip.id] = img;
        }
      }
    });
  }, [project.clips]);

  // Sync video elements current playback time
  useEffect(() => {
    project.clips.forEach((clip) => {
      if (clip.type === 'video') {
        const video = mediaCache.current[clip.id] as HTMLVideoElement;
        if (video) {
          const clipEnd = clip.startTime + clip.duration;
          if (currentTime >= clip.startTime && currentTime <= clipEnd) {
            const targetTime = currentTime - clip.startTime + clip.trimStart;
            // Prevent jerky seek if difference is minimal
            if (Math.abs(video.currentTime - targetTime) > 0.25) {
              video.currentTime = targetTime;
            }
            if (isPlaying && video.paused) {
              video.play().catch(() => {});
            } else if (!isPlaying && !video.paused) {
              video.pause();
            }
          } else {
            if (!video.paused) video.pause();
          }
        }
      }
    });
  }, [currentTime, isPlaying, project.clips]);

  // Render canvas frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Background fill
    ctx.fillStyle = '#08090D';
    ctx.fillRect(0, 0, width, height);

    // Render video and image clips
    project.tracks.forEach((track) => {
      if (!track.isVisible) return;
      const trackClips = project.clips.filter((c) => c.trackId === track.id);

      trackClips.forEach((clip) => {
        const clipEnd = clip.startTime + clip.duration;
        if (currentTime >= clip.startTime && currentTime <= clipEnd) {
          ctx.save();

          // Transitions fade
          let alpha = 1;
          const timeFromStart = currentTime - clip.startTime;
          const timeToEnd = clipEnd - currentTime;
          if (clip.transitionIn === 'fade' && timeFromStart < (clip.fadeIn || 0.5)) {
            alpha = timeFromStart / (clip.fadeIn || 0.5);
          } else if (clip.transitionOut === 'fade' && timeToEnd < (clip.fadeOut || 0.5)) {
            alpha = timeToEnd / (clip.fadeOut || 0.5);
          }
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

          // Filters
          const filters = clip.filters || { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 };
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg)`;

          // Transform
          const transform = clip.transform || { scale: 1, positionX: 0, positionY: 0, rotation: 0 };
          ctx.translate(width / 2 + transform.positionX, height / 2 + transform.positionY);
          if (transform.rotation) {
            ctx.rotate((transform.rotation * Math.PI) / 180);
          }
          if (transform.scale !== 1) {
            ctx.scale(transform.scale, transform.scale);
          }

          if (clip.type === 'video') {
            const vid = mediaCache.current[clip.id] as HTMLVideoElement;
            if (vid && vid.readyState >= 2) {
              const aspect = (vid.videoWidth || 16) / (vid.videoHeight || 9);
              let drawW = width;
              let drawH = width / aspect;
              if (drawH < height) {
                drawH = height;
                drawW = height * aspect;
              }
              ctx.drawImage(vid, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
              drawPlaceholder(ctx, width, height, clip.name);
            }
          } else if (clip.type === 'image') {
            const img = mediaCache.current[clip.id] as HTMLImageElement;
            if (img && img.naturalWidth) {
              const aspect = img.naturalWidth / img.naturalHeight;
              let drawW = width;
              let drawH = width / aspect;
              if (drawH < height) {
                drawH = height;
                drawW = height * aspect;
              }
              ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
              drawPlaceholder(ctx, width, height, clip.name);
            }
          }

          ctx.restore();

          // Vignette
          if (filters.vignette > 0) {
            const grad = ctx.createRadialGradient(
              width / 2,
              height / 2,
              width * 0.3,
              width / 2,
              height / 2,
              width * 0.8
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth(project.aspectRatio), targetHeight(project.aspectRatio));
          }
        }
      });
    });

    // Render Text clips (with full Hindi Unicode & English support)
    const textTrack = project.tracks.find((t) => t.type === 'text' && t.isVisible);
    if (textTrack) {
      const textClips = project.clips.filter((c) => c.trackId === textTrack.id && c.type === 'text');
      textClips.forEach((clip) => {
        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
          const cfg = clip.textConfig;
          if (cfg && cfg.text) {
            ctx.save();
            const scaleFactor = width / 720;
            const fontSize = Math.round(cfg.fontSize * scaleFactor);
            const fontName = cfg.isHindi 
              ? "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif" 
              : "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif";
            ctx.font = `bold ${fontSize}px ${fontName}`;
            ctx.textAlign = cfg.align || 'center';
            ctx.textBaseline = 'middle';

            let posX = width / 2;
            if (cfg.align === 'left') posX = width * 0.1;
            if (cfg.align === 'right') posX = width * 0.9;

            let posY = height / 2;
            if (cfg.position === 'top') posY = height * 0.18;
            if (cfg.position === 'bottom') posY = height * 0.82;
            if (cfg.position === 'custom' && cfg.customY !== undefined) posY = (height * cfg.customY) / 100;

            const textMetrics = ctx.measureText(cfg.text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize * 1.35;
            const padding = (cfg.boxPadding || 12) * scaleFactor;

            // Background badge box
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
              ctx.shadowBlur = (cfg.shadowBlur || 8) * scaleFactor;
            }

            // Draw text
            ctx.fillStyle = cfg.color || '#FFFFFF';
            ctx.fillText(cfg.text, posX, posY);
            ctx.restore();
          }
        }
      });
    }
  }, [currentTime, getCanvasDimensions, project.aspectRatio, project.clips, project.tracks]);

  // Request Animation Frame loop for smooth real-time preview
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Format timecode (00:00.00)
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Step frame (+/- 1 frame = 1/30s)
  const handleStepFrame = (frames: number) => {
    const step = 1 / project.fps;
    const nextTime = Math.max(0, Math.min(project.duration, currentTime + frames * step));
    onTimeUpdate(nextTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Drag-and-drop file upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFiles) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  // Find active text overlay clip
  const activeTextClip = project.clips.find(
    (c) => c.type === 'text' && currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  );

  return (
    <div 
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-between bg-[#0B0C12] select-none h-full w-full overflow-hidden border border-[#1A1D28] rounded-xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      } ${isDraggingOver ? 'ring-2 ring-cyan-400 bg-cyan-950/20' : ''}`}
    >
      {/* Top Monitor Info Bar */}
      <div className="w-full px-3 py-1.5 flex items-center justify-between text-xs text-slate-400 bg-[#0F1118]/85 backdrop-blur-sm border-b border-[#1E2230] z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-slate-300 font-semibold tracking-wide">
            {t.preview} ({project.aspectRatio})
          </span>
          <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
            {project.fps} FPS
          </span>
        </div>

        {/* Active Text Indicator with One-Click Edit */}
        {activeTextClip && (
          <button
            onClick={() => onSelectClip && onSelectClip(activeTextClip.id)}
            className="hidden sm:flex items-center gap-1 text-[10px] bg-amber-950/40 text-amber-300 hover:text-white px-2 py-0.5 rounded border border-amber-600/30 cursor-pointer transition-colors"
            title="Edit this text in Inspector"
          >
            <Type className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[130px] font-medium font-sans">
              {activeTextClip.textConfig?.text}
            </span>
          </button>
        )}

        {/* Timecode display */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-cyan-400 font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{formatTimecode(project.duration)}</span>
        </div>
      </div>

      {/* Center Video Canvas Area with Aspect-Ratio Containment */}
      <div 
        onClick={onTogglePlay}
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden relative cursor-pointer group"
      >
        <div 
          className="relative max-h-full max-w-full shadow-2xl shadow-black/80 rounded-lg overflow-hidden border border-[#2B3042] bg-black flex items-center justify-center transition-all"
          style={{
            aspectRatio: project.aspectRatio === '9:16' ? '9/16' : project.aspectRatio === '16:9' ? '16/9' : project.aspectRatio === '1:1' ? '1/1' : '4/5',
            height: project.aspectRatio === '9:16' ? '100%' : 'auto',
            width: project.aspectRatio === '16:9' ? '100%' : 'auto',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Center Play Indicator Overlay */}
          {!isPlaying && !isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-6 h-6 ml-0.5 fill-white" />
              </div>
            </div>
          )}

          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 p-4 text-center">
              <Upload className="w-10 h-10 text-cyan-300 animate-bounce mb-2" />
              <p className="text-sm font-bold text-white">{t.dragDropVideo}</p>
            </div>
          )}

          {/* Dotted Safe-Area Guide lines */}
          <div className="absolute inset-4 border border-dashed border-white/10 pointer-events-none rounded" />
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="w-full px-3 py-2 bg-[#0F1118] border-t border-[#1E2230] flex items-center justify-between gap-2 z-10">
        {/* Left: Step Frame & Reset */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTimeUpdate(0)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C202C] rounded-lg transition-colors cursor-pointer"
            title="Jump to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStepFrame(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C202C] rounded-lg transition-colors cursor-pointer"
            title="Previous Frame"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-xl text-white transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
          </button>
          <button
            onClick={() => handleStepFrame(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C202C] rounded-lg transition-colors cursor-pointer"
            title="Next Frame"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Playhead quick scrubber slider */}
        <div className="flex-1 max-w-xs mx-2 hidden sm:flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={project.duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#232736] rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Right: Audio Volume + Speed + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C202C] rounded-lg transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || masterVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-14 sm:w-16 h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500 hidden sm:block"
            />
          </div>

          {/* Speed selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-[#181B26] text-slate-300 text-[11px] px-1.5 py-1 rounded border border-[#2B3042] outline-none cursor-pointer"
            title="Speed"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C202C] rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

function targetWidth(aspectRatio: string) {
  return aspectRatio === '16:9' ? 1280 : 720;
}

function targetHeight(aspectRatio: string) {
  return aspectRatio === '16:9' ? 720 : 1280;
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number, label: string) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1E1B4B');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  ctx.fillStyle = '#C084FC';
  ctx.font = '600 24px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
}
