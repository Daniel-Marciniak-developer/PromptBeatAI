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
  externalGetCleanTrackName?: (name: string) => string;
  externalGetAllTracks?: () => any[];
  externalHasActiveNotes?: (track: any) => boolean;
}

const LoopmakerVisualizer: React.FC<LoopmakerVisualizerProps> = ({
  visualSong,
  currentTime,
  isPlaying,
  className = '',
  type = 'pianoRoll',
  onSeek,
  // New props for integrated controls
  duration = 0,
  volume = 80,
  bpm = 128,
  onPlayPause,
  onVolumeChange,
  externalGetCleanTrackName,
  externalGetAllTracks,
  externalHasActiveNotes
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
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

  // Funkcja do czyszczenia nazw ścieżek
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
    const cleanName = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .trim();

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

  // Calculate layout dimensions
  const getLayoutDimensions = useCallback(() => {
    const tracks = externalGetAllTracks ? externalGetAllTracks() : getAllTracks();
    const leftPanelWidth = 200; // Standardowy rozmiar
    // Oblicz wysokość ścieżek z adaptacyjną rezerwą na kontrolki dolne - większe tracks
    const bottomReserve = tracks.length > 15 ? 160 : tracks.length > 8 ? 140 : 120; // Zmniejszona rezerwa
    const availableHeight = containerSize.height - bottomReserve;
    // Lepsze zarządzanie wysokością tracks - więcej miejsca dla każdego track
    const trackHeight = tracks.length <= 2 ?
      Math.min(160, Math.max(130, availableHeight / Math.max(1, tracks.length))) :
      tracks.length <= 4 ?
      Math.min(140, Math.max(110, availableHeight / Math.max(1, tracks.length))) :
      tracks.length <= 6 ?
      Math.min(120, Math.max(90, availableHeight / Math.max(1, tracks.length))) :
      tracks.length <= 8 ?
      Math.min(100, Math.max(80, availableHeight / Math.max(1, tracks.length))) :
      tracks.length <= 12 ?
      Math.min(85, Math.max(70, availableHeight / Math.max(1, tracks.length))) :
      tracks.length <= 20 ?
      Math.min(75, Math.max(60, availableHeight / Math.max(1, tracks.length))) :
      Math.min(60, Math.max(50, availableHeight / Math.max(1, tracks.length)));

    // Oblicz rzeczywistą szerokość obszaru bloków muzycznych - maksymalne wykorzystanie przestrzeni
    // containerSize.width - leftPanelWidth - minimalne marginesy
    const timelineWidth = containerSize.width - leftPanelWidth - 16; // Bardzo małe marginesy dla maksymalnej szerokości

    return {
      leftPanelWidth,
      trackHeight,
      tracks,
      totalSteps: visualSong ? visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat : 0,
      timelineWidth,
      availableHeight // Dodaj availableHeight do return
    };
  }, [visualSong, containerSize, externalGetAllTracks]);

  // Get all unique tracks from the song, merging notes from loop repetitions
  const getAllTracks = useCallback((): VisualTrack[] => {
    if (!visualSong) return [];

    const trackMap = new Map<string, VisualTrack>();
    const allTrackIds: string[] = [];

    for (const loop of visualSong.loops) {
      for (const track of loop.tracks) {
        allTrackIds.push(track.id);
        // Extract base track name (remove global step offset suffix)
        const baseTrackId = track.id.split('_').slice(0, -1).join('_') || track.id;

        if (!trackMap.has(baseTrackId)) {
          // Create new track with base ID
          trackMap.set(baseTrackId, {
            ...track,
            id: baseTrackId,
            notes: [...track.notes] // Copy notes array
          });
        } else {
          // Merge notes from this loop repetition into existing track
          const existingTrack = trackMap.get(baseTrackId)!;
          existingTrack.notes = [...existingTrack.notes, ...track.notes];
        }
      }
    }

    const result = Array.from(trackMap.values())
      .filter(track => track.notes && track.notes.length > 0); // Only tracks with notes

    // Debug track processing
    console.debug('🎵 Track Processing:', {
      totalLoops: visualSong.loops.length,
      allTrackIds: allTrackIds,
      uniqueBaseIds: Array.from(trackMap.keys()),
      beforeFilter: Array.from(trackMap.values()).length,
      afterFilter: result.length,
      finalTracks: result.map(t => ({ id: t.id, name: t.name, notesCount: t.notes.length })),
      pianoTracks: result.filter(t => t.name.toLowerCase().includes('piano')).map(t => ({ id: t.id, name: t.name, notesCount: t.notes.length }))
    });

    return result;
  }, [visualSong]);

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

    // Add small tolerance for floating point precision (5ms for better detection)
    const tolerance = 0.005;
    const isActive = currentTime >= (noteStartTime - tolerance) && currentTime < (noteEndTime + tolerance);

    // Debug logging for problematic notes
    if (isActive && Math.random() < 0.05) { // Log 5% of active notes to avoid spam
      console.debug('🎵 Active Note:', {
        note: note.note,
        step: note.step,
        steps: note.steps,
        trackId: note.trackId,
        noteStartTime: noteStartTime.toFixed(3),
        noteEndTime: noteEndTime.toFixed(3),
        currentTime: currentTime.toFixed(3),
        stepDuration: stepDuration.toFixed(3),
        tolerance: tolerance.toFixed(3)
      });
    }

    return isActive;
  }, [visualSong, currentTime, masterDuration]);

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

        // Use exponential smoothing for fluid animation
        const smoothingFactor = Math.min(1, deltaTime / 16.67); // 60 FPS target
        const interpolationSpeed = 0.15; // Adjust for smoothness vs responsiveness

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





  // Debug logging for synchronization monitoring
  useEffect(() => {
    if (!isFinite(masterDuration) || !isFinite(currentTime)) {
      console.warn('LoopmakerVisualizer: Invalid time values', {
        duration,
        masterDuration,
        currentTime,
        visualSongDuration: visualSong?.duration
      });
    }

    // Optimized debug logging with throttling
    if (isPlaying && Math.floor(currentTime) !== Math.floor(currentTime - 0.1)) {
      const totalSteps = visualSong?.totalBars * visualSong?.beatsPerBar * visualSong?.stepsPerBeat || 0;
      const currentStep = totalSteps > 0 ? (currentTime / masterDuration) * totalSteps : 0;

      // Count active notes for debugging (throttled)
      const activeNotesCount = getAllTracks().reduce((count, track) => {
        return count + track.notes.filter(note => isNoteActive(note)).length;
      }, 0);

      // Sample a few notes for position debugging
      const sampleNotes = getAllTracks().slice(0, 2).flatMap(track =>
        track.notes.slice(0, 3).map(note => ({
          note: note.note,
          step: note.step,
          trackId: note.trackId,
          startPercent: ((note.step / totalSteps) * 100).toFixed(1),
          isActive: isNoteActive(note)
        }))
      );

      console.debug('🎵 Smooth Sync:', {
        time: currentTime.toFixed(3),
        masterDuration: masterDuration.toFixed(3),
        calculatedDuration: visualSong?.duration.toFixed(3) || 'N/A',
        durationMismatch: masterDuration !== (visualSong?.duration || 0),
        step: currentStep.toFixed(2),
        smoothProgress: smoothProgress.toFixed(2) + '%',
        targetProgress: targetProgressPercentage.toFixed(2) + '%',
        activeNotes: activeNotesCount,
        playheadStep: currentStep.toFixed(1),
        playheadPosition: ((progressPercentage / 100) * Math.max(600, timelineWidth) - 8).toFixed(1) + 'px',
        timelineSync: 'Direct (no scaling)',
        sampleNotes: sampleNotes.slice(0, 3) // Show first 3 notes
      });
    }
  }, [masterDuration, currentTime, duration, visualSong, isPlaying, smoothProgress, targetProgressPercentage, timelineScale]);

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
        className="relative h-full backdrop-blur-lg border border-white/10 rounded-3xl p-2 pb-4 flex flex-col gap-2"
        style={{
          background: colors.panel,
          backdropFilter: 'blur(20px)'
        }}
      >


        {/* Tracks Visualization Container - Ograniczona wysokość */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          {/* Tracks Container - Kontrolowana wysokość */}
          <div
            className="tracks-container flex flex-col gap-3 relative"
            style={{
              paddingLeft: `${leftPanelWidth}px`,
              height: `${Math.min(tracks.length * (trackHeight + 16), availableHeight + 60)}px`, // Więcej miejsca na tracks
              maxHeight: tracks.length > 6 ? `${availableHeight + 60}px` : 'none', // Wcześniejszy scroll z większą przestrzenią
              overflowY: tracks.length > 6 ? 'auto' : 'visible'
            }}
          >

            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="track-hover flex items-center relative transition-all duration-300 rounded-lg"
                style={{ height: `${trackHeight}px` }}
              >
                {/* Track Label */}
                <div
                  className="absolute flex items-center gap-3 px-3 py-2 backdrop-blur-sm rounded-lg"
                  style={{
                    left: `-${leftPanelWidth}px`,
                    width: `${leftPanelWidth - 10}px`,
                    background: colors.trackBg,
                    border: `1px solid ${colors.trackBorder}`
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: track.color,
                      boxShadow: `0 0 6px ${track.color}`
                    }}
                  />
                  <span
                    className="text-sm font-medium flex-1 truncate"
                    style={{
                      color: track.mute ? '#666666' : colors.text
                    }}
                  >
                    {getCleanTrackName(track.name)}
                  </span>
                  {track.mute && (
                    <span
                      className="text-xs font-semibold px-1 py-0.5 rounded"
                      style={{
                        color: colors.tertiary,
                        background: 'rgba(255, 0, 128, 0.2)'
                      }}
                    >
                      MUTED
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

                  {/* Note Blocks z precyzyjną synchronizacją i timeline scaling */}
                  {track.notes.map((note, noteIndex) => {
                    const totalSteps = visualSong.totalBars * visualSong.beatsPerBar * visualSong.stepsPerBeat;

                    // Calculate positions without scaling for better visual consistency
                    const rawStartPercent = (note.step / totalSteps) * 100;
                    const rawWidthPercent = (note.steps / totalSteps) * 100;

                    // Use raw positions for consistent visual layout
                    const startPercent = Math.max(0, Math.min(100, rawStartPercent));
                    const widthPercent = Math.max(1.0, rawWidthPercent); // Minimum 1% width for visibility

                    const isActive = isNoteActive(note);

                    // More precise upcoming calculation using master timeline with scaling
                    const noteStartTime = (note.step / totalSteps) * masterDuration;
                    const lookAheadTime = (2 / totalSteps) * masterDuration; // 2 steps ahead
                    const isUpcoming = currentTime < noteStartTime &&
                                      currentTime >= (noteStartTime - lookAheadTime);

                    // Debug logging for first few notes to check positioning
                    if (index === 0 && noteIndex < 3 && Math.random() < 0.05) {
                      console.debug('🎵 Note Position Debug:', {
                        trackName: track.name,
                        note: note.note,
                        step: note.step,
                        totalSteps,
                        rawStartPercent: ((note.step / totalSteps) * 100).toFixed(1),
                        finalStartPercent: startPercent.toFixed(1),
                        isActive,
                        noteStartTime: noteStartTime.toFixed(3),
                        currentTime: currentTime.toFixed(3)
                      });
                    }

                    return (
                      <div
                        key={`${note.step}-${noteIndex}`}
                        className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${ // Mniejsze marginesy = większe bloki
                          isActive ? 'z-10' : ''
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${Math.max(widthPercent, 1.5)}%`, // Większe minimalne bloki dla lepszej widoczności
                          background: isActive
                            ? `linear-gradient(135deg, ${colors.noteActive}, ${colors.primary})`
                            : track.mute
                              ? 'rgba(100, 100, 100, 0.3)'
                              : `linear-gradient(135deg, ${colors.noteInactive}, rgba(111, 0, 255, 0.3))`,
                          border: isActive
                            ? `2px solid ${colors.noteActive}`
                            : `1px solid ${track.mute ? '#555' : colors.noteInactive}`,
                          boxShadow: isActive
                            ? `0 0 12px ${colors.noteActive}, 0 0 24px rgba(0, 255, 136, 0.3)`
                            : isUpcoming
                              ? `0 0 6px ${colors.noteInactive}`
                              : 'none',
                          transform: isActive ? 'scale(1.02)' : 'scale(1)',
                          opacity: track.mute ? 0.4 : 1,
                          filter: track.mute ? 'grayscale(0.7)' : 'none'
                        }}
                        title={`${getCleanTrackName(track.name)} - ${note.note || 'Note'} (Step ${note.step})`}
                      >
                        {/* Note content with gradient */}
                        <div
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: isActive
                              ? `linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent)`
                              : 'inherit'
                          }}
                        />

                        {/* Active shimmer effect */}
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
                              animation: 'shimmer 1.5s ease-in-out infinite'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funkcjonalny pasek postępu na dole */}
        <div className="mt-6 space-y-4">

          {/* Active Tracks Display - Wycentrowane */}
          {onPlayPause && externalGetAllTracks && externalHasActiveNotes && externalGetCleanTrackName && externalGetAllTracks().length > 0 && (
            <div className="mb-1" style={{ paddingLeft: `${leftPanelWidth + 16}px` }}>
              <div className="flex items-center justify-center mb-3">
                <div className="text-white/70 text-sm font-medium">
                  {externalGetAllTracks().length} tracks • {externalGetAllTracks().reduce((sum: number, track: any) => sum + (track.notes?.length || 0), 0)} notes
                </div>
              </div>
              <div className={`flex flex-wrap justify-center gap-3 max-w-4xl mx-auto ${
                externalGetAllTracks().length <= 4 ? 'justify-center' :
                externalGetAllTracks().length <= 6 ? 'justify-center' :
                externalGetAllTracks().length <= 8 ? 'justify-center' : 'justify-center'
              }`}>
                {externalGetAllTracks().map((track: any) => {
                  const trackIsActive = externalHasActiveNotes(track);
                  return (
                    <motion.div
                      key={track.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-center backdrop-blur-sm border ${
                        trackIsActive ? 'bg-white/15 border-white/20 shadow-lg' : 'bg-white/5 border-white/10'
                      }`}
                      animate={{
                        opacity: trackIsActive ? 1 : 0.7,
                        scale: trackIsActive ? 1.02 : 1
                      }}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut"
                      }}
                      layout
                    >
                      <motion.div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: track.color }}
                        animate={{
                          scale: trackIsActive ? 1.2 : 1,
                          boxShadow: trackIsActive ? `0 0 8px ${track.color}` : `0 0 2px ${track.color}`
                        }}
                        transition={{
                          duration: 0.2,
                          ease: "easeInOut"
                        }}
                      />
                      <span className="text-white text-sm font-medium truncate flex-1">
                        {externalGetCleanTrackName(track.name)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interaktywny pasek postępu */}
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

            {/* Markery czasu - zsynchronizowane z timeline */}
            <div className="relative" style={{ paddingLeft: `${leftPanelWidth}px` }}>
              <div
                className="flex justify-between mt-2 text-xs"
                style={{
                  color: colors.textSecondary,
                  width: `${Math.max(600, timelineWidth)}px`, // Dokładna szerokość jak timeline
                  maxWidth: '100%' // Nie przekraczaj kontenera
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
            </div>
          </div>

          {/* Modern Control Panel - Stylowy design - ZAWSZE WIDOCZNY */}
          {onPlayPause && (
            <div className="mt-2 flex-shrink-0" style={{
              paddingLeft: `${leftPanelWidth + 16}px`,
              minHeight: '80px' // Minimalna wysokość dla kontrolek
            }}>
              {/* Control Row - Volume po lewej, Play/Stop wyśrodkowany */}
              <div className="flex items-center justify-between w-full">
                {/* Volume Control - Kompaktowy design */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/10">
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
                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/10">
                  {/* Current Time */}
                  <span className="text-white/70 text-sm font-mono min-w-[35px]">
                    {isFinite(currentTime) ?
                      `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}` :
                      '0:00'
                    }
                  </span>

                  {/* Play/Stop Button - Kompaktowy */}
                  <motion.button
                    onClick={onPlayPause}
                    className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </motion.button>

                  {/* Total Duration */}
                  <span className="text-white/50 text-sm font-mono min-w-[35px]">
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

      {/* CSS Styles */}
      <style jsx="true" global="true">{`
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
        :global(.tracks-container::-webkit-scrollbar) {
          width: 4px;
        }

        :global(.tracks-container::-webkit-scrollbar-track) {
          background: rgba(111, 0, 255, 0.1);
          border-radius: 2px;
        }

        :global(.tracks-container::-webkit-scrollbar-thumb) {
          background: rgba(0, 255, 136, 0.4);
          border-radius: 2px;
        }

        :global(.tracks-container::-webkit-scrollbar-thumb:hover) {
          background: rgba(0, 255, 136, 0.6);
        }

        /* Hover effects */
        :global(.track-hover:hover) {
          background: rgba(111, 0, 255, 0.1) !important;
          transform: translateX(2px);
        }

        /* Progress bar hover */
        :global(.progress-bar:hover) {
          transform: scaleY(1.2);
        }
      `}</style>
    </motion.div>
  );
};

export default LoopmakerVisualizer;
