import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import PromptSection from './components/PromptSection';
import MusicCanvas from './components/MusicCanvas';
import AdvancedPanel from './components/AdvancedPanel';
import AudioPlayer from './components/AudioPlayer';
import HintSuggestions from './components/HintSuggestions';
import './styles/globals.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHints, setShowHints] = useState(false);

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

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Background fog overlay */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none" />
      
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent-from/20 to-accent-to/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-accent-to/15 to-accent-from/15 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4">
          <PromptSection
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            hasGenerated={hasGenerated}
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

          <AdvancedPanel 
            isOpen={showAdvanced} 
            onToggle={() => setShowAdvanced(!showAdvanced)} 
          />

          <AnimatePresence>
            {showHints && (
              <HintSuggestions onHintClick={(hint) => setPrompt(prev => prev + ' ' + hint)} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;