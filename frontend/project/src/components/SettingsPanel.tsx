import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

interface SettingsData {
  theme: 'dark' | 'light' | 'auto';
  volume: number;
  autoSave: boolean;
  downloadFormat: 'mp3' | 'wav' | 'flac';
  defaultDuration: number;
  enableAnimations: boolean;
  showHints: boolean;
  autoPlay: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SettingsData>({
    theme: 'dark',
    volume: 80,
    autoSave: true,
    downloadFormat: 'mp3',
    defaultDuration: 30,
    enableAnimations: true,
    showHints: true,
    autoPlay: false
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('promptbeat-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSetting = <K extends keyof SettingsData>(
    key: K, 
    value: SettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('promptbeat-settings', JSON.stringify(settings));
    setHasChanges(false);
  };

  const resetSettings = () => {
    const defaultSettings: SettingsData = {
      theme: 'dark',
      volume: 80,
      autoSave: true,
      downloadFormat: 'mp3',
      defaultDuration: 30,
      enableAnimations: true,
      showHints: true,
      autoPlay: false
    };
    setSettings(defaultSettings);
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
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
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
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
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
                  onChange={(e) => updateSetting('volume', parseInt(e.target.value))}
                  className="w-full accent-accent-from"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">Download Format</label>
                <select
                  value={settings.downloadFormat}
                  onChange={(e) => updateSetting('downloadFormat', e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-from/50"
                >
                  <option value="mp3">MP3 (Compressed)</option>
                  <option value="wav">WAV (Uncompressed)</option>
                  <option value="flac">FLAC (Lossless)</option>
                </select>
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
                  onChange={(e) => updateSetting('defaultDuration', parseInt(e.target.value))}
                  className="w-full accent-accent-from"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Auto-play generated music</span>
                <button
                  onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
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
              <div>
                <label className="block text-white/80 text-sm mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-from/50"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Enable animations</span>
                <button
                  onClick={() => updateSetting('enableAnimations', !settings.enableAnimations)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableAnimations ? 'bg-accent-from' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.enableAnimations ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Show hint suggestions</span>
                <button
                  onClick={() => updateSetting('showHints', !settings.showHints)}
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
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
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
              onClick={resetSettings}
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
                  saveSettings();
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
