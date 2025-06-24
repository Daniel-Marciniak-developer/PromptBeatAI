import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ModernWaveformProps {
  audioSrc: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  className?: string;
}

interface WaveformData {
  peaks: Float32Array;
  length: number;
}

const ModernWaveform: React.FC<ModernWaveformProps> = ({
  audioSrc,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 200 });
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Generate waveform data from audio file
  const generateWaveformData = useCallback(async (audioUrl: string) => {
    try {
      setIsLoading(true);
      
      // Fetch audio file
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get channel data (use first channel)
      const channelData = audioBuffer.getChannelData(0);
      const samples = channelData.length;
      
      // Downsample to reasonable number of points for visualization
      const targetPoints = Math.min(2000, Math.floor(samples / 100));
      const blockSize = Math.floor(samples / targetPoints);
      const peaks = new Float32Array(targetPoints);
      
      // Calculate RMS (Root Mean Square) for each block
      for (let i = 0; i < targetPoints; i++) {
        let sum = 0;
        const start = i * blockSize;
        const end = Math.min(start + blockSize, samples);
        
        for (let j = start; j < end; j++) {
          sum += channelData[j] * channelData[j];
        }
        
        peaks[i] = Math.sqrt(sum / (end - start));
      }
      
      setWaveformData({ peaks, length: targetPoints });
      setIsLoading(false);
      
      // Clean up
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
      setIsLoading(false);
      setHasError(true);

      // Generate fallback mock data
      const mockPeaks = new Float32Array(1000);
      for (let i = 0; i < 1000; i++) {
        mockPeaks[i] = Math.random() * 0.5 + 0.1;
      }
      setWaveformData({ peaks: mockPeaks, length: 1000 });
    }
  }, []);

  // Load waveform data when audio source changes
  useEffect(() => {
    if (audioSrc) {
      generateWaveformData(audioSrc);
    }
  }, [audioSrc, generateWaveformData]);

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    const { peaks } = waveformData;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const maxAmplitude = height * 0.4; // Leave some padding
    const barWidth = width / peaks.length;
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressX = progress * width;

    // Draw background waveform (unplayed portion)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const amplitude = peaks[i] * maxAmplitude;
      
      // Draw symmetric bars (top and bottom)
      ctx.fillRect(x, centerY - amplitude, Math.max(1, barWidth - 0.5), amplitude * 2);
    }

    // Draw played portion with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#6f00ff');
    gradient.addColorStop(0.2, '#8b5cf6');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(0.8, '#06b6d4');
    gradient.addColorStop(1, '#00ff88');

    ctx.fillStyle = gradient;
    
    // Clip to played portion
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, progressX, height);
    ctx.clip();

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const amplitude = peaks[i] * maxAmplitude;
      
      ctx.fillRect(x, centerY - amplitude, Math.max(1, barWidth - 0.5), amplitude * 2);
    }
    ctx.restore();

    // Draw glow effect for played portion
    ctx.save();
    ctx.shadowColor = '#6f00ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    
    ctx.beginPath();
    ctx.rect(0, 0, progressX, height);
    ctx.clip();

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const amplitude = peaks[i] * maxAmplitude;
      
      ctx.fillRect(x, centerY - amplitude, Math.max(1, barWidth - 0.5), amplitude * 2);
    }
    ctx.restore();

    // Draw playhead
    if (isPlaying || hoverX !== null) {
      const playheadX = hoverX !== null ? hoverX : progressX;
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      
      // Playhead circle
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(playheadX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hover indicator
    if (hoverX !== null) {
      const hoverTime = (hoverX / width) * duration;
      const minutes = Math.floor(hoverTime / 60);
      const seconds = Math.floor(hoverTime % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Hover line with glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();

      // Time tooltip with rounded corners
      const tooltipWidth = 60;
      const tooltipHeight = 24;
      const tooltipX = Math.max(5, Math.min(hoverX - tooltipWidth/2, width - tooltipWidth - 5));
      const tooltipY = 8;

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.beginPath();

      // Use roundRect if available, otherwise fallback to regular rect
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
      } else {
        ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(timeText, tooltipX + tooltipWidth/2, tooltipY + 16);
    }
  }, [waveformData, canvasSize, currentTime, duration, isPlaying, hoverX]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawWaveform();
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawWaveform, isPlaying]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !onSeek || !duration) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;
    
    onSeek(newTime);
  }, [onSeek, duration]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer transition-all duration-200 hover:scale-[1.01] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ filter: 'brightness(1.1)' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white/60 text-sm">Analyzing audio waveform...</div>
          </div>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="absolute top-2 left-2 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-2 py-1 border border-yellow-500/30">
          <span className="text-yellow-300 text-xs">Using fallback waveform</span>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 10px rgba(111, 0, 255, 0.2))'
        }}
      />
    </motion.div>
  );
};

export default ModernWaveform;
