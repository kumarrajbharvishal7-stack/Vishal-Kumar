import React, { useState, useRef } from 'react';
import { MediaAsset, Project, Clip } from '../types/editor';
import { STOCK_VIDEOS, STOCK_IMAGES, STOCK_AUDIO, TEXT_PRESETS } from '../data/stockAssets';
import { 
  FolderPlus, 
  Upload, 
  Music, 
  Type, 
  Wand2, 
  Sparkles, 
  Film, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  Plus, 
  Trash2,
  Sliders,
  Flame,
  Volume2
} from 'lucide-react';

interface AssetShelfProps {
  project: Project;
  currentTime: number;
  onAddClipToTimeline: (newClip: Partial<Clip>) => void;
  onOpenAIModal: () => void;
  onApplyFilterPresetToSelected: (filterPreset: string) => void;
  onApplyTransitionToSelected: (transitionType: any) => void;
  selectedClipId: string | null;
}

export const AssetShelf: React.FC<AssetShelfProps> = ({
  project,
  currentTime,
  onAddClipToTimeline,
  onOpenAIModal,
  onApplyFilterPresetToSelected,
  onApplyTransitionToSelected,
  selectedClipId,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'text' | 'effects' | 'ai'>('media');
  const [mediaSubTab, setMediaSubTab] = useState<'uploads' | 'stock-videos' | 'stock-images'>('stock-videos');
  const [userUploads, setUserUploads] = useState<MediaAsset[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      const newAsset: MediaAsset = {
        id: 'upload_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url,
        size: file.size,
      };

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.onloadedmetadata = () => {
          newAsset.duration = vid.duration;
          // Capture first frame thumbnail
          vid.currentTime = 0.5;
          vid.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(vid, 0, 0, 160, 90);
            newAsset.thumbnail = canvas.toDataURL('image/jpeg');
            setUserUploads((prev) => [newAsset, ...prev]);
          };
        };
      } else if (isImage) {
        newAsset.thumbnail = url;
        newAsset.duration = 5;
        setUserUploads((prev) => [newAsset, ...prev]);
      } else if (isAudio) {
        const aud = new Audio(url);
        aud.onloadedmetadata = () => {
          newAsset.duration = aud.duration;
          setUserUploads((prev) => [newAsset, ...prev]);
        };
      }
    });

    setMediaSubTab('uploads');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Audio audition preview toggle
  const togglePlayAudioPreview = (asset: MediaAsset) => {
    if (playingAudioId === asset.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(asset.url);
      audio.onended = () => setPlayingAudioId(null);
      audio.play().catch(() => {});
      audioPreviewRef.current = audio;
      setPlayingAudioId(asset.id);
    }
  };

  // Add Asset to Timeline helper
  const handleAddAsset = (asset: MediaAsset) => {
    let targetTrack = project.tracks.find((t) => t.type === (asset.type === 'image' ? 'video' : asset.type));
    if (!targetTrack) targetTrack = project.tracks[0];

    onAddClipToTimeline({
      trackId: targetTrack.id,
      type: asset.type,
      name: asset.name,
      sourceUrl: asset.url,
      thumbnailUrl: asset.thumbnail,
      startTime: currentTime,
      duration: asset.duration ? Math.min(asset.duration, 10) : 5,
      sourceDuration: asset.duration,
      volume: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
    });
  };

  // Add Text Preset to Timeline
  const handleAddTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    const textTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];
    onAddClipToTimeline({
      trackId: textTrack.id,
      type: 'text',
      name: preset.name,
      sourceUrl: '',
      startTime: currentTime,
      duration: 4,
      volume: 1,
      filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
      transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
      textConfig: {
        text: preset.text,
        fontSize: preset.fontSize,
        fontFamily: preset.fontFamily,
        color: preset.color,
        backgroundColor: preset.backgroundColor,
        outlineColor: preset.outlineColor,
        outlineWidth: preset.outlineWidth,
        shadowColor: preset.shadowColor,
        shadowBlur: preset.shadowBlur,
        align: preset.align,
        position: preset.position,
        isHindi: preset.isHindi,
        boxPadding: 8,
        borderRadius: 8,
      },
    });
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#0D0F16] border-r border-[#1C202C] select-none overflow-hidden">
      {/* Shelf Tab Icons (CapCut Style Icon Bar) */}
      <div className="h-12 bg-[#090A0F] border-b border-[#1C202C] px-2 flex items-center justify-around shrink-0">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1A1D27]'
          }`}
          title="Media Library"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1A1D27]'
          }`}
          title="Music & SFX"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1A1D27]'
          }`}
          title="Text & Titles"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'effects'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1A1D27]'
          }`}
          title="Filters & Transitions"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Effects</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold shadow-sm'
              : 'text-cyan-300 hover:text-white hover:bg-[#1A1D27]'
          }`}
          title="AI Studio Creative Features"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span>AI</span>
        </button>
      </div>

      {/* Shelf Body Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* TAB 1: MEDIA */}
        {activeTab === 'media' && (
          <div className="flex flex-col gap-3">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,image/*,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 border border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/30 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-300 transition-all cursor-pointer group shadow-sm"
            >
              <Upload className="w-4 h-4 text-purple-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>Import Video, Image or Audio</span>
            </button>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-[#141722] p-1 rounded-lg border border-[#202535]">
              <button
                onClick={() => setMediaSubTab('stock-videos')}
                className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer ${
                  mediaSubTab === 'stock-videos' ? 'bg-[#252A3D] text-white font-medium' : 'text-slate-400'
                }`}
              >
                Stock Videos
              </button>
              <button
                onClick={() => setMediaSubTab('stock-images')}
                className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer ${
                  mediaSubTab === 'stock-images' ? 'bg-[#252A3D] text-white font-medium' : 'text-slate-400'
                }`}
              >
                Stock Images
              </button>
              <button
                onClick={() => setMediaSubTab('uploads')}
                className={`flex-1 py-1 text-xs rounded transition-colors cursor-pointer ${
                  mediaSubTab === 'uploads' ? 'bg-[#252A3D] text-white font-medium' : 'text-slate-400'
                }`}
              >
                Uploads ({userUploads.length})
              </button>
            </div>

            {/* Media Items Grid */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {mediaSubTab === 'stock-videos' &&
                STOCK_VIDEOS.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-lg overflow-hidden border border-[#222738] bg-[#141722] hover:border-purple-500/60 transition-all flex flex-col"
                  >
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono px-1 rounded text-slate-300">
                        {item.duration}s
                      </span>
                    </div>
                    <div className="p-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300 truncate">{item.name}</span>
                      <button
                        onClick={() => handleAddAsset(item)}
                        className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors cursor-pointer"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

              {mediaSubTab === 'stock-images' &&
                STOCK_IMAGES.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-lg overflow-hidden border border-[#222738] bg-[#141722] hover:border-purple-500/60 transition-all flex flex-col"
                  >
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300 truncate">{item.name}</span>
                      <button
                        onClick={() => handleAddAsset(item)}
                        className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors cursor-pointer"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

              {mediaSubTab === 'uploads' &&
                (userUploads.length > 0 ? (
                  userUploads.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg overflow-hidden border border-[#222738] bg-[#141722] hover:border-purple-500/60 transition-all flex flex-col"
                    >
                      <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Film className="w-6 h-6 text-slate-600" />
                        )}
                        {item.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono px-1 rounded text-slate-300">
                            {item.duration.toFixed(0)}s
                          </span>
                        )}
                      </div>
                      <div className="p-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300 truncate">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setUserUploads((prev) => prev.filter((p) => p.id !== item.id))}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                            title="Remove File"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleAddAsset(item)}
                            className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white shadow cursor-pointer"
                            title="Add to Timeline"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-500">
                    No files uploaded yet. Click import above to upload media from your device.
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-[#1E2230]">
              <span className="font-semibold text-slate-300">Royalty-Free BGM & SFX</span>
              <span className="text-[10px] text-emerald-400">Licensed / Safe</span>
            </div>

            {STOCK_AUDIO.map((audio) => {
              const isPlaying = playingAudioId === audio.id;
              return (
                <div
                  key={audio.id}
                  className="p-2.5 rounded-lg border border-[#202535] bg-[#121520] hover:border-emerald-500/40 flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      onClick={() => togglePlayAudioPreview(audio)}
                      className={`p-2 rounded-full cursor-pointer transition-colors ${
                        isPlaying ? 'bg-emerald-500 text-slate-900' : 'bg-[#1D2232] text-emerald-400 hover:bg-[#252B40]'
                      }`}
                      title={isPlaying ? 'Pause Audio' : 'Play Audio'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-medium text-slate-200 truncate">{audio.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{audio.duration}s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddAsset(audio)}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    title="Add Track to Timeline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold hidden sm:inline">Add</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: TEXT & TITLES */}
        {activeTab === 'text' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                const textTrack = project.tracks.find((t) => t.type === 'text') || project.tracks[0];
                onAddClipToTimeline({
                  trackId: textTrack.id,
                  type: 'text',
                  name: 'Text Title',
                  sourceUrl: '',
                  startTime: currentTime,
                  duration: 4,
                  volume: 1,
                  filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, vignette: 0 },
                  transform: { scale: 1, positionX: 0, positionY: 0, rotation: 0 },
                  textConfig: {
                    text: 'YOUR TEXT HERE',
                    fontSize: 36,
                    fontFamily: 'Plus Jakarta Sans',
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    align: 'center',
                    position: 'middle',
                    boxPadding: 8,
                    borderRadius: 6,
                  },
                });
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Default Text to Timeline</span>
            </button>

            <span className="text-xs font-semibold text-slate-400 mt-1">Text Style Presets</span>
            <div className="flex flex-col gap-2">
              {TEXT_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddTextPreset(preset)}
                  className="p-3 rounded-lg border border-[#222738] bg-[#121520] hover:border-purple-500/50 hover:bg-[#181C2B] cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-300">{preset.name}</span>
                    <span className="text-sm font-bold text-white drop-shadow-sm font-sans">
                      {preset.text}
                    </span>
                  </div>
                  <button className="p-1.5 rounded-lg bg-[#202538] group-hover:bg-purple-600 text-slate-300 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EFFECTS & FILTERS */}
        {activeTab === 'effects' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-300">Color Grading Presets</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Normal', key: 'normal', color: 'from-slate-700 to-slate-900' },
                { name: 'Cyberpunk', key: 'cyberpunk', color: 'from-cyan-500 to-fuchsia-600' },
                { name: 'Cinematic', key: 'cinematic', color: 'from-amber-700 to-sky-900' },
                { name: 'Moody B&W', key: 'bw', color: 'from-gray-300 to-gray-900' },
                { name: 'Warm Sunset', key: 'warm', color: 'from-rose-500 to-amber-500' },
                { name: 'Vintage 90s', key: 'vintage', color: 'from-yellow-700 to-emerald-900' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => onApplyFilterPresetToSelected(filter.key)}
                  className={`p-2.5 rounded-lg border border-[#242A3D] bg-gradient-to-br ${filter.color} text-white text-xs font-semibold flex items-center justify-center shadow transition-all hover:scale-[1.02] cursor-pointer`}
                  title={`Apply ${filter.name} filter to selected clip`}
                >
                  <span>{filter.name}</span>
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-300 mt-2">Transitions</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Fade In / Out', key: 'fade' },
                { name: 'Cross Dissolve', key: 'dissolve' },
                { name: 'Slide Wipe', key: 'wipe' },
                { name: 'Quick Zoom', key: 'zoom' },
                { name: 'Flash White', key: 'flash' },
                { name: 'None', key: 'none' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => onApplyTransitionToSelected(t.key)}
                  className="p-2 rounded-lg border border-[#242A3D] bg-[#141722] hover:bg-[#1E2333] hover:border-cyan-500/50 text-slate-300 text-xs font-medium text-center transition-all cursor-pointer"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AI STUDIO FEATURES */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>AI Creative Studio</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Supercharge your video with automated scripts, synchronized captions, AI voiceovers, and viral metadata.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenAIModal}
                className="w-full p-3 rounded-lg border border-[#282F45] bg-[#141724] hover:border-purple-500/60 hover:bg-[#1A1F30] text-left flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Story-to-Scenes</h4>
                  <p className="text-[10px] text-slate-400">Generate full video timeline scenes from a prompt</p>
                </div>
              </button>

              <button
                onClick={onOpenAIModal}
                className="w-full p-3 rounded-lg border border-[#282F45] bg-[#141724] hover:border-cyan-500/60 hover:bg-[#1A1F30] text-left flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Auto Subtitles & Captions</h4>
                  <p className="text-[10px] text-slate-400">Timed captions in English and Hindi (हिंदी)</p>
                </div>
              </button>

              <button
                onClick={onOpenAIModal}
                className="w-full p-3 rounded-lg border border-[#282F45] bg-[#141724] hover:border-emerald-500/60 hover:bg-[#1A1F30] text-left flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Voiceover (TTS)</h4>
                  <p className="text-[10px] text-slate-400">Natural voice narration directly to audio track</p>
                </div>
              </button>

              <button
                onClick={onOpenAIModal}
                className="w-full p-3 rounded-lg border border-[#282F45] bg-[#141724] hover:border-amber-500/60 hover:bg-[#1A1F30] text-left flex items-start gap-2.5 transition-all cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Viral Titles & Hashtags</h4>
                  <p className="text-[10px] text-slate-400">High-CTR suggestions for TikTok, Shorts & Reels</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
