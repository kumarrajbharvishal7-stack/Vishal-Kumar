import { Project } from '../types/editor';

class PreviewAudioEngine {
  private audioElements: Record<string, HTMLAudioElement> = {};

  sync(project: Project, currentTime: number, isPlaying: boolean) {
    const audioTrack = project.tracks.find((t) => t.type === 'audio');
    const audioClips = project.clips.filter((c) => c.type === 'audio');

    audioClips.forEach((clip) => {
      if (!clip.sourceUrl) return;

      if (!this.audioElements[clip.id]) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = clip.sourceUrl;
        audio.preload = 'auto';
        this.audioElements[clip.id] = audio;
      }

      const audio = this.audioElements[clip.id];
      const clipEnd = clip.startTime + clip.duration;
      const isTrackMuted = audioTrack?.isMuted ?? false;

      if (currentTime >= clip.startTime && currentTime <= clipEnd && !isTrackMuted) {
        const targetTime = currentTime - clip.startTime + clip.trimStart;

        // Apply volume with fade in/out
        let vol = clip.volume ?? 1;
        const timeFromStart = currentTime - clip.startTime;
        const timeToEnd = clipEnd - currentTime;
        if (timeFromStart < (clip.fadeIn || 0.5)) {
          vol *= timeFromStart / (clip.fadeIn || 0.5);
        } else if (timeToEnd < (clip.fadeOut || 0.5)) {
          vol *= timeToEnd / (clip.fadeOut || 0.5);
        }
        audio.volume = Math.max(0, Math.min(1, vol));

        if (Math.abs(audio.currentTime - targetTime) > 0.25) {
          audio.currentTime = targetTime;
        }

        if (isPlaying && audio.paused) {
          audio.play().catch(() => {});
        } else if (!isPlaying && !audio.paused) {
          audio.pause();
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    });
  }

  stopAll() {
    Object.values(this.audioElements).forEach((audio) => {
      if (!audio.paused) audio.pause();
    });
  }
}

export const previewAudioEngine = new PreviewAudioEngine();
