import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Initialize Gemini SDK with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '50mb' }));

// Helper to read server-persisted projects
function getStoredProjects(): any[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading projects:', err);
  }
  return [];
}

// Helper to write server-persisted projects
function saveStoredProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving projects:', err);
  }
}

// -------------------------------------------------------------
// Backend Projects API (Sync with IndexedDB)
// -------------------------------------------------------------
app.get('/api/projects', (req, res) => {
  const projects = getStoredProjects();
  res.json({ success: true, projects });
});

app.get('/api/projects/:id', (req, res) => {
  const projects = getStoredProjects();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, project });
});

app.post('/api/projects', (req, res) => {
  const project = req.body;
  if (!project || !project.id) {
    return res.status(400).json({ success: false, error: 'Invalid project data' });
  }
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveStoredProjects(projects);
  res.json({ success: true, project });
});

app.delete('/api/projects/:id', (req, res) => {
  let projects = getStoredProjects();
  projects = projects.filter((p) => p.id !== req.params.id);
  saveStoredProjects(projects);
  res.json({ success: true });
});

// -------------------------------------------------------------
// AI Features (Gemini API)
// -------------------------------------------------------------

// 1. AI Story-to-Scenes Workflow (Generates multi-scene video plan)
app.post('/api/ai/story-to-scenes', async (req, res) => {
  try {
    const { prompt, duration = 30, style = 'dynamic', language = 'en' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction = `You are an expert video director and CapCut video editor.
Given a topic, create a structured video scene breakdown for a ${duration}-second video.
Language: ${language === 'hi' ? 'Hindi (हिंदी Unicode)' : 'English'}.
The output must be structured JSON. Each scene should have:
- title: Short scene title
- visualDescription: Specific visual cue or background prompt
- narration: Voiceover narration line
- onScreenText: Punchy overlay text for the screen (short, max 6 words)
- durationSeconds: Scene duration (sum roughly around ${duration})
- transition: Recommended transition ('fade', 'dissolve', 'slide', 'none')
- filterPreset: Color grade tone ('normal', 'cyberpunk', 'warm', 'cinematic', 'vintage')`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Create a video storyboard and timeline breakdown for: "${prompt}". Style: ${style}. Total target duration: ${duration}s.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            targetDuration: { type: Type.NUMBER },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  onScreenText: { type: Type.STRING },
                  durationSeconds: { type: Type.NUMBER },
                  transition: { type: Type.STRING },
                  filterPreset: { type: Type.STRING },
                },
                required: ['title', 'visualDescription', 'narration', 'onScreenText', 'durationSeconds'],
              },
            },
          },
          required: ['title', 'hook', 'scenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('AI Storyboard error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate video scenes' });
  }
});

// 2. AI Auto Captions Generator
app.post('/api/ai/auto-captions', async (req, res) => {
  try {
    const { scriptOrTheme, language = 'en', videoDuration = 15 } = req.body;
    if (!scriptOrTheme) {
      return res.status(400).json({ error: 'Text content or topic is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate timed subtitle caption segments for this video script or topic: "${scriptOrTheme}".
Target total video duration is ${videoDuration} seconds.
Language: ${language === 'hi' ? 'Hindi (हिंदी text)' : 'English'}.
Break into short, punchy 1.5 to 3.5 second subtitles with exact start and end timestamps in seconds.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              emphasisWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['text', 'start', 'end'],
          },
        },
      },
    });

    const captions = JSON.parse(response.text || '[]');
    res.json({ success: true, captions });
  } catch (err: any) {
    console.error('AI Captions error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate captions' });
  }
});

// 3. AI Viral Titles, Descriptions & Hashtags
app.post('/api/ai/viral-metadata', async (req, res) => {
  try {
    const { projectSummary, platform = 'all' } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate viral video titles, descriptions, and hashtags for a video about: "${projectSummary}". Target platform: ${platform} (YouTube Shorts, Instagram Reels, TikTok).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Catchy, high-CTR titles',
            },
            description: { type: Type.STRING },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            soundSuggestion: { type: Type.STRING },
            retentionTip: { type: Type.STRING },
          },
          required: ['titles', 'description', 'hashtags'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Viral metadata error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate metadata' });
  }
});

// 4. AI Voiceover Generator (TTS via gemini-3.8-flash-lite-tts)
app.post('/api/ai/voiceover', async (req, res) => {
  try {
    const { text, voice = 'Kore', style = 'Clear, upbeat video creator' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for voiceover' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned by TTS model');
    }

    res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      format: 'wav',
      voice,
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to synthesize voiceover' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zyvox AI Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
