import React from 'react';
import { motion } from 'framer-motion';
import { FloatingMusicIcons } from './MusicIcons';

interface MusicBackgroundProps {
  isGenerating?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

const MusicBackground: React.FC<MusicBackgroundProps> = ({ 
  isGenerating = false, 
  intensity = 'medium' 
}) => {
  const getIconCount = () => {
    switch (intensity) {
      case 'low': return 8;
      case 'medium': return 12;
      case 'high': return 16;
      default: return 12;
    }
  };

  const getAnimationSpeed = () => {
    if (isGenerating) return 1.5; // Faster when generating
    switch (intensity) {
      case 'low': return 4;
      case 'medium': return 3;
      case 'high': return 2;
      default: return 3;
    }
  };

  const iconTypes = [
    { component: FloatingMusicIcons.Piano, color: '#a855f7' },
    { component: FloatingMusicIcons.Guitar, color: '#ef4444' },
    { component: FloatingMusicIcons.Drum, color: '#06b6d4' },
    { component: FloatingMusicIcons.Mic, color: '#f59e0b' },
    { component: FloatingMusicIcons.Music, color: '#10b981' },
    { component: FloatingMusicIcons.Headphones, color: '#8b5cf6' },
  ];

  const generateIcons = () => {
    const icons = [];
    const count = getIconCount();
    
    for (let i = 0; i < count; i++) {
      const iconType = iconTypes[i % iconTypes.length];
      const IconComponent = iconType.component;
      
      icons.push(
        <IconComponent
          key={i}
          color={iconType.color}
          size={Math.random() * 8 + 12} // Random size between 12-20
          delay={Math.random() * 5} // Random delay up to 5 seconds
          duration={getAnimationSpeed() + Math.random() * 2} // Varied duration
          className={`
            left-[${Math.random() * 80 + 10}%] 
            top-[${Math.random() * 80 + 10}%]
          `}
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
        />
      );
    }
    
    return icons;
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base fog overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Animated music-themed background elements */}
      <div className="absolute inset-0">
        {/* Large floating music symbols */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #6f00ff40 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, #009dff40 0%, transparent 70%)'
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.25, 0.1],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating music icons */}
        <div className="relative w-full h-full">
          {generateIcons()}
        </div>

        {/* Musical staff lines (subtle) */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-px bg-white"
              style={{ top: `${20 + i * 15}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 0] }}
              transition={{
                duration: 6,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Pulsing circles representing sound waves */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-white/10 rounded-full"
              style={{
                width: `${(i + 1) * 200}px`,
                height: `${(i + 1) * 200}px`,
                left: `${-(i + 1) * 100}px`,
                top: `${-(i + 1) * 100}px`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 4,
                delay: i * 1.3,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Frequency bars (like equalizer) */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-20">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-accent-from to-accent-to rounded-full"
              animate={{
                height: [
                  `${Math.random() * 20 + 10}px`,
                  `${Math.random() * 40 + 20}px`,
                  `${Math.random() * 20 + 10}px`
                ]
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Vinyl record effect */}
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 rounded-full border-4 border-white/10 opacity-30"
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="absolute inset-4 rounded-full border-2 border-white/5" />
          <div className="absolute inset-8 rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </motion.div>

        {/* Additional floating elements when generating */}
        {isGenerating && (
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`generating-${i}`}
                className="absolute w-2 h-2 bg-accent-from rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicBackground;
