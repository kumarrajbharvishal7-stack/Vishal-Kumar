import React, { useState } from 'react';
import { Project, Clip, StoryboardScene } from '../types/editor';
import { STOCK_VIDEOS, STOCK_AUDIO } from '../data/stockAssets';
import { 
  X, 
  Sparkles, 
  Wand2, 
  Type, 
  Volume2, 
  Flame, 
  Loader2, 
  Plus, 
  Check, 
  Play, 
  Pause, 
  Languages, 
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AIModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onApplyScenesToTimeline: (scenes: StoryboardScene[]) => void;
  onAddCaptionsToTimeline: (captions: Array<{ text: string; start: number; end: number }>) => void;
  onAddAudioToTimeline: (audioUrl: string, name: string) => void;
}

export const AIModal: React.FC<AIModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplyScenesToTimeline,
  onAddCaptionsToTimeline,
  onAddAudioToTimeline,
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'captions' | 'voiceover' | 'metadata'>('story');

  // Story state
  const [storyPrompt, setStoryPrompt] = useState('Top 5 Productivity Hacks for Creators');
  const [storyDuration, setStoryDuration] = useState(25);
  const [storyLanguage, setStoryLanguage] = useState<'en' | 'hi'>('en');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyResult, setStoryResult] = useState<{ title: string; hook: string; scenes: StoryboardScene[] } | null>(null);

  // Captions state
  const [captionInput, setCaptionInput] = useState('Welcome to Zyvox AI Studio. Edit videos like a pro with real-time multi-track timeline and AI.');
  const [captionLanguage, setCaptionLanguage] = useState<'en' | 'hi'>('en');
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionsResult, setCaptionsResult] = useState<Array<{ text: string; start: number; end: number }>>([]);

  // Voiceover state
  const [voiceText, setVoiceText] = useState('Welcome back to the channel. Today we are exploring the future of artificial intelligence in video creation.');
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Fenrir' | 'Zephyr'>('Kore');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Metadata state
  const [metaPrompt, setMetaPrompt] = useState('How to edit viral shorts in 60 seconds with CapCut style editor');
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [metaResult, setMetaResult] = useState<{ titles: string[]; description: string; hashtags: string[] } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Generate Story
  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/story-to-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: storyPrompt,
          duration: storyDuration,
          language: storyLanguage,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStoryResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate story scenes');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // 2. Generate Captions
  const handleGenerateCaptions = async () => {
    setIsGeneratingCaptions(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/auto-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptOrTheme: captionInput,
          language: captionLanguage,
          videoDuration: Math.round(project.duration),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCaptionsResult(data.captions || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate captions');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // 3. Generate Voiceover TTS
  const handleGenerateVoiceover = async () => {
    setIsGeneratingVoice(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceText,
          voice: selectedVoice,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setVoiceAudioUrl(data.audioUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate AI voiceover');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // 4. Generate Viral Metadata
  const handleGenerateMeta = async () => {
    setIsGeneratingMeta(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/viral-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSummary: metaPrompt,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMetaResult(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate viral suggestions');
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-[#0F1118] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141824] border-b border-[#232838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Zyvox AI Creative Studio</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400">Next-gen AI tools for video ideation, subtitles and voice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2336] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[#090A0F] border-b border-[#1C202C] px-3">
          {[
            { id: 'story', label: 'Story-to-Scenes', icon: Wand2 },
            { id: 'captions', label: 'Auto Captions', icon: Type },
            { id: 'voiceover', label: 'AI Voiceover', icon: Volume2 },
            { id: 'metadata', label: 'Viral Titles', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: STORY-TO-SCENES */}
          {activeTab === 'story' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Video Topic or Story Idea</label>
                <textarea
                  rows={2}
                  value={storyPrompt}
                  onChange={(e) => setStoryPrompt(e.target.value)}
                  className="w-full bg-[#171B28] border border-[#262D42] focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  placeholder="e.g. 5 Morning Habits of High Achievers, or Cinematic Travel Vlog to Tokyo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Language</label>
                  <select
                    value={storyLanguage}
                    onChange={(e) => setStoryLanguage(e.target.value as any)}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="en">English (Global)</option>
                    <option value="hi">Hindi (हिंदी Unicode)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Duration</label>
                  <select
                    value={storyDuration}
                    onChange={(e) => setStoryDuration(parseInt(e.target.value))}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="15">15 Seconds (Shorts/Reels)</option>
                    <option value="25">25 Seconds (Standard Story)</option>
                    <option value="45">45 Seconds (In-Depth)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateStory}
                disabled={isGeneratingStory}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing & Directing Scenes...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-cyan-200" />
                    <span>Generate Video Storyboard</span>
                  </>
                )}
              </button>

              {storyResult && (
                <div className="mt-2 flex flex-col gap-3 p-3 bg-[#131622] rounded-xl border border-[#232838]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{storyResult.title}</h4>
                      <p className="text-[11px] text-purple-300">Hook: "{storyResult.hook}"</p>
                    </div>
                    <button
                      onClick={() => {
                        onApplyScenesToTimeline(storyResult.scenes);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Apply to Timeline</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    {storyResult.scenes.map((scene, i) => (
                      <div key={i} className="p-2.5 bg-[#181C2B] rounded-lg border border-[#262D42] flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">Scene {i + 1}: {scene.title}</span>
                          <span className="font-mono text-cyan-400">{scene.durationSeconds}s</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">Visual: {scene.visualDescription}</p>
                        <p className="text-[11px] text-amber-300 font-medium">Text Overlay: "{scene.onScreenText}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTO CAPTIONS */}
          {activeTab === 'captions' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Script or Spoken Voiceover Text</label>
                <textarea
                  rows={3}
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="w-full bg-[#171B28] border border-[#262D42] focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  placeholder="Paste your video dialogue or topic here to generate perfectly timed subtitles..."
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subtitle Language</label>
                  <select
                    value={captionLanguage}
                    onChange={(e) => setCaptionLanguage(e.target.value as any)}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="en">English Captions</option>
                    <option value="hi">Hindi Subtitles (हिंदी)</option>
                  </select>
                </div>

                <div className="pt-5">
                  <button
                    onClick={handleGenerateCaptions}
                    disabled={isGeneratingCaptions}
                    className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingCaptions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
                    <span>Generate Captions</span>
                  </button>
                </div>
              </div>

              {captionsResult.length > 0 && (
                <div className="mt-2 flex flex-col gap-2.5 p-3 bg-[#131622] rounded-xl border border-[#232838]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Generated {captionsResult.length} Subtitle Cards
                    </span>
                    <button
                      onClick={() => {
                        onAddCaptionsToTimeline(captionsResult);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Text Track</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {captionsResult.map((c, i) => (
                      <div key={i} className="p-2 bg-[#181C2B] rounded-lg border border-[#262D42] flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium">{c.text}</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {c.start}s - {c.end}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI VOICEOVER TTS */}
          {activeTab === 'voiceover' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Narration Script (TTS)</label>
                <textarea
                  rows={3}
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  className="w-full bg-[#171B28] border border-[#262D42] focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  placeholder="Enter text to speak..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">AI Voice Persona</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Kore', label: 'Kore (Energetic)', gender: 'Female' },
                    { id: 'Puck', label: 'Puck (Playful)', gender: 'Male' },
                    { id: 'Fenrir', label: 'Fenrir (Deep)', gender: 'Male' },
                    { id: 'Zephyr', label: 'Zephyr (Smooth)', gender: 'Female' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id as any)}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        selectedVoice === v.id
                          ? 'bg-purple-600 border-purple-500 text-white font-bold shadow'
                          : 'bg-[#171B28] border-[#262D42] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{v.label}</span>
                      <span className="text-[9px] opacity-70 font-normal">{v.gender}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateVoiceover}
                disabled={isGeneratingVoice}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingVoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Voiceover Audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-200" />
                    <span>Generate AI Voiceover</span>
                  </>
                )}
              </button>

              {voiceAudioUrl && (
                <div className="p-3 bg-[#131622] rounded-xl border border-[#232838] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!audioRef.current) {
                          audioRef.current = new Audio(voiceAudioUrl);
                          audioRef.current.onended = () => setIsPlayingAudio(false);
                        }
                        if (isPlayingAudio) {
                          audioRef.current.pause();
                          setIsPlayingAudio(false);
                        } else {
                          audioRef.current.play();
                          setIsPlayingAudio(true);
                        }
                      }}
                      className="p-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Voiceover ({selectedVoice})</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Ready to insert</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAddAudioToTimeline(voiceAudioUrl, `AI Voiceover (${selectedVoice})`);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert to Audio Track</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VIRAL METADATA */}
          {activeTab === 'metadata' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Video Content Summary</label>
                <input
                  type="text"
                  value={metaPrompt}
                  onChange={(e) => setMetaPrompt(e.target.value)}
                  className="w-full bg-[#171B28] border border-[#262D42] focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  placeholder="e.g. 3 Quick Tips to Speed up React Video Editing"
                />
              </div>

              <button
                onClick={handleGenerateMeta}
                disabled={isGeneratingMeta}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                <span>Generate Viral Titles & Hashtags</span>
              </button>

              {metaResult && (
                <div className="mt-2 flex flex-col gap-3 p-3 bg-[#131622] rounded-xl border border-[#232838]">
                  <span className="text-xs font-bold text-slate-300">Suggested Catchy Titles</span>
                  <div className="flex flex-col gap-1.5">
                    {metaResult.titles.map((title, i) => (
                      <div key={i} className="p-2 bg-[#181C2B] rounded-lg border border-[#262D42] flex items-center justify-between text-xs">
                        <span className="text-white font-medium">{title}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(title);
                            setCopiedIndex(i);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>

                  <span className="text-xs font-bold text-slate-300 mt-1">Hashtags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {metaResult.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs bg-[#1A1F30] text-cyan-300 px-2 py-0.5 rounded-full border border-[#2B3248]">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
