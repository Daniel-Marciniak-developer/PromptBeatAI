import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sliders, Music4, Drum, Piano } from 'lucide-react';
import StyleSelector from './StyleSelector';
import InstrumentToggle from './InstrumentToggle';
import DynamicsSlider from './DynamicsSlider';
import AtmosphereSlider from './AtmosphereSlider';
import TempoInput from './TempoInput';

interface AdvancedPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ isOpen, onToggle }) => {
  const [tempo, setTempo] = useState(128);

  return (
    <motion.section 
      className="my-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Panel Header */}
      <motion.button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 bg-glass backdrop-blur-lg border border-white/10 rounded-t-2xl hover:bg-white/5 transition-colors group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center space-x-3">
          <Sliders className="w-6 h-6 text-accent-from" />
          <h2 className="text-xl font-semibold text-white">Advanced Settings</h2>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
        </motion.div>
      </motion.button>

      {/* Panel Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="bg-glass backdrop-blur-lg border-x border-b border-white/10 rounded-b-2xl overflow-hidden"
          >
            <div className="p-6 space-y-8">
              {/* Style Selector */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Music Style</h3>
                <StyleSelector />
              </div>

              {/* Tempo Control */}
              <div>
                <TempoInput
                  defaultValue={tempo}
                  onChange={setTempo}
                  min={60}
                  max={200}
                />
              </div>

              {/* Instrument Toggles */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Instruments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InstrumentToggle icon={Piano} label="Piano" defaultChecked />
                  <InstrumentToggle icon={Music4} label="Bass" defaultChecked />
                  <InstrumentToggle icon={Drum} label="Drums" defaultChecked />
                  <InstrumentToggle icon={Music4} label="Strings" />
                  <InstrumentToggle icon={Music4} label="Synth" />
                  <InstrumentToggle icon={Music4} label="FX" />
                </div>
              </div>

              {/* Dynamics Sliders */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Dynamics</h3>
                <div className="space-y-4">
                  <DynamicsSlider label="Bass" color="#ff6b6b" defaultValue={70} />
                  <DynamicsSlider label="Drums" color="#4ecdc4" defaultValue={85} />
                  <DynamicsSlider label="Melody" color="#45b7d1" defaultValue={60} />
                </div>
              </div>

              {/* Atmosphere Sliders */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Atmosphere</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AtmosphereSlider label="Warmth" defaultValue={60} />
                  <AtmosphereSlider label="Brightness" defaultValue={40} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default AdvancedPanel; 