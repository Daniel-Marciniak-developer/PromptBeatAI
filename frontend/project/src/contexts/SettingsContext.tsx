import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SettingsData {
  theme: 'dark' | 'light' | 'auto';
  autoSave: boolean;
  enableAnimations: boolean;
  showHints: boolean;
  volume: number;
  downloadFormat: 'mp3' | 'wav' | 'flac';
  defaultDuration: number;
  autoPlay: boolean;
}

interface SettingsContextType {
  settings: SettingsData;
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsData = {
  theme: 'dark',
  autoSave: true,
  enableAnimations: true,
  showHints: true,
  volume: 80,
  downloadFormat: 'mp3',
  defaultDuration: 30,
  autoPlay: false
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('promptbeat-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse settings from localStorage:', error);
      }
    }
  }, []);

  // Apply settings to the application
  useEffect(() => {
    // Apply theme
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      // Auto theme - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      }
    }

    // Apply animations setting
    if (!settings.enableAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }


    // Apply volume to all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = settings.volume / 100;
    });

  }, [settings]);

  const updateSetting = <K extends keyof SettingsData>(
    key: K, 
    value: SettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('promptbeat-settings', JSON.stringify(settings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('promptbeat-settings', JSON.stringify(defaultSettings));
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    saveSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
