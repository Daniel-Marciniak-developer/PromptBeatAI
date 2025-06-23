import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InstrumentToggleProps {
  icon: LucideIcon;
  label: string;
  defaultChecked?: boolean;
}

const InstrumentToggle: React.FC<InstrumentToggleProps> = ({ 
  icon: Icon, 
  label, 
  defaultChecked = false 
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  return (
    <motion.button
      onClick={() => setIsChecked(!isChecked)}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isChecked
          ? 'border-accent-from bg-gradient-to-r from-accent-from/20 to-accent-to/20'
          : 'border-white/20 bg-white/5 hover:bg-white/10'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex flex-col items-center space-y-2">
        <Icon className={`w-6 h-6 ${isChecked ? 'text-accent-from' : 'text-white/60'}`} />
        <span className={`text-sm font-medium ${isChecked ? 'text-white' : 'text-white/60'}`}>
          {label}
        </span>
      </div>
      
      {isChecked && (
        <motion.div
          className="absolute inset-0 border-2 border-accent-from rounded-xl pointer-events-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};

export default InstrumentToggle;