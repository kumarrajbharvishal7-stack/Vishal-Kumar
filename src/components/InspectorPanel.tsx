import React from 'react';
import { Clip, Project } from '../types/editor';
import { Language, translations } from '../utils/i18n';
import { 
  Sliders, 
  Type, 
  Volume2, 
  Trash2,
  Clock,
  Scissors,
  Check
} from 'lucide-react';

interface InspectorPanelProps {
  selectedClip: Clip | null;
  project: Project;
  language?: Language;
  onUpdateClip: (updatedClip: Clip) => void;
  onDeleteClip: (clipId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  project,
  language = 'en',
  onUpdateClip,
  onDeleteClip,
}) => {
  const t = translations[language] || translations.en;

  if (!selectedClip) {
    return (
      <aside className="w-full h-full bg-[#0D0F16] border-l border-[#1C202C] p-4 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <div className="w-12 h-12 rounded-full bg-[#151824] flex items-center justify-center mb-3 text-slate-400">
          <Sliders className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">
          {language === 'hi' ? 'कोई क्लिप चुनी नहीं गई' : 'No Clip Selected'}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
          {language === 'hi' 
            ? 'टाइमलाइन पर किसी भी क्लिप पर क्लिक करके ट्रिम, स्प्लिट, टेक्स्ट और फ़िल्टर सेट करें।' 
            : 'Select any clip on the timeline to edit filters, trimming, text formatting, and audio.'}
        </p>
      </aside>
    );
  }

  // Update filter helper
  const handleFilterChange = (key: keyof Clip['filters'], value: number) => {
    onUpdateClip({
      ...selectedClip,
      filters: {
        ...selectedClip.filters,
        [key]: value,
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    onUpdateClip({
      ...selectedClip,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
      },
    });
  };

  // Update text config helper
  const handleTextConfigChange = (key: string, value: any) => {
    if (!selectedClip.textConfig) return;
    onUpdateClip({
      ...selectedClip,
      textConfig: {
        ...selectedClip.textConfig,
        [key]: value,
      },
    });
  };

  // Update transform helper
  const handleTransformChange = (key: keyof Clip['transform'], value: number) => {
    onUpdateClip({
      ...selectedClip,
      transform: {
        ...selectedClip.transform,
        [key]: value,
      },
    });
  };

  return (
    <aside className="w-full h-full bg-[#0D0F16] border-l border-[#1C202C] flex flex-col select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3 bg-[#0A0C13] border-b border-[#1C202C] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono truncate">
            {selectedClip.type} {language === 'hi' ? 'सेटिंग्स' : 'Inspector'}
          </span>
        </div>
        <button
          onClick={() => onDeleteClip(selectedClip.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="Delete Clip"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-5">
        {/* Timing & Precision Trim Controls */}
        <div className="p-2.5 rounded-lg bg-[#141724] border border-[#222738] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#202538]">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'समय और ट्रिम (Timing)' : 'Timing & Trimming'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{language === 'hi' ? 'क्लिप का नाम:' : 'Clip Name:'}</span>
            <input
              type="text"
              value={selectedClip.name}
              onChange={(e) => onUpdateClip({ ...selectedClip, name: e.target.value })}
              className="bg-[#1C2030] text-slate-200 text-xs px-2 py-0.5 rounded border border-[#2C3247] outline-none max-w-[130px] text-right font-sans"
            />
          </div>

          {/* Duration numeric trimmer */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{t.duration}:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0.3"
                value={Number(selectedClip.duration.toFixed(2))}
                onChange={(e) => {
                  const val = Math.max(0.3, parseFloat(e.target.value) || 0.3);
                  onUpdateClip({ ...selectedClip, duration: val });
                }}
                className="w-16 bg-[#1C2030] text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded border border-[#2C3247] outline-none text-right font-semibold"
              />
              <span className="text-slate-500 font-mono text-[10px]">sec</span>
            </div>
          </div>

          {/* Start Time in timeline */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{t.startTime}:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0"
                value={Number(selectedClip.startTime.toFixed(2))}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onUpdateClip({ ...selectedClip, startTime: val });
                }}
                className="w-16 bg-[#1C2030] text-slate-200 font-mono text-xs px-1.5 py-0.5 rounded border border-[#2C3247] outline-none text-right"
              />
              <span className="text-slate-500 font-mono text-[10px]">sec</span>
            </div>
          </div>

          {/* In-point trim offset */}
          {selectedClip.type !== 'text' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{language === 'hi' ? 'कट ऑफसेट (Trim In):' : 'Trim In-Point:'}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number((selectedClip.trimStart || 0).toFixed(2))}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onUpdateClip({ ...selectedClip, trimStart: val });
                  }}
                  className="w-16 bg-[#1C2030] text-slate-300 font-mono text-xs px-1.5 py-0.5 rounded border border-[#2C3247] outline-none text-right"
                />
                <span className="text-slate-500 font-mono text-[10px]">sec</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION: TEXT CONTROLS (IF TEXT CLIP) */}
        {selectedClip.type === 'text' && selectedClip.textConfig && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-[#202538] pb-1">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? 'टेक्स्ट और हिंदी टाइपोग्राफी' : 'Text & Unicode Typography'}</span>
              </span>
            </div>

            {/* Content Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">
                {language === 'hi' ? 'टेक्स्ट सामग्री (हिंदी व अंग्रेजी)' : 'Content (Hindi & English Unicode)'}
              </label>
              <textarea
                rows={2}
                value={selectedClip.textConfig.text}
                onChange={(e) => handleTextConfigChange('text', e.target.value)}
                className="w-full bg-[#141724] border border-[#2B3145] focus:border-purple-500 rounded-lg p-2 text-xs text-white outline-none resize-none font-sans"
                placeholder="यहाँ टेक्स्ट लिखें..."
              />

              {/* Hindi Quick Inserts */}
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {['नया वीडियो', 'सब्सक्राइब करें', 'लाइक 👍', 'वायरल क्लिप', 'शेयर करें ✨'].map((word) => (
                  <button
                    key={word}
                    onClick={() => handleTextConfigChange('text', (selectedClip.textConfig?.text ? selectedClip.textConfig.text + ' ' : '') + word)}
                    className="text-[10px] bg-[#1A1F30] hover:bg-[#252B42] text-amber-300 px-1.5 py-0.5 rounded border border-[#2D344B] cursor-pointer"
                  >
                    +{word}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Alignment */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.fontSize}</span>
                <span className="font-mono text-slate-300">{selectedClip.textConfig.fontSize}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={96}
                value={selectedClip.textConfig.fontSize}
                onChange={(e) => handleTextConfigChange('fontSize', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Font Family */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">{t.font}</label>
              <select
                value={selectedClip.textConfig.fontFamily}
                onChange={(e) => handleTextConfigChange('fontFamily', e.target.value)}
                className="bg-[#141724] border border-[#2B3145] text-xs text-slate-200 p-1.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="Noto Sans Devanagari">Noto Sans Devanagari (हिंदी Unicode)</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Sans)</option>
                <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
              </select>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">{t.position}</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'top', label: t.top },
                  { id: 'middle', label: t.middle },
                  { id: 'bottom', label: t.bottom },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => handleTextConfigChange('position', pos.id)}
                    className={`py-1 text-xs capitalize rounded border transition-colors cursor-pointer ${
                      selectedClip.textConfig?.position === pos.id
                        ? 'bg-purple-600 text-white border-purple-500 font-semibold'
                        : 'bg-[#141724] text-slate-400 border-[#252B3D] hover:bg-[#1D2232]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400">{t.textColor}</label>
                <div className="flex items-center gap-1.5 bg-[#141724] p-1 rounded-lg border border-[#252B3D]">
                  <input
                    type="color"
                    value={selectedClip.textConfig.color || '#ffffff'}
                    onChange={(e) => handleTextConfigChange('color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 uppercase truncate">
                    {selectedClip.textConfig.color}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400">{t.bgColor}</label>
                <div className="flex items-center gap-1.5 bg-[#141724] p-1 rounded-lg border border-[#252B3D]">
                  <input
                    type="color"
                    value={selectedClip.textConfig.backgroundColor?.startsWith('#') ? selectedClip.textConfig.backgroundColor : '#8b5cf6'}
                    onChange={(e) => handleTextConfigChange('backgroundColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <button
                    onClick={() => handleTextConfigChange('backgroundColor', 'transparent')}
                    className="text-[9px] text-slate-400 hover:text-white px-1 py-0.5 rounded bg-[#1F2538]"
                    title="Transparent"
                  >
                    None
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: FILTERS & COLOR GRADING (FOR VIDEO & IMAGE) */}
        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-[#202538] pb-1">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.filters}</span>
              </span>
              <button
                onClick={resetFilters}
                className="text-[10px] text-purple-400 hover:text-purple-300 cursor-pointer font-normal"
              >
                {t.reset}
              </button>
            </div>

            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.brightness}</span>
                <span className="font-mono text-slate-300">{selectedClip.filters.brightness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={selectedClip.filters.brightness}
                onChange={(e) => handleFilterChange('brightness', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.contrast}</span>
                <span className="font-mono text-slate-300">{selectedClip.filters.contrast}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={selectedClip.filters.contrast}
                onChange={(e) => handleFilterChange('contrast', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.saturation}</span>
                <span className="font-mono text-slate-300">{selectedClip.filters.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={selectedClip.filters.saturation}
                onChange={(e) => handleFilterChange('saturation', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Vignette */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.vignette}</span>
                <span className="font-mono text-slate-300">{selectedClip.filters.vignette}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedClip.filters.vignette}
                onChange={(e) => handleFilterChange('vignette', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Speed & Playback */}
            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[11px] text-slate-400">{t.speed}</label>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onUpdateClip({ ...selectedClip, speed: spd })}
                    className={`py-1 text-xs rounded border transition-colors cursor-pointer ${
                      selectedClip.speed === spd
                        ? 'bg-purple-600 text-white border-purple-500 font-semibold'
                        : 'bg-[#141724] text-slate-400 border-[#252B3D] hover:bg-[#1D2232]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scale and Rotation */}
            <div className="flex flex-col gap-2 mt-1">
              <label className="text-[11px] text-slate-400">{language === 'hi' ? 'ज़ूम और रोटेशन (Transform)' : 'Transform & Scale'}</label>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Scale</span>
                <span className="font-mono text-slate-300">{selectedClip.transform.scale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={selectedClip.transform.scale}
                onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Rotation</span>
                <span className="font-mono text-slate-300">{selectedClip.transform.rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selectedClip.transform.rotation}
                onChange={(e) => handleTransformChange('rotation', parseInt(e.target.value))}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* SECTION: AUDIO CONTROLS (IF AUDIO OR VIDEO) */}
        {(selectedClip.type === 'audio' || selectedClip.type === 'video') && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-[#202538] pb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.audio}</span>
              </span>
            </div>

            {/* Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.volume}</span>
                <span className="font-mono text-slate-300">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={selectedClip.volume ?? 1}
                onChange={(e) => onUpdateClip({ ...selectedClip, volume: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Fade In & Fade Out */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Fade In</span>
                  <span className="font-mono text-slate-300">{(selectedClip.fadeIn ?? 0.5).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={selectedClip.fadeIn ?? 0.5}
                  onChange={(e) => onUpdateClip({ ...selectedClip, fadeIn: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Fade Out</span>
                  <span className="font-mono text-slate-300">{(selectedClip.fadeOut ?? 0.5).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={selectedClip.fadeOut ?? 0.5}
                  onChange={(e) => onUpdateClip({ ...selectedClip, fadeOut: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#232736] rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
