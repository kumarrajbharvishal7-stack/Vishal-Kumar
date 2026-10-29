import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface AndroidBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBuildModal: React.FC<AndroidBuildModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hindi' | 'eas' | 'gradle' | 'pwa'>('hindi');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const easCommand = `# 1. Android Directory me jayein
cd android

# 2. EAS CLI install karein
npm install -g eas-cli

# 3. Expo account me login karein (Free account)
eas login

# 4. Standalone signed Release APK generate karein (Cloud build - kisi Android Studio ki zarurat nahi)
eas build --platform android --profile preview`;

  const gradleCommand = `# 1. Android native project me jayein
cd android

# 2. Automated release build script run karein (signed APK generate karega)
./build-apk.sh

# Output APK path:
# android/native-project/app/build/outputs/apk/release/app-release.apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-[#0F1118] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141824] border-b border-[#232838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Zyvox AI Studio - Android APK Build</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  v1.0.0
                </span>
              </h3>
              <p className="text-xs text-slate-400">Package: com.zyvox.aistudio | SDK 34 | Signed Release</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2336] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-[#090A0F] border-b border-[#1C202C] px-3 overflow-x-auto">
          {[
            { id: 'hindi', label: '1. हिंदी निर्देश (Hindi Guide)' },
            { id: 'eas', label: '2. 1-Click EAS Cloud APK' },
            { id: 'gradle', label: '3. Gradle Android Studio' },
            { id: 'pwa', label: '4. Instant WebAPK / PWA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 sm:px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs text-slate-300">
          {/* TAB 1: HINDI GUIDE */}
          {activeTab === 'hindi' && (
            <div className="flex flex-col gap-3.5">
              <div className="p-3.5 bg-[#141824] rounded-xl border border-emerald-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Android फ़ोन पर ऐप इंस्टॉल करने के सरल निर्देश</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Zyvox AI Studio का Android पैकेज <strong className="text-white">com.zyvox.aistudio</strong> नाम से पूर्ण रूप से कॉन्फ़िगर है। नीचे दिए गए 3 आसान तरीकों से आप इसे अपने मोबाइल पर चला सकते हैं:
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-white text-xs">तरीका 1: डायरेक्ट PWA / WebAPK (सबसे तेज, बिना किसी डाउनलोड के)</span>
                <ol className="list-decimal pl-5 flex flex-col gap-1 text-slate-400 text-[11px]">
                  <li>अपने Android फ़ोन के Google Chrome ब्राउज़र में इस वेबसाइट को खोलें।</li>
                  <li>ऊपर दाईं ओर दिए गए तीन बिंदुओं (<strong className="text-white">⋮</strong>) पर टैप करें।</li>
                  <li><strong className="text-emerald-400">"Install app"</strong> या <strong className="text-emerald-400">"Add to Home screen"</strong> चुनें।</li>
                  <li>ऐप आपके फ़ोन की होम स्क्रीन पर एक नेटिव एंड्रॉइड ऐप की तरह इंस्टॉल हो जाएगा।</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#1E2333]">
                <span className="font-bold text-white text-xs">तरीका 2: Standalone .APK फाइल बनाना और इंस्टॉल करना</span>
                <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-slate-400 text-[11px]">
                  <li>
                    कंप्यूटर या टर्मिनल में <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">cd android && eas build --platform android --profile preview</code> चलाएं।
                  </li>
                  <li>Expo Cloud बिल्ड पूरा होने पर आपको डायरेक्ट <strong className="text-white">.apk डाउनलोड लिंक</strong> और QR कोड मिल जाएगा।</li>
                  <li>लिंक पर क्लिक करके अपने फोन में APK डाउनलोड करें।</li>
                  <li>फ़ाइल पर क्लिक करें। यदि फ़ोन पूछे: <strong className="text-amber-300">"Allow installation from unknown sources"</strong>, तो उसे <strong className="text-emerald-400">Allow / अनुमति दें</strong> पर सेट करें।</li>
                  <li><strong className="text-white">"Install"</strong> पर टैप करें और ऐप खोलकर वीडियो एडिट करना शुरू करें!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: EAS BUILD */}
          {activeTab === 'eas' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#141824] rounded-xl border border-[#232838] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>EAS Cloud Build (No Android Studio Needed)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(easCommand, 'eas')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedKey === 'eas' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'eas' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  This compiles a standalone signed installable Android APK on Expo's cloud build servers.
                </p>
              </div>

              <pre className="p-3 bg-[#0A0C13] border border-[#212638] rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {easCommand}
              </pre>

              <div className="p-3 bg-[#131622] rounded-xl border border-[#232838] text-[11px] text-slate-400 flex flex-col gap-1">
                <span className="font-semibold text-slate-200">Pre-configured files:</span>
                <span>• Configuration: <code className="text-purple-300">/android/eas.json</code></span>
                <span>• App Manifest: <code className="text-purple-300">/android/app.json</code></span>
                <span>• React Native Client: <code className="text-purple-300">/android/App.tsx</code></span>
              </div>
            </div>
          )}

          {/* TAB 3: GRADLE / ANDROID STUDIO */}
          {activeTab === 'gradle' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#141824] rounded-xl border border-[#232838] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Native Android Studio / Gradle Project</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(gradleCommand, 'gradle')}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedKey === 'gradle' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'gradle' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Complete native project located in <code className="text-purple-300">/android/native-project</code>. You can open this folder directly in Android Studio.
                </p>
              </div>

              <pre className="p-3 bg-[#0A0C13] border border-[#212638] rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {gradleCommand}
              </pre>

              <div className="p-3 bg-[#131622] rounded-xl border border-[#232838] text-[11px] text-slate-400 flex flex-col gap-1">
                <span className="font-semibold text-slate-200">Native Android Structure:</span>
                <span>• <code className="text-cyan-300">MainActivity.java</code>: Hardware-accelerated WebView + HTML5 file chooser for videos/audio</span>
                <span>• <code className="text-cyan-300">AndroidManifest.xml</code>: Configured with <code className="text-purple-300">READ_MEDIA_VIDEO</code>, <code className="text-purple-300">CAMERA</code>, <code className="text-purple-300">RECORD_AUDIO</code></span>
                <span>• <code className="text-cyan-300">build.gradle</code>: Release signing configuration with secure environment variable keystore</span>
              </div>
            </div>
          )}

          {/* TAB 4: PWA / WEBAPK */}
          {activeTab === 'pwa' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 bg-[#141824] rounded-xl border border-[#232838] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Immediate Zero-Config Testing on Any Android Device</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Zyvox AI Studio is equipped with a Web App Manifest (<code className="text-purple-300">/public/manifest.json</code>), touch-optimized multi-track timeline, and hardware GPU rendering that Google Chrome on Android compiles into a verified WebAPK directly on the device.
                </p>
              </div>

              <div className="p-3 bg-[#131622] rounded-xl border border-[#232838] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Live Production App URL</span>
                  <span className="text-[10px] text-slate-400 font-mono">Open in mobile Chrome to install</span>
                </div>
                <a
                  href="https://ais-dev-l5gguvlhcaiwiqmhancgoy-949116338675.asia-east1.run.app"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <span>Open URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#141824] border-t border-[#232838] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ready for Android Deployment</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1A1F30] hover:bg-[#252B42] rounded-xl transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
