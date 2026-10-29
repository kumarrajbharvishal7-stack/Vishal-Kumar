import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Project, Clip, Track } from '../types/editor';
import { Language, translations } from '../utils/i18n';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Type, 
  Music, 
  Video, 
  Layers, 
  Split,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload
} from 'lucide-react';

interface TimelineProps {
  project: Project;
  currentTime: number;
  selectedClipId: string | null;
  language?: Language;
  onTimeUpdate: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clip: Clip) => void;
  onDeleteClip: (clipId: string) => void;
  onDuplicateClip: (clipId: string) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onTrimClipStartToPlayhead: (clipId: string) => void;
  onTrimClipEndToPlayhead: (clipId: string) => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackVisible: (trackId: string) => void;
  onAddTextQuick: () => void;
  onUploadMediaQuick: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  selectedClipId,
  language = 'en',
  onTimeUpdate,
  onSelectClip,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip,
  onTrimClipStartToPlayhead,
  onTrimClipEndToPlayhead,
  onToggleTrackMute,
  onToggleTrackVisible,
  onAddTextQuick,
  onUploadMediaQuick,
}) => {
  const t = translations[language] || translations.en;
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);

  // Zoom level: pixels per second (e.g. 40px = 1 sec, up to 160px = 1 sec)
  const [zoomLevel, setZoomLevel] = useState(60);

  // Dragging states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [clipInitialStart, setClipInitialStart] = useState(0);
  const [trimmingClip, setTrimmingClip] = useState<{ 
    id: string; 
    edge: 'start' | 'end'; 
    initialTime: number; 
    initialDuration: number; 
    initialTrimStart: number 
  } | null>(null);

  // Ruler tick interval based on zoom
  const rulerInterval = zoomLevel >= 100 ? 1 : zoomLevel >= 50 ? 2 : 5;
  const totalRulerSeconds = Math.max(project.duration + 5, 20);
  const totalWidth = totalRulerSeconds * zoomLevel;

  // Convert timeline container mouse position to time in seconds
  const getTimeFromMouseEvent = useCallback((clientX: number) => {
    if (!tracksScrollRef.current) return 0;
    const rect = tracksScrollRef.current.getBoundingClientRect();
    const scrollLeft = tracksScrollRef.current.scrollLeft;
    const offsetX = clientX - rect.left + scrollLeft;
    const time = offsetX / zoomLevel;
    return Math.max(0, Math.min(project.duration, time));
  }, [zoomLevel, project.duration]);

  // Scrubbing on playhead / ruler
  const handleScrubStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScrubbing(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    onTimeUpdate(getTimeFromMouseEvent(clientX));
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

      if (isScrubbing) {
        onTimeUpdate(getTimeFromMouseEvent(clientX));
      } else if (trimmingClip) {
        const deltaX = clientX - dragStartX;
        const deltaTime = deltaX / zoomLevel;
        const clip = project.clips.find((c) => c.id === trimmingClip.id);
        if (!clip) return;

        if (trimmingClip.edge === 'start') {
          // Adjust start time & trimStart, keep end fixed
          const newStart = Math.max(0, trimmingClip.initialTime + deltaTime);
          const maxStart = trimmingClip.initialTime + trimmingClip.initialDuration - 0.3; // Min 0.3s
          const clampedStart = Math.min(newStart, maxStart);
          const durationDiff = clampedStart - trimmingClip.initialTime;
          const newDuration = trimmingClip.initialDuration - durationDiff;
          const newTrimStart = trimmingClip.initialTrimStart + durationDiff;

          onUpdateClip({
            ...clip,
            startTime: clampedStart,
            duration: newDuration,
            trimStart: Math.max(0, newTrimStart),
          });
        } else {
          // Adjust end / duration
          const newDuration = Math.max(0.3, trimmingClip.initialDuration + deltaTime);
          onUpdateClip({
            ...clip,
            duration: newDuration,
          });
        }
      } else if (draggingClipId) {
        const deltaX = clientX - dragStartX;
        const deltaTime = deltaX / zoomLevel;
        const clip = project.clips.find((c) => c.id === draggingClipId);
        if (!clip) return;

        const newStartTime = Math.max(0, clipInitialStart + deltaTime);
        onUpdateClip({
          ...clip,
          startTime: newStartTime,
        });
      }
    };

    const handleUp = () => {
      setIsScrubbing(false);
      setTrimmingClip(null);
      setDraggingClipId(null);
    };

    if (isScrubbing || trimmingClip || draggingClipId) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isScrubbing, trimmingClip, draggingClipId, dragStartX, zoomLevel, clipInitialStart, getTimeFromMouseEvent, onTimeUpdate, onUpdateClip, project.clips]);

  // Split selected clip at playhead
  const handleSplitSelected = () => {
    if (!selectedClipId) return;
    const clip = project.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    if (currentTime > clip.startTime + 0.1 && currentTime < clip.startTime + clip.duration - 0.1) {
      onSplitClip(selectedClipId, currentTime);
    }
  };

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const canSplitSelected = selectedClip 
    ? currentTime > selectedClip.startTime + 0.1 && currentTime < selectedClip.startTime + selectedClip.duration - 0.1 
    : false;

  const canTrimStart = selectedClip 
    ? currentTime > selectedClip.startTime && currentTime < selectedClip.startTime + selectedClip.duration - 0.2
    : false;

  const canTrimEnd = selectedClip 
    ? currentTime > selectedClip.startTime + 0.2 && currentTime < selectedClip.startTime + selectedClip.duration
    : false;

  const getTrackIcon = (type: Track['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'overlay':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getClipBgColor = (type: Clip['type'], isSelected: boolean) => {
    if (isSelected) {
      return 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/25 ring-2 ring-cyan-500/30';
    }
    switch (type) {
      case 'video':
        return 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-500/50 hover:border-blue-400';
      case 'text':
        return 'bg-gradient-to-r from-amber-900/90 to-yellow-900/90 border border-amber-500/50 hover:border-amber-400';
      case 'audio':
        return 'bg-gradient-to-r from-emerald-950/90 to-teal-900/90 border border-emerald-500/50 hover:border-emerald-400';
      case 'image':
        return 'bg-gradient-to-r from-purple-900/90 to-fuchsia-900/90 border border-purple-500/50 hover:border-purple-400';
      default:
        return 'bg-slate-800 border border-slate-600';
    }
  };

  return (
    <div 
      ref={timelineContainerRef}
      className="h-full flex flex-col bg-[#090A0F] border-t border-[#1C202C] select-none overflow-hidden"
    >
      {/* Timeline Controls & Action Bar */}
      <div className="h-11 bg-[#0E1017] border-b border-[#1E2230] px-3 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Quick Editing Actions (Split, Trim In, Trim Out, Delete, Duplicate) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {/* Split Button */}
          <button
            onClick={handleSplitSelected}
            disabled={!canSplitSelected}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer shadow-sm ${
              canSplitSelected
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 border border-purple-400/50'
                : 'text-slate-600 bg-[#161924] border border-[#212638] cursor-not-allowed opacity-60'
            }`}
            title="Split Clip at Playhead (Keyboard: S)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{t.split}</span>
          </button>

          {/* Trim In-Point Button */}
          <button
            onClick={() => selectedClipId && onTrimClipStartToPlayhead(selectedClipId)}
            disabled={!canTrimStart}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
              canTrimStart
                ? 'bg-[#1D2232] hover:bg-[#282F45] text-cyan-300 border border-cyan-500/40'
                : 'text-slate-600 bg-[#141722] border border-[#1E2333] cursor-not-allowed opacity-50'
            }`}
            title="Trim Start to Playhead position"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{t.trimStart}</span>
          </button>

          {/* Trim Out-Point Button */}
          <button
            onClick={() => selectedClipId && onTrimClipEndToPlayhead(selectedClipId)}
            disabled={!canTrimEnd}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
              canTrimEnd
                ? 'bg-[#1D2232] hover:bg-[#282F45] text-cyan-300 border border-cyan-500/40'
                : 'text-slate-600 bg-[#141722] border border-[#1E2333] cursor-not-allowed opacity-50'
            }`}
            title="Trim End to Playhead position"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{t.trimEnd}</span>
          </button>

          <div className="h-5 w-px bg-[#232736] mx-0.5 hidden sm:block" />

          {/* Delete */}
          <button
            onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
              selectedClipId
                ? 'bg-[#1D2232] hover:bg-rose-950/40 text-rose-400 border border-rose-500/30'
                : 'text-slate-600 bg-transparent cursor-not-allowed opacity-50'
            }`}
            title="Delete Selected Clip (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.delete}</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
              selectedClipId
                ? 'bg-[#1D2232] hover:bg-[#282F45] text-slate-300 border border-[#2B3042]'
                : 'text-slate-600 bg-transparent cursor-not-allowed opacity-50'
            }`}
            title="Duplicate Clip"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.duplicate}</span>
          </button>

          {/* Quick Add Text */}
          <button
            onClick={onAddTextQuick}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium bg-[#1B2030] hover:bg-[#252C42] text-amber-300 border border-amber-500/30 transition-colors cursor-pointer ml-1"
            title="Add text to Text Track"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>+ {t.addText}</span>
          </button>

          {/* Quick Upload Video */}
          <button
            onClick={onUploadMediaQuick}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium bg-[#1B2030] hover:bg-[#252C42] text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
            title="Upload Video or Image"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>+ {t.uploadVideo}</span>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setZoomLevel((z) => Math.max(30, z - 15))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1E2230] rounded cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={30}
            max={150}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
            className="w-14 sm:w-20 h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
          />
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1E2230] rounded cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Timeline Workspace: Left Track Headers + Right Scrollable Tracks */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers (Fixed width) */}
        <div className="w-28 sm:w-36 bg-[#0B0D14] border-r border-[#1E2230] shrink-0 z-10 flex flex-col">
          {/* Header spacer aligned with ruler */}
          <div className="h-7 border-b border-[#1E2230] flex items-center px-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Tracks
          </div>

          {/* Track Labels */}
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className="h-12 border-b border-[#1A1D27] px-2 flex items-center justify-between text-xs text-slate-300 bg-[#0F1118]"
            >
              <div className="flex items-center gap-1.5 truncate">
                {getTrackIcon(track.type)}
                <span className="truncate text-[11px] font-medium">{track.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleTrackMute(track.id)}
                  className={`p-1 rounded hover:bg-[#202535] cursor-pointer ${
                    track.isMuted ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
                >
                  {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => onToggleTrackVisible(track.id)}
                  className={`p-1 rounded hover:bg-[#202535] cursor-pointer ${
                    !track.isVisible ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={track.isVisible ? 'Hide Track' : 'Show Track'}
                >
                  {track.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scrollable Tracks Area */}
        <div 
          ref={tracksScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#07080C] timeline-grid"
          style={{ backgroundSize: `${zoomLevel}px 100%` }}
        >
          {/* Timeline Container with Dynamic Width */}
          <div 
            className="h-full relative"
            style={{ width: `${totalWidth}px` }}
          >
            {/* 1. Time Ruler Bar */}
            <div 
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
              className="h-7 border-b border-[#1E2230] bg-[#0E1017] cursor-pointer relative"
            >
              {Array.from({ length: Math.ceil(totalRulerSeconds / rulerInterval) }).map((_, i) => {
                const sec = i * rulerInterval;
                const left = sec * zoomLevel;
                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 flex flex-col justify-end pb-1 border-l border-[#2B3042] pl-1"
                    style={{ left: `${left}px` }}
                  >
                    <span className="text-[10px] text-slate-500 font-mono select-none">
                      {Math.floor(sec / 60)}:{Math.floor(sec % 60).toString().padStart(2, '0')}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 2. Track Lanes */}
            {project.tracks.map((track) => {
              const trackClips = project.clips.filter((c) => c.trackId === track.id);

              return (
                <div
                  key={track.id}
                  className={`h-12 border-b border-[#1A1D27] relative transition-opacity ${
                    !track.isVisible ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {trackClips.map((clip) => {
                    const isSelected = clip.id === selectedClipId;
                    const leftPx = clip.startTime * zoomLevel;
                    const widthPx = clip.duration * zoomLevel;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                        }}
                        onMouseDown={(e) => {
                          // Ignore if clicking trim handles
                          if ((e.target as HTMLElement).dataset.handle) return;
                          setDraggingClipId(clip.id);
                          setDragStartX(e.clientX);
                          setClipInitialStart(clip.startTime);
                          onSelectClip(clip.id);
                        }}
                        className={`absolute top-1 bottom-1 rounded-md overflow-hidden flex items-center justify-between px-2 cursor-grab active:cursor-grabbing group select-none transition-all ${getClipBgColor(
                          clip.type,
                          isSelected
                        )}`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${Math.max(24, widthPx)}px`,
                        }}
                      >
                        {/* Left Trim Handle (In-Point) */}
                        <div
                          data-handle="start"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClip({
                              id: clip.id,
                              edge: 'start',
                              initialTime: clip.startTime,
                              initialDuration: clip.duration,
                              initialTrimStart: clip.trimStart || 0,
                            });
                            setDragStartX(e.clientX);
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3 bg-cyan-400/30 hover:bg-cyan-400 group-hover:opacity-100 opacity-70 cursor-ew-resize flex items-center justify-center transition-all z-20"
                          title="Drag to Trim Start (In-Point)"
                        >
                          <div className="w-0.5 h-3.5 bg-white rounded shadow" />
                        </div>

                        {/* Clip Content Label & Visual Cue */}
                        <div className="flex items-center gap-1.5 truncate pointer-events-none px-2 z-10">
                          {clip.thumbnailUrl && (
                            <img
                              src={clip.thumbnailUrl}
                              alt=""
                              className="w-7 h-7 rounded object-cover shrink-0 border border-black/40 shadow-sm"
                            />
                          )}
                          <div className="flex flex-col truncate">
                            <span className="text-[11px] font-semibold text-white truncate drop-shadow-sm font-sans">
                              {clip.type === 'text' && clip.textConfig?.text ? clip.textConfig.text : clip.name}
                            </span>
                            <span className="text-[9px] text-slate-300/90 font-mono">
                              {clip.duration.toFixed(1)}s {clip.trimStart > 0 ? `(Trim +${clip.trimStart.toFixed(1)}s)` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Audio Waveform Effect (CSS Gradient visualization) */}
                        {clip.type === 'audio' && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px]" />
                        )}

                        {/* Right Trim Handle (Out-Point) */}
                        <div
                          data-handle="end"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClip({
                              id: clip.id,
                              edge: 'end',
                              initialTime: clip.startTime,
                              initialDuration: clip.duration,
                              initialTrimStart: clip.trimStart || 0,
                            });
                            setDragStartX(e.clientX);
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3 bg-cyan-400/30 hover:bg-cyan-400 group-hover:opacity-100 opacity-70 cursor-ew-resize flex items-center justify-center transition-all z-20"
                          title="Drag to Trim End (Out-Point)"
                        >
                          <div className="w-0.5 h-3.5 bg-white rounded shadow" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* 3. Interactive Red Glowing Playhead Scrubber */}
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.9)]"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Playhead marker needle */}
              <div 
                className="w-4 h-4 bg-rose-500 rounded-sm transform -translate-x-1/2 rotate-45 border border-white shadow-md pointer-events-auto cursor-ew-resize -mt-1.5"
                onMouseDown={handleScrubStart}
                onTouchStart={handleScrubStart}
                title="Drag to Scrub Playhead"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
