import React, { useState } from 'react';
import { Project, AspectRatio } from '../types/editor';
import { 
  Play, 
  Sparkles, 
  Plus, 
  Copy, 
  Trash2, 
  Film, 
  Smartphone, 
  Monitor, 
  Square, 
  Layout, 
  Clock, 
  Layers, 
  Sliders, 
  Type, 
  Music, 
  Download, 
  User, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';

interface LandingPageProps {
  projects: Project[];
  activeProjectId: string;
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: (aspectRatio: AspectRatio, name?: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenAIStudio: () => void;
  onOpenAndroidGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  projects,
  activeProjectId,
  onOpenProject,
  onCreateNewProject,
  onDuplicateProject,
  onDeleteProject,
  onOpenAIStudio,
  onOpenAndroidGuide,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('New Video Edit');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    onCreateNewProject(selectedRatio, newProjectName.trim() || 'Untitled Project');
    setShowNewModal(false);
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 flex flex-col select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-[#1A1D28] px-4 sm:px-8 flex items-center justify-between bg-[#0C0E15]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-600/25">
            <div className="w-full h-full bg-[#0C0E15] rounded-[10px] flex items-center justify-center">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400 ml-0.5" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              ZYVOX <span className="text-xs text-purple-400 uppercase tracking-widest font-mono">STUDIO</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAndroidGuide}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#161924] hover:bg-[#202434] border border-[#262C3E] rounded-lg transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android Setup</span>
          </button>

          {/* Account status */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#222738]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#121520] rounded-full flex items-center justify-center text-slate-300 text-xs">
                <User className="w-3.5 h-3.5 text-cyan-300" />
              </div>
            </div>
            <span className="text-xs text-slate-300 hidden md:inline font-medium">Creator Mode</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 py-10 sm:py-14 border-b border-[#1A1D28] overflow-hidden bg-gradient-to-b from-[#10131E] via-[#090A0F] to-[#08090D]">
        {/* Glow ambient background spots */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>CapCut-Style Non-Destructive Video Editing + Gemini AI</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight">
            Next-Gen Video Editing for <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Web & Android</span>
          </h2>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Multi-track timeline, instant frame trimming, Unicode Hindi & English typography, real-time color filters, audio mixing, and AI storyboard generation.
          </p>

          {/* Call to action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                if (projects.length > 0) {
                  onOpenProject(projects[0].id);
                } else {
                  setShowNewModal(true);
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Editing Now</span>
            </button>

            <button
              onClick={onOpenAIStudio}
              className="px-5 py-3 bg-[#151926] hover:bg-[#1E2336] text-cyan-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-[#272E44] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Create AI Video</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area: My Projects */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Projects Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">My Projects</h3>
            <span className="text-xs text-slate-500 font-mono">({projects.length})</span>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Create New Card */}
          <div
            onClick={() => setShowNewModal(true)}
            className="group rounded-2xl border-2 border-dashed border-[#232838] hover:border-purple-500/60 bg-[#0E1018]/50 hover:bg-[#131622] p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all shadow-md">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-slate-200 block">Create Blank Project</span>
              <span className="text-[11px] text-slate-500">Choose custom aspect ratio</span>
            </div>
          </div>

          {/* Project Cards */}
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="group rounded-2xl border border-[#1E2333] hover:border-purple-500/50 bg-[#11131E] overflow-hidden flex flex-col transition-all hover:shadow-xl hover:shadow-purple-950/20"
            >
              {/* Thumbnail with overlay badge */}
              <div
                onClick={() => onOpenProject(proj.id)}
                className="aspect-video relative overflow-hidden bg-black cursor-pointer"
              >
                {proj.thumbnail ? (
                  <img
                    src={proj.thumbnail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-slate-600">
                    <Film className="w-8 h-8 text-purple-500/40" />
                  </div>
                )}

                {/* Aspect ratio badge */}
                <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-[10px] font-mono font-semibold px-2 py-0.5 rounded text-cyan-300 border border-white/10">
                  {proj.aspectRatio}
                </span>

                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded text-slate-200">
                  {proj.duration.toFixed(1)}s
                </span>
              </div>

              {/* Card Details */}
              <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                <div onClick={() => onOpenProject(proj.id)} className="cursor-pointer">
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    {proj.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Edited {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#1C202E] flex items-center justify-between">
                  <button
                    onClick={() => onOpenProject(proj.id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1E2336] transition-colors cursor-pointer"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(proj.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights Section */}
        <section className="mt-8 pt-8 border-t border-[#1A1D28]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 text-center mb-6 font-mono">
            Professional Built-In Capabilities
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Layers,
                title: 'Multi-Track Non-Destructive Editing',
                desc: 'Independent tracks for video, overlays, Hindi/English typography, and audio with frame-accurate splitting and trimming.',
                color: 'text-blue-400',
              },
              {
                icon: Sliders,
                title: 'Real-Time Filters & Color Grading',
                desc: 'Brightness, contrast, saturation, blur, vignette, and speed control running seamlessly on the GPU.',
                color: 'text-purple-400',
              },
              {
                icon: Type,
                title: 'Multilingual Unicode Typography',
                desc: 'Full native support for Hindi (हिंदी Unicode), English, badges, drop shadows, and stroke outlines.',
                color: 'text-amber-400',
              },
              {
                icon: Music,
                title: 'Audio Mixer & Licensed Music',
                desc: 'Fade-in/out, volume gain up to 200%, and built-in royalty-free lofi, cinematic, and vlog background tracks.',
                color: 'text-emerald-400',
              },
              {
                icon: Download,
                title: 'High-Definition Export Engine',
                desc: 'Render MP4 and WebM videos up to 1080p 60 FPS with real frame-by-frame progress and zero waiting queues.',
                color: 'text-cyan-400',
              },
              {
                icon: Sparkles,
                title: 'Integrated Gemini 3.8 AI Assistant',
                desc: 'AI story-to-scenes breakdown, automatic multilingual subtitle timing, voiceover TTS, and viral metadata.',
                color: 'text-fuchsia-400',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0F1118] border border-[#1E2333] flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#161926] text-white">
                      <Icon className={`w-4 h-4 ${f.color}`} />
                    </div>
                    <span className="text-xs font-bold text-white">{f.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* MODAL: CREATE NEW PROJECT */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
          <div className="w-full max-w-md bg-[#0F1118] border border-[#232838] rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="bg-[#171B28] border border-[#262D42] focus:border-purple-500 rounded-lg p-2.5 text-xs text-white outline-none"
                placeholder="My Viral Edit"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Aspect Ratio Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '9:16', name: '9:16 Vertical', desc: 'TikTok, Shorts, Reels', icon: Smartphone },
                  { id: '16:9', name: '16:9 Landscape', desc: 'YouTube, Cinema', icon: Monitor },
                  { id: '1:1', name: '1:1 Square', desc: 'Instagram Post', icon: Square },
                  { id: '4:5', name: '4:5 Portrait', desc: 'Social Feeds', icon: Layout },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = selectedRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedRatio(item.id as any)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isSel
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow'
                          : 'bg-[#171B28] border-[#262D42] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-purple-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
          <div className="w-full max-w-sm bg-[#0F1118] border border-[#232838] rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Delete Project?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this project? This non-destructive edit timeline and all edits will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
