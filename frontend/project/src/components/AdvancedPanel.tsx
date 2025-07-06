import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sliders, Music4, Drum, Piano } from 'lucide-react';
import StyleSelector from './StyleSelector';
import InstrumentToggle from './InstrumentToggle';
import DynamicsSlider from './DynamicsSlider';
import AtmosphereSlider from './AtmosphereSlider';
import TempoInput from './TempoInput';


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
}

interface AdvancedPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  advancedSettings: AdvancedSettings;
  setAdvancedSettings: (settings: AdvancedSettings) => void;
}

const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ isOpen, onToggle, advancedSettings, setAdvancedSettings }) => {

  const updateSetting = (key: keyof AdvancedSettings, enabled: boolean, value?: any) => {
    setAdvancedSettings({
      ...advancedSettings,
      [key]: {
        enabled,
        value: value !== undefined ? value : advancedSettings[key].value
      }
    });
  };

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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={advancedSettings.style.enabled}
                      onChange={(e) => updateSetting('style', e.target.checked)}
                      className="sr-only"
                      id="style-checkbox"
                    />
                    <label
                      htmlFor="style-checkbox"
                      className={`
                        relative flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-300 ease-out
                        ${advancedSettings.style.enabled
                          ? 'bg-gradient-to-br from-accent-from to-accent-to shadow-lg shadow-accent-from/25 scale-100'
                          : 'bg-white/10 border-2 border-white/30 hover:border-white/50 hover:bg-white/15'
                        }
                        group-hover:scale-105 group-active:scale-95
                      `}
                    >
                      {advancedSettings.style.enabled && (
                        <svg
                          className="w-3.5 h-3.5 text-white drop-shadow-sm"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {/* Glow effect when checked */}
                      {advancedSettings.style.enabled && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-from to-accent-to opacity-30 blur-sm -z-10"></div>
                      )}
                    </label>
                  </div>
                  <h3 className="text-lg font-medium text-white">Music Style</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    advancedSettings.style.enabled
                      ? 'bg-gradient-to-r from-accent-from/20 to-accent-to/20 text-accent-from border border-accent-from/30 shadow-sm'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {advancedSettings.style.enabled ? 'Default' : 'Custom'}
                  </span>
                </div>
                <StyleSelector
                  selectedStyle={advancedSettings.style.value}
                  onStyleChange={(style) => updateSetting('style', advancedSettings.style.enabled, style)}
                />
              </div>

              {/* Tempo Control */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={advancedSettings.tempo.enabled}
                      onChange={(e) => updateSetting('tempo', e.target.checked)}
                      className="sr-only"
                      id="tempo-checkbox"
                    />
                    <label
                      htmlFor="tempo-checkbox"
                      className={`
                        relative flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-300 ease-out
                        ${advancedSettings.tempo.enabled
                          ? 'bg-gradient-to-br from-accent-from to-accent-to shadow-lg shadow-accent-from/25 scale-100'
                          : 'bg-white/10 border-2 border-white/30 hover:border-white/50 hover:bg-white/15'
                        }
                        group-hover:scale-105 group-active:scale-95
                      `}
                    >
                      {advancedSettings.tempo.enabled && (
                        <svg
                          className="w-3.5 h-3.5 text-white drop-shadow-sm"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {advancedSettings.tempo.enabled && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-from to-accent-to opacity-30 blur-sm -z-10"></div>
                      )}
                    </label>
                  </div>
                  <h3 className="text-lg font-medium text-white">Tempo</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    advancedSettings.tempo.enabled
                      ? 'bg-gradient-to-r from-accent-from/20 to-accent-to/20 text-accent-from border border-accent-from/30 shadow-sm'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {advancedSettings.tempo.enabled ? 'Default' : 'Custom'}
                  </span>
                </div>
                <TempoInput
                  defaultValue={advancedSettings.tempo.value}
                  onChange={(value) => updateSetting('tempo', advancedSettings.tempo.enabled, value)}
                  min={60}
                  max={200}
                />
              </div>

              {/* Instrument Toggles */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={advancedSettings.instruments.enabled}
                      onChange={(e) => updateSetting('instruments', e.target.checked)}
                      className="sr-only"
                      id="instruments-checkbox"
                    />
                    <label
                      htmlFor="instruments-checkbox"
                      className={`
                        relative flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-300 ease-out
                        ${advancedSettings.instruments.enabled
                          ? 'bg-gradient-to-br from-accent-from to-accent-to shadow-lg shadow-accent-from/25 scale-100'
                          : 'bg-white/10 border-2 border-white/30 hover:border-white/50 hover:bg-white/15'
                        }
                        group-hover:scale-105 group-active:scale-95
                      `}
                    >
                      {advancedSettings.instruments.enabled && (
                        <svg
                          className="w-3.5 h-3.5 text-white drop-shadow-sm"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {advancedSettings.instruments.enabled && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-from to-accent-to opacity-30 blur-sm -z-10"></div>
                      )}
                    </label>
                  </div>
                  <h3 className="text-lg font-medium text-white">Instruments</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    advancedSettings.instruments.enabled
                      ? 'bg-gradient-to-r from-accent-from/20 to-accent-to/20 text-accent-from border border-accent-from/30 shadow-sm'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {advancedSettings.instruments.enabled ? 'Default' : 'Custom'}
                  </span>
                </div>
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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled}
                      onChange={(e) => {
                        updateSetting('bass', e.target.checked);
                        updateSetting('drums', e.target.checked);
                        updateSetting('melody', e.target.checked);
                      }}
                      className="sr-only"
                      id="dynamics-checkbox"
                    />
                    <label
                      htmlFor="dynamics-checkbox"
                      className={`
                        relative flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-300 ease-out
                        ${(advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled)
                          ? 'bg-gradient-to-br from-accent-from to-accent-to shadow-lg shadow-accent-from/25 scale-100'
                          : 'bg-white/10 border-2 border-white/30 hover:border-white/50 hover:bg-white/15'
                        }
                        group-hover:scale-105 group-active:scale-95
                      `}
                    >
                      {(advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled) && (
                        <svg
                          className="w-3.5 h-3.5 text-white drop-shadow-sm"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {(advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled) && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-from to-accent-to opacity-30 blur-sm -z-10"></div>
                      )}
                    </label>
                  </div>
                  <h3 className="text-lg font-medium text-white">Dynamics</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    (advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled)
                      ? 'bg-gradient-to-r from-accent-from/20 to-accent-to/20 text-accent-from border border-accent-from/30 shadow-sm'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {(advancedSettings.bass.enabled || advancedSettings.drums.enabled || advancedSettings.melody.enabled) ? 'Default' : 'Custom'}
                  </span>
                </div>
                <div className="space-y-4">
                  <DynamicsSlider
                    label="Bass"
                    color="#ff6b6b"
                    defaultValue={advancedSettings.bass.value}
                    onChange={(value) => updateSetting('bass', advancedSettings.bass.enabled, value)}
                  />
                  <DynamicsSlider
                    label="Drums"
                    color="#4ecdc4"
                    defaultValue={advancedSettings.drums.value}
                    onChange={(value) => updateSetting('drums', advancedSettings.drums.enabled, value)}
                  />
                  <DynamicsSlider
                    label="Melody"
                    color="#45b7d1"
                    defaultValue={advancedSettings.melody.value}
                    onChange={(value) => updateSetting('melody', advancedSettings.melody.enabled, value)}
                  />
                </div>
              </div>

              {/* Atmosphere Sliders */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      checked={advancedSettings.warmth.enabled || advancedSettings.brightness.enabled}
                      onChange={(e) => {
                        updateSetting('warmth', e.target.checked);
                        updateSetting('brightness', e.target.checked);
                      }}
                      className="sr-only"
                      id="atmosphere-checkbox"
                    />
                    <label
                      htmlFor="atmosphere-checkbox"
                      className={`
                        relative flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-300 ease-out
                        ${(advancedSettings.warmth.enabled || advancedSettings.brightness.enabled)
                          ? 'bg-gradient-to-br from-accent-from to-accent-to shadow-lg shadow-accent-from/25 scale-100'
                          : 'bg-white/10 border-2 border-white/30 hover:border-white/50 hover:bg-white/15'
                        }
                        group-hover:scale-105 group-active:scale-95
                      `}
                    >
                      {(advancedSettings.warmth.enabled || advancedSettings.brightness.enabled) && (
                        <svg
                          className="w-3.5 h-3.5 text-white drop-shadow-sm"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {(advancedSettings.warmth.enabled || advancedSettings.brightness.enabled) && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-from to-accent-to opacity-30 blur-sm -z-10"></div>
                      )}
                    </label>
                  </div>
                  <h3 className="text-lg font-medium text-white">Atmosphere</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    (advancedSettings.warmth.enabled || advancedSettings.brightness.enabled)
                      ? 'bg-gradient-to-r from-accent-from/20 to-accent-to/20 text-accent-from border border-accent-from/30 shadow-sm'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {(advancedSettings.warmth.enabled || advancedSettings.brightness.enabled) ? 'Default' : 'Custom'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AtmosphereSlider
                    label="Warmth"
                    defaultValue={advancedSettings.warmth.value}
                    onChange={(value) => updateSetting('warmth', advancedSettings.warmth.enabled, value)}
                  />
                  <AtmosphereSlider
                    label="Brightness"
                    defaultValue={advancedSettings.brightness.value}
                    onChange={(value) => updateSetting('brightness', advancedSettings.brightness.enabled, value)}
                  />
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
