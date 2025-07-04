import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface HintSuggestionsProps {
  onHintClick: (hint: string) => void;
}

const HintSuggestions: React.FC<HintSuggestionsProps> = ({ onHintClick }) => {
  const hints = [
    "add background synth",
    "increase drums",
    "slow tempo by 10 BPM",
    "more reverb on vocals",
    "add string pads",
    "warmer bass",
    "brighter melody",
    "add vinyl crackle",
    "softer attack"
  ];

  return (
    <motion.div 
      className="my-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 text-white/80">
          <Lightbulb className="w-5 h-5 text-accent-from" />
          <span className="font-medium">Quick Improvements</span>
        </div>
        <p className="text-white/50 text-sm mt-2">Click to add to your prompt</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {hints.map((hint, index) => (
          <motion.button
            key={hint}
            onClick={() => onHintClick(hint)}
            className="hint-chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {hint}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default HintSuggestions;