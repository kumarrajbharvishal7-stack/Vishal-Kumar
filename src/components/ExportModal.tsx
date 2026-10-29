import React, { useState } from 'react';
import { Project, ExportSettings } from '../types/editor';
import { renderProjectVideo, RenderProgress, RenderResult } from '../utils/renderer';
import { 
  X, 
  Download, 
  Film, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Play, 
  Share2, 
  Settings2
} from 'lucide-react';

interface ExportModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    filename: `${project.name.toLowerCase().replace(/\s+/g, '_')}_zyvox`,
    resolution: '1080p',
    fps: 30,
    format: 'mp4',
    quality: 'high',
  });

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsRendering(true);
    setErrorMsg(null);
    setRenderResult(null);

    try {
      const result = await renderProjectVideo(project, settings, (info) => {
        setRenderProgress(info);
      });
      setRenderResult(result);
      setIsRendering(false);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err.message || 'Failed to render video. Please check media availability.');
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderResult) return;
    const a = document.createElement('a');
    a.href = renderResult.url;
    a.download = renderResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-[#0F1118] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141824] border-b border-[#232838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Export Video</h3>
              <p className="text-xs text-slate-400">Render high-definition video with full effects & audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRendering}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2336] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* STATE 1: CONFIGURATION FORM */}
          {!isRendering && !renderResult && (
            <div className="flex flex-col gap-4">
              {/* Filename */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">File Name</label>
                <div className="flex items-center bg-[#171B28] border border-[#262D42] rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={settings.filename}
                    onChange={(e) => setSettings({ ...settings, filename: e.target.value })}
                    className="bg-transparent text-sm text-white outline-none w-full font-medium"
                    placeholder="my_video_export"
                  />
                  <span className="text-xs text-slate-500 font-mono">.{settings.format}</span>
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Resolution</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="1080p">1080p (Full HD - Recommended)</option>
                    <option value="720p">720p (HD Fast)</option>
                    <option value="480p">480p (Small Size)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Frame Rate</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) })}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="30">30 FPS (Standard)</option>
                    <option value="60">60 FPS (Ultra Smooth)</option>
                    <option value="24">24 FPS (Cinematic)</option>
                  </select>
                </div>
              </div>

              {/* Format & Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Output Format</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['mp4', 'webm'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSettings({ ...settings, format: fmt })}
                        className={`py-2 text-xs uppercase font-semibold rounded-lg border transition-all cursor-pointer ${
                          settings.format === fmt
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-[#171B28] border-[#262D42] text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Encoding Quality</label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
                    className="bg-[#171B28] border border-[#262D42] text-xs text-slate-200 p-2.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="high">High Quality (Balanced)</option>
                    <option value="ultra">Ultra Quality (Crisp)</option>
                    <option value="standard">Standard Quality</option>
                  </select>
                </div>
              </div>

              {/* Project summary card */}
              <div className="p-3 bg-[#131622] rounded-xl border border-[#202638] flex items-center justify-between text-xs text-slate-400">
                <div className="flex flex-col">
                  <span className="text-slate-300 font-semibold">{project.name}</span>
                  <span className="font-mono text-[11px]">
                    Aspect: {project.aspectRatio} | Duration: {project.duration.toFixed(1)}s
                  </span>
                </div>
                <span className="text-cyan-400 font-mono font-semibold">
                  {settings.resolution} @ {settings.fps}fps
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: RENDERING PROGRESS */}
          {isRendering && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-purple-900/40" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"
                />
                <span className="text-sm font-bold text-white font-mono">
                  {renderProgress?.progress || 0}%
                </span>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <h4 className="text-sm font-bold text-white">Rendering Video...</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  {renderProgress?.status || 'Processing canvas frames and audio mix'}
                </p>
                {renderProgress?.timeRemaining && (
                  <span className="text-[11px] font-mono text-cyan-300 mt-1">
                    Estimated time remaining: {renderProgress.timeRemaining}
                  </span>
                )}
              </div>

              {/* Linear progress bar */}
              <div className="w-full bg-[#181C2B] h-2 rounded-full overflow-hidden border border-[#252C40] mt-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${renderProgress?.progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* STATE 3: EXPORT COMPLETE WITH IN-APP PREVIEW & DOWNLOAD */}
          {renderResult && (
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Video Rendered Successfully!</span>
              </div>

              {/* In-app preview player */}
              <div className="w-full max-h-64 rounded-xl overflow-hidden bg-black border border-[#232838] flex items-center justify-center shadow-lg">
                <video
                  src={renderResult.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-64 max-w-full"
                />
              </div>

              {/* File details */}
              <div className="w-full p-3 bg-[#131622] rounded-xl border border-[#202638] flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>File: {renderResult.filename}</span>
                <span className="text-cyan-400 font-semibold">
                  {(renderResult.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {/* Download Action Buttons */}
              <div className="w-full flex items-center gap-2 mt-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Video ({renderResult.filename})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141824] border-t border-[#232838] flex items-center justify-end gap-2.5">
          {!isRendering && !renderResult ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#1A1F30] hover:bg-[#242A42] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-400/25 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                <span>Start Render</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              disabled={isRendering}
              className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1A1F30] hover:bg-[#242A42] rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
