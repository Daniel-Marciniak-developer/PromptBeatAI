import React from 'react';
import { motion } from 'framer-motion';
import { 
  Music, 
  Piano, 
  Guitar, 
  Drum, 
  Mic, 
  Headphones,
  Volume2,
  Radio,
  Disc,
  PlayCircle,
  PauseCircle,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Download,
  Share2
} from 'lucide-react';

interface MusicIconProps {
  icon: React.ComponentType<any>;
  color?: string;
  size?: number;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MusicIcon: React.FC<MusicIconProps> = ({ 
  icon: Icon, 
  color = '#6f00ff', 
  size = 24, 
  animated = false,
  className = '',
  onClick 
}) => {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      whileHover={animated ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={animated ? { scale: 0.95 } : {}}
      onClick={onClick}
    >
      <Icon 
        size={size} 
        style={{ color }} 
        className={animated ? 'transition-all duration-200' : ''}
      />
    </motion.div>
  );
};

interface FloatingMusicIconProps {
  icon: React.ComponentType<any>;
  color?: string;
  size?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FloatingMusicIcon: React.FC<FloatingMusicIconProps> = ({ 
  icon: Icon, 
  color = '#6f00ff', 
  size = 16, 
  delay = 0,
  duration = 3,
  className = ''
}) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [-20, -40, -60, -80], 
        scale: [0, 1, 1, 0],
        rotate: [0, 10, -10, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon size={size} style={{ color }} />
    </motion.div>
  );
};

interface PulsingMusicIconProps {
  icon: React.ComponentType<any>;
  color?: string;
  size?: number;
  className?: string;
}

export const PulsingMusicIcon: React.FC<PulsingMusicIconProps> = ({ 
  icon: Icon, 
  color = '#6f00ff', 
  size = 24,
  className = ''
}) => {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon size={size} style={{ color }} />
    </motion.div>
  );
};

interface RotatingMusicIconProps {
  icon: React.ComponentType<any>;
  color?: string;
  size?: number;
  speed?: number;
  className?: string;
}

export const RotatingMusicIcon: React.FC<RotatingMusicIconProps> = ({ 
  icon: Icon, 
  color = '#6f00ff', 
  size = 24,
  speed = 1,
  className = ''
}) => {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 3 / speed,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <Icon size={size} style={{ color }} />
    </motion.div>
  );
};

// Pre-configured music icons for common use cases
export const MusicIcons = {
  // Instruments
  Piano: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Piano} {...props} />,
  Guitar: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Guitar} {...props} />,
  Drum: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Drum} {...props} />,
  Mic: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Mic} {...props} />,
  
  // Audio Equipment
  Headphones: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Headphones} {...props} />,
  Volume: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Volume2} {...props} />,
  Radio: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Radio} {...props} />,
  Disc: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Disc} {...props} />,
  
  // Playback Controls
  Play: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={PlayCircle} {...props} />,
  Pause: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={PauseCircle} {...props} />,
  Next: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={SkipForward} {...props} />,
  Previous: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={SkipBack} {...props} />,
  Shuffle: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Shuffle} {...props} />,
  Repeat: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Repeat} {...props} />,
  
  // Actions
  Heart: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Heart} {...props} />,
  Download: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Download} {...props} />,
  Share: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Share2} {...props} />,
  Music: (props: Omit<MusicIconProps, 'icon'>) => <MusicIcon icon={Music} {...props} />,
};

// Floating variants
export const FloatingMusicIcons = {
  Piano: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Piano} {...props} />,
  Guitar: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Guitar} {...props} />,
  Drum: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Drum} {...props} />,
  Mic: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Mic} {...props} />,
  Music: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Music} {...props} />,
  Headphones: (props: Omit<FloatingMusicIconProps, 'icon'>) => <FloatingMusicIcon icon={Headphones} {...props} />,
};

// Pulsing variants
export const PulsingMusicIcons = {
  Piano: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Piano} {...props} />,
  Guitar: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Guitar} {...props} />,
  Drum: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Drum} {...props} />,
  Mic: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Mic} {...props} />,
  Music: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Music} {...props} />,
  Headphones: (props: Omit<PulsingMusicIconProps, 'icon'>) => <PulsingMusicIcon icon={Headphones} {...props} />,
};

// Rotating variants (great for discs, loading states)
export const RotatingMusicIcons = {
  Disc: (props: Omit<RotatingMusicIconProps, 'icon'>) => <RotatingMusicIcon icon={Disc} {...props} />,
  Music: (props: Omit<RotatingMusicIconProps, 'icon'>) => <RotatingMusicIcon icon={Music} {...props} />,
};

export default MusicIcons;
