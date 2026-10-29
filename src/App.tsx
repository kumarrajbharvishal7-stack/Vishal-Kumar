import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, Clip, AspectRatio, StoryboardScene } from './types/editor';
import { Language } from './utils/i18n';
import { 
  getAllProjects, 
  saveProject, 
  deleteProject, 
  createDefaultProject 
} from './utils/storage';
import { previewAudioEngine } from './utils/audioSync';
import { STOCK_VIDEOS, STOCK_IMAGES, STOCK_AUDIO } from './data/stockAssets';

// Components
import { Navbar } from './components/Navbar';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Timeline } from './components/Timeline';
import { AssetShelf } from './components/AssetShelf';
import { InspectorPanel } from './components/InspectorPanel';
import { LandingPage } from './components/LandingPage';
import { ExportModal } from './components/ExportModal';
import { AIModal } from './components/AIModal';
import { AndroidBuildModal } from './components/AndroidBuildModal';

export default function App() {
  const [view, setView] = useState<'landing' | 'editor'>('editor');
  const [language, setLanguage] = useState<Language>('hi'); // Default Hindi for user instruction
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAndroidOpen, setIsAndroidOpen] = useState(false);
  const [isMobileShelfOpen, setIsMobileShelfOpen] = useState(false);

  // Playback timer ref
  const lastTimeRef = useRef<number>(performance.now());

  // 1. Load initial projects
  useEffect(() => {
    getAllProjects().then((loaded) => {
      setProjects(loaded);
      if (loaded.length > 0) {
        setActiveProject(loaded[0]);
      }
    });
  }, []);

  // 2. Playback Animation Frame Loop
  useEffect(() => {
    let animId: number;

    const playLoop = (now: number) => {
      if (isPlaying && activeProject) {
        const delta = (now - lastTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= activeProject.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      animId = requestAnimationFrame(playLoop);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(playLoop);

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeProject]);

  // 3. Audio Synchronization with Preview Playback
  useEffect(() => {
    if (activeProject) {
      previewAudioEngine.sync(activeProject, currentTime, isPlaying);
    }
  }, [activeProject, currentTime, isPlaying]);

  // Helper to commit state with Undo tracking
  const pushState = useCallback((newProject: Project) => {
    if (activeProject) {
      setUndoStack((prev) => [...prev.slice(-25), activeProject]);
      setRedoStack([]);
    }
    setActiveProject(newProject);
    saveProject(newProject);
    setProjects((prev) => prev.map((p) => (p.id === newProject.id ? newProject : p)));
  }, [activeProject]);

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0 || !activeProject) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [activeProject, ...prev]);
    setActiveProject(previous);
    saveProject(previous);
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0 || !activeProject) return;
    const next = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setUndoStack((prev) => [...prev, activeProject]);
    setActiveProject(next);
    saveProject(next);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside text fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      } else if (e.key.toLowerCase() === 's') {
        if (selectedClipId && activeProject) {
          handleSplitClip(selectedClipId, currentTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Project Management Actions
  const handleOpenProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      setActiveProject(proj);
      setCurrentTime(0);
      setIsPlaying(false);
      setSelectedClipId(null);
      setView('editor');
    }
  };

  const handleCreateNewProject = (ratio: AspectRatio, name = 'New Project') => {
    const newProj = createDefaultProject(name, ratio);
    saveProject(newProj);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setView('editor');
  };

  const handleDuplicateProject = (id: string) => {
    const orig = projects.find((p) => p.id === id);
    if (!orig) return;
    const dup: Project = {
      ...orig,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: `${orig.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveProject(dup);
    setProjects((prev) => [dup, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProject?.id === id) {
      if (remaining.length > 0) {
        setActiveProject(remaining[0]);
      } else {
        const fresh = createDefaultProject('Untitled Project', '9:16');
        saveProject(fresh);
        setProjects([fresh]);
        setActiveProject(fresh);
      }
    }
  };

  const handleUpdateProjectName = (name: string) => {
    if (!activeProject) return;
    pushState({ ...activeProject, name });
  };

  const handleUpdateAspectRatio = (aspectRatio: AspectRatio) => {
    if (!activeProject) return;
    const width = aspectRatio === '9:16' ? 1080 : aspectRatio === '16:9' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;
    const height = aspectRatio === '9:16' ? 1920 : aspectRatio === '16:9' ? 1080 : aspectRatio === '1:1' ? 1080 : 1350;
    pushState({ ...activeProject, aspectRatio, width, height });
  };

  // Clip Timeline Actions
  const handleAddClipToTimeline = (clipData: Partial<Clip>) => {
    if (!activeProject) return;
    const newId = 'clip_' + Math.random().toString(36).substring(2, 9);
    const newClip: Clip = {
      id: newId,
      trackId: clipData.trackId || activeProject.tracks[0].id,
      type: clipData.type || 'video',
      name: clipData.name || 'New Clip',
      sourceUrl: clipData.sourceUrl || '',
      thumbnailUrl: clipData.thumbnailUrl,
      startTime: clipData.startTime ?? currentTime,
      duration: clipData.duration ?? 5,
      trimStart: clipData.trimStart ?? 0,
      volume: clipData.volume ?? 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1,
      filters: clipData.filters || { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: clipData.transform || { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      textConfig: clipData.textConfig,
    };

    // Auto-expand project duration if clip exceeds current boundary
    const maxClipEnd = Math.max(activeProject.duration, newClip.startTime + newClip.duration);

    pushState({
      ...activeProject,
      duration: maxClipEnd,
      clips: [...activeProject.clips, newClip],
    });
    setSelectedClipId(newId);
  };

  const handleUpdateClip = (updatedClip: Clip) => {
    if (!activeProject) return;
    const updatedClips = activeProject.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    const maxEnd = Math.max(...updatedClips.map((c) => c.startTime + c.duration), 5);
    pushState({
      ...activeProject,
      duration: maxEnd,
      clips: updatedClips,
    });
  };

  const handleDeleteClip = (clipId: string) => {
    if (!activeProject) return;
    const updatedClips = activeProject.clips.filter((c) => c.id !== clipId);
    pushState({
      ...activeProject,
      clips: updatedClips,
    });
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const handleDuplicateClip = (clipId: string) => {
    if (!activeProject) return;
    const orig = activeProject.clips.find((c) => c.id === clipId);
    if (!orig) return;
    const copyId = 'clip_' + Math.random().toString(36).substring(2, 9);
    const duplicatedClip: Clip = {
      ...orig,
      id: copyId,
      name: `${orig.name} (Copy)`,
      startTime: orig.startTime + orig.duration + 0.2,
    };
    pushState({
      ...activeProject,
      duration: Math.max(activeProject.duration, duplicatedClip.startTime + duplicatedClip.duration),
      clips: [...activeProject.clips, duplicatedClip],
    });
    setSelectedClipId(copyId);
  };

  // Non-destructive clip split at playhead
  const handleSplitClip = (clipId: string, splitTime: number) => {
    if (!activeProject) return;
    const clip = activeProject.clips.find((c) => c.id === clipId);
    if (!clip) return;

    if (splitTime <= clip.startTime + 0.1 || splitTime >= clip.startTime + clip.duration - 0.1) {
      return;
    }

    const firstDuration = splitTime - clip.startTime;
    const secondDuration = clip.duration - firstDuration;

    const clipPart1: Clip = {
      ...clip,
      duration: firstDuration,
    };

    const clipPart2: Clip = {
      ...clip,
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      name: `${clip.name} (Part 2)`,
      startTime: splitTime,
      duration: secondDuration,
      trimStart: (clip.trimStart || 0) + firstDuration,
    };

    const remaining = activeProject.clips.filter((c) => c.id !== clipId);
    pushState({
      ...activeProject,
      clips: [...remaining, clipPart1, clipPart2],
    });
    setSelectedClipId(clipPart2.id);
  };

  // Precision Trim In (Start to playhead)
  const handleTrimClipStartToPlayhead = (clipId: string) => {
    if (!activeProject) return;
    const clip = activeProject.clips.find((c) => c.id === clipId);
    if (!clip) return;
    if (currentTime > clip.startTime && currentTime < clip.startTime + clip.duration - 0.2) {
      const timeTrimmed = currentTime - clip.startTime;
      const newDuration = clip.duration - timeTrimmed;
      const newTrimStart = (clip.trimStart || 0) + timeTrimmed;
      handleUpdateClip({
        ...clip,
        startTime: currentTime,
        duration: newDuration,
        trimStart: newTrimStart,
      });
    }
  };

  // Precision Trim Out (End to playhead)
  const handleTrimClipEndToPlayhead = (clipId: string) => {
    if (!activeProject) return;
    const clip = activeProject.clips.find((c) => c.id === clipId);
    if (!clip) return;
    if (currentTime > clip.startTime + 0.2 && currentTime < clip.startTime + clip.duration) {
      const newDuration = currentTime - clip.startTime;
      handleUpdateClip({
        ...clip,
        duration: newDuration,
      });
    }
  };

  // Direct Video & Media Upload Handler
  const handleUploadMedia = (files: FileList) => {
    if (!activeProject) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.onloadedmetadata = () => {
          const dur = Math.min(vid.duration || 10, 60);
          vid.currentTime = 0.5;
          vid.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(vid, 0, 0, 160, 90);
            const thumb = canvas.toDataURL('image/jpeg');

            const videoTrack = activeProject.tracks.find((t) => t.type === 'video') || activeProject.tracks[0];
            handleAddClipToTimeline({
              trackId: videoTrack.id,
              type: 'video',
              name: file.name,
              sourceUrl: url,
              thumbnailUrl: thumb,
              startTime: currentTime,
              duration: dur,
              sourceDuration: vid.duration,
              trimStart: 0,
              volume: 1,
            });
          };
        };
      } else if (isImage) {
        const videoTrack = activeProject.tracks.find((t) => t.type === 'video') || activeProject.tracks[0];
        handleAddClipToTimeline({
          trackId: videoTrack.id,
          type: 'image',
          name: file.name,
          sourceUrl: url,
          thumbnailUrl: url,
          startTime: currentTime,
          duration: 5,
          trimStart: 0,
          volume: 1,
        });
      } else if (isAudio) {
        const audioTrack = activeProject.tracks.find((t) => t.type === 'audio') || activeProject.tracks[0];
        const aud = new Audio(url);
        aud.onloadedmetadata = () => {
          handleAddClipToTimeline({
            trackId: audioTrack.id,
            type: 'audio',
            name: file.name,
            sourceUrl: url,
            startTime: currentTime,
            duration: Math.min(aud.duration || 10, 60),
            sourceDuration: aud.duration,
            trimStart: 0,
            volume: 1,
          });
        };
      }
    });
  };

  // Quick Add Text to Text Track
  const handleQuickAddText = () => {
    if (!activeProject) return;
    const textTrack = activeProject.tracks.find((t) => t.type === 'text') || activeProject.tracks[0];
    const isHindi = language === 'hi';
    const defaultText = isHindi ? 'नया टेक्स्ट यहाँ लिखें' : 'YOUR TEXT HERE';

    handleAddClipToTimeline({
      trackId: textTrack.id,
      type: 'text',
      name: defaultText,
      sourceUrl: '',
      startTime: currentTime,
      duration: 4,
      trimStart: 0,
      volume: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      textConfig: {
        text: defaultText,
        fontSize: 38,
        fontFamily: isHindi ? 'Noto Sans Devanagari' : 'Plus Jakarta Sans',
        color: '#FFFFFF',
        backgroundColor: 'rgba(139, 92, 246, 0.85)',
        outlineColor: '#4C1D95',
        outlineWidth: 2,
        shadowColor: '#8B5CF6',
        shadowBlur: 14,
        align: 'center',
        position: 'middle',
        isHindi: isHindi,
        boxPadding: 10,
        borderRadius: 8,
      },
    });
  };

  // Toggle track mute/visibility
  const handleToggleTrackMute = (trackId: string) => {
    if (!activeProject) return;
    const updatedTracks = activeProject.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
    pushState({ ...activeProject, tracks: updatedTracks });
  };

  const handleToggleTrackVisible = (trackId: string) => {
    if (!activeProject) return;
    const updatedTracks = activeProject.tracks.map((t) => (t.id === trackId ? { ...t, isVisible: !t.isVisible } : t));
    pushState({ ...activeProject, tracks: updatedTracks });
  };

  // Apply Filter Preset
  const handleApplyFilterPresetToSelected = (filterPreset: string) => {
    if (!selectedClipId || !activeProject) return;
    const clip = activeProject.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    let newFilters = { ...clip.filters };
    if (filterPreset === 'normal') {
      newFilters = { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 };
    } else if (filterPreset === 'cyberpunk') {
      newFilters = { brightness: 110, contrast: 125, saturation: 145, blur: 0, grayscale: 0, sepia: 0, hueRotate: 280, vignette: 25 };
    } else if (filterPreset === 'cinematic') {
      newFilters = { brightness: 95, contrast: 130, saturation: 90, blur: 0, grayscale: 0, sepia: 15, hueRotate: 15, vignette: 40 };
    } else if (filterPreset === 'bw') {
      newFilters = { brightness: 105, contrast: 140, saturation: 0, blur: 0, grayscale: 100, sepia: 0, hueRotate: 0, vignette: 30 };
    } else if (filterPreset === 'warm') {
      newFilters = { brightness: 105, contrast: 110, saturation: 120, blur: 0, grayscale: 0, sepia: 35, hueRotate: 340, vignette: 15 };
    } else if (filterPreset === 'vintage') {
      newFilters = { brightness: 110, contrast: 90, saturation: 80, blur: 0, grayscale: 0, sepia: 60, hueRotate: 20, vignette: 45 };
    }

    handleUpdateClip({ ...clip, filters: newFilters });
  };

  // Apply Transition
  const handleApplyTransitionToSelected = (transitionType: any) => {
    if (!selectedClipId || !activeProject) return;
    const clip = activeProject.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    handleUpdateClip({ ...clip, transitionIn: transitionType, transitionOut: transitionType });
  };

  // AI Story Import
  const handleApplyScenesToTimeline = (scenes: StoryboardScene[]) => {
    if (!activeProject) return;
    let cursor = 0;
    const newClips: Clip[] = [];

    const videoTrack = activeProject.tracks.find((t) => t.type === 'video') || activeProject.tracks[0];
    const textTrack = activeProject.tracks.find((t) => t.type === 'text') || activeProject.tracks[1];

    scenes.forEach((scene, index) => {
      const stock = STOCK_VIDEOS[index % STOCK_VIDEOS.length];
      const dur = scene.durationSeconds || 5;

      // Video clip
      newClips.push({
        id: 'clip_ai_vid_' + Math.random().toString(36).substring(2, 9),
        trackId: videoTrack.id,
        type: 'video',
        name: scene.title,
        sourceUrl: stock.url,
        thumbnailUrl: stock.thumbnail,
        startTime: cursor,
        duration: dur,
        trimStart: 0,
        volume: 1,
        fadeIn: 0.5,
        fadeOut: 0.5,
        speed: 1,
        filters: { brightness: 105, contrast: 110, saturation: 115, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 20 },
        transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
        transitionIn: 'fade',
        transitionOut: 'dissolve',
      });

      // Text caption
      if (scene.onScreenText) {
        newClips.push({
          id: 'clip_ai_text_' + Math.random().toString(36).substring(2, 9),
          trackId: textTrack.id,
          type: 'text',
          name: scene.onScreenText,
          sourceUrl: '',
          startTime: cursor,
          duration: dur,
          trimStart: 0,
          volume: 1,
          fadeIn: 0.3,
          fadeOut: 0.3,
          speed: 1,
          filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
          transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
          textConfig: {
            text: scene.onScreenText,
            fontSize: 34,
            fontFamily: language === 'hi' ? 'Noto Sans Devanagari' : 'Plus Jakarta Sans',
            color: '#FFFFFF',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            outlineColor: '#000000',
            outlineWidth: 2,
            shadowColor: '#8B5CF6',
            shadowBlur: 14,
            align: 'center',
            position: 'bottom',
            boxPadding: 8,
            borderRadius: 6,
            isHindi: language === 'hi',
          },
        });
      }

      cursor += dur;
    });

    // Add BGM
    const audioTrack = activeProject.tracks.find((t) => t.type === 'audio');
    if (audioTrack) {
      newClips.push({
        id: 'clip_ai_bgm_' + Math.random().toString(36).substring(2, 9),
        trackId: audioTrack.id,
        type: 'audio',
        name: 'Cinematic BGM Track',
        sourceUrl: STOCK_AUDIO[0].url,
        startTime: 0,
        duration: cursor,
        trimStart: 0,
        volume: 0.7,
        fadeIn: 1,
        fadeOut: 1.5,
        speed: 1,
        filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
        transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      });
    }

    pushState({
      ...activeProject,
      duration: cursor,
      clips: newClips,
    });
    setCurrentTime(0);
  };

  // AI Auto-Captions Import
  const handleAddCaptionsToTimeline = (captions: Array<{ text: string; start: number; end: number }>) => {
    if (!activeProject) return;
    const textTrack = activeProject.tracks.find((t) => t.type === 'text') || activeProject.tracks[0];

    const captionClips: Clip[] = captions.map((cap) => ({
      id: 'clip_cap_' + Math.random().toString(36).substring(2, 9),
      trackId: textTrack.id,
      type: 'text',
      name: cap.text,
      sourceUrl: '',
      startTime: cap.start,
      duration: Math.max(0.5, cap.end - cap.start),
      trimStart: 0,
      volume: 1,
      fadeIn: 0.2,
      fadeOut: 0.2,
      speed: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      textConfig: {
        text: cap.text,
        fontSize: 32,
        fontFamily: 'Noto Sans Devanagari',
        color: '#FBBF24',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        outlineColor: '#000000',
        outlineWidth: 2,
        shadowColor: '#F59E0B',
        shadowBlur: 10,
        align: 'center',
        position: 'bottom',
        boxPadding: 8,
        borderRadius: 6,
        isHindi: true,
      },
    }));

    pushState({
      ...activeProject,
      clips: [...activeProject.clips, ...captionClips],
    });
  };

  // AI Voiceover Audio Import
  const handleAddAudioToTimeline = (audioUrl: string, name: string) => {
    if (!activeProject) return;
    const audioTrack = activeProject.tracks.find((t) => t.type === 'audio') || activeProject.tracks[0];
    const newClip: Clip = {
      id: 'clip_tts_' + Math.random().toString(36).substring(2, 9),
      trackId: audioTrack.id,
      type: 'audio',
      name,
      sourceUrl: audioUrl,
      startTime: currentTime,
      duration: 8,
      trimStart: 0,
      volume: 1.2,
      fadeIn: 0.2,
      fadeOut: 0.5,
      speed: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
    };

    pushState({
      ...activeProject,
      clips: [...activeProject.clips, newClip],
    });
    setSelectedClipId(newClip.id);
  };

  // If in Landing page view:
  if (view === 'landing' || !activeProject) {
    return (
      <LandingPage
        projects={projects}
        activeProjectId={activeProject?.id || ''}
        onOpenProject={handleOpenProject}
        onCreateNewProject={handleCreateNewProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onOpenAIStudio={() => setIsAIOpen(true)}
        onOpenAndroidGuide={() => setIsAndroidOpen(true)}
      />
    );
  }

  const selectedClip = activeProject.clips.find((c) => c.id === selectedClipId) || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#08090D] overflow-hidden select-none">
      {/* 1. Top Navigation Bar with Language Toggle & Quick Upload */}
      <Navbar
        project={activeProject}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'hi' ? 'en' : 'hi'))}
        onUpdateProjectName={handleUpdateProjectName}
        onUpdateAspectRatio={handleUpdateAspectRatio}
        onUploadMedia={handleUploadMedia}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenAIModal={() => setIsAIOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenProjectsDashboard={() => setView('landing')}
        onOpenAndroidModal={() => setIsAndroidOpen(true)}
        isMobileShelfOpen={isMobileShelfOpen}
        onToggleMobileShelf={() => setIsMobileShelfOpen((s) => !s)}
      />

      {/* 2. Middle Editor Workspace: Shelf + Preview Player + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Asset Shelf (Collapsible on mobile) */}
        <div 
          className={`w-72 sm:w-80 shrink-0 h-full z-20 transition-all duration-300 md:relative md:block ${
            isMobileShelfOpen 
              ? 'absolute inset-y-0 left-0 shadow-2xl block bg-[#0D0F16]' 
              : 'hidden md:block'
          }`}
        >
          <AssetShelf
            project={activeProject}
            currentTime={currentTime}
            onAddClipToTimeline={handleAddClipToTimeline}
            onOpenAIModal={() => setIsAIOpen(true)}
            onApplyFilterPresetToSelected={handleApplyFilterPresetToSelected}
            onApplyTransitionToSelected={handleApplyTransitionToSelected}
            selectedClipId={selectedClipId}
          />
        </div>

        {/* Center: Real-Time Preview Player Canvas with Drag-and-Drop Video Upload */}
        <div className="flex-1 h-full p-2 sm:p-3 overflow-hidden bg-[#07080C] flex flex-col items-center justify-center">
          <PreviewPlayer
            project={activeProject}
            currentTime={currentTime}
            isPlaying={isPlaying}
            language={language}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onDropFiles={handleUploadMedia}
            onSelectClip={(id) => setSelectedClipId(id)}
          />
        </div>

        {/* Right: Clip Inspector Panel (Desktop & Tablet) */}
        <div className="hidden lg:block w-72 sm:w-80 shrink-0 h-full">
          <InspectorPanel
            selectedClip={selectedClip}
            project={activeProject}
            language={language}
            onUpdateClip={handleUpdateClip}
            onDeleteClip={handleDeleteClip}
          />
        </div>
      </div>

      {/* 3. Bottom: Pro Multi-Track Timeline with Split, Trim & Quick Actions */}
      <div className="h-56 sm:h-64 shrink-0 z-10">
        <Timeline
          project={activeProject}
          currentTime={currentTime}
          selectedClipId={selectedClipId}
          language={language}
          onTimeUpdate={(t) => setCurrentTime(t)}
          onSelectClip={(id) => setSelectedClipId(id)}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
          onSplitClip={handleSplitClip}
          onTrimClipStartToPlayhead={handleTrimClipStartToPlayhead}
          onTrimClipEndToPlayhead={handleTrimClipEndToPlayhead}
          onToggleTrackMute={handleToggleTrackMute}
          onToggleTrackVisible={handleToggleTrackVisible}
          onAddTextQuick={handleQuickAddText}
          onUploadMediaQuick={() => {
            const el = document.createElement('input');
            el.type = 'file';
            el.multiple = true;
            el.accept = 'video/*,image/*,audio/*';
            el.onchange = (e: any) => {
              if (e.target.files) handleUploadMedia(e.target.files);
            };
            el.click();
          }}
        />
      </div>

      {/* Modals */}
      <ExportModal
        project={activeProject}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <AIModal
        project={activeProject}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onApplyScenesToTimeline={handleApplyScenesToTimeline}
        onAddCaptionsToTimeline={handleAddCaptionsToTimeline}
        onAddAudioToTimeline={handleAddAudioToTimeline}
      />

      <AndroidBuildModal
        isOpen={isAndroidOpen}
        onClose={() => setIsAndroidOpen(false)}
      />
    </div>
  );
}
