import {
  Song,
  Loop,
  Track,
  Hit,
  Generator,
  VisualSong,
  VisualLoop,
  VisualTrack,
  VisualNote,
  getGeneratorColor,
  calculateNotePosition,
  noteToFrequency
} from '../types/LoopmakerTypes';

export class LoopmakerParser {
  private song: Song;
  private beatsPerBar: number;
  private stepsPerBeat: number;
  private secondsPerBeat: number;
  private secondsPerStep: number;

  constructor(song: Song) {
    this.song = song;
    this.beatsPerBar = song.beats_per_bar || 4;
    this.stepsPerBeat = song.steps_per_beat || 4;
    this.secondsPerBeat = 60 / song.bpm;
    this.secondsPerStep = this.secondsPerBeat / this.stepsPerBeat;
  }

  public parseToVisualSong(): VisualSong {
    const loops = this.parseLoops();
    const totalDuration = this.calculateTotalDuration();
    const totalBars = this.calculateTotalBars();

    return {
      bpm: this.song.bpm,
      duration: totalDuration,
      loops,
      totalBars,
      beatsPerBar: this.beatsPerBar,
      stepsPerBeat: this.stepsPerBeat
    };
  }

  private parseLoops(): VisualLoop[] {
    const visualLoops: VisualLoop[] = [];
    let currentTime = 0;
    let globalStepOffset = 0; // Track global step position for proper loop repetition

    for (const loopContext of this.song.loops_in_context) {
      const loop = loopContext.loop;
      const repeatTimes = loopContext.repeat_times || 1;
      const loopDuration = this.calculateLoopDuration(loop);
      const loopSteps = loop.bars * this.beatsPerBar * this.stepsPerBeat;

      for (let repeat = 0; repeat < repeatTimes; repeat++) {
        const visualLoop: VisualLoop = {
          id: `loop_${loopContext.start_bar}_${repeat}`,
          startTime: currentTime,
          duration: loopDuration,
          tracks: this.parseTracks(loop, currentTime, globalStepOffset),
          gain: loop.gain || 1.0,
          mute: loop.mute || false
        };

        visualLoops.push(visualLoop);
        currentTime += loopDuration;
        globalStepOffset += loopSteps; // Increment global step offset for next repetition
      }
    }

    return visualLoops;
  }

  private parseTracks(loop: Loop, startTime: number, globalStepOffset: number = 0): VisualTrack[] {
    const tracks: VisualTrack[] = [];

    for (const [trackId, track] of Object.entries(loop.tracks)) {
      const visualTrack: VisualTrack = {
        id: `${trackId}_${globalStepOffset}`, // Make unique ID for each repetition
        name: this.generateTrackName(track.gen, trackId),
        color: getGeneratorColor(track.gen),
        type: track.gen.type,
        notes: this.parseHits(track.hits, startTime, trackId, globalStepOffset),
        gain: track.gain || 1.0,
        mute: track.mute || false,
        waveform: track.gen.type === 'synth' ? track.gen.waveform : undefined,
        filepath: track.gen.type === 'sampler' ? track.gen.filepath :
                 track.gen.type === 'piano' ? track.gen.folderpath : undefined
      };

      tracks.push(visualTrack);
    }

    return tracks;
  }

  private parseHits(hits: Hit[], startTime: number, trackId: string, globalStepOffset: number = 0): VisualNote[] {
    const notes: VisualNote[] = [];
    // Extract base track ID for consistent grouping across loop repetitions
    const baseTrackId = trackId.split('_').slice(0, -1).join('_') || trackId;

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const globalStep = hit.step + globalStepOffset; // Add global offset for loop repetitions
      const noteStartTime = startTime + (hit.step * this.secondsPerStep);
      const noteDuration = hit.steps * this.secondsPerStep;

      const visualNote: VisualNote = {
        id: `${baseTrackId}_note_${globalStep}_${i}`, // Unique ID using global step
        x: globalStep, // Use global step position for proper timeline placement
        y: calculateNotePosition(hit.note),
        width: hit.steps,
        height: 0.8, // Standard note height
        color: this.calculateNoteColor(hit.note, baseTrackId),
        intensity: this.calculateNoteIntensity(hit.note),
        trackId: baseTrackId, // Use base track ID for consistent grouping
        note: hit.note,
        step: globalStep, // Use global step for visualization
        steps: hit.steps
      };

      notes.push(visualNote);
    }

