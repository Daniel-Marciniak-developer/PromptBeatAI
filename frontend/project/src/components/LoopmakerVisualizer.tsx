import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { VisualSong, VisualNote, VisualTrack } from '../types/LoopmakerTypes';
import { LoopmakerParser } from '../utils/LoopmakerParser';

interface LoopmakerVisualizerProps {
  visualSong: VisualSong | null;
  currentTime: number;
  isPlaying: boolean;
  parser?: LoopmakerParser | null;
  className?: string;
  type?: 'pianoRoll' | 'waveform' | 'circular' | 'spectrogram';
  onSeek?: (time: number) => void;
  // New props for integrated controls
  duration?: number;
  volume?: number;
  bpm?: number;
  onPlayPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  externalGetAllTracks?: () => any[];
}

const LoopmakerVisualizer: React.FC<LoopmakerVisualizerProps> = ({
  visualSong,
  currentTime,
  isPlaying,
  className = '',
  onSeek,
  // New props for integrated controls
  duration = 0,
  volume = 80,
  onPlayPause,
  onVolumeChange,
  externalGetAllTracks
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: 1200, // Domyślna szerokość, zostanie zaktualizowana
    height: 600
  }); // Responsywny rozmiar

  // PromptBeatAI Color Scheme - dopasowane do projektu
  const colors = {
    primary: '#6f00ff',      // Fioletowy główny
    secondary: '#00ff88',    // Neonowa zieleń
    tertiary: '#ff0080',     // Neonowy róż
    background: '#0a0a0a',   // Czarne tło
    panel: 'rgba(10, 10, 10, 0.98)', // Ciemniejsze panel tło
    trackBg: 'rgba(20, 20, 20, 0.8)', // Tło tracków
    trackBorder: 'rgba(111, 0, 255, 0.3)', // Obramowanie tracków
    text: '#ffffff',         // Biały tekst
    textSecondary: '#a0a0a0', // Szary tekst
    noteActive: '#00ff88',   // Aktywne nuty
    noteInactive: 'rgba(0, 255, 136, 0.4)', // Nieaktywne nuty
    playhead: '#ff0080'      // Kolor playheada
  };

  // NOWA PALETA - bardzo różnorodne kolory, unikające kolorów kategorii (czerwone, niebieskie, zielone)
  const trackRowColors = [
    '#FF69B4', // Hot Pink
    '#FF1493', // Deep Pink
    '#DA70D6', // Orchid
    '#BA55D3', // Medium Orchid
    '#9370DB', // Medium Purple
    '#8A2BE2', // Blue Violet
    '#9932CC', // Dark Orchid
    '#FF4500', // Orange Red
    '#FF6347', // Tomato
    '#FF7F50', // Coral
    '#FFA500', // Orange
    '#FFD700', // Gold
    '#FFFF00', // Yellow
    '#ADFF2F', // Green Yellow
    '#7FFF00', // Chartreuse
    '#32CD32', // Lime Green
    '#00FF7F', // Spring Green
    '#00FA9A', // Medium Spring Green
    '#40E0D0', // Turquoise
    '#48D1CC', // Medium Turquoise
    '#00CED1', // Dark Turquoise
    '#5F9EA0', // Cadet Blue
    '#4682B4', // Steel Blue
    '#6495ED', // Cornflower Blue
    '#87CEEB', // Sky Blue
    '#87CEFA', // Light Sky Blue
    '#B0C4DE', // Light Steel Blue
    '#DDA0DD', // Plum
    '#EE82EE', // Violet
    '#D8BFD8'  // Thistle
  ];

  // NOWA FUNKCJA: Unikalny kolor dla każdego WIERSZA na podstawie nazwy nuty
  const getEnhancedTrackColor = useCallback((track: VisualTrack, trackId: string): string => {
    // Użyj pełnego klucza trackId do determinowania koloru (każdy track = inny kolor)
    const uniqueKey = trackId;

    // Stwórz stabilny hash z pełnego klucza
    let hash = 0;
    for (let i = 0; i < uniqueKey.length; i++) {
      const char = uniqueKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Użyj hash do wyboru koloru z palety - dodaj offset żeby uniknąć pierwszych kolorów
    const colorIndex = (Math.abs(hash) + 7) % trackRowColors.length; // +7 offset dla większej różnorodności
    const selectedColor = trackRowColors[colorIndex];

    // Kolory są teraz różnorodne i unikalne dla każdego tracka

    return selectedColor;
  }, []);

  // Funkcja do muzycznego porównywania nut (C2 < C3 < C4, C < C# < D, itp.)
  const compareNotesMusicially = useCallback((noteA: string, noteB: string): number => {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Parsuj nuty (np. "C#3" -> {note: "C#", octave: 3})
    const parseNote = (note: string) => {
      const match = note.match(/^([A-G]#?)(\d+)$/);
      if (!match) return { note: note, octave: 0 };
      return { note: match[1], octave: parseInt(match[2]) };
    };

    const parsedA = parseNote(noteA);
    const parsedB = parseNote(noteB);

    // Najpierw sortuj według oktawy (niższe oktawy pierwsze)
    if (parsedA.octave !== parsedB.octave) {
      return parsedA.octave - parsedB.octave;
    }

    // Potem według nazwy nuty w kolejności muzycznej
    const indexA = noteOrder.indexOf(parsedA.note);
    const indexB = noteOrder.indexOf(parsedB.note);

    return indexA - indexB;
  }, []);

  // Get border color for instrument groups
  const getInstrumentBorderColor = useCallback((track: VisualTrack): string => {
    const trackType = track.type?.toLowerCase() || '';
    const filepath = track.filepath?.toLowerCase() || '';
    const waveform = track.waveform?.toLowerCase() || '';

    // LOGICZNE GRUPOWANIE KOLORÓW - podobne instrumenty obok siebie

    // GRUPA SAMPLER - CZERWONE ODCIENIE (perkusja i sample)
    if (trackType === 'sampler') {
      if (filepath.includes('kick') || filepath.includes('bd')) {
        return '#FF0000'; // Jasny czerwony - KICK
      }
      if (filepath.includes('snare') || filepath.includes('sd')) {
        return '#CC0000'; // Ciemny czerwony - SNARE
      }
      if (filepath.includes('hat') || filepath.includes('hh') || filepath.includes('hihat')) {
        return '#FF3333'; // Średni czerwony - HI-HAT
      }
      if (filepath.includes('crash') || filepath.includes('cymbal') || filepath.includes('ride')) {
        return '#990000'; // Bardzo ciemny czerwony - CYMBALS
      }
      if (filepath.includes('perc') || filepath.includes('shaker') || filepath.includes('tambourine')) {
        return '#FF6666'; // Jasny czerwony - PERCUSSION
      }
      // Pozostałe sample
      return '#AA0000'; // Domyślny czerwony dla sampler
    }

    // GRUPA PIANO - NIEBIESKIE ODCIENIE (wszystkie nuty piano)
    if (trackType === 'piano') {
      return '#0066FF'; // Niebieski dla wszystkich nut piano
    }

    // GRUPA SYNTH - RÓŻNE KOLORY według waveform i zastosowania
    if (trackType === 'synth') {
      // Bass synth (niskie nuty) - ZIELONE ODCIENIE
      if (waveform === 'sawtooth' || filepath.includes('bass')) {
        return '#00AA00'; // Zielony - BASS SYNTH
      }

      // Lead synth (wysokie nuty) - ŻÓŁTE ODCIENIE
      if (waveform === 'square' || filepath.includes('lead')) {
        return '#FFAA00'; // Pomarańczowo-żółty - LEAD SYNTH
      }

      // Pad synth (harmonie) - FIOLETOWE ODCIENIE
      if (waveform === 'sine' || filepath.includes('pad')) {
        return '#AA00FF'; // Fioletowy - PAD SYNTH
      }

      // Pluck/Arp synth - TURKUSOWE ODCIENIE
      if (waveform === 'triangle' || filepath.includes('pluck') || filepath.includes('arp')) {
        return '#00AAFF'; // Turkusowy - PLUCK/ARP SYNTH
      }

      // Pozostałe synth
      return '#0088AA'; // Domyślny niebieski dla synth
    }

    // FALLBACK - SZARE ODCIENIE dla nieznanych
    return '#888888'; // Szary dla nieznanych typów
  }, []);

  // Funkcja do czyszczenia nazw ścieżek - ULEPSZONA: lepsze nazwy dla dźwięków
  const getCleanTrackName = useCallback((trackName: string): string => {
    if (!trackName) return 'Unknown Track';

    // Usuń ścieżkę - obsłuż zarówno / jak i \ oraz mieszane ścieżki
    let fileName = trackName;

    // Znajdź ostatni separator ścieżki
    const lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
    if (lastSlash !== -1) {
      fileName = fileName.substring(lastSlash + 1);
    }

    // Usuń rozszerzenie pliku
    const nameWithoutExt = fileName.replace(/\.(wav|mp3|ogg|flac|aiff|m4a)$/i, '');

    // Jeśli nazwa jest pusta po czyszczeniu, użyj oryginalnej
    if (!nameWithoutExt.trim()) {
      return trackName;
    }

    // Kapitalizuj pierwszą literę i zamień podkreślenia/myślniki na spacje
    let cleanName = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\s*\d+$/, '') // Usuń cyfry na końcu (indeksy loop)
      .trim();

    // Mapuj popularne nazwy na bardziej czytelne
    const nameMap: { [key: string]: string } = {
      'lofi kick': 'Lo-Fi Kick',
      'lofi snare': 'Lo-Fi Snare',
      'lofi hat': 'Lo-Fi Hat',
      'lo fi kick': 'Lo-Fi Kick',
      'lo fi snare': 'Lo-Fi Snare',
      'lo fi hat': 'Lo-Fi Hat',
      'sine synth': 'Sine Synth',
      'piano': 'Piano',
      'kick': 'Kick',
      'snare': 'Snare',
      'hihat': 'Hi-Hat',
      'hat': 'Hat',
      'bass': 'Bass',
      'lead': 'Lead',
      'pad': 'Pad',
      'pluck': 'Pluck'
    };

    // Sprawdź czy nazwa pasuje do mapy
    const lowerName = cleanName.toLowerCase();
    for (const [key, value] of Object.entries(nameMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }, []);

  // Update container size on resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Użyj całej dostępnej szerokości i wysokości kontenera
        const availableWidth = rect.width; // Pełna szerokość kontenera
        const availableHeight = rect.height; // Pełna wysokość kontenera
        setContainerSize({
          width: availableWidth, // Dokładnie szerokość kontenera
          height: availableHeight // Dokładnie wysokość kontenera
        });
      }
    };

    const timeoutId = setTimeout(updateContainerSize, 150);
    window.addEventListener('resize', updateContainerSize);

    return () => {
      window.removeEventListener('resize', updateContainerSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Calculate layout dimensions - NOWE: krótsze bloki pionowo, więcej wierszy
  const getLayoutDimensions = useCallback(() => {
    const tracks = externalGetAllTracks ? externalGetAllTracks() : getAllTracks();
    const leftPanelWidth = 200; // Standardowy rozmiar

    // ZWIĘKSZONA rezerwa na kontrolki dolne - żeby ostatni wiersz nie był ucinany
    const bottomReserve = 120; // Zwiększona rezerwa na kontrolki + padding
    const availableHeight = containerSize.height - bottomReserve;

    // DYNAMICZNE wysokości tracków - ZAWSZE WYPEŁNIAJ DOSTĘPNĄ PRZESTRZEŃ
    const minTrackHeight = 12; // Absolutne minimum dla czytelności
    const maxTrackHeight = 50; // Maksimum dla estetyki
    const gapBetweenTracks = 2; // Gap między trackami

    // Oblicz idealną wysokość tracka żeby wypełnić całą dostępną przestrzeń
    const totalGaps = Math.max(0, tracks.length - 1) * gapBetweenTracks;
    const availableForTracks = availableHeight - totalGaps;
    const idealTrackHeight = Math.max(minTrackHeight, Math.min(maxTrackHeight, availableForTracks / Math.max(1, tracks.length)));

    // Użyj idealnej wysokości - zawsze wypełnij przestrzeń!
    const trackHeight = Math.round(idealTrackHeight);

    // Oblicz rzeczywistą szerokość obszaru bloków muzycznych - maksymalne wykorzystanie przestrzeni
    const timelineWidth = containerSize.width - leftPanelWidth - 16; // Bardzo małe marginesy dla maksymalnej szerokości

    return {
      leftPanelWidth,
      trackHeight,
      tracks,
      totalSteps: visualSong ? (visualSong.totalBars || 0) * (visualSong.beatsPerBar || 4) * (visualSong.stepsPerBeat || 4) : 0,
      timelineWidth,
      availableHeight // Dodaj availableHeight do return
    };
  }, [visualSong, containerSize, externalGetAllTracks]);

  // NOWA FUNKCJA: Grupuj po NUTACH, nie po instrumentach - każda nuta = osobny track
  const getAllTracks = useCallback((): VisualTrack[] => {
    if (!visualSong) return [];



    const noteTrackMap = new Map<string, VisualTrack>();

    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        // Grupuj wszystkie nuty z tego tracka
        for (const note of track.notes) {
          // KLUCZ: nuta + typ instrumentu (żeby C2 z piano było inne niż C2 z synth)
          const noteKey = `${note.note}_${track.type}_${track.filepath || track.waveform || 'default'}`;

          if (!noteTrackMap.has(noteKey)) {
            // Utwórz nowy track dla tej nuty
            const uniqueBlockColor = getEnhancedTrackColor(track, noteKey); // KOLOR BLOKÓW DŹWIĘKOWYCH
            const categoryBorderColor = getInstrumentBorderColor(track); // KOLOR KATEGORII (dla nazw)


            noteTrackMap.set(noteKey, {
              ...track,
              id: noteKey,
              name: note.note, // NAZWA = NUTA (C2, C3, A#3, itp.)
              notes: [note], // Tylko ta jedna nuta
              color: uniqueBlockColor, // UNIKALNY KOLOR BLOKÓW DŹWIĘKOWYCH
              borderColor: categoryBorderColor // KOLOR KATEGORII (dla nazw tracków)
            });
          } else {
            // Dodaj nutę do istniejącego track dla tej nuty
            const existingTrack = noteTrackMap.get(noteKey)!;
            existingTrack.notes.push(note);
          }
        }
      }
    }

    const result = Array.from(noteTrackMap.values())
      .filter(track => track.notes && track.notes.length > 0)
      .sort((a, b) => {
        // GRUPOWANIE WEDŁUG KATEGORII: najpierw po kolorze kategorii (borderColor), potem po nutach
        const aBorderColor = a.borderColor || '#888888';
        const bBorderColor = b.borderColor || '#888888';

        // 1. Sortuj po kolorze kategorii (grupuje podobne instrumenty razem)
        if (aBorderColor !== bBorderColor) {
          // Kolejność kategorii: czerwone (sampler), niebieskie (piano), zielone/żółte/fioletowe (synth)
          const categoryOrder: Record<string, number> = {
            '#FF0000': 0, '#CC0000': 1, '#FF3333': 2, '#990000': 3, '#FF6666': 4, '#AA0000': 5, // Czerwone (sampler)
            '#0066FF': 10, // Niebieskie (piano)
            '#00AA00': 20, '#FFAA00': 21, '#AA00FF': 22, '#00AAFF': 23, '#0088AA': 24, // Synth
            '#888888': 99 // Nieznane
          };
          const aOrder = categoryOrder[aBorderColor] || 50;
          const bOrder = categoryOrder[bBorderColor] || 50;
          return aOrder - bOrder;
        }

        // 2. W ramach tej samej kategorii, sortuj muzycznie po nutach
        return compareNotesMusicially(a.name, b.name);
      });



    return result;
  }, [visualSong, getEnhancedTrackColor, getInstrumentBorderColor]);

  // Master timeline duration - always use audio duration as source of truth
  const masterDuration = useMemo(() => {
    // Priority: 1. Audio duration (real), 2. Calculated duration (fallback)
    if (isFinite(duration) && duration > 0) {
      return duration; // Use real audio duration
    }
    if (visualSong && isFinite(visualSong.duration) && visualSong.duration > 0) {
      return visualSong.duration; // Fallback to calculated duration
    }
    return 0;
  }, [duration, visualSong]);

  // Timeline scaling factor to sync blocks with actual audio duration
  const timelineScale = useMemo(() => {
    if (!visualSong || masterDuration <= 0 || visualSong.duration <= 0) return 1;
    const scale = masterDuration / visualSong.duration; // Scale factor for timeline

    console.debug('📏 Timeline Scale Calculation:', {
      masterDuration: masterDuration.toFixed(3),
      visualSongDuration: visualSong.duration.toFixed(3),
      timelineScale: scale.toFixed(3),
      totalBars: visualSong.totalBars,
      bpm: visualSong.bpm
    });

    return scale;
  }, [masterDuration, visualSong]);

  // Check if note is currently active with master timeline synchronization and loop repetitions
  const isNoteActive = useCallback((note: VisualNote): boolean => {
    if (!visualSong || masterDuration <= 0 || !isFinite(currentTime)) return false;

    const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;
    const stepDuration = masterDuration / totalSteps; // Use master duration for timing

    // Direct step-based comparison for this specific note
    const noteStartTime = note.step * stepDuration;
    const noteEndTime = noteStartTime + (note.steps * stepDuration);

    // Precyzyjne sprawdzenie aktywności bez tolerancji
    const isActive = currentTime >= noteStartTime && currentTime < noteEndTime;



    return isActive;
  }, [visualSong, currentTime, masterDuration]);

  // Funkcja do łączenia sąsiadujących bloków w ciągłe segmenty
  const mergeAdjacentNotes = useCallback((notes: any[]) => {
    if (!notes || notes.length === 0) return [];

    // Sortuj nuty według pozycji
    const sortedNotes = [...notes].sort((a, b) => a.step - b.step);
    const mergedBlocks: any[] = [];

    let currentBlock = { ...sortedNotes[0] };

    for (let i = 1; i < sortedNotes.length; i++) {
      const note = sortedNotes[i];
      const currentEnd = currentBlock.step + currentBlock.steps;

      // Jeśli nuta jest bezpośrednio po poprzedniej (lub się nakłada), połącz je
      if (note.step <= currentEnd + 2) { // +2 pozwala na większe przerwy i lepsze łączenie
        currentBlock.steps = Math.max(currentEnd, note.step + note.steps) - currentBlock.step;
        currentBlock.mergedNotes = currentBlock.mergedNotes || [currentBlock];
        currentBlock.mergedNotes.push(note);
      } else {
        // Dodaj poprzedni blok i zacznij nowy
        mergedBlocks.push(currentBlock);
        currentBlock = { ...note };
      }
    }

    // Dodaj ostatni blok
    mergedBlocks.push(currentBlock);

    return mergedBlocks;
  }, []);

  // Handle timeline click for seeking - use actual timeline width
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!visualSong || masterDuration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // Use actual timeline width from the clicked element
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * masterDuration;

    console.debug('🎯 Timeline Click:', {
      clickX: clickX.toFixed(1),
      rectWidth: rect.width.toFixed(1),
      percentage: (percentage * 100).toFixed(1) + '%',
      newTime: newTime.toFixed(3),
      masterDuration: masterDuration.toFixed(3),
      seekCalled: !!onSeek
    });

    // Emit seek event to parent component
    if (onSeek) {
      console.log('🎯 Calling onSeek with time:', newTime.toFixed(3));
      onSeek(newTime);
    } else {
      console.warn('🎯 No onSeek callback provided');
    }
  }, [visualSong, onSeek, masterDuration]);



  // Smooth progress percentage with interpolation for fluid animation
  const [smoothProgress, setSmoothProgress] = useState(0);
  const lastUpdateTime = useRef(0);
  const animationFrameRef = useRef<number>();

  // Calculate target progress percentage using master timeline
  const targetProgressPercentage = useMemo(() => {
    if (masterDuration <= 0 || !isFinite(currentTime) || !isFinite(masterDuration)) {
      return 0;
    }
    // Use master duration for perfect sync with audio
    const percentage = Math.max(0, Math.min(100, (currentTime / masterDuration) * 100));

    // Ensure we reach 100% when audio ends (handle floating point precision)
    if (currentTime >= masterDuration - 0.1) { // 100ms tolerance for end
      return 100;
    }

    return percentage;
  }, [currentTime, masterDuration]);

  // Smooth animation frame updates for fluid playhead movement
  useEffect(() => {
    if (!isPlaying) {
      setSmoothProgress(targetProgressPercentage);
      return;
    }

    const updateSmoothProgress = () => {
      const now = performance.now();
      const deltaTime = now - lastUpdateTime.current;
      lastUpdateTime.current = now;

      setSmoothProgress(prev => {
        const diff = targetProgressPercentage - prev;

        // Use exponential smoothing for fluid animation with better responsiveness
        const smoothingFactor = Math.min(1, deltaTime / 16.67); // 60 FPS target
        const interpolationSpeed = 0.25; // Zwiększona responsywność dla lepszej synchronizacji

        return prev + (diff * interpolationSpeed * smoothingFactor);
      });

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothProgress);
      }
    };

    lastUpdateTime.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateSmoothProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, targetProgressPercentage]);

  // Use smooth progress for display
  const progressPercentage = smoothProgress;






  // Render the new HTML-based visualizer
  if (!visualSong) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-white/60">No song data available</div>
      </div>
    );
  }

  const { leftPanelWidth, trackHeight, tracks, timelineWidth, availableHeight } = getLayoutDimensions();

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", damping: 25 }}
      style={{
        width: '100%', // Pełna szerokość kontenera
        height: '100%', // Pełna wysokość kontenera
        minHeight: tracks.length > 20 ? '700px' : tracks.length > 10 ? '600px' : '550px', // Adaptacyjna minimalna wysokość
        background: `
          radial-gradient(circle at 30% 70%, rgba(111,0,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(0,255,136,0.1) 0%, transparent 50%),
          ${colors.background}
        `,
        borderRadius: '24px',
        border: `1px solid rgba(111, 0, 255, 0.2)`,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full opacity-60"
            style={{
              background: colors.secondary,
              left: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Main Panel */}
      <div
        className="relative h-full backdrop-blur-lg border border-white/10 rounded-3xl p-1 pb-2 flex flex-col gap-1"
        style={{
          background: colors.panel,
          backdropFilter: 'blur(20px)'
        }}
      >


        {/* Tracks Visualization Container - ZAWSZE WYPEŁNIJ PRZESTRZEŃ */}
        <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Tracks Container - NOWE: maksymalne wykorzystanie przestrzeni */}
          <div
            className="tracks-container flex flex-col gap-0.5 relative flex-1" // Ultra zmniejszony gap + wypełnij przestrzeń
            style={{
              paddingLeft: `${leftPanelWidth}px`,
              height: `${availableHeight}px`, // ZAWSZE WYPEŁNIJ CAŁĄ DOSTĘPNĄ PRZESTRZEŃ
              maxHeight: `${availableHeight}px`,
              overflowY: 'visible' // NIGDY SCROLL - zawsze wypełnij przestrzeń
            }}
          >

            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="track-hover flex items-center relative transition-all duration-300 rounded-lg"
                style={{ height: `${trackHeight}px` }}
              >
                {/* Track Label - ZMNIEJSZONE: mniejsze etykiety żeby się nie nakładały */}
                <div
                  className="absolute flex items-center gap-1 px-1 py-0.5 backdrop-blur-sm rounded-md"
                  style={{
                    left: `-${leftPanelWidth}px`,
                    width: `${leftPanelWidth - 8}px`,
                    height: `${Math.min(trackHeight - 2, 28)}px`, // Kompaktowa wysokość
                    background: colors.trackBg,
                    border: `1px solid ${(track as any).borderColor || colors.trackBorder}`, // Cieńsze obramowanie
                    borderLeft: `2px solid ${(track as any).borderColor || colors.trackBorder}`, // Mniejszy akcent po lewej
                    fontSize: '11px' // Mniejszy font
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: (track as any).borderColor || track.color, // KOLOR KATEGORII (dla nazw tracków)
                      boxShadow: `0 0 3px ${(track as any).borderColor || track.color}`,
                      border: `1px solid ${(track as any).borderColor || track.color}` // Obramowanie = kolor kategorii
                    }}
                  />
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{
                      color: track.mute ? '#666666' : colors.text,
                      lineHeight: '1.1',
                      fontSize: '10px'
                    }}
                  >
                    {track.name}
                  </span>
                  {/* Kategoria instrumentu jako bardzo mała etykieta */}
                  <span
                    className="text-xs px-0.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${(track as any).borderColor || colors.trackBorder}15`,
                      color: (track as any).borderColor || colors.trackBorder,
                      fontSize: '8px',
                      lineHeight: '1',
                      minWidth: '14px',
                      textAlign: 'center'
                    }}
                    title={(track as any).category || track.type}
                  >
                    {((track as any).category || track.type)?.charAt(0).toUpperCase()}
                  </span>
                  {track.mute && (
                    <span
                      className="text-xs font-semibold px-1 py-0.5 rounded flex-shrink-0"
                      style={{
                        color: colors.tertiary,
                        background: 'rgba(255, 0, 128, 0.2)',
                        fontSize: '9px'
                      }}
                    >
                      M
                    </span>
                  )}
                </div>

                {/* Track Timeline */}
                <div
                  className="w-full h-full relative rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg,
                      rgba(111, 0, 255, 0.05) 0%,
                      rgba(0, 255, 136, 0.03) 50%,
                      rgba(255, 0, 128, 0.05) 100%)`,
                    border: `1px solid ${colors.trackBorder}`
                  }}
                >
                  {/* Grid Background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 20px,
                        rgba(111, 0, 255, 0.1) 20px,
                        rgba(111, 0, 255, 0.1) 21px
                      )`
                    }}
                  />

                  {/* Note Blocks - NOWE: z połączonymi sąsiadującymi blokami */}
                  {mergeAdjacentNotes(track.notes).map((block: any, blockIndex: number) => {
                    const totalSteps = (visualSong.totalBars || 0) * (visualSong.beatsPerBar || 4) * (visualSong.stepsPerBeat || 4);

                    // Calculate positions without scaling for better visual consistency
                    const rawStartPercent = totalSteps > 0 ? (block.step / totalSteps) * 100 : 0;
                    const rawWidthPercent = totalSteps > 0 ? (block.steps / totalSteps) * 100 : 1;

                    // Use raw positions for consistent visual layout
                    const startPercent = Math.max(0, Math.min(100, rawStartPercent));
                    const widthPercent = Math.max(1.0, rawWidthPercent); // Minimum 1% width for visibility

                    // Sprawdź czy którakolwiek z nut w bloku jest aktywna
                    const isActive = block.mergedNotes ?
                      block.mergedNotes.some((note: any) => isNoteActive(note)) :
                      isNoteActive(block);



                    // Sprawdź czy blok jest aktywny - to wystarczy dla animacji



                    return (
                      <div
                        key={`${block.step}-${blockIndex}`}
                        className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-all duration-75 overflow-hidden ${ // Szybsze przejścia dla lepszej synchronizacji
                          isActive ? 'z-10' : ''
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${Math.max(widthPercent, 1.5)}%`, // Większe minimalne bloki dla lepszej widoczności
                          // AKTYWNE = wypełnione tym samym kolorem co obramowanie, NIEAKTYWNE = pusty środek
                          background: track.mute
                            ? 'rgba(100, 100, 100, 0.4)'
                            : isActive
                              ? track.color // AKTYWNE: wypełnione tym samym kolorem co obramowanie
                              : 'transparent', // NIEAKTYWNE: pusty środek
                          border: `2px solid ${track.mute ? '#555' : track.color}`, // Obramowanie = unikalny kolor bloków dźwiękowych
                          boxShadow: isActive
                            ? `0 0 20px ${track.color}, 0 0 40px ${track.color}66` // ŚWIATEŁKO w kolorze bloków dźwiękowych
                            : `0 2px 4px rgba(0,0,0,0.2)`, // Subtelny cień zawsze
                          transform: isActive ? 'scale(1.05)' : 'scale(1)', // Lekkie powiększenie gdy aktywne
                          opacity: track.mute ? 0.4 : 1, // Pełna widoczność
                          filter: track.mute ? 'grayscale(0.7)' : 'none',
                          transition: 'all 0.05s ease-out' // Bardzo szybkie przejścia dla precyzyjnej synchronizacji
                        }}
                        title={`${getCleanTrackName(track.name)} - ${block.note || 'Block'} (Step ${block.step}, Length: ${block.steps}${block.mergedNotes ? `, Merged: ${block.mergedNotes.length}` : ''})`}
                      >
                        {/* Subtelny gradient wewnętrzny tylko dla nieaktywnych bloków */}
                        {!isActive && (
                          <div
                            className="absolute inset-0 rounded-md"
                            style={{
                              background: `linear-gradient(45deg, transparent, ${track.color}15, transparent)` // Bardzo subtelny gradient dla nieaktywnych
                            }}
                          />
                        )}

                        {/* ŚWIATEŁKO WOKÓŁ dla aktywnych bloków */}
                        {isActive && (
                          <>
                            {/* Pulsujące światełko */}
                            <div
                              className="absolute inset-0 rounded-md"
                              style={{
                                background: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`,
                                animation: 'pulse 1.5s ease-in-out infinite'
                              }}
                            />
                            {/* Delikatny shimmer */}
                            <div
                              className="absolute inset-0 rounded-md"
                              style={{
                                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)`,
                                animation: 'shimmer 2s ease-in-out infinite'
                              }}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaktywny pasek postępu - BEZPOŚREDNIO pod głównym panelem */}
        <div className="mt-1 space-y-2">

          {/* Pasek postępu - przeniesiony wyżej */}
          <div className="relative" style={{ paddingLeft: `${leftPanelWidth}px` }}>
            <div
              className="progress-bar h-3 rounded-full cursor-pointer relative overflow-hidden transition-transform duration-200 shadow-lg"
              style={{
                width: `${Math.max(600, timelineWidth)}px`, // Większa minimalna szerokość
                maxWidth: '100%', // Nie przekraczaj kontenera
                background: `linear-gradient(90deg,
                  rgba(111, 0, 255, 0.2) 0%,
                  rgba(0, 255, 136, 0.2) 50%,
                  rgba(255, 0, 128, 0.2) 100%)`,
                border: `1px solid ${colors.trackBorder}`
              }}
              onClick={handleTimelineClick}
            >
              {/* Wypełnienie postępu z precyzyjną synchronizacją */}
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: '100%', // Full width container
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  boxShadow: `0 0 8px rgba(111, 0, 255, 0.5)`,
                  transform: `scaleX(${Math.min(1, progressPercentage / 100)}) translateZ(0)`, // Direct progress without scaling
                  transformOrigin: 'left center',
                  transition: 'none', // Always smooth for real-time
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
              />

              {/* Suwak z precyzyjną synchronizacją */}
              <div
                className="absolute top-1/2 w-4 h-4 rounded-full cursor-grab active:cursor-grabbing"
                style={{
                  left: `${(progressPercentage / 100) * Math.max(600, timelineWidth) - 8}px`, // Pozycja w pikselach względem timeline width
                  top: '50%',
                  transform: `translateY(-50%) translateZ(0)`, // Tylko center vertically
                  background: colors.playhead,
                  border: `2px solid ${colors.text}`,
                  boxShadow: `0 0 10px ${colors.playhead}`,
                  // Optimized for smooth animation
                  transition: 'none', // Always smooth for real-time
                  willChange: 'left',
                  backfaceVisibility: 'hidden'
                }}
              />
            </div>

            {/* Markery czasu i informacje o trackach */}
            <div className="relative" style={{ paddingLeft: `${leftPanelWidth}px` }}>
              <div className="flex justify-between items-center mt-1">
                {/* Markery czasu po lewej */}
                <div
                  className="flex justify-between text-xs"
                  style={{
                    color: colors.textSecondary,
                    width: `${Math.max(600, timelineWidth)}px`, // Dokładna szerokość jak timeline
                    maxWidth: '70%' // Zostaw miejsce na informacje po prawej
                  }}
                >
                {[0, 0.25, 0.5, 0.75, 1].map((position) => {
                  const time = position * masterDuration;
                  return (
                    <span key={position} className="font-mono">
                      {isFinite(time) ?
                        `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}` :
                        '0:00'
                      }
                    </span>
                  );
                })}
                </div>

                {/* Informacje o trackach po prawej */}
                <div className="flex items-center gap-3 text-xs" style={{ color: colors.textSecondary }}>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                    <span className="font-medium">{tracks.length} tracks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    <span className="font-medium">{tracks.reduce((sum, track) => sum + (track.notes?.length || 0), 0)} notes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Control Panel - Stylowy design - ZAWSZE WIDOCZNY */}
          {onPlayPause && (
            <div className="mt-1 flex-shrink-0" style={{
              paddingLeft: `${leftPanelWidth + 8}px`,
              minHeight: '40px' // Kompaktowa wysokość dla kontrolek
            }}>
              {/* Control Row - Volume po lewej, Play/Stop wyśrodkowany */}
              <div className="flex items-center justify-between w-full">
                {/* Volume Control - Kompaktowy design */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 backdrop-blur-sm border border-white/10">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                  <div className="w-16 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newVolume = Number(e.target.value);
                        if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 100) {
                          onVolumeChange?.(newVolume);
                        }
                      }}
                      onInput={(e) => {
                        // Additional handler to prevent conflicts
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer music-volume-slider"
                      style={{
                        background: `linear-gradient(to right, #6f00ff 0%, #a855f7 ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  <span className="text-white/50 text-xs font-mono w-6 text-center">{volume}</span>
                </div>

                {/* Play/Stop Button with Time - Kompaktowy design */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 backdrop-blur-sm border border-white/10">
                  {/* Current Time */}
                  <span className="text-white/70 text-xs font-mono min-w-[30px]">
                    {isFinite(currentTime) ?
                      `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}` :
                      '0:00'
                    }
                  </span>

                  {/* Play/Stop Button - Kompaktowy */}
                  <motion.button
                    onClick={onPlayPause}
                    className="w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </motion.button>

                  {/* Total Duration */}
                  <span className="text-white/50 text-xs font-mono min-w-[30px]">
                    {masterDuration > 0 ?
                      `${Math.floor(masterDuration / 60)}:${Math.floor(masterDuration % 60).toString().padStart(2, '0')}` :
                      '0:00'
                    }
                  </span>
                </div>

                {/* Spacer po prawej dla symetrii */}
                <div className="w-[120px]"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Styles - converted to regular style tag */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-20px) scale(1);
            opacity: 0;
          }
        }

        @keyframes bpm-pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(111, 0, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(111, 0, 255, 0.6);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Scrollbar styling */
        .tracks-container::-webkit-scrollbar {
          width: 4px;
        }

        .tracks-container::-webkit-scrollbar-track {
          background: rgba(111, 0, 255, 0.1);
          border-radius: 2px;
        }

        .tracks-container::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 136, 0.4);
          border-radius: 2px;
        }

        .tracks-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 136, 0.6);
        }

        /* Hover effects */
        .track-hover:hover {
          background: rgba(111, 0, 255, 0.1) !important;
          transform: translateX(2px);
        }

        /* Progress bar hover */
        .progress-bar:hover {
          transform: scaleY(1.2);
        }
      `}</style>
    </motion.div>
  );
};

export default LoopmakerVisualizer;
