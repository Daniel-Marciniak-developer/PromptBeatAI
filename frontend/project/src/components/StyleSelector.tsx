import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Headphones,
  Mic,
  Zap,
  Film,
  Piano,
  Radio
} from 'lucide-react';

const StyleSelector: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState('Lo-fi');
  
  const styles = [
    {
      name: 'Lo-fi',
      icon: Headphones,
      color: '#a855f7',
      bgColor: '#a855f7',
      description: 'Chill, relaxed vibes'
    },
    {
      name: 'Hip-hop',
      icon: Mic,
      color: '#ef4444',
      bgColor: '#ef4444',
      description: 'Urban beats & rhythm'
    },
    {
      name: 'EDM',
      icon: Zap,
      color: '#06b6d4',
      bgColor: '#06b6d4',
      description: 'Electronic dance music'
    },
    {
      name: 'Cinematic',
      icon: Film,
      color: '#6b7280',
      bgColor: '#6b7280',
      description: 'Epic orchestral sounds'
    },
    {
      name: 'Classical',
      icon: Piano,
      color: '#d97706',
      bgColor: '#d97706',
      description: 'Timeless compositions'
    },
    {
      name: 'Podcast',
      icon: Radio,
      color: '#059669',
      bgColor: '#059669',
      description: 'Voice & ambient'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {styles.map((style) => (
        <motion.button
          key={style.name}
          onClick={() => setSelectedStyle(style.name)}
          className={`relative p-4 rounded-xl border-2 transition-all ${
            selectedStyle === style.name
              ? 'border-accent-from bg-white/10'
              : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Music Icon Container */}
          <div
            className="w-full h-16 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: `${style.bgColor}20` }}
          >
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, ${style.color}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${style.color}30 0%, transparent 50%)`
              }}
            />

            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <style.icon
                className="w-8 h-8"
                style={{ color: style.color }}
              />
            </motion.div>

            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: style.color,
                    left: `${20 + i * 20}%`,
                    top: `${50 + (i % 2 ? 10 : -10)}%`
                  }}
                  animate={{
                    x: [0, 20, 0],
                    y: [0, -10, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <span className="text-white font-medium block">{style.name}</span>
            <span className="text-white/60 text-xs">{style.description}</span>
          </div>
          
          {selectedStyle === style.name && (
            <motion.div
              className="absolute inset-0 border-2 border-accent-from rounded-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default StyleSelector;