import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface AtmosphereSliderProps {
  label: string;
  defaultValue: number;
}

const AtmosphereSlider: React.FC<AtmosphereSliderProps> = ({ 
  label, 
  defaultValue 
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-white/80 font-medium">{label}</span>
        <span className="text-white/60 text-sm">{value}%</span>
      </div>
      
      <div className="relative">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full"
            style={{ width: `${value}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.div
            className="absolute top-0 h-full bg-gradient-to-r from-accent-from to-accent-to rounded-full blur-sm opacity-50"
            style={{ width: `${value}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-accent-from to-accent-to rounded-full border-2 border-white shadow-lg cursor-pointer"
          style={{ left: `calc(${value}% - 10px)` }}
          whileHover={{ scale: 1.2 }}
          whileDrag={{ scale: 1.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(event, info) => {
            const rect = event.currentTarget.parentElement?.getBoundingClientRect();
            if (rect) {
              const percentage = Math.max(0, Math.min(100, (info.point.x / rect.width) * 100));
              setValue(Math.round(percentage));
            }
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-full animate-pulse" />
        </motion.div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default AtmosphereSlider;