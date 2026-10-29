import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator, 
  StatusBar,
  Alert
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Backend endpoint configured for Cloud Run / Local host
const API_BASE = 'https://ais-dev-l5gguvlhcaiwiqmhancgoy-949116338675.asia-east1.run.app';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [activeTab, setActiveTab] = useState<'clips' | 'text' | 'ai' | 'audio'>('clips');
  const [isExporting, setIsExporting] = useState(false);

  const videoRef = useRef<Video>(null);

  // Request Android Media Permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#08090D" />

      {/* Top Android Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={styles.title}>ZYVOX <Text style={styles.titleSub}>STUDIO</Text></Text>
        </View>

        {/* Aspect Ratio Switcher */}
        <View style={styles.ratioRow}>
          {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
            <TouchableOpacity
              key={ratio}
              onPress={() => setAspectRatio(ratio)}
              style={[styles.ratioButton, aspectRatio === ratio && styles.ratioButtonActive]}
            >
              <Text style={[styles.ratioButtonText, aspectRatio === ratio && styles.ratioButtonTextActive]}>
                {ratio}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Export button */}
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={() => Alert.alert('Export Video', 'Render 1080p MP4 with Zyvox rendering engine?', [
            { text: 'Cancel' },
            { text: 'Start Export', onPress: () => Alert.alert('Success', 'Video saved to Android Gallery!') }
          ])}
        >
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Center Video Preview Monitor */}
      <View style={styles.previewContainer}>
        <View 
          style={[
            styles.videoFrame, 
            { 
              aspectRatio: aspectRatio === '9:16' ? 9 / 16 : aspectRatio === '16:9' ? 16 / 9 : 1,
              width: aspectRatio === '16:9' ? SCREEN_WIDTH - 24 : undefined,
              height: aspectRatio === '9:16' ? '100%' : undefined,
            }
          ]}
        >
          <Video
            ref={videoRef}
            source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.COVER}
            isLooping
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />

          {/* Timecode overlay */}
          <View style={styles.timecodeOverlay}>
            <Text style={styles.timecodeText}>00:{Math.floor(currentTime).toString().padStart(2, '0')}.00</Text>
          </View>
        </View>
      </View>

      {/* Transport Controls */}
      <View style={styles.transportRow}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
          <Text style={styles.playButtonText}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        <View style={styles.scrubberLane}>
          <View style={[styles.scrubberProgress, { width: `${(currentTime / 15) * 100}%` }]} />
        </View>
      </View>

      {/* Bottom Tool Shelf */}
      <View style={styles.bottomShelf}>
        <View style={styles.tabRow}>
          {[
            { id: 'clips', label: 'Clips' },
            { id: 'text', label: 'Text (हिंदी)' },
            { id: 'audio', label: 'Audio' },
            { id: 'ai', label: 'AI Studio' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfScroll}>
          {activeTab === 'clips' && (
            <>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>✂️</Text>
                <Text style={styles.toolCardText}>Split</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>✨</Text>
                <Text style={styles.toolCardText}>Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>⚡</Text>
                <Text style={styles.toolCardText}>Speed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🔄</Text>
                <Text style={styles.toolCardText}>Rotate</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'text' && (
            <>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🔤</Text>
                <Text style={styles.toolCardText}>Add Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🇮🇳</Text>
                <Text style={styles.toolCardText}>हिंदी टाइटल</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🎨</Text>
                <Text style={styles.toolCardText}>Neon Glow</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'ai' && (
            <>
              <TouchableOpacity 
                style={[styles.toolCard, styles.aiCard]}
                onPress={() => Alert.alert('Gemini AI', 'AI Story-to-Scenes breakdown generated via server-side Gemini 3.8')}
              >
                <Text style={styles.toolCardIcon}>🪄</Text>
                <Text style={[styles.toolCardText, { color: '#22d3ee' }]}>AI Story</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toolCard, styles.aiCard]}
                onPress={() => Alert.alert('Auto Captions', 'Generating synchronized multilingual subtitles...')}
              >
                <Text style={styles.toolCardIcon}>💬</Text>
                <Text style={[styles.toolCardText, { color: '#22d3ee' }]}>Captions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toolCard, styles.aiCard]}
                onPress={() => Alert.alert('AI Voiceover', 'Generating TTS audio via gemini-3.8-flash-lite-tts...')}
              >
                <Text style={styles.toolCardIcon}>🎙️</Text>
                <Text style={[styles.toolCardText, { color: '#22d3ee' }]}>Voiceover</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'audio' && (
            <>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🎵</Text>
                <Text style={styles.toolCardText}>Lofi Beat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🔊</Text>
                <Text style={styles.toolCardText}>Whoosh SFX</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolCardIcon}>🎚️</Text>
                <Text style={styles.toolCardText}>Fade Out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08090D',
  },
  header: {
    height: 54,
    backgroundColor: '#0F1118',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  titleSub: {
    color: '#A855F7',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  ratioRow: {
    flexDirection: 'row',
    backgroundColor: '#181C28',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  ratioButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratioButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  ratioButtonText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  ratioButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#22D3EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportText: {
    color: '#090A0F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  videoFrame: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#232838',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  timecodeOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timecodeText: {
    color: '#22D3EE',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0E1017',
    gap: 12,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  scrubberLane: {
    flex: 1,
    height: 6,
    backgroundColor: '#232838',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#22D3EE',
  },
  bottomShelf: {
    height: 140,
    backgroundColor: '#0D0F16',
    borderTopWidth: 1,
    borderTopColor: '#1E2333',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2333',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  tabButtonText: {
    color: '#64748B',
    fontSize: 11,
  },
  tabButtonTextActive: {
    color: '#A855F7',
    fontWeight: 'bold',
  },
  shelfScroll: {
    padding: 12,
    gap: 10,
    flexDirection: 'row',
  },
  toolCard: {
    width: 68,
    height: 68,
    backgroundColor: '#161926',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262D42',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  aiCard: {
    borderColor: '#06B6D4',
    backgroundColor: '#0D2136',
  },
  toolCardIcon: {
    fontSize: 18,
  },
  toolCardText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '500',
  },
});
