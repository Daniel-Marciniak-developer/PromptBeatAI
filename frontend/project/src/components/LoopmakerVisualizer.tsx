import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { VisualSong, VisualNote, VisualTrack } from '../types/LoopmakerTypes';
import { LoopmakerParser } from '../utils/LoopmakerParser';

interface LoopmakerVisualizerProps {
  visualSong: VisualSong | null;
  currentTime: number;
  isPlaying: boolean;
  parser?: LoopmakerParser | null;
  className?: string;
  type?: 'pianoRoll' | 'waveform' | 'circular' | 'spectrogram';
}

const LoopmakerVisualizer: React.FC<LoopmakerVisualizerProps> = ({
  visualSong,
  currentTime,
  isPlaying,
  className = '',
  type = 'pianoRoll'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 700 });
  const showAdvanced = false; // Always use simplified view

  // Update canvas size on resize - much more spacious
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(1200, rect.width),
          height: Math.max(650, rect.height) // Increased minimum height
        });
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(updateCanvasSize, 150);

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, [showAdvanced]);

  // Modern Piano Roll visualization - wide and spacious
  const drawPianoRoll = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!visualSong) return;

    ctx.clearRect(0, 0, width, height);

    // Draw modern background
    drawModernBackground(ctx, width, height);

    // Calculate spacious layout - maximum width utilization with minimal margins
    const tracks = getAllTracks();
    const leftPanelWidth = showAdvanced ? 350 : 280;
    const topMargin = showAdvanced ? 20 : 2;
    const bottomMargin = showAdvanced ? 80 : 2;
    const availableHeight = height - topMargin - bottomMargin;
    const trackHeight = Math.min(100, Math.max(70, availableHeight / Math.max(1, tracks.length)));

    // Ensure all tracks fit within canvas
    const totalTracksHeight = tracks.length * trackHeight;
    const adjustedTrackHeight = totalTracksHeight > availableHeight
      ? Math.floor(availableHeight / tracks.length)
      : trackHeight;

    // Draw modern tracks with better spacing
    drawModernTracks(ctx, tracks, leftPanelWidth, topMargin, adjustedTrackHeight, width);

    // Draw modern playhead
    drawModernPlayhead(ctx, width, height, leftPanelWidth, topMargin);

    // Draw time indicators
    drawTimeIndicators(ctx, width, height, leftPanelWidth, topMargin);
  }, [visualSong, currentTime, showAdvanced]);

  // Modern, spacious background
  const drawModernBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clean dark background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#050505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!visualSong) return;

    const leftPanelWidth = showAdvanced ? 400 : 320;
    const topMargin = showAdvanced ? 20 : 2;

    // Modern timeline background
    const bottomMargin = showAdvanced ? 120 : 2;
    const timelineHeight = height - bottomMargin;

    // Timeline area background
    const timelineGradient = ctx.createLinearGradient(leftPanelWidth, 0, width, 0);
    timelineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    timelineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
    timelineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = timelineGradient;
    ctx.fillRect(leftPanelWidth, topMargin, width - leftPanelWidth, timelineHeight - topMargin);

    // Grid pattern - detailed when advanced mode
    if (showAdvanced) {
      // Detailed grid for advanced mode
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;

      const totalBeats = visualSong.totalBars * visualSong.beatsPerBar;
      const beatWidth = (width - leftPanelWidth) / totalBeats;

      // Beat lines with bar emphasis
      for (let beat = 0; beat <= totalBeats; beat++) {
        const x = leftPanelWidth + beat * beatWidth;
        ctx.strokeStyle = beat % visualSong.beatsPerBar === 0 ? '#2a2a2a' : '#151515';
        ctx.lineWidth = beat % visualSong.beatsPerBar === 0 ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(x, topMargin);
        ctx.lineTo(x, timelineHeight);
        ctx.stroke();
      }
    } else {
      // Simple grid for normal mode with time markers
      const timelineWidth = width - leftPanelWidth;
      const numMarkers = 8;

      for (let i = 0; i <= numMarkers; i++) {
        const x = leftPanelWidth + (i / numMarkers) * timelineWidth;
        ctx.strokeStyle = i % 2 === 0 ? '#1a1a1a' : '#111111';
        ctx.lineWidth = i % 2 === 0 ? 1 : 0.5;

        ctx.beginPath();
        ctx.moveTo(x, topMargin);
        ctx.lineTo(x, timelineHeight);
        ctx.stroke();
      }
    }
  };

  // Modern tracks drawing - spacious and clean
  const drawModernTracks = (
    ctx: CanvasRenderingContext2D,
    tracks: VisualTrack[],
    leftPanelWidth: number,
    topMargin: number,
    trackHeight: number,
    width: number
  ) => {
    tracks.forEach((track, index) => {
      const y = topMargin + index * trackHeight;

      // Track background with subtle gradient - more spacious
      const gradient = ctx.createLinearGradient(0, y, 0, y + trackHeight);
      gradient.addColorStop(0, index % 2 === 0 ? '#0f0f0f' : '#0a0a0a');
      gradient.addColorStop(1, index % 2 === 0 ? '#1a1a1a' : '#151515');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, width, trackHeight);

      // Track name area with modern styling - cleaner
      const nameGradient = ctx.createLinearGradient(0, y, leftPanelWidth, y);
      nameGradient.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
      nameGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.01)');
      nameGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nameGradient;
      ctx.fillRect(0, y, leftPanelWidth, trackHeight);

      // Modern track color indicator - rounded pill
      ctx.fillStyle = track.color;
      const indicatorWidth = 6;
      const indicatorHeight = trackHeight - 20;
      const indicatorY = y + 10;
      const radius = indicatorWidth / 2;

      ctx.beginPath();
      ctx.roundRect(16, indicatorY, indicatorWidth, indicatorHeight, radius);
      ctx.fill();

      // Track name with clean, readable font - centered vertically
      ctx.fillStyle = track.mute ? '#666666' : '#ffffff';
      ctx.font = `600 ${Math.min(18, trackHeight / 4)}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      const textY = y + trackHeight / 2 + 6;
      ctx.fillText(track.name, 32, textY);

      // Mute indicator - subtle
      if (track.mute) {
        ctx.fillStyle = '#ff4444';
        ctx.font = `500 ${Math.min(12, trackHeight / 7)}px Inter, sans-serif`;
        ctx.fillText('MUTED', 32, textY + 20);
      }

      // Draw notes with modern styling - clean and visible
      track.notes.forEach(note => {
        if (!visualSong) return;
        const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;
        const noteX = leftPanelWidth + (note.step / totalSteps) * (width - leftPanelWidth);
        const noteWidth = Math.max(16, (note.steps / totalSteps) * (width - leftPanelWidth));

        const isActive = isNoteActive(note);
        const noteHeight = Math.max(trackHeight - 24, 50);
        const noteY = y + (trackHeight - noteHeight) / 2;

        // Note with glow effect for active notes
        if (isActive) {
          ctx.shadowColor = track.color;
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Modern note styling with better contrast
        const noteAlpha = isActive ? 1 : (track.mute ? 0.25 : 0.8);
        ctx.fillStyle = track.color;
        ctx.globalAlpha = noteAlpha;

        // Rounded rectangle for notes - modern and clean
        const radius = Math.min(8, noteWidth / 2, noteHeight / 2);
        ctx.beginPath();
        ctx.roundRect(noteX, noteY, noteWidth, noteHeight, radius);
        ctx.fill();

        // Add subtle border for better definition
        if (!track.mute) {
          ctx.strokeStyle = track.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
    });
  };

  // Modern playhead
  const drawModernPlayhead = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    leftPanelWidth: number,
    topMargin: number
  ) => {
    if (!visualSong) return;

    const progress = currentTime / visualSong.duration;
    const x = leftPanelWidth + progress * (width - leftPanelWidth);

    // Calculate proper bottom margin to match track area
    const bottomMargin = showAdvanced ? 120 : 2;
    const playheadBottom = height - bottomMargin;

    // Simple, clean playhead line - only in track area
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x, topMargin);
    ctx.lineTo(x, playheadBottom);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Modern triangle at top with glow
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x - 8, topMargin);
    ctx.lineTo(x + 8, topMargin);
    ctx.lineTo(x, topMargin + 16);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // Modern time indicators - clean and informative
  const drawTimeIndicators = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    leftPanelWidth: number,
    topMargin: number
  ) => {
    if (!visualSong) return;

    const duration = visualSong.duration;
    const timelineWidth = width - leftPanelWidth;
    const bottomMargin = showAdvanced ? 120 : 2;
    const timelineBottom = height - bottomMargin + 10;
    const numMarkers = showAdvanced ? 16 : 8;

    // Time markers background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(leftPanelWidth, timelineBottom, timelineWidth, 30);

    ctx.fillStyle = '#888';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= numMarkers; i++) {
      const time = (i / numMarkers) * duration;
      const x = leftPanelWidth + (i / numMarkers) * timelineWidth;

      // Time text with better formatting
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      ctx.fillText(timeText, x, timelineBottom + 18);

      // Marker line
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, timelineBottom);
      ctx.lineTo(x, timelineBottom + 6);
      ctx.stroke();
    }

    // Current time indicator
    if (showAdvanced) {
      const currentTime_formatted = `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`;
      const totalTime_formatted = `${Math.floor(visualSong.duration / 60)}:${Math.floor(visualSong.duration % 60).toString().padStart(2, '0')}`;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${currentTime_formatted} / ${totalTime_formatted}`, leftPanelWidth + 10, timelineBottom + 50);
    }
  };




  const getAllTracks = (): VisualTrack[] => {
    if (!visualSong) return [];

    const trackMap = new Map<string, VisualTrack>();

    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        if (!trackMap.has(track.id)) {
          trackMap.set(track.id, track);
        }
      }
    }

    return Array.from(trackMap.values());
  };

  const isNoteActive = (note: VisualNote): boolean => {
    if (!visualSong) return false;

    // Calculate if note should be active based on current time
    const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;
    const stepDuration = visualSong.duration / totalSteps;
    const noteStartTime = note.step * stepDuration;
    const noteEndTime = noteStartTime + (note.steps * stepDuration);

    return currentTime >= noteStartTime && currentTime <= noteEndTime;
  };

  // Circular visualization
  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!visualSong) return;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const maxRadius = Math.min(width, height) / 2.5;

    // Draw tracks in concentric circles
    const tracks = getAllTracks();
    const radiusStep = (maxRadius - radius) / Math.max(1, tracks.length);

    tracks.forEach((track, trackIndex) => {
      const trackRadius = radius + (trackIndex * radiusStep);
      drawTrackCircular(ctx, track, centerX, centerY, trackRadius, radiusStep * 0.8);
    });

    // Draw center circle with BPM
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(111, 0, 255, 0.3)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${visualSong.bpm}`, centerX, centerY - 5);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('BPM', centerX, centerY + 15);
  }, [visualSong, currentTime]);

  const drawTrackCircular = (
    ctx: CanvasRenderingContext2D,
    track: VisualTrack,
    centerX: number,
    centerY: number,
    radius: number,
    thickness: number
  ) => {
    if (!visualSong) return;

    const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;
    const angleStep = (Math.PI * 2) / totalSteps;

    // Draw track circle
    ctx.strokeStyle = `${track.color}40`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw notes
    for (const note of track.notes) {
      const startAngle = note.step * angleStep - Math.PI / 2;
      const endAngle = (note.step + note.steps) * angleStep - Math.PI / 2;
      
      const alpha = track.mute ? 0.3 : note.intensity * track.gain;
      ctx.strokeStyle = `${note.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = thickness * 0.8;
      
      if (isNoteActive(note)) {
        ctx.lineWidth = thickness;
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
      
      if (isNoteActive(note)) {
        ctx.shadowBlur = 0;
      }
    }
  };

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visualSong) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasSize;
    
    // Set canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    switch (type) {
      case 'pianoRoll':
        drawPianoRoll(ctx, width, height);
        break;
      case 'circular':
        drawCircular(ctx, width, height);
        break;
      default:
        drawPianoRoll(ctx, width, height);
    }
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [canvasSize, type, isPlaying, drawPianoRoll, drawCircular]);

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

  // Initial draw and when song changes
  useEffect(() => {
    draw();
  }, [draw, visualSong]);

  return (
    <motion.div
      className={`relative overflow-hidden ${className} ${
        showAdvanced
          ? 'fixed inset-4 z-50 bg-black/98 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl'
          : 'h-full w-full'
      }`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      transition={{ duration: 0.3, type: "spring", damping: 25 }}
      layout
    >


      {/* Canvas - Wide and Compact */}
      <canvas
        ref={canvasRef}
        className="w-full h-full transition-all duration-300"
        style={{
          width: '100%',
          height: '100%',
          filter: showAdvanced
            ? 'drop-shadow(0 0 30px rgba(111, 0, 255, 0.6))'
            : 'drop-shadow(0 0 15px rgba(111, 0, 255, 0.4))',
          minHeight: showAdvanced ? '100vh' : '100%'
        }}
      />

      {/* Modern Overlay Effects */}
      {showAdvanced && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      )}


    </motion.div>
  );
};

export default LoopmakerVisualizer;
