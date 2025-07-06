// TypeScript interfaces based on Loopmaker JSON schemas

export interface AHDSREnvelope {
  attack_ms: number;
  hold_ms: number;
  decay_ms: number;
  sustain_level: number;
  release_ms: number;
}

export interface SynthSettings {
  type: 'synth';
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  ahdsr_envelope: AHDSREnvelope;
  amplitude: number;
  sample_rate: number;
}

export interface SamplerSettings {
  type: 'sampler';
  filepath: string;
}

export interface PianoSettings {
  type: 'piano';
  folderpath: string;
}

export type Generator = SynthSettings | SamplerSettings | PianoSettings;

export interface Hit {
  step: number;
  note: string;
  steps: number;
}

export interface Track {
  gen: Generator;
  hits: Hit[];
  gain?: number;
  mute?: boolean;
}

export interface Loop {
  bars: number;
  gain?: number;
  mute?: boolean;
  tracks: Record<string, Track>;
}

export interface LoopInContext {
  loop: Loop;
  start_bar: number;
  repeat_times?: number;
}

export interface Song {
  bpm: number;
  beats_per_bar?: number;
  steps_per_beat?: number;
  loops_in_context: LoopInContext[];
}

// Visualization-specific types
export interface VisualNote {
  id: string;
  x: number; // time position (0-1)
  y: number; // pitch position (0-1)
  width: number; // duration (0-1)
  height: number; // note height
  color: string;
  intensity: number; // based on gain
  trackId: string;
  note: string;
  step: number;
  steps: number;
}

export interface VisualTrack {
  id: string;
  name: string;
  color: string;
  borderColor?: string; // Kolor obramowania dla grupy instrumentów
  category?: string; // Kategoria instrumentu (Piano, Kick/Bass Drum, itd.)
  type: 'synth' | 'sampler' | 'piano';
  notes: VisualNote[];
  gain: number;
  mute: boolean;
  waveform?: string;
  filepath?: string;
}

export interface VisualLoop {
  id: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  tracks: VisualTrack[];
  gain: number;
  mute: boolean;
}

export interface VisualSong {
  bpm: number;
  duration: number; // total duration in seconds
  loops: VisualLoop[];
  totalBars: number;
  beatsPerBar: number;
  stepsPerBeat: number;
}

// Color schemes for different generator types - High contrast and vibrant
export const GENERATOR_COLORS = {
  synth: {
    sine: '#00D4FF',      // Bright cyan - smooth waves
    square: '#FF4757',    // Bright red - sharp edges
    sawtooth: '#FFA502',  // Bright orange - jagged
    triangle: '#2ED573'   // Bright green - triangular
  },
  sampler: '#A55EEA',     // Bright purple - samples
  piano: '#74B9FF'        // Bright blue - classic piano
} as const;

// Note to frequency mapping (for visualization)
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
  'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
  'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
  'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83,
  'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
  'C8': 4186.01
};

// Utility functions
export function noteToMidiNumber(note: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60; // Default to C4
  
  const noteName = match[1];
  const octave = parseInt(match[2]);
  const noteIndex = noteNames.indexOf(noteName);
  
  return (octave + 1) * 12 + noteIndex;
}

export function midiNumberToFrequency(midiNumber: number): number {
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export function noteToFrequency(note: string): number {
  return NOTE_FREQUENCIES[note] || 440;
}

export function getGeneratorColor(generator: Generator): string {
  switch (generator.type) {
    case 'synth':
      return GENERATOR_COLORS.synth[generator.waveform];
    case 'sampler':
      return GENERATOR_COLORS.sampler;
    case 'piano':
      return GENERATOR_COLORS.piano;
    default:
      return '#6B7280';
  }
}

export function calculateNotePosition(note: string, minNote: string = 'C2', maxNote: string = 'C6'): number {
  const noteFreq = noteToFrequency(note);
  const minFreq = noteToFrequency(minNote);
  const maxFreq = noteToFrequency(maxNote);
  
  // Logarithmic scale for better visual distribution
  const logNote = Math.log(noteFreq);
  const logMin = Math.log(minFreq);
  const logMax = Math.log(maxFreq);
  
  return Math.max(0, Math.min(1, (logNote - logMin) / (logMax - logMin)));
}
