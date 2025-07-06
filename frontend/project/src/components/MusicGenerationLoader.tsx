import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2 } from 'lucide-react';

interface MusicGenerationLoaderProps {
  isVisible: boolean;
  progress?: number;
  stage?: 'generating' | 'pending' | 'complete';
  onCancel?: () => void;
}

const loadingMessages = [
  "🎵 Analyzing your musical vision...",
  "🎹 Composing melodies and harmonies...",
  "🥁 Crafting the perfect rhythm...",
  "🎸 Adding instrumental layers...",
  "🎺 Fine-tuning the arrangement...",
  "✨ Adding the final touches...",
  "🎼 Almost ready to play..."
];

const MusicGenerationLoader: React.FC<MusicGenerationLoaderProps> = ({
  isVisible,
  progress = 0,
  stage = 'generating',
  onCancel
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) {
      setCurrentMessage(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [isVisible]);

  // Animate dots
  useEffect(() => {
    if (!isVisible) {
      setDots(''); // Reset when hidden
      return;
    }

    const dotInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isVisible]);

  // Handle ESC key to cancel (optional)
  useEffect(() => {
    if (!isVisible || !onCancel) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isVisible, onCancel]);

  const waveVariants = {
    animate: {
      scaleY: [1, 2, 1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 rounded-3xl p-8 max-w-md w-full mx-4 border border-purple-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Animation Area */}
            <div className="relative h-32 mb-6 flex items-center justify-center">
              {/* Background Waves */}
              <div className="absolute inset-0 flex items-center justify-center space-x-1">
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={`wave-${i}-${isVisible}`}
                    variants={waveVariants}
                    animate="animate"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    className="w-2 h-8 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full opacity-60"
                  />
                ))}
              </div>

              {/* Central Pulsing Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4 shadow-lg"
              >
                <Volume2 className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* Status Message */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Generating Your Music{dots}
              </h3>

              {/* Messages Container - shows only current message */}
              <div className="min-h-[60px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`message-${currentMessage}-${isVisible}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-purple-200 text-sm"
                  >
                    {loadingMessages[currentMessage]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Stage Indicator */}
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${stage === 'generating' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                <div className={`w-2 h-2 rounded-full ${stage === 'pending' ? 'bg-blue-400' : 'bg-gray-500'}`} />
                <div className={`w-2 h-2 rounded-full ${stage === 'complete' ? 'bg-green-400' : 'bg-gray-500'}`} />
              </div>

              <p className="text-xs text-purple-300 mt-2 capitalize">
                {stage === 'generating' && 'Initializing...'}
                {stage === 'pending' && 'Creating your masterpiece...'}
                {stage === 'complete' && 'Ready to play!'}
              </p>

              {/* Cancel button (optional) */}
              {onCancel && stage !== 'complete' && (
                <button
                  onClick={onCancel}
                  className="mt-4 px-4 py-2 text-xs text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-400 rounded-lg transition-colors"
                >
                  Cancel Generation
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MusicGenerationLoader;
