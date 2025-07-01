import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DynamicsSliderProps {
  label: string;
  color: string;
  defaultValue: number;
  onChange?: (value: number) => void;
}

const DynamicsSlider: React.FC<DynamicsSliderProps> = ({
  label,
  color,
  defaultValue,
  onChange
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = useCallback((newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  return (
    <div className="dynamics-slider-container space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-white/80 font-medium">{label}</span>
        <span className="text-white/60 text-sm">{value}%</span>
      </div>

      <div className="relative">
        {/* Track Background */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              width: `${value}%`,
              boxShadow: `0 0 8px ${color}50`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Range Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="dynamics-slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10 }}
        />

        {/* Visual Thumb */}
        <motion.div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${value}% - 8px)`,
            top: '-4px', // Pasek h-2 (8px), środek na 4px. Kropka 16px, środek na 8px. 4px - 8px = -4px
            backgroundColor: color,
            zIndex: 5
          }}
          animate={{
            left: `calc(${value}% - 8px)`,
            scale: 1
          }}
          whileHover={{ scale: 1.2 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default DynamicsSlider;