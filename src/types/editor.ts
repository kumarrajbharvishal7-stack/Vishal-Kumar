export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type ResolutionPreset = '480p' | '720p' | '1080p';

export type ClipType = 'video' | 'image' | 'audio' | 'text';

export type TransitionType = 'none' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'flash';

export interface ClipFilters {
  brightness: number; // 0 - 200, default 100
  contrast: number; // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  blur: number; // 0 - 20, default 0
  grayscale: number; // 0 - 100, default 0
  sepia: number; // 0 - 100, default 0
  hueRotate: number; // 0 - 360, default 0
  vignette: number; // 0 - 100, default 0
}

export interface ClipTransform {
  scale: number; // 0.2 - 3, default 1
  positionX: number; // offset in px or %
  positionY: number; // offset in px or %
  rotation: number; // -180 to 180 degrees
}

export interface ClipTextConfig {
  text: string;
  fontSize: number; // 12 - 120
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  align: 'left' | 'center' | 'right';
  position: 'top' | 'middle' | 'bottom' | 'custom';
  customY?: number;
  isHindi?: boolean;
  boxPadding?: number;
  borderRadius?: number;
}

export interface Clip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  trimStart: number; // in seconds
  trimEnd?: number; // in seconds
  sourceDuration?: number; // total duration of raw source
  volume: number; // 0.0 - 2.0 (1.0 = normal)
  fadeIn: number; // in seconds
  fadeOut: number; // in seconds
  speed: number; // 0.25 - 4.0
  filters: ClipFilters;
  transform: ClipTransform;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  textConfig?: ClipTextConfig;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'overlay' | 'text' | 'audio';
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  duration: number;
  tracks: Track[];
  clips: Clip[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  size?: number;
  dimensions?: { width: number; height: number };
}

export interface ExportSettings {
  filename: string;
  resolution: ResolutionPreset;
  fps: number;
  format: 'mp4' | 'webm';
  quality: 'standard' | 'high' | 'ultra';
}

export interface StoryboardScene {
  title: string;
  visualDescription: string;
  narration: string;
  onScreenText: string;
  durationSeconds: number;
  transition?: string;
  filterPreset?: string;
}
