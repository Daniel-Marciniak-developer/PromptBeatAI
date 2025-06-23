import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Volume2 } from 'lucide-react';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(80);
  const duration = "2:34";
  const currentTime = "0:52";

  return (
    <motion.div 
      className="my-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
        {/* Play/Pause Button */}
        <motion.button
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative w-16 h-16 bg-gradient-to-r from-accent-from to-accent-to rounded-full flex items-center justify-center border border-white/20">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
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
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="progressGradient">
                <stop offset="0%" stopColor="#6f00ff" />
                <stop offset="100%" stopColor="#009dff" />
              </linearGradient>
            </defs>
          </svg>
        </motion.button>

        {/* Progress Info */}
        <div className="flex items-center space-x-4 text-white/80">
          <span className="text-sm font-medium">{currentTime}</span>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-sm">{duration}</span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-white/60" />
          <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
              style={{ width: `${volume}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${volume}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Download Button */}
        <motion.button
          className="ghost-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-5 h-5" />
          <span className="ml-2">Download</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;