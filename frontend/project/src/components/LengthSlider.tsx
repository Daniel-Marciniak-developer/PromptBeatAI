import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface LengthSliderProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const LengthSlider: React.FC<LengthSliderProps> = ({
  defaultValue = 60,
  onChange,
  min = 10,
  max = 300
}) => {
  const [length, setLength] = useState(defaultValue);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = useCallback((newLength: number) => {
    setLength(newLength);
    onChange?.(newLength);
  }, [onChange]);

  const percentage = ((length - min) / (max - min)) * 100;

  return (
    <div className="length-slider-container space-y-4">
      <div className="flex items-center justify-center space-x-3 text-white/80">
        <Clock className="w-5 h-5 text-accent-from" />
        <span className="font-medium">Length: {formatTime(length)}</span>
      </div>

      <div className="relative max-w-md mx-auto">
        {/* Track Background */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          {/* Progress Fill */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
            style={{ width: `${percentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {/* Glow Effect */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-sm opacity-30"
            style={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Custom Range Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={length}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="length-slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10 }}
        />

        {/* Visual Thumb */}
        <motion.div
          className="absolute w-5 h-5 bg-gradient-to-r from-accent-from to-accent-to rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${percentage}% - 10px)`,
            top: '-6px', // Pasek h-2 (8px), środek na 4px. Kropka 20px, środek na 10px. 4px - 10px = -6px
            zIndex: 5
          }}
          animate={{
            left: `calc(${percentage}% - 10px)`,
            scale: 1
          }}
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full opacity-80" />
        </motion.div>
      </div>

      <div className="flex justify-between text-sm text-white/60 max-w-md mx-auto">
        <span>{formatTime(min)}</span>
        <span>{formatTime(max)}</span>
      </div>
    </div>
  );
};

export default LengthSlider;