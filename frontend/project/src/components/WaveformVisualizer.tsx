import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WaveformVisualizerProps {
  currentTime: number;
  duration: number;
  isGenerating: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  currentTime,
  duration,
  isGenerating
}) => {
  // Generate mock waveform data
  const waveformData = useMemo(() => {
    const points = 200;
    const data = [];
    for (let i = 0; i < points; i++) {
      const x = (i / points) * 100;
      const amplitude = Math.sin(i * 0.1) * 0.5 + 
                      Math.sin(i * 0.05) * 0.3 + 
                      Math.sin(i * 0.2) * 0.2;
      const y = 50 + amplitude * 40;
      data.push({ x, y });
    }
    return data;
  }, []);

  const pathData = waveformData
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const currentProgress = (currentTime / duration) * 100;

  return (
    <div className="relative w-full h-full">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Background waveform */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        
        {/* Active waveform (played portion) */}
        <defs>
          <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6f00ff" />
            <stop offset="100%" stopColor="#009dff" />
          </linearGradient>
          <clipPath id="progressClip">
            <rect
              x="0"
              y="0"
              width={`${currentProgress}%`}
              height="100%"
            />
          </clipPath>
        </defs>
        
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#waveformGradient)"
          strokeWidth="1"
          clipPath="url(#progressClip)"
          filter="drop-shadow(0 0 4px rgba(111, 0, 255, 0.5))"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Glow effect */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#waveformGradient)"
          strokeWidth="2"
          clipPath="url(#progressClip)"
          opacity="0.3"
          filter="blur(2px)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </svg>

      {/* Loading animation for generation */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-accent-from/30 border-t-accent-from rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;