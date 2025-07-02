// API client for PromptBeatAI backend
import { Song } from '../../types/LoopmakerTypes';

// Konfiguracja API
const API_BASE_URL = 'http://localhost:8000';

// Typy dla API
export interface GenerationPrompt {
  text_prompt: string;
  other_settings: Record<string, any>;
  reference_composition?: Song;
}

export interface GenerationResponse {
  id: string;
  mode: 'mock' | 'openai';
}

export interface SongStatusResponse {
  id: string;
  status: 'pending' | 'complete' | 'error';
  result?: Song;
  error?: string;
}

// Klasa API Client
export class PromptBeatAIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Rozpoczyna generowanie piosenki
   * @param prompt - Prompt do generowania muzyki
   * @returns Promise z ID piosenki
   */
  async generateSong(prompt: GenerationPrompt): Promise<GenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating song:', error);
      throw error;
    }
  }

  /**
   * Sprawdza status generowania piosenki
   * @param songId - ID piosenki
   * @returns Promise ze statusem piosenki
   */
  async getSongStatus(songId: string): Promise<SongStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/song/${songId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Song not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting song status:', error);
      throw error;
    }
  }

  /**
   * Polling - czeka na ukończenie generowania piosenki
   * @param songId - ID piosenki
   * @param maxAttempts - Maksymalna liczba prób (domyślnie 30)
   * @param intervalMs - Interwał między próbami w ms (domyślnie 2000)
   * @returns Promise z ukończoną piosenką
   */
  async waitForSong(
    songId: string, 
    maxAttempts: number = 30, 
    intervalMs: number = 2000
  ): Promise<Song> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getSongStatus(songId);
      
      if (status.status === 'complete' && status.result) {
        return status.result;
      }
      
      if (status.status === 'error') {
        throw new Error(status.error || 'Song generation failed');
      }
      
      // Czekaj przed następną próbą
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Timeout: Song generation took too long');
  }

  /**
   * Kompletny workflow - generuje piosenkę i czeka na wynik
   * @param prompt - Prompt do generowania muzyki
   * @param onProgress - Callback wywoływany podczas oczekiwania
   * @returns Promise z ukończoną piosenką
   */
  async generateAndWaitForSong(
    prompt: GenerationPrompt,
    onProgress?: (status: 'generating' | 'pending' | 'complete') => void
  ): Promise<Song> {
    // Rozpocznij generowanie
    onProgress?.('generating');
    const response = await this.generateSong(prompt);
    
    // Czekaj na wynik
    onProgress?.('pending');
    const song = await this.waitForSong(response.id);
    
    onProgress?.('complete');
    return song;
  }
}

// Eksportuj domyślną instancję
export const promptBeatAI = new PromptBeatAIClient();

// Eksportuj również funkcje pomocnicze
export const generateSong = (prompt: GenerationPrompt) => promptBeatAI.generateSong(prompt);
export const getSongStatus = (songId: string) => promptBeatAI.getSongStatus(songId);
export const waitForSong = (songId: string) => promptBeatAI.waitForSong(songId);
export const generateAndWaitForSong = (
  prompt: GenerationPrompt, 
  onProgress?: (status: 'generating' | 'pending' | 'complete') => void
) => promptBeatAI.generateAndWaitForSong(prompt, onProgress);
