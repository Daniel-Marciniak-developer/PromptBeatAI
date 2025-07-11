import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Header from './components/Header';
import PromptSection from './components/PromptSection';
import { ApiMusicCanvas } from './components/ApiMusicCanvas';
import { ApiStatusMonitor } from './components/ApiStatusMonitor';
import { generateAndWaitForSong, GenerationPrompt, getMp3Url } from './services/api';
import { Song } from './types/LoopmakerTypes';

import HintSuggestions from './components/HintSuggestions';
import Sidebar from './components/Sidebar';

import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';

import FavoritesPanel from './components/FavoritesPanel';

import SharePanel from './components/SharePanel';
import MusicBackground from './components/MusicBackground';
import MusicGenerationLoader from './components/MusicGenerationLoader';
import './styles/globals.css';

const AppContent: React.FC = () => {
  const { settings } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'generating' | 'pending' | 'complete'>('generating');
  const [generationCancelled, setGenerationCancelled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // API Integration
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
  const [generatedSongId, setGeneratedSongId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'generating' | 'pending' | 'complete' | 'error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  // Panel states
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Advanced settings state - domyślnie wszystko odznaczone (enabled: false = Default)
  const [advancedSettings, setAdvancedSettings] = useState({
    style: { enabled: false, value: 'Lo-fi' },
    tempo: { enabled: false, value: 128 },
    bass: { enabled: false, value: 70 },
    drums: { enabled: false, value: 85 },
    melody: { enabled: false, value: 60 },
    warmth: { enabled: false, value: 60 },
    brightness: { enabled: false, value: 40 },
    instruments: { enabled: false, value: { piano: true, drums: true, bass: true } },
    dynamics: { enabled: false, value: null }, // Nowy checkbox dla Dynamics
    atmosphere: { enabled: false, value: null } // Nowy checkbox dla Atmosphere
  });

  // Duration state - osobno, zawsze wysyłane
  const [duration, setDuration] = useState(60);

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

    } catch (error) {
      console.error('❌ Error saving favorites:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setShowHints(false);
    setApiError(null);
    setApiStatus('generating');
    setGenerationProgress(0);
    setGenerationStage('generating');
    setGenerationCancelled(false);

    // Declare progressInterval outside try block
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 0;

    try {
      // Przygotuj ustawienia zaawansowane
      const advancedSettingsJson = {
        duration: duration, // Zawsze wysyłane
        style: advancedSettings.style.enabled ? advancedSettings.style.value : "default",
        tempo: advancedSettings.tempo.enabled ? advancedSettings.tempo.value : "default",
        bass: advancedSettings.bass.enabled ? advancedSettings.bass.value : "default",
        drums: advancedSettings.drums.enabled ? advancedSettings.drums.value : "default",
        melody: advancedSettings.melody.enabled ? advancedSettings.melody.value : "default",
        warmth: advancedSettings.warmth.enabled ? advancedSettings.warmth.value : "default",
        brightness: advancedSettings.brightness.enabled ? advancedSettings.brightness.value : "default",
        instruments: advancedSettings.instruments.enabled ? advancedSettings.instruments.value : "default"
      };

      // Stwórz prompt z JSON-em
      const promptWithSettings = `${prompt}\n\nAdvanced Settings: ${JSON.stringify(advancedSettingsJson)}`;

      // Log do konsoli
      console.log('🎵 Sending prompt to API:', promptWithSettings);

      // Przygotuj prompt dla API
      const generationPrompt: GenerationPrompt = {
        text_prompt: promptWithSettings,
        other_settings: {
          bpm: settings.defaultBpm || 128,
          style: settings.defaultStyle || "Lo-fi",
          duration: settings.defaultDuration || 30
        }
      };

      // Start progress animation

      const updateProgress = () => {
        currentProgress += Math.random() * 3 + 1; // Random increment 1-4%
        if (currentProgress > 95) currentProgress = 95; // Cap at 95% until complete
        setGenerationProgress(currentProgress);
      };

      progressInterval = setInterval(updateProgress, 500);

      // Wywołaj API z progress callback
      const result = await generateAndWaitForSong(generationPrompt, (status) => {
        setApiStatus(status);
        setGenerationStage(status);

        // Update progress based on stage
        if (status === 'generating') {
          currentProgress = Math.max(currentProgress, 10);
        } else if (status === 'pending') {
          currentProgress = Math.max(currentProgress, 30);
        } else if (status === 'complete') {
          clearInterval(progressInterval);
          setGenerationProgress(100);
        }
      });

      // Zapisz wygenerowaną piosenkę
      setGeneratedSong(result.song);
      setGeneratedSongId(result.songId);
      setApiStatus('complete');
      setHasGenerated(true);
      setShowAdvanced(true);
      setShowHints(true);

      // Pokaż animację sukcesu
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 3000); // Ukryj po 3 sekundach

      // Create new project z wygenerowanymi danymi
      const newProject = {
        id: Date.now().toString(),
        name: `Generated Track ${Date.now()}`,
        prompt: prompt,
        audioUrl: getMp3Url(result.songId), // Użyj prawdziwego URL-a do wygenerowanej muzyki
        createdAt: new Date(),
        duration: settings.defaultDuration,
        style: settings.defaultStyle || "AI Generated",
        bpm: result.song.bpm,
        isFavorite: false,
        songData: result.song // Dodajemy wygenerowane dane piosenki
      };

      // Set current project for sharing
      setCurrentProject(newProject);

      // Auto-save project if enabled
      if (settings.autoSave) {
        const projects = JSON.parse(localStorage.getItem('promptbeat-projects') || '[]');
        projects.unshift(newProject);
        localStorage.setItem('promptbeat-projects', JSON.stringify(projects.slice(0, 50))); // Keep only 50 projects
      }

    } catch (error) {
      console.error('Error generating song:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to generate song');
      setApiStatus('error');
    } finally {
      setIsGenerating(false);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
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

  const handleCancelGeneration = () => {
    setGenerationCancelled(true);
    setIsGenerating(false);
    setApiStatus('error');
    setApiError('Generation cancelled by user');
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
    setGeneratedSong(null);
    setGeneratedSongId(null);
    setApiStatus('idle');
    setApiError(null);
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

      {/* API Status Monitor */}
      <ApiStatusMonitor />

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
          <div className="w-full px-6">
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
              advancedSettings={advancedSettings}
              setAdvancedSettings={setAdvancedSettings}
              duration={duration}
              setDuration={setDuration}
            />

            <AnimatePresence>
              {hasGenerated && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <ApiMusicCanvas
                    song={generatedSong}
                    songId={generatedSongId}
                    isGenerating={isGenerating}
                    apiStatus={apiStatus}
                    apiError={apiError}
                    title={generatedSong ? `AI Generated - ${prompt.slice(0, 30)}...` : "AI Generated Track"}
                    artist="PromptBeat AI"
                    onShare={handleOpenShare}
                    onDownload={async (format, quality) => {
                      try {
                        // Use format from settings if not specified
                        const downloadFormat = format || settings.downloadFormat;
                        const audioSrc = generatedSongId ? `${getMp3Url(generatedSongId)}?download=true` : "/beat-freestyle.mp3?download=true";

                        // Fetch the file as blob to force download
                        const response = await fetch(audioSrc);
                        const blob = await response.blob();

                        // Create blob URL and download
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `ai-generated-${quality}.${downloadFormat.toLowerCase()}`;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Clean up blob URL
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

                        // Save to downloads history
                        const downloadItem = {
                          id: Date.now().toString(),
                          name: generatedSong ? `AI Generated - ${prompt.slice(0, 20)}...` : "AI Generated Track",
                          format: downloadFormat,
                          quality: quality,
                          downloadedAt: new Date(),
                          size: "3.2 MB",
                          url: audioSrc
                        };

                        const downloads = JSON.parse(localStorage.getItem('promptbeat-downloads') || '[]');
                        downloads.unshift(downloadItem);
                        localStorage.setItem('promptbeat-downloads', JSON.stringify(downloads.slice(0, 50)));
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback - try with download attribute
                        const audioSrc = generatedSongId ? getMp3Url(generatedSongId) : "/beat-freestyle.mp3";
                        window.open(audioSrc + '?download=true', '_blank');
                      }
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

            {/* Success Animation */}
            <AnimatePresence>
              {showSuccessAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                >
                  <div className="bg-green-500/90 backdrop-blur-lg rounded-full p-8 shadow-2xl">
                    <motion.svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </div>
                  <motion.p
                    className="text-white text-center mt-4 font-semibold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Music Generated Successfully!
                  </motion.p>
                </motion.div>
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

      {/* Music Generation Loader */}
      <MusicGenerationLoader
        isVisible={isGenerating}
        progress={generationProgress}
        stage={generationStage}
        onCancel={handleCancelGeneration}
      />
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