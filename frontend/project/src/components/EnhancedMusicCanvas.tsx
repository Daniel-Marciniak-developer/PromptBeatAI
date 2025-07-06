import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Eye, Radio, Zap } from 'lucide-react';
import RealAudioPlayer, { RealAudioPlayerRef } from './RealAudioPlayer';
// import RealAudioVisualizer from './RealAudioVisualizer'; // Commented out - using only LoopmakerVisualizer
import LoopmakerVisualizer from './LoopmakerVisualizer';
import { FloatingMusicIcons, RotatingMusicIcons } from './MusicIcons';
import { VisualSong } from '../types/LoopmakerTypes';
import { loadSongFromJSON, LoopmakerParser } from '../utils/LoopmakerParser';

interface EnhancedMusicCanvasProps {
  isGenerating: boolean;
  audioSrc?: string;
  songDataSrc?: string;
  title?: string;
  artist?: string;
  bpm?: number;
  onShare?: () => void;
  onDownload?: (format: string, quality: string) => void;
  onAddToFavorites?: () => void;
  isFavorite?: boolean;
  autoPlay?: boolean;
}

const EnhancedMusicCanvas: React.FC<EnhancedMusicCanvasProps> = ({
  isGenerating,
  audioSrc = "/beat-freestyle.mp3",
  songDataSrc = "/beat-freestyle.json",
  title = "Beat for Freestyle",
  artist = "PromptBeat AI",
  bpm = 128,
  onShare,
  onDownload,
  onAddToFavorites,
  isFavorite = false,
  autoPlay = false
}) => {


  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(256));
  const [isPlaying, setIsPlaying] = useState(false);
  // Fixed to pianoRoll only - waveform commented out
  const visualizerType = 'pianoRoll' as const;
  const [showSettings, setShowSettings] = useState(false);
  const [visualSong, setVisualSong] = useState<VisualSong | null>(null);
  const [parser, setParser] = useState<LoopmakerParser | null>(null);
  const [volume, setVolume] = useState(80);
  const [showCentralPlay, setShowCentralPlay] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [audioPlayerRef, setAudioPlayerRef] = useState<RealAudioPlayerRef | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'wav' | 'flac'>('mp3');
  const [downloadQuality, setDownloadQuality] = useState<'128' | '192' | '320' | 'lossless'>('320');

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time);
    // Use audio duration if valid, otherwise fallback to song data duration
    if (isFinite(dur) && dur > 0) {
      setDuration(dur);
    } else if (visualSong && isFinite(visualSong.duration) && visualSong.duration > 0) {
      setDuration(visualSong.duration);
    }
  }, [visualSong]);

  const handleFrequencyData = useCallback((data: Uint8Array) => {
    setFrequencyData(data);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioPlayerRef) {
      audioPlayerRef.togglePlayPause();
    }
  }, [audioPlayerRef]);

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const handleAddToFavorites = () => {
    if (onAddToFavorites) {
      onAddToFavorites();
    }
  };

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  const handleDownloadConfirm = () => {
    if (onDownload) {
      onDownload(downloadFormat, downloadQuality);
    }

    // Add to downloads history
    const downloadItem = {
      id: Date.now().toString(),
      projectId: Date.now().toString(),
      projectName: title,
      fileName: `${title.replace(/\s+/g, '_')}.${downloadFormat}`,
      format: downloadFormat,
      quality: downloadQuality === 'lossless' ? 'Lossless' : `${downloadQuality} kbps`,
      size: Math.floor(Math.random() * 10000000) + 5000000, // Simulate file size
      downloadedAt: new Date(),
      status: 'completed' as const,
      url: audioSrc,
      duration: Math.floor(duration)
    };

    const downloads = JSON.parse(localStorage.getItem('promptbeat-downloads') || '[]');
    downloads.unshift(downloadItem);
    localStorage.setItem('promptbeat-downloads', JSON.stringify(downloads.slice(0, 50))); // Keep only 50 items

    setShowDownloadModal(false);
  };

  // Update volume when audioPlayerRef changes
  const updateVolume = useCallback((newVolume: number) => {
    // Validate volume range
    const clampedVolume = Math.max(0, Math.min(100, newVolume));

    setVolume(clampedVolume);

    // Update audio player volume if available
    if (audioPlayerRef && typeof audioPlayerRef.setVolume === 'function') {
      audioPlayerRef.setVolume(clampedVolume); // RealAudioPlayer expects 0-100 range
    }
  }, [audioPlayerRef]);

  const handleSeek = useCallback((time: number) => {
    if (audioPlayerRef) {
      audioPlayerRef.seekTo(time);
    }
  }, [audioPlayerRef]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Handle canvas click for scrubbing
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;
    setCurrentTime(newTime);
  }, [duration]);

  const handleScrub = useCallback((e: any) => {
    // Handle scrubber drag
    const progress = e.point.x / e.target.getBoundingClientRect().width;
    const newTime = progress * duration;
    setCurrentTime(newTime);
  }, [duration]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;
    if (audioPlayerRef) {
      audioPlayerRef.seekTo(newTime);
    }
  }, [duration, audioPlayerRef]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;
    setHoverTime(newTime);
  }, [duration]);

  // Get all tracks from visual song, merging notes from loop repetitions
  const getAllTracks = useCallback(() => {
    if (!visualSong) return [];

    const trackMap = new Map<string, any>();
    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        // Extract base track name (remove global step offset suffix)
        const baseTrackId = track.id.split('_').slice(0, -1).join('_') || track.id;

        if (!trackMap.has(baseTrackId)) {
          // Create new track with base ID
          trackMap.set(baseTrackId, {
            ...track,
            id: baseTrackId,
            notes: [...track.notes] // Copy notes array
          });
        } else {
          // Merge notes from this loop repetition into existing track
          const existingTrack = trackMap.get(baseTrackId)!;
          existingTrack.notes = [...existingTrack.notes, ...track.notes];
        }
      }
    }
    return Array.from(trackMap.values());
  }, [visualSong]);

  // Check if track has currently active notes with master timeline sync
  const hasActiveNotes = useCallback((track: any) => {
    if (!track || !parser || !visualSong || !isFinite(currentTime)) return false;

    // Use parser's getNotesAtTime method with master duration (audio duration)
    const activeNotes = parser.getNotesAtTime(visualSong, currentTime, duration);

    // Check if any active note belongs to this track (use base track ID)
    const baseTrackId = track.id.split('_').slice(0, -1).join('_') || track.id;
    return activeNotes.some(note => {
      const noteBaseTrackId = note.trackId.split('_').slice(0, -1).join('_') || note.trackId;
      return noteBaseTrackId === baseTrackId || note.trackId === track.id;
    });
  }, [currentTime, parser, visualSong, duration]);

  // Helper function to clean track names
  const getCleanTrackName = useCallback((trackName: string): string => {
    if (!trackName) return 'Unknown Track';

    // Usuń ścieżkę - obsłuż zarówno / jak i \ oraz mieszane ścieżki
    let fileName = trackName;

    // Znajdź ostatni separator ścieżki
    const lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
    if (lastSlash !== -1) {
      fileName = fileName.substring(lastSlash + 1);
    }

    // Usuń rozszerzenie pliku
    const nameWithoutExt = fileName.replace(/\.(wav|mp3|ogg|flac|aiff|m4a)$/i, '');

    // Jeśli nazwa jest pusta po czyszczeniu, użyj oryginalnej
    if (!nameWithoutExt.trim()) {
      return trackName;
    }

    // Kapitalizuj pierwszą literę i zamień podkreślenia/myślniki na spacje
    const cleanName = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .trim();

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }, []);

  // Get tracks from visual song
  const tracks = visualSong ? visualSong.loops.flatMap(loop => loop.tracks) : [];

  // Load song data
  useEffect(() => {
    const loadSongData = async () => {
      try {
        const songData = await loadSongFromJSON(songDataSrc);
        setVisualSong(songData);

        // Create parser for real-time analysis - tylko jeśli nie jest blob URL
        if (!songDataSrc.startsWith('blob:')) {
          const response = await fetch(songDataSrc);
          const rawSongData = await response.json();
          const newParser = new LoopmakerParser(rawSongData);
          setParser(newParser);
        } else {
          // Dla blob URL, użyj songData bezpośrednio
          const newParser = new LoopmakerParser(songData);
          setParser(newParser);
        }



        // Set duration from song data if audio duration is not available
        if (!isFinite(duration) || duration <= 0) {
          setDuration(songData.duration);
        }
      } catch (error) {
        console.error('Failed to load song data:', error);
        // Fallback to basic visualization
        setVisualSong(null);
        setParser(null);
      }
    };

    if (songDataSrc) {
      loadSongData();
    }
  }, [songDataSrc]);

  // Set initial volume when audioPlayerRef is available (only once)
  useEffect(() => {
    if (audioPlayerRef) {
      audioPlayerRef.setVolume(volume);

      // Auto-play if enabled
      if (autoPlay && !isGenerating) {
        setTimeout(() => {
          audioPlayerRef.togglePlayPause();
        }, 500); // Small delay to ensure audio is loaded
      }
    }
  }, [audioPlayerRef, autoPlay, isGenerating]); // Remove volume dependency to avoid loops

  // Create fallback audio src when backend is not available
  const [effectiveAudioSrc, setEffectiveAudioSrc] = useState(audioSrc);

  useEffect(() => {
    const testAndSetAudioSrc = async () => {
      try {


        // If it's a backend URL, test if it's accessible
        if (audioSrc.includes('localhost:8000') || audioSrc.includes('http')) {
          try {
            // Try HEAD request first
            const response = await fetch(audioSrc, { method: 'HEAD' });
            if (response.ok) {

              setEffectiveAudioSrc(audioSrc);
              return;
            }
          } catch (headError) {

          }

          // If HEAD fails, try a range request to test accessibility
          try {
            const response = await fetch(audioSrc, {
              method: 'GET',
              headers: { 'Range': 'bytes=0-1' }
            });
            if (response.ok || response.status === 206) {

              setEffectiveAudioSrc(audioSrc);
              return;
            }
          } catch (rangeError) {

          }

          // If both fail, throw error to trigger fallback
          throw new Error('Backend audio not accessible');
        } else {
          // Local file, use as is
          setEffectiveAudioSrc(audioSrc);
        }
      } catch (error) {
        console.warn('❌ Backend audio not accessible, falling back to local file:', error);
        // Fallback to local file only if it's not already a local file
        if (audioSrc.includes('localhost:8000') || audioSrc.includes('http')) {
          setEffectiveAudioSrc('/beat-freestyle.mp3');
        } else {
          setEffectiveAudioSrc(audioSrc);
        }
      }
    };

    if (audioSrc) {
      testAndSetAudioSrc();
    }
  }, [audioSrc]);

  // Commented out waveform for now - keeping only piano roll
  // const visualizerTypes = [
  //   { type: 'pianoRoll' as const, icon: Music2, label: 'Piano Roll' },
  //   { type: 'waveform' as const, icon: BarChart3, label: 'Waveform' }
  // ];

  return (
    <motion.section
      className="w-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="relative bg-glass backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden w-full h-[87vh] min-h-[820px] shadow-2xl pb-2">
        {/* Single Unified Tablet Panel - All elements integrated */}
        <div className="relative w-full h-full flex flex-col">

          {/* Top Header Bar - Integrated in main panel */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4">
            <div className="flex items-center justify-between">
              {/* Track Info with BPM */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                  <div className="flex items-center gap-2">
                    <RotatingMusicIcons.Disc
                      size={14}
                      color="#a855f7"
                      speed={isPlaying ? (bpm / 60) : 0}
                    />
                    <div>
                      <div className="text-white font-semibold text-sm">{title}</div>
                      <div className="text-white/60 text-xs">{artist}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Controls */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Share Button */}
                <motion.button
                  onClick={handleShare}
                  className="flex items-center gap-1 px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-all text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Share"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </motion.button>

                {/* Add to Favorites Button */}
                <motion.button
                  onClick={handleAddToFavorites}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all text-xs ${
                    isFavorite
                      ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border-pink-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white/60 border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <svg className="w-3 h-3" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </motion.button>

                {/* Download Button */}
                <motion.button
                  onClick={handleDownloadClick}
                  className="flex items-center gap-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Download"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* Main Visualizer Content - Full height with padding for top overlay only */}
          <div className="relative w-full h-full pt-20">
            {/* Only Piano Roll Visualizer - Waveform commented out */}
            <LoopmakerVisualizer
              visualSong={visualSong}
              currentTime={currentTime}
              isPlaying={isPlaying}
              className="h-full"
              onSeek={handleSeek}
              duration={duration}
              volume={volume}
              onPlayPause={togglePlayPause}
              onVolumeChange={updateVolume}

            />
          </div>



          {/* Generation Loading Overlay */}
          {isGenerating && (
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-white font-medium">Generating your music...</p>
                <p className="text-white/60 text-sm mt-1">This may take a few moments</p>
              </div>
            </motion.div>
          )}

          {/* Floating music icons around the canvas */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <FloatingMusicIcons.Piano
              color="#a855f7"
              size={14}
              delay={0}
              duration={4}
              className="top-[20%] left-[10%]"
            />
            <FloatingMusicIcons.Guitar
              color="#ef4444"
              size={12}
              delay={1}
              duration={3.5}
              className="top-[60%] right-[15%]"
            />
            <FloatingMusicIcons.Drum
              color="#06b6d4"
              size={16}
              delay={2}
              duration={4.5}
              className="bottom-[30%] left-[20%]"
            />
            <FloatingMusicIcons.Mic
              color="#f59e0b"
              size={13}
              delay={0.5}
              duration={3.8}
              className="top-[40%] right-[25%]"
            />
            <FloatingMusicIcons.Music
              color="#10b981"
              size={15}
              delay={1.5}
              duration={4.2}
              className="bottom-[50%] right-[10%]"
            />
          </div>
        </div>
        {/* Integrated UI Elements - All within main panel */}

        {/* Hidden Audio Player for Real Functionality */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
          <RealAudioPlayer
            audioSrc={effectiveAudioSrc}
            title={title}
            artist={artist}
            onTimeUpdate={handleTimeUpdate}
            onFrequencyData={handleFrequencyData}
            onPlayStateChange={handlePlayStateChange}
            ref={setAudioPlayerRef}
          />
        </div>
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDownloadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Download Audio</h3>
                      <p className="text-white/60 text-sm">{title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-white/80 font-medium mb-2">Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mp3', 'wav', 'flac'] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setDownloadFormat(format)}
                          className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                            downloadFormat === format
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Selection */}
                  <div>
                    <label className="block text-white/80 font-medium mb-2">Quality</label>
                    <div className="grid grid-cols-2 gap-2">
                      {downloadFormat === 'flac' ? (
                        <button
                          onClick={() => setDownloadQuality('lossless')}
                          className="col-span-2 p-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium"
                        >
                          Lossless
                        </button>
                      ) : (
                        (['128', '192', '320'] as const).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => setDownloadQuality(quality)}
                            className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                              downloadQuality === quality
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {quality} kbps
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="text-xs text-white/60 space-y-1">
                      <div className="flex justify-between">
                        <span>File name:</span>
                        <span className="text-white/80">{title.replace(/\s+/g, '_')}.{downloadFormat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated size:</span>
                        <span className="text-white/80">
                          {downloadFormat === 'flac' ? '~25 MB' :
                           downloadQuality === '320' ? '~8 MB' :
                           downloadQuality === '192' ? '~5 MB' : '~3 MB'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowDownloadModal(false)}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDownloadConfirm}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default EnhancedMusicCanvas;
