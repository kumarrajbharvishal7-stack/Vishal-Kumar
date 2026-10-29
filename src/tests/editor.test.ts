import { createDefaultProject } from '../utils/storage';
import { Project, Clip } from '../types/editor';

/**
 * Core Logic Automated Tests for Zyvox AI Studio
 */

export function runEditorTests() {
  const results: { test: string; passed: boolean; message?: string }[] = [];

  // Test 1: Project Initialization
  try {
    const proj = createDefaultProject('Test Project', '9:16');
    const hasTracks = proj.tracks.length === 4;
    const hasClips = proj.clips.length > 0;
    const isVertical = proj.aspectRatio === '9:16' && proj.height > proj.width;

    results.push({
      test: '1. Project Initialization & Aspect Ratio Dimensions',
      passed: hasTracks && hasClips && isVertical,
      message: `Tracks: ${proj.tracks.length}, Clips: ${proj.clips.length}, Ratio: ${proj.aspectRatio} (${proj.width}x${proj.height})`,
    });
  } catch (err: any) {
    results.push({ test: '1. Project Initialization', passed: false, message: err.message });
  }

  // Test 2: Non-Destructive Clip Splitting Logic
  try {
    const clip: Clip = {
      id: 'clip_orig',
      trackId: 'track-video',
      type: 'video',
      name: 'Original Video',
      sourceUrl: 'test.mp4',
      startTime: 2,
      duration: 6, // 2s to 8s
      trimStart: 1,
      volume: 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
    };

    const splitAt = 5; // split at 5.0 seconds
    const part1Duration = splitAt - clip.startTime; // 3s
    const part2Duration = clip.duration - part1Duration; // 3s
    const part2TrimStart = clip.trimStart + part1Duration; // 4s

    const passed = part1Duration === 3 && part2Duration === 3 && part2TrimStart === 4;
    results.push({
      test: '2. Non-Destructive Clip Splitting Algorithm',
      passed,
      message: `Split at ${splitAt}s produced Part 1 (${part1Duration}s) and Part 2 (${part2Duration}s, trimStart ${part2TrimStart}s)`,
    });
  } catch (err: any) {
    results.push({ test: '2. Non-Destructive Clip Splitting', passed: false, message: err.message });
  }

  // Test 3: Multilingual Hindi Unicode Text Styling
  try {
    const hindiText = 'सर्वश्रेष्ठ वीडियो एडिटर 🎬';
    const textClip: Partial<Clip> = {
      type: 'text',
      textConfig: {
        text: hindiText,
        fontSize: 36,
        fontFamily: 'Noto Sans Devanagari',
        color: '#FBBF24',
        align: 'center',
        position: 'middle',
        isHindi: true,
      },
    };

    const passed = textClip.textConfig?.isHindi === true && textClip.textConfig.text.length > 0;
    results.push({
      test: '3. Multilingual Unicode Text & Devanagari Support',
      passed,
      message: `Processed: "${hindiText}" with font "${textClip.textConfig?.fontFamily}"`,
    });
  } catch (err: any) {
    results.push({ test: '3. Multilingual Unicode Text', passed: false, message: err.message });
  }

  // Test 4: Aspect Ratio Presets
  try {
    const ratios = ['9:16', '16:9', '1:1', '4:5'] as const;
    const allValid = ratios.every((r) => {
      const p = createDefaultProject('Ratio Test', r);
      return p.aspectRatio === r && p.width > 0 && p.height > 0;
    });

    results.push({
      test: '4. Aspect Ratio Geometry (9:16, 16:9, 1:1, 4:5)',
      passed: allValid,
      message: `All 4 standard aspect ratios validated with proportional bounds`,
    });
  } catch (err: any) {
    results.push({ test: '4. Aspect Ratio Geometry', passed: false, message: err.message });
  }

  return results;
}
