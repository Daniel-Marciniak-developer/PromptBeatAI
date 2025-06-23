import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import PromptSection from './components/PromptSection';
import MusicCanvas from './components/MusicCanvas';
import AdvancedPanel from './components/AdvancedPanel';
import AudioPlayer from './components/AudioPlayer';
import HintSuggestions from './components/HintSuggestions';
import Sidebar from './components/Sidebar';
import ProjectManager from './components/ProjectManager';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import MusicBackground from './components/MusicBackground';
import './styles/globals.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Panel states
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
  };

  const handleNewProject = () => {
    setPrompt('');
    setHasGenerated(false);
    setShowAdvanced(false);
    setShowHints(false);
    setIsGenerating(false);
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleSelectProject = (project: any) => {
    setPrompt(project.prompt);
    setHasGenerated(true);
    setShowAdvanced(true);
    setShowProjectManager(false);
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

  return (
    <div className="bg-black relative overflow-x-hidden min-h-screen">
      {/* Sidebar */}
      <Sidebar
        onNewProject={handleNewProject}
        onOpenHistory={handleOpenHistory}
        onOpenSettings={handleOpenSettings}
        onOpenProjects={() => setShowProjectManager(true)}
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
          <div className="max-w-4xl mx-auto px-4">
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
                  <MusicCanvas isGenerating={isGenerating} />
                  <AudioPlayer />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showHints && (
                <HintSuggestions onHintClick={(hint) => setPrompt(prev => prev + ' ' + hint)} />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showProjectManager && (
          <ProjectManager
            isOpen={showProjectManager}
            onClose={() => setShowProjectManager(false)}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
          />
        )}
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
    </div>
  );
}

export default App;