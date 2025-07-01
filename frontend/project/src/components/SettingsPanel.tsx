import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SelectDropdown from './SelectDropdown';
import { useSettings, SettingsData } from '../contexts/SettingsContext';
import {
  X,
  Settings,
  Volume2,
  Monitor,
  Palette,
  Download,
  Trash2,
  RefreshCw,
  Save
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting, saveSettings, resetSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    updateSetting(key, value);
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    saveSettings();
    setHasChanges(false);
  };

  const handleResetSettings = () => {
    resetSettings();
    setHasChanges(true);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove all projects, history, and settings.')) {
      localStorage.clear();
      location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-white/60 text-sm">Customize your experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">

          {/* Audio Settings */}
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Audio Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Default Volume: {settings.volume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleUpdateSetting('volume', parseInt(e.target.value))}
                  className="w-full custom-slider"
                  style={{
                    background: `linear-gradient(to right, #f093fb 0%, #f093fb ${settings.volume}%, rgba(255,255,255,0.2) ${settings.volume}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Download Format</label>
                <SelectDropdown
                  options={[
                    { value: 'mp3', label: 'MP3 (Compressed)' },
                    { value: 'wav', label: 'WAV (Uncompressed)' },
                    { value: 'flac', label: 'FLAC (Lossless)' }
                  ]}
                  value={settings.downloadFormat}
                  onChange={(value) => handleUpdateSetting('downloadFormat', value as any)}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Default Duration: {settings.defaultDuration}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={settings.defaultDuration}
                  onChange={(e) => handleUpdateSetting('defaultDuration', parseInt(e.target.value))}
                  className="w-full custom-slider"
                  style={{
                    background: `linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${((settings.defaultDuration - 10) / (120 - 10)) * 100}%, rgba(255,255,255,0.2) ${((settings.defaultDuration - 10) / (120 - 10)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Auto-play generated music</span>
                <button
                  onClick={() => handleUpdateSetting('autoPlay', !settings.autoPlay)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoPlay ? 'bg-accent-from' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoPlay ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Interface Settings */}
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Interface Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Show hint suggestions</span>
                <button
                  onClick={() => handleUpdateSetting('showHints', !settings.showHints)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.showHints ? 'bg-accent-from' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.showHints ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Data Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Auto-save projects</span>
                <button
                  onClick={() => handleUpdateSetting('autoSave', !settings.autoSave)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoSave ? 'bg-accent-from' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoSave ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={clearAllData}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
                <p className="text-white/40 text-xs mt-2 text-center">
                  This will remove all projects, history, and settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between items-center">
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-2 text-white/60 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveSettings();
                  onClose();
                }}
                disabled={!hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-gradient-to-r from-accent-from to-accent-to text-white hover:opacity-90'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPanel;
