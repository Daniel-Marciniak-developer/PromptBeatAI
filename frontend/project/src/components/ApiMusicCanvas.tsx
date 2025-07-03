import React, { useState, useEffect, useMemo } from 'react';
import { Song } from '../types/LoopmakerTypes';
import { LoopmakerParser } from '../utils/LoopmakerParser';
import EnhancedMusicCanvas from './EnhancedMusicCanvas';

interface ApiMusicCanvasProps {
  song: Song | null;
  isGenerating: boolean;
  apiStatus: 'idle' | 'generating' | 'pending' | 'complete' | 'error';
  apiError: string | null;
  title?: string;
  artist?: string;
  onShare?: () => void;
  onDownload?: (format: string, quality: string) => void;
  onAddToFavorites?: () => void;
  isFavorite?: boolean;
  autoPlay?: boolean;
}

export const ApiMusicCanvas: React.FC<ApiMusicCanvasProps> = ({
  song,
  isGenerating,
  apiStatus,
  apiError,
  title = "AI Generated Track",
  artist = "PromptBeat AI",
  onShare,
  onDownload,
  onAddToFavorites,
  isFavorite = false,
  autoPlay = false
}) => {
  const [songDataUrl, setSongDataUrl] = useState<string | null>(null);

  // Konwertuj Song object na blob URL dla EnhancedMusicCanvas
  useEffect(() => {
    if (song) {
      try {
        // Konwertuj Song object na JSON string
        const songJson = JSON.stringify(song, null, 2);
        
        // Stwórz blob URL
        const blob = new Blob([songJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        setSongDataUrl(url);
        
        // Cleanup function
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('Error creating song data URL:', error);
        setSongDataUrl(null);
      }
    } else {
      setSongDataUrl(null);
    }
  }, [song]);

  // Status overlay component
  const StatusOverlay = () => {
    if (apiStatus === 'idle') return null;

    const getStatusInfo = () => {
      switch (apiStatus) {
        case 'generating':
          return {
            title: 'Starting Generation...',
            description: 'Preparing your music request',
            color: 'bg-blue-500/20 border-blue-500/30',
            textColor: 'text-blue-300',
            showSpinner: true
          };
        case 'pending':
          return {
            title: 'Generating Music...',
            description: 'AI is creating your track',
            color: 'bg-purple-500/20 border-purple-500/30',
            textColor: 'text-purple-300',
            showSpinner: true
          };
        case 'complete':
          return {
            title: 'Generation Complete!',
            description: 'Your music is ready',
            color: 'bg-green-500/20 border-green-500/30',
            textColor: 'text-green-300',
            showSpinner: false
          };
        case 'error':
          return {
            title: 'Generation Failed',
            description: apiError || 'An error occurred',
            color: 'bg-red-500/20 border-red-500/30',
            textColor: 'text-red-300',
            showSpinner: false
          };
        default:
          return null;
      }
    };

    const statusInfo = getStatusInfo();
    if (!statusInfo) return null;

    return (
      <div className={`absolute inset-0 z-10 flex items-center justify-center ${statusInfo.color} border rounded-lg backdrop-blur-sm`}>
        <div className="text-center p-8">
          {statusInfo.showSpinner && (
            <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4"></div>
          )}
          <h3 className={`text-xl font-bold ${statusInfo.textColor} mb-2`}>
            {statusInfo.title}
          </h3>
          <p className="text-white/60">
            {statusInfo.description}
          </p>
        </div>
      </div>
    );
  };



  // Jeśli mamy wygenerowaną piosenkę, użyj jej danych
  if (song && songDataUrl && apiStatus === 'complete') {
    return (
      <div className="relative">
        <EnhancedMusicCanvas
          isGenerating={false}
          audioSrc="/beat-freestyle.mp3" // Placeholder audio
          songDataSrc={songDataUrl} // Użyj wygenerowanych danych
          title={title}
          artist={artist}
          bpm={song.bpm}
          onShare={onShare}
          onDownload={onDownload}
          onAddToFavorites={onAddToFavorites}
          isFavorite={isFavorite}
          autoPlay={autoPlay}
        />
      </div>
    );
  }

  // Fallback - użyj domyślnych danych z overlay statusu
  return (
    <div className="relative">
      <EnhancedMusicCanvas
        isGenerating={isGenerating}
        audioSrc="/beat-freestyle.mp3"
        songDataSrc="/beat-freestyle.json" // Fallback do przykładowych danych
        title={title}
        artist={artist}
        bpm={128}
        onShare={onShare}
        onDownload={onDownload}
        onAddToFavorites={onAddToFavorites}
        isFavorite={isFavorite}
        autoPlay={autoPlay}
      />
      <StatusOverlay />
    </div>
  );
};
