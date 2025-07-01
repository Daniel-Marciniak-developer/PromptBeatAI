import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Header from './components/Header';
import PromptSection from './components/PromptSection';
import EnhancedMusicCanvas from './components/EnhancedMusicCanvas';

import HintSuggestions from './components/HintSuggestions';
import Sidebar from './components/Sidebar';

import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';

import FavoritesPanel from './components/FavoritesPanel';

import SharePanel from './components/SharePanel';
import MusicBackground from './components/MusicBackground';
import './styles/globals.css';

const AppContent: React.FC = () => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Panel states

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showFavorites, setShowFavorites] = useState(false);

  const [showShare, setShowShare] = useState(false);

  // Current project for sharing
  const [currentProject, setCurrentProject] = useState<any>(null);

  // Track favorites state for reactivity
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  // Simple favorites management
  const getFavorites = () => {
    try {
      const saved = localStorage.getItem('promptbeat-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  };

  const saveFavorites = (favorites: any[]) => {
    try {
      localStorage.setItem('promptbeat-favorites', JSON.stringify(favorites));
      const newVersion = favoritesVersion + 1;
      setFavoritesVersion(newVersion);
      console.log('✅ Favorites saved:', favorites);
      console.log('🔄 FavoritesVersion updated to:', newVersion);

      // Verify save
      const verification = localStorage.getItem('promptbeat-favorites');
      console.log('🔍 Verification - saved data:', verification);
    } catch (error) {
      console.error('❌ Error saving favorites:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setShowHints(false);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsGenerating(false);
    setHasGenerated(true);
    setShowAdvanced(true);
    setShowHints(true);

    // Create new project
    const newProject = {
      id: Date.now().toString(),
      name: `Generated Track ${Date.now()}`,
      prompt: prompt,
      audioUrl: "/beat-freestyle.mp3",
      createdAt: new Date(),
      duration: settings.defaultDuration, // Use setting
      style: "Lo-fi", // Default style, should be taken from settings
      bpm: 128,
      isFavorite: false
    };

    // Set current project for sharing
    setCurrentProject(newProject);

    // Auto-save project if enabled
    if (settings.autoSave) {
      const projects = JSON.parse(localStorage.getItem('promptbeat-projects') || '[]');
      projects.unshift(newProject);
      localStorage.setItem('promptbeat-projects', JSON.stringify(projects.slice(0, 50))); // Keep only 50 projects
    }

    // Save to history
    const historyItem = {
      id: Date.now().toString(),
      prompt: prompt,
      timestamp: new Date(),
      duration: 180,
      style: "Lo-fi",
      settings: {
        bpm: 128,
        instruments: ['piano', 'bass', 'drums']
      }
    };

    const existingHistory = JSON.parse(localStorage.getItem('promptbeat-history') || '[]');
    const updatedHistory = [historyItem, ...existingHistory.slice(0, 49)]; // Keep only 50 items
    localStorage.setItem('promptbeat-history', JSON.stringify(updatedHistory));
  };

  const handleNewProject = () => {
    setPrompt('');
    setHasGenerated(false);
    setShowAdvanced(false);
    setShowHints(false);
    setIsGenerating(false);
  };

  // Helper function to close all panels
  const closeAllPanels = () => {
    setShowHistory(false);
    setShowSettings(false);
    setShowFavorites(false);

    setShowShare(false);
  };

  const handleOpenHistory = () => {
    closeAllPanels();
    setShowHistory(true);
  };

  const handleOpenSettings = () => {
    closeAllPanels();
    setShowSettings(true);
  };



  const handleOpenFavorites = () => {
    closeAllPanels();
    setShowFavorites(true);
  };



  const handleOpenShare = () => {
    closeAllPanels();
    setShowShare(true);
  };



  const handleRestoreFromHistory = (historyItem: any) => {
    setPrompt(historyItem.prompt);
    setHasGenerated(true);
    setShowAdvanced(true);
    setShowHistory(false);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setHasGenerated(false);
    setShowAdvanced(false);
    setShowHints(false);
  };

  const handleRandomPrompt = () => {
    // Random prompt is handled in PromptSection
    setShowHints(true);
  };





  const handleAddToFavorites = () => {
    if (!hasGenerated || !prompt.trim()) {
      console.log('❌ Cannot add to favorites - hasGenerated:', hasGenerated, 'prompt:', prompt);
      return;
    }

    const favorites = getFavorites();
    const existingIndex = favorites.findIndex((fav: any) => fav.prompt === prompt);

    if (existingIndex >= 0) {
      // Remove from favorites
      favorites.splice(existingIndex, 1);
      console.log('➖ Removed from favorites');
    } else {
      // Add to favorites
      const favoriteItem = {
        id: `fav_${Date.now()}`,
        name: "Beat for Freestyle",
        prompt: prompt,
        createdAt: new Date().toISOString(),
        addedToFavoritesAt: new Date().toISOString(),
        duration: settings.defaultDuration,
        style: "Freestyle",
        tags: ["beat", "freestyle", "hip-hop"]
      };
      favorites.unshift(favoriteItem);
      console.log('➕ Added to favorites:', favoriteItem);
    }

    // Save and trigger refresh
    saveFavorites(favorites.slice(0, 50));
  };

  const isCurrentTrackFavorite = useMemo(() => {
    if (!hasGenerated || !prompt.trim()) return false;
    const favorites = getFavorites();
    const isFavorite = favorites.some((fav: any) => fav.prompt === prompt);
    console.log('💖 Is current track favorite:', isFavorite, 'for prompt:', prompt);
    return isFavorite;
  }, [hasGenerated, prompt, favoritesVersion]);



  return (
    <div className="bg-black relative overflow-x-hidden min-h-screen">
      {/* Sidebar */}
      <Sidebar
        onNewProject={handleNewProject}
        onOpenHistory={handleOpenHistory}
        onOpenSettings={handleOpenSettings}


        onOpenFavorites={handleOpenFavorites}
        onSidebarStateChange={setIsSidebarExpanded}
      />

      {/* Music-themed animated background */}
      <MusicBackground
        isGenerating={isGenerating}
        intensity={hasGenerated ? 'high' : 'medium'}
      />

      <div className="relative z-10">
        {/* Header - always visible but logo hidden when sidebar expanded */}
        <div
          className="relative z-20 transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isSidebarExpanded ? '280px' : '80px'
          }}
        >
          <Header hideLogo={isSidebarExpanded} />
        </div>

        <main
          className="pb-20 transition-all duration-300 ease-in-out relative z-20"
          style={{
            marginLeft: isSidebarExpanded ? '280px' : '80px',
            width: `calc(100vw - ${isSidebarExpanded ? '280px' : '80px'})`,
            minHeight: '100vh',
            overflow: 'visible'
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <PromptSection
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasGenerated={hasGenerated}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              onClear={handleClearPrompt}
              onRandom={handleRandomPrompt}
            />

            <AnimatePresence>
              {hasGenerated && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <EnhancedMusicCanvas
                    isGenerating={isGenerating}
                    audioSrc="/beat-freestyle.mp3"
                    songDataSrc="/beat-freestyle.json"
                    title="Beat for Freestyle"
                    artist="PromptBeat AI"
                    bpm={128}
                    onShare={handleOpenShare}
                    onDownload={(format, quality) => {
                      // Use format from settings if not specified
                      const downloadFormat = format || settings.downloadFormat;

                      // Create a download link for the audio file
                      const audioSrc = "/beat-freestyle.mp3";
                      const link = document.createElement('a');
                      link.href = audioSrc;
                      link.download = `beat-freestyle-${quality}.${downloadFormat.toLowerCase()}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      // Save to downloads history
                      const downloadItem = {
                        id: Date.now().toString(),
                        name: "Beat for Freestyle",
                        format: downloadFormat,
                        quality: quality,
                        downloadedAt: new Date(),
                        size: "3.2 MB",
                        url: audioSrc
                      };

                      const downloads = JSON.parse(localStorage.getItem('promptbeat-downloads') || '[]');
                      downloads.unshift(downloadItem);
                      localStorage.setItem('promptbeat-downloads', JSON.stringify(downloads.slice(0, 50)));
                    }}
                    onAddToFavorites={handleAddToFavorites}
                    isFavorite={isCurrentTrackFavorite}
                    autoPlay={settings.autoPlay}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHints && settings.showHints && (
                <HintSuggestions onHintClick={(hint) => setPrompt(prev => prev + ' ' + hint)} />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>

      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            onRestoreFromHistory={handleRestoreFromHistory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showFavorites && (
          <FavoritesPanel
            isOpen={showFavorites}
            onClose={() => setShowFavorites(false)}
            refreshTrigger={favoritesVersion}
            onRemoveFromFavorites={(id) => {
              console.log('🗑️ Removing favorite with id:', id);
              const favorites = getFavorites();
              const updated = favorites.filter((fav: any) => fav.id !== id);
              saveFavorites(updated);
            }}
          />
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showShare && (
          <SharePanel
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            currentProject={currentProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;