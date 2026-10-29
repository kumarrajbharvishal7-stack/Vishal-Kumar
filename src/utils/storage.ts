import { Project, Track, Clip } from '../types/editor';
import { STOCK_VIDEOS, STOCK_AUDIO } from '../data/stockAssets';

const DB_NAME = 'zyvox_editor_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createDefaultProject(name = 'Untitled Project', aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' = '9:16'): Project {
  const id = 'proj_' + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  const width = aspectRatio === '9:16' ? 1080 : aspectRatio === '16:9' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;
  const height = aspectRatio === '9:16' ? 1920 : aspectRatio === '16:9' ? 1080 : aspectRatio === '1:1' ? 1080 : 1350;

  const tracks: Track[] = [
    { id: 'track-text', name: 'Text & Titles', type: 'text', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-overlay', name: 'Stickers & Overlay', type: 'overlay', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-video', name: 'Main Video', type: 'video', isMuted: false, isLocked: false, isVisible: true },
    { id: 'track-audio', name: 'Audio & Music', type: 'audio', isMuted: false, isLocked: false, isVisible: true },
  ];

  const defaultVideo = STOCK_VIDEOS[0];
  const defaultAudio = STOCK_AUDIO[0];

  const clips: Clip[] = [
    {
      id: 'clip_vid_1',
      trackId: 'track-video',
      type: 'video',
      name: defaultVideo.name,
      sourceUrl: defaultVideo.url,
      thumbnailUrl: defaultVideo.thumbnail,
      startTime: 0,
      duration: 8,
      trimStart: 0,
      trimEnd: 8,
      sourceDuration: 15,
      volume: 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1,
      filters: {
        brightness: 105,
        contrast: 110,
        saturation: 115,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 15,
      },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      transitionIn: 'fade',
      transitionOut: 'dissolve',
    },
    {
      id: 'clip_text_1',
      trackId: 'track-text',
      type: 'text',
      name: 'Title Hook',
      sourceUrl: '',
      startTime: 0.5,
      duration: 4.5,
      trimStart: 0,
      volume: 1,
      fadeIn: 0.3,
      fadeOut: 0.3,
      speed: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      textConfig: {
        text: 'ZYVOX AI STUDIO',
        fontSize: 38,
        fontFamily: 'Plus Jakarta Sans',
        color: '#FFFFFF',
        backgroundColor: 'rgba(139, 92, 246, 0.85)',
        outlineColor: '#4C1D95',
        outlineWidth: 2,
        shadowColor: '#8B5CF6',
        shadowBlur: 18,
        align: 'center',
        position: 'top',
        boxPadding: 8,
        borderRadius: 8,
      },
    },
    {
      id: 'clip_audio_1',
      trackId: 'track-audio',
      type: 'audio',
      name: defaultAudio.name,
      sourceUrl: defaultAudio.url,
      startTime: 0,
      duration: 8,
      trimStart: 0,
      trimEnd: 8,
      sourceDuration: 30,
      volume: 0.8,
      fadeIn: 1,
      fadeOut: 1.5,
      speed: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
    },
  ];

  return {
    id,
    name,
    aspectRatio,
    width,
    height,
    fps: 30,
    duration: 8,
    tracks,
    clips,
    createdAt: now,
    updatedAt: now,
    thumbnail: defaultVideo.thumbnail,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();
      request.onsuccess = () => {
        const localProjects: Project[] = request.result || [];
        if (localProjects.length === 0) {
          const initial = createDefaultProject('Welcome Demo Project', '9:16');
          saveProject(initial);
          resolve([initial]);
        } else {
          // Sort descending by updatedAt
          resolve(localProjects.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      };
      request.onerror = () => {
        resolve(getFallbackProjects());
      };
    });
  } catch {
    return getFallbackProjects();
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    const projects = getFallbackProjects();
    return projects.find((p) => p.id === id) || null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = Date.now();
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    saveFallbackProject(project);
  }

  // Also sync to backend asynchronously (non-blocking)
  try {
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }).catch(() => {});
  } catch {}
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    deleteFallbackProject(id);
  }

  try {
    fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

function getFallbackProjects(): Project[] {
  try {
    const raw = localStorage.getItem('zyvox_projects');
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = createDefaultProject('Welcome Demo Project', '9:16');
  saveFallbackProject(initial);
  return [initial];
}

function saveFallbackProject(project: Project) {
  try {
    const projects = getFallbackProjects().filter((p) => p.id !== project.id);
    projects.unshift(project);
    localStorage.setItem('zyvox_projects', JSON.stringify(projects));
  } catch {}
}

function deleteFallbackProject(id: string) {
  try {
    const projects = getFallbackProjects().filter((p) => p.id !== id);
    localStorage.setItem('zyvox_projects', JSON.stringify(projects));
  } catch {}
}
