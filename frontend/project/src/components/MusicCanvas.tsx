import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import WaveformVisualizer from './WaveformVisualizer';
import PianoRoll from './PianoRoll';
import SegmentLabels from './SegmentLabels';
import { FloatingMusicIcons, RotatingMusicIcons } from './MusicIcons';

interface MusicCanvasProps {
  isGenerating: boolean;
}

const MusicCanvas: React.FC<MusicCanvasProps> = ({ isGenerating }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120); // 2 minutes
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isGenerating) {
      const animate = () => {
        setCurrentTime(prev => (prev + 0.1) % duration);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGenerating, duration]);

  return (
    <motion.section 
      className="my-16"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="relative bg-glass backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        {/* BPM Badge with rotating disc icon */}
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="bg-gradient-to-r from-accent-from to-accent-to rounded-full px-4 py-2 border border-white/20 flex items-center gap-2">
            <RotatingMusicIcons.Disc size={16} color="#ffffff" speed={0.5} />
            <span className="text-white font-medium text-sm">128 BPM</span>
          </div>
        </motion.div>

        {/* Floating music icons around the canvas */}
        <div className="absolute inset-0 pointer-events-none">
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

        {/* Canvas Content */}
        <div className="relative h-80 lg:h-96 p-6">
          {/* Waveform Layer */}
          <div className="absolute inset-6 z-10">
            <WaveformVisualizer 
              currentTime={currentTime}
              duration={duration}
              isGenerating={isGenerating}
            />
          </div>

          {/* Piano Roll Overlay */}
          <div className="absolute inset-6 z-15 opacity-60">
            <PianoRoll 
              currentTime={currentTime}
              duration={duration}
            />
          </div>

          {/* Segment Labels */}
          <div className="absolute inset-6 z-20">
            <SegmentLabels duration={duration} />
          </div>

          {/* Live Cursor */}
          <motion.div
            className="absolute top-6 bottom-6 w-0.5 bg-white shadow-lg z-30"
            style={{
              left: `${24 + (currentTime / duration) * (100 - 48)}%`,
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          />
        </div>
      </div>
    </motion.section>
  );
};

export default MusicCanvas;