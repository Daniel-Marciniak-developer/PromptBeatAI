import React from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Loader2 } from 'lucide-react';
import LengthSlider from './LengthSlider';
import AdvancedPanel from './AdvancedPanel';

interface AdvancedSetting {
  enabled: boolean;
  value: any;
}

interface AdvancedSettings {
  style: AdvancedSetting;
  tempo: AdvancedSetting;
  bass: AdvancedSetting;
  drums: AdvancedSetting;
  melody: AdvancedSetting;
  warmth: AdvancedSetting;
  brightness: AdvancedSetting;
  instruments: AdvancedSetting;
  dynamics: AdvancedSetting;
  atmosphere: AdvancedSetting;
}

interface PromptSectionProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasGenerated: boolean;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onClear?: () => void;
  onRandom?: () => void;
  advancedSettings: AdvancedSettings;
  setAdvancedSettings: (settings: AdvancedSettings) => void;
  duration: number;
  setDuration: (duration: number) => void;
}

const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  hasGenerated,
  showAdvanced,
  onToggleAdvanced,
  onClear,
  onRandom,
  advancedSettings,
  setAdvancedSettings,
  duration,
  setDuration
}) => {
  const randomPrompts = [
    "Chill lo-fi with warm piano and vinyl crackle",
    "Upbeat electronic dance with heavy bass",
    "Ambient cinematic with strings and soft pads",
    "Jazz fusion with smooth saxophone",
    "Retro synthwave with nostalgic melodies",
    "Acoustic folk with gentle guitar fingerpicking",
    "Dark trap with 808 drums and atmospheric pads",
    "Classical piano piece with emotional depth"
  ];

  const handleRandom = () => {
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    setPrompt(randomPrompt);
    onRandom?.();
  };

  const handleClear = () => {
    setPrompt('');
    onClear?.();
  };
  return (
    <motion.section 
      className={`transition-all duration-1000 ${hasGenerated ? 'py-8' : 'min-h-[80vh] justify-center'} flex flex-col items-center`}
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
                placeholder="Type: Chill lo-fi with warm piano..."
                className="flex-1 bg-transparent text-white text-xl md:text-2xl lg:text-3xl font-medium placeholder-white/40 focus:outline-none caret-accent-from"
                disabled={isGenerating}
                onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
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
          <LengthSlider
            defaultValue={duration}
            onChange={setDuration}
            min={10}
            max={300}
          />
        </motion.div>

        {/* Advanced Settings*/}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <AdvancedPanel
            isOpen={showAdvanced}
            onToggle={onToggleAdvanced}
            advancedSettings={advancedSettings}
            setAdvancedSettings={setAdvancedSettings}
          />
        </motion.div>

        {/* Action Buttons Section */}
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {/* Main Generate Button */}
          <motion.button
            onClick={onGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`generate-button ${!prompt.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isGenerating ? {
              boxShadow: [
                '0 0 20px rgba(111, 0, 255, 0.5)',
                '0 0 40px rgba(0, 157, 255, 0.5)',
                '0 0 20px rgba(111, 0, 255, 0.5)'
              ]
            } : {}}
            transition={{ repeat: isGenerating ? Infinity : 0, duration: 2 }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Music...</span>
              </>
            ) : (
              <>
                <Keyboard className="w-6 h-6" />
                <span>Generate Music</span>
              </>
            )}
          </motion.button>

          {/* Secondary Actions */}
          {!isGenerating && (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.button
                className="ghost-button text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRandom}
              >
                🎲 Random
              </motion.button>

              <motion.button
                className="ghost-button text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
              >
                🗑️ Clear
              </motion.button>

              {hasGenerated && (
                <motion.button
                  className="ghost-button text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGenerate}
                >
                  🔄 Regenerate
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default PromptSection;