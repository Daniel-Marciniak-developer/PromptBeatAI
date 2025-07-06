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
    // NOWE: Grupuj wszystkie hity według unikalnych kombinacji instrument+nuta
    const groupedTracks = this.groupTracksByInstrumentAndNote();
    const totalDuration = this.calculateTotalDuration();
    const totalBars = this.calculateTotalBars();

    // Stwórz jeden loop z pogrupowanymi trackami
    const visualLoop: VisualLoop = {
      id: 'grouped_tracks',
      startTime: 0,
      duration: totalDuration,
      tracks: groupedTracks,
      gain: 1.0,
      mute: false
    };

    return {
      bpm: this.song.bpm,
      duration: totalDuration,
      loops: [visualLoop], // Jeden loop z wszystkimi pogrupowanymi trackami
      totalBars,
      beatsPerBar: this.beatsPerBar,
      stepsPerBeat: this.stepsPerBeat
    };
  }

  // NAPRAWIONA FUNKCJA: Grupuj wszystkie hity według unikalnych NUT (nie instrument+nuta!)
  private groupTracksByInstrumentAndNote(): VisualTrack[] {
    const trackGroups = new Map<string, {
      note: string;
      hits: Array<{ hit: Hit; startTime: number; globalStep: number; generator: Generator; originalTrackId: string }>;
    }>();

    let globalStepOffset = 0;

    // Przejdź przez wszystkie loopy i zbierz wszystkie hity
    for (const loopContext of this.song.loops_in_context) {
      const loop = loopContext.loop;
      const repeatTimes = loopContext.repeat_times || 1;
      const loopDuration = this.calculateLoopDuration(loop);
      const stepsPerLoop = loop.bars * this.beatsPerBar * this.stepsPerBeat;

      for (let repeat = 0; repeat < repeatTimes; repeat++) {
        const currentTime = globalStepOffset * this.secondsPerStep;

        // Przejdź przez wszystkie tracki w tym loopie
        for (const [trackId, track] of Object.entries(loop.tracks)) {
          // Przejdź przez wszystkie hity w tym tracku
          for (const hit of track.hits) {
            // KLUCZ TO NUTA + KATEGORIA INSTRUMENTU - każda kombinacja ma swój wiersz!
            const category = this.determineInstrumentCategory(track.gen, trackId);
            const uniqueKey = `${hit.note}_${category}`;

            // Jeśli grupa nie istnieje, stwórz ją
            if (!trackGroups.has(uniqueKey)) {
              trackGroups.set(uniqueKey, {
                note: hit.note,
                hits: []
              });
            }

            // Dodaj hit do grupy
            const group = trackGroups.get(uniqueKey)!;
            group.hits.push({
              hit,
              startTime: currentTime,
              globalStep: hit.step + globalStepOffset,
              generator: track.gen,
              originalTrackId: trackId
            });
          }
        }

        globalStepOffset += stepsPerLoop;
      }
    }

    // Konwertuj grupy na VisualTrack
    const visualTracks: VisualTrack[] = [];

    // Sortuj grupy według nut (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) i oktaw
    const sortedGroups = Array.from(trackGroups.entries()).sort(([a], [b]) => {
      return this.compareNotes(a, b);
    });

    for (const [noteKey, group] of sortedGroups) {
      // Sortuj hity według globalStep
      group.hits.sort((a, b) => a.globalStep - b.globalStep);

      // Połącz sąsiadujące bloki w ciągłe segmenty
      const mergedNotes = this.mergeAdjacentNotes(group.hits, noteKey);

      // Wybierz pierwszy generator dla koloru (wszystkie hity tej nuty będą miały ten sam kolor)
      const firstGenerator = group.hits[0].generator;

      // Określ kategorię instrumentu dla obramowania
      const category = this.determineInstrumentCategory(firstGenerator, group.hits[0].originalTrackId);
      const borderColor = this.getCategoryBorderColor(category);

      // Stwórz VisualTrack dla tej grupy (jedna nuta = jeden wiersz)
      const visualTrack: VisualTrack = {
        id: noteKey,
        name: group.note, // Pełna nazwa nuty z oktawą
        color: this.calculateNoteTrackColor(group.note), // Kolor bazowany na nucie
        borderColor: borderColor, // Kolor obramowania kategorii
        category: category, // Kategoria instrumentu
        type: firstGenerator.type,
        notes: mergedNotes,
        gain: 1.0,
        mute: false,
        waveform: firstGenerator.type === 'synth' ? firstGenerator.waveform : undefined,
        filepath: firstGenerator.type === 'sampler' ? firstGenerator.filepath :
                 firstGenerator.type === 'piano' ? firstGenerator.folderpath : undefined
      };

      visualTracks.push(visualTrack);
    }

    return visualTracks;
  }

  // Funkcja do generowania koloru tracka bazowanego na nucie
  private calculateNoteTrackColor(note: string): string {
    // Użyj tej samej logiki co dla pojedynczych nut, ale z większą saturacją dla tracka
    const baseHue = this.noteToHue(note);
    const saturation = 70; // Nieco mniejsza saturacja dla tła tracka
    const lightness = 45;  // Ciemniejszy dla tła tracka

    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  }

  // Funkcja do porównywania nut dla sortowania
  private compareNotes(noteA: string, noteB: string): number {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Wyciągnij nazwę nuty i oktawę
    const parseNote = (note: string) => {
      const match = note.match(/^([A-G]#?)(\d+)$/);
      if (!match) return { noteName: note, octave: 0 };
      return { noteName: match[1], octave: parseInt(match[2]) };
    };

    const parsedA = parseNote(noteA);
    const parsedB = parseNote(noteB);

    // Najpierw sortuj według oktawy
    if (parsedA.octave !== parsedB.octave) {
      return parsedA.octave - parsedB.octave;
    }

    // Potem według nazwy nuty
    const indexA = noteOrder.indexOf(parsedA.noteName);
    const indexB = noteOrder.indexOf(parsedB.noteName);

    return indexA - indexB;
  }

  // Funkcja do łączenia sąsiadujących bloków
  private mergeAdjacentNotes(hits: Array<{ hit: Hit; startTime: number; globalStep: number; generator: Generator; originalTrackId: string }>, noteKey: string): VisualNote[] {
    if (hits.length === 0) return [];

    const mergedNotes: VisualNote[] = [];
    let currentSegment: VisualNote | null = null;

    for (let i = 0; i < hits.length; i++) {
      const { hit, startTime, globalStep, generator, originalTrackId } = hits[i];

      if (!currentSegment) {
        // Rozpocznij nowy segment
        currentSegment = {
          id: `${noteKey}_note_${globalStep}_${i}`,
          x: globalStep,
          y: calculateNotePosition(hit.note),
          width: hit.steps,
          height: 0.8,
          color: this.calculateNoteColor(hit.note, noteKey),
          intensity: this.calculateNoteIntensity(hit.note),
          trackId: noteKey,
          note: hit.note,
          step: globalStep,
          steps: hit.steps
        };
      } else {
        // Sprawdź czy ten hit jest sąsiadujący z poprzednim segmentem
        const segmentEnd = currentSegment.x + currentSegment.width;
        const gap = globalStep - segmentEnd;

        if (gap <= 1) { // Jeśli przerwa jest 1 step lub mniej, połącz
          // Rozszerz obecny segment
          currentSegment.width = (globalStep + hit.steps) - currentSegment.x;
          currentSegment.steps = currentSegment.width;
        } else {
          // Przerwa jest za duża, zakończ obecny segment i rozpocznij nowy
          mergedNotes.push(currentSegment);

          currentSegment = {
            id: `${noteKey}_note_${globalStep}_${i}`,
            x: globalStep,
            y: calculateNotePosition(hit.note),
            width: hit.steps,
            height: 0.8,
            color: this.calculateNoteColor(hit.note, noteKey),
            intensity: this.calculateNoteIntensity(hit.note),
            trackId: noteKey,
            note: hit.note,
            step: globalStep,
            steps: hit.steps
          };
        }
      }
    }

    // Dodaj ostatni segment
    if (currentSegment) {
      mergedNotes.push(currentSegment);
    }

    return mergedNotes;
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

  // Funkcja do określania kategorii instrumentu
  private determineInstrumentCategory(generator: Generator, trackId?: string): string {
    if (generator.type === 'piano') {
      return 'Piano';
    }

    if (generator.type === 'synth') {
      // Najpierw sprawdź nazwę tracka jeśli jest dostępna
      if (trackId) {
        const trackName = trackId.toLowerCase();
        if (trackName.includes('bass')) {
          return 'Bass Synth';
        }
        if (trackName.includes('lead')) {
          return 'Lead Synth';
        }
        if (trackName.includes('pad')) {
          return 'Pad Synth';
        }
        if (trackName.includes('arp')) {
          return 'Arp Synth';
        }
      }

      // Kategoryzuj syntezatory według waveform
      switch (generator.waveform) {
        case 'sine':
          return 'Pad Synth';
        case 'sawtooth':
          return 'Bass Synth';
        case 'square':
          return 'Lead Synth';
        case 'triangle':
          return 'Soft Synth';
        default:
          return 'Synth';
      }
    }

    if (generator.type === 'sampler') {
      const filepath = generator.filepath.toLowerCase();

      // Kategoryzuj sample według nazwy pliku
      if (filepath.includes('kick') || filepath.includes('bd')) {
        return 'Kick';
      }
      if (filepath.includes('snare') || filepath.includes('sd')) {
        return 'Snare';
      }
      if (filepath.includes('hihat') || filepath.includes('hh') || filepath.includes('hat')) {
        return 'Hi-Hat';
      }
      if (filepath.includes('crash') || filepath.includes('cymbal')) {
        return 'Cymbals';
      }
      if (filepath.includes('perc') || filepath.includes('shaker') || filepath.includes('tambourine')) {
        return 'Percussion';
      }
      if (filepath.includes('bass')) {
        return 'Bass Sample';
      }
      if (filepath.includes('lead') || filepath.includes('melody')) {
        return 'Lead Sample';
      }
      if (filepath.includes('pad') || filepath.includes('string')) {
        return 'Pad Sample';
      }
      if (filepath.includes('vocal') || filepath.includes('voice')) {
        return 'Vocals';
      }
      if (filepath.includes('fx') || filepath.includes('effect')) {
        return 'FX';
      }

      return 'Sample';
    }

    return 'Unknown';
  }

  // Funkcja do generowania koloru obramowania kategorii
  private getCategoryBorderColor(category: string): string {
    const categoryColors: Record<string, string> = {
      'Piano': '#FFD700',           // Złoty
      'Pad Synth': '#00CED1',       // Turkusowy
      'Bass Synth': '#FF4500',      // Pomarańczowo-czerwony
      'Lead Synth': '#00FF00',      // Zielony
      'Arp Synth': '#DDA0DD',       // Śliwkowy
      'Soft Synth': '#9370DB',      // Fioletowy
      'Synth': '#9370DB',           // Fioletowy
      'Kick': '#DC143C',            // Czerwony
      'Snare': '#FF69B4',           // Różowy
      'Hi-Hat': '#00FFFF',          // Cyjan
      'Cymbals': '#FFE4B5',         // Beżowy
      'Percussion': '#FFA500',      // Pomarańczowy
      'Bass Sample': '#8B0000',     // Ciemno-czerwony
      'Lead Sample': '#1E90FF',     // Niebieski
      'Pad Sample': '#98FB98',      // Jasno-zielony
      'Vocals': '#FF1493',          // Głęboki różowy
      'FX': '#800080',              // Fioletowy
      'Sample': '#696969',          // Szary
      'Unknown': '#808080'          // Szary
    };

    return categoryColors[category] || '#808080';
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
