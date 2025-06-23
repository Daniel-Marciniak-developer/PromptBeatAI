import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const LengthSlider: React.FC = () => {
  const [length, setLength] = useState(60); // seconds
  const minLength = 10;
  const maxLength = 300; // 5 minutes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-3 text-white/80">
        <Clock className="w-5 h-5" />
        <span className="font-medium">Długość: {formatTime(length)}</span>
      </div>
      
      <div className="relative max-w-md mx-auto">
        <motion.div 
          className="relative h-2 bg-white/10 rounded-full overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          {/* Progress track */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
            style={{ width: `${((length - minLength) / (maxLength - minLength)) * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${((length - minLength) / (maxLength - minLength)) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          {/* Glow effect */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-sm opacity-50"
            style={{ width: `${((length - minLength) / (maxLength - minLength)) * 100}%` }}
          />
        </motion.div>
        
        {/* Slider thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-accent-from to-accent-to rounded-full border-2 border-white shadow-lg cursor-pointer"
          style={{ left: `calc(${((length - minLength) / (maxLength - minLength)) * 100}% - 12px)` }}
          whileHover={{ scale: 1.2 }}
          whileDrag={{ scale: 1.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(event, info) => {
            const rect = event.currentTarget.parentElement?.getBoundingClientRect();
            if (rect) {
              const percentage = Math.max(0, Math.min(1, info.point.x / rect.width));
              const newLength = Math.round(minLength + percentage * (maxLength - minLength));
              setLength(newLength);
            }
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full animate-pulse" />
        </motion.div>
        
        {/* Input range for better accessibility */}
        <input
          type="range"
          min={minLength}
          max={maxLength}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between text-sm text-white/60 max-w-md mx-auto">
        <span>{formatTime(minLength)}</span>
        <span>{formatTime(maxLength)}</span>
      </div>
    </div>
  );
};

export default LengthSlider;