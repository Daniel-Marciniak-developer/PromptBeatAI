import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Eye, BarChart3, Radio, Zap, Music2 } from 'lucide-react';
import RealAudioPlayer, { RealAudioPlayerRef } from './RealAudioPlayer';
import RealAudioVisualizer from './RealAudioVisualizer';
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
}

const EnhancedMusicCanvas: React.FC<EnhancedMusicCanvasProps> = ({
  isGenerating,
  audioSrc = "/beat-freestyle.mp3",
  songDataSrc = "/beat-freestyle.json",
  title = "Beat for Freestyle",
  artist = "PromptBeat AI",
  bpm = 128
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(256));
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerType, setVisualizerType] = useState<'waveform' | 'pianoRoll'>('pianoRoll');
  const [showSettings, setShowSettings] = useState(false);
  const [visualSong, setVisualSong] = useState<VisualSong | null>(null);
  const [parser, setParser] = useState<LoopmakerParser | null>(null);
  const [volume, setVolume] = useState(80);
  const [showCentralPlay, setShowCentralPlay] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [audioPlayerRef, setAudioPlayerRef] = useState<RealAudioPlayerRef | null>(null);

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
  }, []);

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

  // Update volume when audioPlayerRef changes
  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioPlayerRef) {
      audioPlayerRef.setVolume(newVolume); // RealAudioPlayer expects 0-100 range
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

  // Get all tracks from visual song
  const getAllTracks = useCallback(() => {
    if (!visualSong) return [];

    const trackMap = new Map<string, any>();

    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        if (!trackMap.has(track.id)) {
          trackMap.set(track.id, track);
        }
      }
    }

    return Array.from(trackMap.values());
  }, [visualSong]);

  // Check if track has currently active notes
  const hasActiveNotes = useCallback((track: any) => {
    if (!track || !parser || typeof currentTime !== 'number') return false;

    // Use parser's getNotesAtTime method to get currently active notes
    const activeNotes = parser.getNotesAtTime(visualSong!, currentTime);

    // Check if any active note belongs to this track
    return activeNotes.some(note => note.trackId === track.id);
  }, [currentTime, parser, visualSong]);

  // Get tracks from visual song
  const tracks = visualSong ? visualSong.loops.flatMap(loop => loop.tracks) : [];

  // Load song data
  useEffect(() => {
    const loadSongData = async () => {
      try {
        const songData = await loadSongFromJSON(songDataSrc);
        setVisualSong(songData);

        // Create parser for real-time analysis
        const response = await fetch(songDataSrc);
        const rawSongData = await response.json();
        const newParser = new LoopmakerParser(rawSongData);
        setParser(newParser);

        console.log('Loaded song data:', songData);
        console.log('Total duration:', songData.duration, 'seconds');
        console.log('Total tracks:', songData.loops.flatMap(l => l.tracks).length);
      } catch (error) {
        console.error('Failed to load song data:', error);
        // Fallback to basic visualization
        setVisualSong(null);
        setParser(null);
      }
    };

    loadSongData();
  }, [songDataSrc]);

  // Set initial volume when audioPlayerRef is available (only once)
  useEffect(() => {
    if (audioPlayerRef) {
      audioPlayerRef.setVolume(volume);
    }
  }, [audioPlayerRef]); // Remove volume dependency to avoid loops

  const visualizerTypes = [
    { type: 'pianoRoll' as const, icon: Music2, label: 'Piano Roll' },
    { type: 'waveform' as const, icon: BarChart3, label: 'Waveform' }
  ];

  return (
    <motion.section
      className="w-full max-w-none"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="relative bg-glass backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden w-full h-[900px] flex flex-col">
        {/* Integrated Header with Track Info and Controls - Compact */}
        <div className="relative px-6 pt-4 pb-0">
          <div className="flex items-center justify-between">
            {/* Track Info with BPM */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <div className="flex items-center gap-2.5">
                  <RotatingMusicIcons.Disc
                    size={16}
                    color="#a855f7"
                    speed={isPlaying ? (bpm / 60) : 0}
                  />
                  <div>
                    <div className="text-white font-semibold text-base">{title}</div>
                    <div className="text-white/60 text-xs">{artist} • {bpm} BPM</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Controls */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Share Button */}
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-all text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </motion.button>

              {/* Download Button */}
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </motion.button>
            </motion.div>
          </div>
        </div>
        {/* Seamless Visualization Area - Fill available space completely */}
        <div className="relative flex-1 overflow-hidden">
          <div className="relative w-full h-full overflow-hidden">
            {/* Main Visualizer Content - Fill container completely */}
            <div className="relative w-full h-full">
              {visualizerType === 'pianoRoll' ? (
                <LoopmakerVisualizer
                  visualSong={visualSong}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  parser={parser}
                  type="pianoRoll"
                  className="w-full h-full"
                />
              ) : (
                <RealAudioVisualizer
                  frequencyData={frequencyData}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  type={visualizerType}
                  audioSrc={audioSrc}
                  onSeek={handleSeek}
                  className="w-full h-full"
                />
              )}
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
        </div>
        {/* Seamless Control Bar - Direct continuation with padding */}
        <div className="bg-glass backdrop-blur-lg border-t border-white/10">
          <div className="px-8 py-6">

          {/* Track Information Panel - Above Progress Bar */}
          {visualSong && (
            <div className="mb-6 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm font-medium">
                  {getAllTracks().length} tracks • {getAllTracks().reduce((sum, track) => sum + track.notes.length, 0)} notes
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getAllTracks().map(track => {
                    const trackIsActive = hasActiveNotes(track);
                    return (
                      <motion.div
                        key={track.id}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all min-w-fit ${
                          trackIsActive ? 'bg-white/20' : 'bg-white/5'
                        }`}
                        animate={{
                          opacity: trackIsActive ? 1 : 0.6
                        }}
                        transition={{
                          duration: 0.2,
                          ease: "easeInOut"
                        }}
                        layout
                      >
                        <motion.div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: track.color }}
                          animate={{
                            scale: trackIsActive ? 1.2 : 1,
                            boxShadow: trackIsActive ? `0 0 8px ${track.color}` : 'none'
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeInOut"
                          }}
                        />
                        <span className="text-white text-xs font-medium whitespace-nowrap">{track.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar with Scrubbing */}
          <div className="relative mb-6">
            <div
              className="h-3 bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full shadow-lg"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                transition={{ duration: 0.1 }}
              />
              {/* Hover indicator */}
              {hoverTime !== null && (
                <div
                  className="absolute top-0 w-0.5 h-full bg-white/60"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                />
              )}
            </div>
            {/* Time Labels */}
            <div className="flex justify-between text-xs text-white/60 mt-3">
              <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Control Row - Centered Play/Stop with Side Controls */}
          <div className="flex items-center justify-between">
            {/* Left: Volume Control */}
            <div className="flex items-center gap-3 flex-1">
              <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <div className="w-32">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = Number(e.target.value);
                    console.log('Volume slider changed to:', newVolume);
                    updateVolume(newVolume);
                  }}
                  className="volume-slider w-full"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #3b82f6 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
              <span className="text-white/50 text-sm min-w-[3ch] font-mono">{volume}</span>
            </div>

            {/* Center: Large Play/Stop Button */}
            <div className="flex justify-center">
              <motion.button
                onClick={togglePlayPause}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white hover:shadow-2xl transition-all shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </motion.button>
            </div>

            {/* Right: Visualizer Type Selector */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {visualizerTypes.map(({ type, icon: Icon, label }) => (
                <motion.button
                  key={type}
                  onClick={() => setVisualizerType(type)}
                  className={`p-3 rounded-lg transition-all ${
                    visualizerType === type
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Hidden Audio Player for Real Functionality */}
        <div className="hidden">
          <RealAudioPlayer
            audioSrc={audioSrc}
            title={title}
            artist={artist}
            onTimeUpdate={handleTimeUpdate}
            onFrequencyData={handleFrequencyData}
            onPlayStateChange={handlePlayStateChange}
            ref={setAudioPlayerRef}
          />
        </div>
      </div>
    </motion.section>
  );
};

export default EnhancedMusicCanvas;
