import React, { useState } from 'react';
import { generateAndWaitForSong, GenerationPrompt } from '../services/api';
import { Song } from '../types/LoopmakerTypes';

interface SongGeneratorProps {
  onSongGenerated?: (song: Song) => void;
}

export const SongGenerator: React.FC<SongGeneratorProps> = ({ onSongGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [bpm, setBpm] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'pending' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedSong(null);

    try {
      const generationPrompt: GenerationPrompt = {
        text_prompt: prompt,
        other_settings: {
          bpm: bpm,
        },
      };

      const song = await generateAndWaitForSong(generationPrompt, (progressStatus) => {
        setStatus(progressStatus);
      });

      setGeneratedSong(song);
      setStatus('complete');
      onSongGenerated?.(song);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'generating':
        return 'Starting generation...';
      case 'pending':
        return 'Generating your song...';
      case 'complete':
        return 'Song generated successfully!';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Generate Song</h2>
      
      {/* Prompt Input */}
      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Music Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the music you want to create..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={isGenerating}
        />
      </div>

      {/* BPM Input */}
      <div className="mb-4">
        <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 mb-2">
          BPM (Beats Per Minute)
        </label>
        <input
          id="bpm"
          type="number"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
          min="60"
          max="200"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isGenerating}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isGenerating || !prompt.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Song'}
      </button>

      {/* Status Message */}
      {status !== 'idle' && (
        <div className="mt-4">
          <div className={`p-3 rounded-md ${
            status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {getStatusMessage()}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Generated Song Info */}
      {generatedSong && (
        <div className="mt-4 p-4 bg-green-100 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">Song Generated!</h3>
          <div className="text-sm text-green-700">
            <p>BPM: {generatedSong.bpm}</p>
            <p>Beats per bar: {generatedSong.beats_per_bar || 4}</p>
            <p>Steps per beat: {generatedSong.steps_per_beat || 4}</p>
            <p>Loops: {generatedSong.loops_in_context.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};