    return notes;
  }

  private calculateLoopDuration(loop: Loop): number {
    return loop.bars * this.beatsPerBar * this.secondsPerBeat;
  }

  private calculateTotalDuration(): number {
    let totalDuration = 0;

    for (const loopContext of this.song.loops_in_context) {
      const loopDuration = this.calculateLoopDuration(loopContext.loop);
      const repeatTimes = loopContext.repeat_times || 1;
      totalDuration += loopDuration * repeatTimes;
    }

    return totalDuration;
  }

  private calculateTotalBars(): number {
    let totalBars = 0;

    for (const loopContext of this.song.loops_in_context) {
      const repeatTimes = loopContext.repeat_times || 1;
      totalBars += loopContext.loop.bars * repeatTimes;
    }

    return totalBars;
  }

  private generateTrackName(generator: Generator, trackId: string): string {
    switch (generator.type) {
      case 'synth':
        return `${generator.waveform.charAt(0).toUpperCase() + generator.waveform.slice(1)} Synth`;
      case 'sampler':
        const filename = generator.filepath.split('/').pop()?.split('.')[0] || 'Sample';
        return filename.charAt(0).toUpperCase() + filename.slice(1);
      case 'piano':
        return 'Piano';
      default:
        return trackId;
    }
  }

  private calculateNoteColor(note: string, trackId: string): string {
    // Base color with slight variations based on note
    const baseHue = this.noteToHue(note);
    const saturation = 85; // Higher saturation for more vibrant colors
    const lightness = 65;  // Higher lightness for better visibility

    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  }

  private calculateNoteIntensity(note: string): number {
    // Higher notes = higher intensity
    const frequency = noteToFrequency(note);
    const minFreq = 80; // Low bass
    const maxFreq = 2000; // High treble
    
    const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
    return 0.3 + (normalizedFreq * 0.7); // Range from 0.3 to 1.0
  }

  private noteToHue(note: string): number {
    // Map notes to hues in a musical way
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = note.replace(/\d+/, '');
    const noteIndex = noteNames.indexOf(noteName);
    
    if (noteIndex === -1) return 240; // Default blue
    
    // Map to color wheel: C=red, F#=cyan, etc.
    return (noteIndex * 30) % 360;
  }

  // Utility methods for real-time visualization with master timeline sync
  public getNotesAtTime(visualSong: VisualSong, currentTime: number, masterDuration?: number): VisualNote[] {
    const activeNotes: VisualNote[] = [];

    // Use master duration if provided, otherwise fall back to calculated duration
    const effectiveDuration = masterDuration && masterDuration > 0 ? masterDuration : visualSong.duration;

    if (!visualSong || !isFinite(currentTime) || effectiveDuration <= 0) {
      return activeNotes;
    }

    const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;
    const currentStep = (currentTime / effectiveDuration) * totalSteps;

    // Small tolerance for floating point precision
    const tolerance = 0.01; // 0.01 steps tolerance

    // Collect all notes from all loops and check if they're active at current time
    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        if (track.mute || loop.mute) continue;

        for (const note of track.notes) {
          // Check if note is active at current global step position with tolerance
          const noteStartStep = note.step;
          const noteEndStep = noteStartStep + note.steps;

          if (currentStep >= (noteStartStep - tolerance) && currentStep < (noteEndStep + tolerance)) {
            activeNotes.push({
              ...note,
              intensity: note.intensity * track.gain * loop.gain
            });
          }
        }
      }
    }

    return activeNotes;
  }

  public getFrequencyDataFromNotes(notes: VisualNote[]): Uint8Array {
    // Simulate frequency data based on active notes
    const frequencyData = new Uint8Array(256);
    
    for (const note of notes) {
      const frequency = noteToFrequency(note.note);
      const binIndex = Math.floor((frequency / 22050) * 256); // Nyquist frequency
      
      if (binIndex < 256) {
        const intensity = Math.floor(note.intensity * 255);
        frequencyData[binIndex] = Math.max(frequencyData[binIndex], intensity);
        
        // Add harmonics
        for (let harmonic = 2; harmonic <= 4; harmonic++) {
          const harmonicBin = Math.floor(binIndex * harmonic);
          if (harmonicBin < 256) {
            const harmonicIntensity = Math.floor(intensity / harmonic);
            frequencyData[harmonicBin] = Math.max(frequencyData[harmonicBin], harmonicIntensity);
          }
        }
      }
    }

    return frequencyData;
  }

  public getCurrentSection(visualSong: VisualSong, currentTime: number): string {
    for (let i = 0; i < visualSong.loops.length; i++) {
      const loop = visualSong.loops[i];
      if (currentTime >= loop.startTime && currentTime <= loop.startTime + loop.duration) {
        return `Section ${i + 1}`;
      }
    }
    return 'Intro';
  }

  public getProgressPercentage(visualSong: VisualSong, currentTime: number): number {
    return Math.max(0, Math.min(100, (currentTime / visualSong.duration) * 100));
  }
}

// Factory function for easy usage
export function createLoopmakerParser(songData: Song): LoopmakerParser {
  return new LoopmakerParser(songData);
}

// Utility function to load and parse song from JSON
export async function loadSongFromJSON(jsonPath: string): Promise<VisualSong> {
  try {
    const response = await fetch(jsonPath);
    const songData: Song = await response.json();
    const parser = new LoopmakerParser(songData);
    return parser.parseToVisualSong();
  } catch (error) {
    console.error('Error loading song JSON:', error);
    throw error;
  }
}
