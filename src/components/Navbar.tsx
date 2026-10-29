import React, { useRef } from 'react';
import { Project, AspectRatio } from '../types/editor';
import { Language, translations } from '../utils/i18n';
import { 
  Play, 
  Sparkles, 
  Download, 
  Undo2, 
  Redo2, 
  Layout, 
  Smartphone, 
  Monitor, 
  Square, 
  FolderOpen,
  Layers,
  Upload,
  Languages
} from 'lucide-react';

interface NavbarProps {
  project: Project;
  language?: Language;
  onToggleLanguage?: () => void;
  onUpdateProjectName: (name: string) => void;
  onUpdateAspectRatio: (ratio: AspectRatio) => void;
  onUploadMedia: (files: FileList) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenAIModal: () => void;
  onOpenExportModal: () => void;
  onOpenProjectsDashboard: () => void;
  onOpenAndroidModal: () => void;
  isMobileShelfOpen: boolean;
  onToggleMobileShelf: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  language = 'en',
  onToggleLanguage,
  onUpdateProjectName,
  onUpdateAspectRatio,
  onUploadMedia,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenAIModal,
  onOpenExportModal,
  onOpenProjectsDashboard,
  onOpenAndroidModal,
  isMobileShelfOpen,
  onToggleMobileShelf,
}) => {
  const t = translations[language] || translations.en;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadMedia(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="h-14 bg-[#0F1117] border-b border-[#232736] px-3 sm:px-4 flex items-center justify-between select-none z-30">
      {/* Hidden file input for quick video upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Brand + Project Switcher + Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Logo */}
        <button
          onClick={onOpenProjectsDashboard}
          title="Return to Projects Dashboard"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0F1117] rounded-[7px] flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 ml-0.5" />
            </div>
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent hidden md:inline">
            ZYVOX <span className="text-xs text-purple-400 uppercase tracking-widest font-mono">STUDIO</span>
          </span>
        </button>

        <div className="h-5 w-px bg-[#232736] hidden sm:block" />

        {/* Projects Dashboard Button */}
        <button
          onClick={onOpenProjectsDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#1A1D27] hover:bg-[#252838] border border-[#2B3042] rounded-md transition-colors cursor-pointer"
          title="All Projects"
        >
          <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">{t.projects}</span>
        </button>

        {/* Quick Upload Video Button in Navbar */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-200 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 hover:border-purple-400 rounded-md transition-all cursor-pointer shadow-sm"
          title="Upload Video or Media"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">{t.uploadVideo}</span>
        </button>

        {/* Editable Project Name */}
        <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[180px]">
          <input
            type="text"
            value={project.name}
            onChange={(e) => onUpdateProjectName(e.target.value)}
            className="bg-transparent hover:bg-[#181B24] focus:bg-[#181B24] text-xs sm:text-sm font-medium text-slate-200 px-2 py-1 rounded border border-transparent focus:border-purple-500/50 outline-none truncate transition-colors w-full"
            placeholder="Untitled Project"
          />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Saved" />
        </div>
      </div>

      {/* Center: Aspect Ratio & Undo/Redo */}
      <div className="hidden lg:flex items-center gap-2 bg-[#151821] p-1 rounded-lg border border-[#232736]">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-[#232736]">
          <button
            onClick={() => onUpdateAspectRatio('9:16')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${
              project.aspectRatio === '9:16'
                ? 'bg-purple-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202433]'
            }`}
            title="9:16 Vertical (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16</span>
          </button>

          <button
            onClick={() => onUpdateAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${
              project.aspectRatio === '16:9'
                ? 'bg-purple-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202433]'
            }`}
            title="16:9 Landscape (YouTube, Cinema)"
          >
            <Monitor className="w-3 h-3" />
            <span>16:9</span>
          </button>

          <button
            onClick={() => onUpdateAspectRatio('1:1')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${
              project.aspectRatio === '1:1'
                ? 'bg-purple-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202433]'
            }`}
            title="1:1 Square (Instagram Feed)"
          >
            <Square className="w-3 h-3" />
            <span>1:1</span>
          </button>

          <button
            onClick={() => onUpdateAspectRatio('4:5')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all cursor-pointer ${
              project.aspectRatio === '4:5'
                ? 'bg-purple-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202433]'
            }`}
            title="4:5 Portrait (Social Post)"
          >
            <Layout className="w-3 h-3" />
            <span>4:5</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'text-slate-300 hover:text-white hover:bg-[#222636] cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'text-slate-300 hover:text-white hover:bg-[#222636] cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Language Switcher + AI Tools + Android Info + Export Button */}
      <div className="flex items-center gap-2">
        {/* Language Toggle (हिन्दी / EN) */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-[#1A1D27] hover:bg-[#252838] border border-[#2B3042] rounded-md transition-colors cursor-pointer"
            title="भाषा बदलें / Toggle Language"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
          </button>
        )}

        {/* Mobile Shelf Toggle */}
        <button
          onClick={onToggleMobileShelf}
          className="md:hidden p-1.5 text-slate-300 bg-[#1A1D27] hover:bg-[#252838] border border-[#2B3042] rounded-md"
          title="Toggle Tools"
        >
          <Layers className="w-4 h-4 text-purple-400" />
        </button>

        {/* Android Guide */}
        <button
          onClick={onOpenAndroidModal}
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs text-slate-300 hover:text-white bg-[#1A1D27] hover:bg-[#252838] border border-[#2B3042] rounded-md transition-colors cursor-pointer"
          title="Android React Native & PWA Setup"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Android APK</span>
        </button>

        {/* AI Studio Assistant Modal Trigger */}
        <button
          onClick={onOpenAIModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-lg shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          title="AI Storyboard, Captions & Voiceover"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
          <span>{t.aiStudio}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-400/20 transition-all cursor-pointer"
          title="Export Video (MP4 / WebM)"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.export}</span>
        </button>
      </div>
    </header>
  );
};
