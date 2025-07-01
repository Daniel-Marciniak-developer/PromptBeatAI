import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ModernWaveform from './ModernWaveform';

interface RealAudioVisualizerProps {
  frequencyData: Uint8Array;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  className?: string;
  type?: 'waveform' | 'frequency' | 'circular' | 'spectrogram';
  audioSrc?: string;
  onSeek?: (time: number) => void;
}

const RealAudioVisualizer: React.FC<RealAudioVisualizerProps> = ({
  frequencyData,
  currentTime,
  duration,
  isPlaying,
  className = '',
  type = 'waveform',
  audioSrc = '/beat-freestyle.mp3',
  onSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 300 });

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Waveform visualization
  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / frequencyData.length;
    const centerY = height / 2;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#6f00ff');
    gradient.addColorStop(0.5, '#009dff');
    gradient.addColorStop(1, '#00ff88');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    
    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = (frequencyData[i] / 255) * (height / 2);
      const x = i * barWidth;
      const y1 = centerY - amplitude;
      const y2 = centerY + amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y1);
      } else {
        ctx.lineTo(x, y1);
      }
    }
    
    ctx.stroke();
    
    // Draw reflection
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    
    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = (frequencyData[i] / 255) * (height / 2);
      const x = i * barWidth;
      const y2 = centerY + amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y2);
      } else {
        ctx.lineTo(x, y2);
      }
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw progress line
    const progressX = (currentTime / duration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [frequencyData, currentTime, duration]);

  // Frequency bars visualization
  const drawFrequencyBars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / frequencyData.length;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      const hue = (i / frequencyData.length) * 360;
      gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 70%, 80%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, actualBarWidth, barHeight);
      
      // Add glow effect
      ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, actualBarWidth, barHeight);
      ctx.shadowBlur = 0;
    }
  }, [frequencyData]);

  // Circular visualization
  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const maxRadius = Math.min(width, height) / 2.5;
    
    ctx.translate(centerX, centerY);
    
    const angleStep = (Math.PI * 2) / frequencyData.length;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = (frequencyData[i] / 255) * (maxRadius - radius);
      const angle = i * angleStep;
      
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius + amplitude);
      const y2 = Math.sin(angle) * (radius + amplitude);
      
      // Color based on frequency
      const hue = (i / frequencyData.length) * 360;
      ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Add glow
      ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(111, 0, 255, 0.3)';
    ctx.fill();
    
    ctx.translate(-centerX, -centerY);
  }, [frequencyData]);

  // Spectrogram visualization
  const drawSpectrogram = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Shift existing image data to the left
    const imageData = ctx.getImageData(1, 0, width - 1, height);
    ctx.putImageData(imageData, 0, 0);
    
    // Draw new column
    const columnWidth = 2;
    const x = width - columnWidth;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const intensity = frequencyData[i] / 255;
      const y = (i / frequencyData.length) * height;
      const barHeight = height / frequencyData.length;
      
      // Color based on intensity
      const hue = intensity * 240; // Blue to red
      const saturation = 70;
      const lightness = 30 + intensity * 50;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, y, columnWidth, barHeight);
    }
  }, [frequencyData]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasSize;
    
    // Set canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    switch (type) {
      case 'waveform':
        drawWaveform(ctx, width, height);
        break;
      case 'frequency':
        drawFrequencyBars(ctx, width, height);
        break;
      case 'circular':
        drawCircular(ctx, width, height);
        break;
      case 'spectrogram':
        drawSpectrogram(ctx, width, height);
        break;
    }
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [canvasSize, type, isPlaying, drawWaveform, drawFrequencyBars, drawCircular, drawSpectrogram]);

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      draw();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, draw]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Use ModernWaveform for waveform type, canvas for others
  if (type === 'waveform') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <ModernWaveform
          audioSrc={audioSrc}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={onSeek}
          className="w-full h-full"
        />

        {/* Type indicator */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-white/60 text-xs capitalize">{type}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 10px rgba(111, 0, 255, 0.3))'
        }}
      />

      {/* Type indicator */}
      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
        <span className="text-white/60 text-xs capitalize">{type}</span>
      </div>
    </motion.div>
  );
};

export default RealAudioVisualizer;
