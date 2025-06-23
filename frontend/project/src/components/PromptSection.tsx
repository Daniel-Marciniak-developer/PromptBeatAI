import React from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Loader2 } from 'lucide-react';
import LengthSlider from './LengthSlider';

interface PromptSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasGenerated: boolean;
}

const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  hasGenerated
}) => {
  return (
    <motion.section 
      className={`transition-all duration-1000 ${hasGenerated ? 'h-auto' : 'h-[80vh]'} flex flex-col justify-center items-center`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Main prompt input */}
        <motion.div 
          className="relative"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from/20 to-accent-to/20 rounded-2xl blur-xl" />
          <div className="relative bg-glass backdrop-blur-lg border border-white/10 rounded-2xl p-1">
            <div className="flex items-center space-x-4 p-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-accent-from to-accent-to rounded-xl flex items-center justify-center">
                  <Keyboard className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Napisz: Chill lo-fi z ciepłym pianinem..."
                className="flex-1 bg-transparent text-white text-xl md:text-2xl lg:text-3xl font-medium placeholder-white/40 focus:outline-none caret-accent-from"
                disabled={isGenerating}
                onKeyPress={(e) => e.key === 'Enter' && onGenerate()}
              />
            </div>
          </div>
        </motion.div>

        {/* Length slider */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <LengthSlider />
        </motion.div>

        {/* Generate button */}
        <motion.div 
          className="flex justify-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.button
            onClick={onGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`generate-button ${!prompt.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isGenerating ? { boxShadow: ['0 0 20px rgba(111, 0, 255, 0.5)', '0 0 40px rgba(0, 157, 255, 0.5)', '0 0 20px rgba(111, 0, 255, 0.5)'] } : {}}
            transition={{ repeat: isGenerating ? Infinity : 0, duration: 2 }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generuję...</span>
              </>
            ) : (
              <>
                <Keyboard className="w-6 h-6" />
                <span>🎹 Generuj</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default PromptSection;