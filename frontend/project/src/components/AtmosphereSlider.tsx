import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AtmosphereSliderProps {
  label: string;
  defaultValue: number;
  onChange?: (value: number) => void;
}

const AtmosphereSlider: React.FC<AtmosphereSliderProps> = ({
  label,
  defaultValue,
  onChange
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isHovering, setIsHovering] = useState(false);

  const handleChange = useCallback((newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  return (
    <div className="atmosphere-slider-container space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-white/80 font-medium">{label}</span>
        <span className="text-white/60 text-sm">{value}%</span>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Track Background */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
            style={{ width: `${value}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            className="absolute top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-sm"
            style={{ width: `${value}%` }}
            initial={{ width: 0, opacity: 0.3 }}
            animate={{
              width: `${value}%`,
              opacity: isHovering ? 0.6 : 0.3
            }}
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
          className="atmosphere-slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10, margin: 0, padding: 0 }}
        />

        {/* Visual Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-accent-from to-accent-to rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${value}% - 10px)`,
            zIndex: 5
          }}
          animate={{
            left: `calc(${value}% - 10px)`,
            scale: isHovering ? 1.2 : 1,
            boxShadow: isHovering
              ? '0 0 20px rgba(111, 0, 255, 0.5)'
              : '0 4px 8px rgba(0, 0, 0, 0.3)'
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};

export default AtmosphereSlider;