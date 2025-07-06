import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  Share,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle
} from 'lucide-react';

interface RealAudioPlayerProps {
  audioSrc?: string;
  title?: string;
  artist?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onFrequencyData?: (frequencyData: Uint8Array) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface RealAudioPlayerRef {
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

const RealAudioPlayer = forwardRef<RealAudioPlayerRef, RealAudioPlayerProps>(({
  audioSrc = "/beat-freestyle.mp3",
  title = "Generated Track",
  artist = "PromptBeat AI",
  onTimeUpdate,
  onFrequencyData,
  onPlayStateChange
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(256));
  const timeUpdateRef = useRef<number>();

  // High-precision time update using requestAnimationFrame
  const updateTimeWithPrecision = useCallback(() => {
    if (!audioRef.current || !isPlaying) return;

    const preciseTime = audioRef.current.currentTime;
    const preciseDuration = audioRef.current.duration;

    setCurrentTime(preciseTime);
    onTimeUpdate?.(preciseTime, preciseDuration);

    // Continue updating while playing
    if (isPlaying) {
      timeUpdateRef.current = requestAnimationFrame(updateTimeWithPrecision);
    }
  }, [isPlaying, onTimeUpdate]);

  // Initialize audio context and analyser
  const initializeAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Try to create media source, but handle CORS errors gracefully
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (corsError) {
        console.warn('CORS restriction detected, audio will play without frequency analysis:', corsError);
        // Audio will still play, just without frequency data
      }

      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  // Update frequency data for visualization
  const updateFrequencyData = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    setFrequencyData(dataArray);
    onFrequencyData?.(dataArray);

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    }
  }, [isPlaying, onFrequencyData]);

  // Play/Pause functionality
  const togglePlayPause = useCallback(async () => {
    console.log('🎵 togglePlayPause called, isPlaying:', isPlaying);
    console.log('🎵 audioRef.current:', audioRef.current);
    console.log('🎵 audioSrc:', audioSrc);

    if (!audioRef.current) {
      console.error('❌ Audio ref is null!');
      return;
    }

    try {
      if (isPlaying) {
        console.log('⏸️ Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
        // Stop high-precision time updates
        if (timeUpdateRef.current) {
          cancelAnimationFrame(timeUpdateRef.current);
        }
      } else {
        console.log('▶️ Starting audio playback');
        console.log('🎵 Audio volume:', audioRef.current.volume);
        console.log('🎵 Audio muted:', audioRef.current.muted);
        console.log('🎵 Audio readyState:', audioRef.current.readyState);

        // Initialize audio context on first play
        if (!audioContextRef.current) {
          console.log('🎵 Initializing audio context');
          initializeAudioContext();
        }

        if (audioContextRef.current?.state === 'suspended') {
          console.log('🎵 Resuming suspended audio context');
          await audioContextRef.current.resume();
        }

        console.log('🎵 Calling audio.play()');
        await audioRef.current.play();
        console.log('✅ Audio play() successful');
        setIsPlaying(true);
        onPlayStateChange?.(true);
        updateFrequencyData();
        // Start high-precision time updates
        updateTimeWithPrecision();
      }
    } catch (error) {
      console.error('❌ Playback error:', error);
      setIsPlaying(false);
    }
  }, [isPlaying, updateFrequencyData, initializeAudioContext, onPlayStateChange, audioSrc]);

  // Seek functionality
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) {
      console.warn('🎯 SeekTo called but no audio ref');
      return;
    }

    const audioDuration = audioRef.current.duration;
    console.log('🎯 SeekTo called with time:', time.toFixed(3), 'duration:', audioDuration?.toFixed(3) || 'unknown');

    // Check if duration is valid (not Infinity or NaN)
    if (!isFinite(audioDuration) || audioDuration <= 0) {
      console.warn('🎯 Cannot seek - invalid audio duration:', audioDuration);
      return;
    }

    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(time, audioDuration));

    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);

    console.log('🎯 Audio currentTime set to:', audioRef.current.currentTime.toFixed(3));
  }, []);

  // Volume control - SINGLE SOURCE OF TRUTH
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));

    // Update audio element volume FIRST
    audioRef.current.volume = clampedVolume;

    // Then update state (this won't trigger useEffect anymore)
    setVolume(clampedVolume);

    // Handle mute state
    if (clampedVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Set volume from external control (0-100 range)
  const setVolumeExternal = useCallback((volumePercent: number) => {
    // Validate input
    if (typeof volumePercent !== 'number' || isNaN(volumePercent)) {
      console.error('Invalid volume value:', volumePercent);
      return;
    }

    const clampedPercent = Math.max(0, Math.min(100, volumePercent));
    const volumeDecimal = clampedPercent / 100;

    handleVolumeChange(volumeDecimal);
  }, [handleVolumeChange]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    togglePlayPause,
    seekTo,
    setVolume: setVolumeExternal
  }), [togglePlayPause, seekTo, setVolumeExternal]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Download functionality
  const handleDownload = useCallback(() => {
    if (!audioSrc) return;

    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioSrc, title]);

  // Share functionality
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - ${artist}`,
          text: `Check out this amazing track generated by PromptBeat AI!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        console.log('Link copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  }, [title, artist]);

  // Format time display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Initialize audio volume ONLY ONCE
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume only once when component mounts
    audio.volume = 0.8; // Fixed initial volume

  }, []); // Empty dependency array - runs only once

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('🎵 Audio metadata loaded:', {
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.src,
        currentSrc: audio.currentSrc
      });

      // Check if duration is valid
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setIsLoading(false);

        // Immediately notify parent component about the duration
        if (onTimeUpdate) {
          onTimeUpdate(audio.currentTime, audio.duration);
          console.log('🎵 Sent initial time update:', audio.currentTime.toFixed(3), 'duration:', audio.duration.toFixed(3));
        }
      } else {
        console.warn('🎵 Invalid duration received:', audio.duration);
        // Try to get duration from other events
        setIsLoading(false);
      }
    };

    const handleTimeUpdate = () => {
      // Use high-precision timing for better synchronization
      const preciseTime = audio.currentTime;
      setCurrentTime(preciseTime);
      onTimeUpdate?.(preciseTime, audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      }
    };

    const handleLoadStart = () => {

      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('🎵 Can play event:', {
        duration: audio.duration,
        readyState: audio.readyState
      });

      setIsLoading(false);

      // Try to get duration if not already set
      if (isFinite(audio.duration) && audio.duration > 0 && (!isFinite(duration) || duration <= 0)) {
        console.log('🎵 Setting duration from canplay event:', audio.duration);
        setDuration(audio.duration);
        if (onTimeUpdate) {
          onTimeUpdate(audio.currentTime, audio.duration);
        }
      }
    };

    const handleDurationChange = () => {
      console.log('🎵 Duration change event:', {
        duration: audio.duration,
        readyState: audio.readyState
      });

      if (isFinite(audio.duration) && audio.duration > 0) {
        console.log('🎵 Setting duration from durationchange event:', audio.duration);
        setDuration(audio.duration);
        if (onTimeUpdate) {
          onTimeUpdate(audio.currentTime, audio.duration);
        }
      }
    };

    const handleError = (e: any) => {
      console.error('Audio loading error:', e);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [isRepeat, onTimeUpdate]);
  // Handle audio source changes
  useEffect(() => {
    if (!audioRef.current) return;

    console.log('🎵 Audio source changed to:', audioSrc);

    // Reset state when audio source changes
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(true);

    // Force reload of audio element
    audioRef.current.load();
  }, [audioSrc]);





  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      className="real-audio-player bg-glass backdrop-blur-lg border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
        muted={false}
        playsInline
        webkit-playsinline="true"
      />

      {/* Track Info */}
      <div className="text-center mb-6">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-white/60 text-sm">{artist}</p>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        {/* Shuffle */}
        <motion.button
          onClick={() => setIsShuffle(!isShuffle)}
          className={`p-2 rounded-lg transition-colors ${
            isShuffle ? 'text-accent-from bg-white/10' : 'text-white/60 hover:text-white'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Shuffle className="w-4 h-4" />
        </motion.button>

        {/* Previous */}
        <motion.button
          className="p-2 text-white/60 hover:text-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SkipBack className="w-5 h-5" />
        </motion.button>

        {/* Play/Pause */}
        <motion.button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative w-16 h-16 bg-gradient-to-r from-accent-from to-accent-to rounded-full flex items-center justify-center border border-white/20">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ) : isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Pause className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress ring */}
          <svg className="absolute inset-0 w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress / 100) }}
              transition={{ duration: 0.1 }}
            />
            <defs>
              <linearGradient id="progressGradient">
                <stop offset="0%" stopColor="#6f00ff" />
                <stop offset="100%" stopColor="#009dff" />
              </linearGradient>
            </defs>
          </svg>
        </motion.button>

        {/* Next */}
        <motion.button
          className="p-2 text-white/60 hover:text-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SkipForward className="w-5 h-5" />
        </motion.button>

        {/* Repeat */}
        <motion.button
          onClick={() => setIsRepeat(!isRepeat)}
          className={`p-2 rounded-lg transition-colors ${
            isRepeat ? 'text-accent-from bg-white/10' : 'text-white/60 hover:text-white'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Repeat className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          className="relative h-2 bg-white/10 rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />

          {/* Hover effect */}
          <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Progress thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-accent-from to-accent-to rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
            animate={{ left: `calc(${progress}% - 8px)` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between text-sm text-white/60 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume and Actions */}
      <div className="flex items-center justify-between">
        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </motion.button>

          <div
            className="w-20 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newVolume = clickX / rect.width;
              handleVolumeChange(newVolume);
            }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              animate={{ width: `${isMuted ? 0 : volume * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={handleDownload}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={handleShare}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Share"
          >
            <Share className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

export default RealAudioPlayer;
