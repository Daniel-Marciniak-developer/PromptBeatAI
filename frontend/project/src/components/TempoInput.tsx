import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Minus, Plus, RotateCcw } from 'lucide-react';
import { RotatingMusicIcons } from './MusicIcons';

interface TempoInputProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const TempoInput: React.FC<TempoInputProps> = ({
  defaultValue = 128,
  onChange,
  min = 60,
  max = 200
}) => {
  const [tempo, setTempo] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue.toString());
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isTapping, setIsTapping] = useState(false);

  useEffect(() => {
    onChange?.(tempo);
  }, [tempo, onChange]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setTempo(numValue);
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(tempo.toString());
    } else {
      setTempo(numValue);
    }
  };

  const adjustTempo = (delta: number) => {
    const newTempo = Math.max(min, Math.min(max, tempo + delta));
    setTempo(newTempo);
    setInputValue(newTempo.toString());
  };

  const resetTempo = () => {
    setTempo(defaultValue);
    setInputValue(defaultValue.toString());
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // Keep only last 4 taps
    setTapTimes(newTapTimes);
    setIsTapping(true);

    // Calculate BPM from tap intervals
    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBPM = Math.round(60000 / avgInterval); // Convert ms to BPM

      if (calculatedBPM >= min && calculatedBPM <= max) {
        setTempo(calculatedBPM);
        setInputValue(calculatedBPM.toString());
      }
    }

    // Reset tap state after 3 seconds of inactivity
    setTimeout(() => {
      setIsTapping(false);
      setTapTimes([]);
    }, 3000);
  };

  const getTempoDescription = (bpm: number) => {
    if (bpm < 70) return 'Very Slow';
    if (bpm < 90) return 'Slow';
    if (bpm < 110) return 'Moderate';
    if (bpm < 130) return 'Medium';
    if (bpm < 150) return 'Fast';
    if (bpm < 170) return 'Very Fast';
    return 'Extremely Fast';
  };

  const getTempoColor = (bpm: number) => {
    if (bpm < 90) return '#6366f1'; // Indigo for slow
    if (bpm < 120) return '#10b981'; // Green for moderate
    if (bpm < 150) return '#f59e0b'; // Amber for fast
    return '#ef4444'; // Red for very fast
  };

  return (
    <div className="tempo-input-container space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Tempo</h3>
            <p className="text-sm text-white/60">{getTempoDescription(tempo)}</p>
          </div>
        </div>
        
        {/* Rotating disc indicator */}
        <RotatingMusicIcons.Disc 
          size={24} 
          color={getTempoColor(tempo)} 
          speed={tempo / 120} // Speed based on tempo
        />
      </div>

      {/* Main tempo control */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Decrease button */}
          <motion.button
            onClick={() => adjustTempo(-5)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={tempo <= min}
          >
            <Minus className="w-4 h-4 text-white/80" />
          </motion.button>

          {/* Tempo display/input */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="number"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyPress={(e) => e.key === 'Enter' && handleInputBlur()}
                className="w-20 text-center text-2xl font-bold bg-transparent text-white border-b-2 border-accent-from focus:outline-none"
                min={min}
                max={max}
                autoFocus
              />
            ) : (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="text-2xl font-bold text-white hover:text-accent-from transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {tempo}
              </motion.button>
            )}
            <span className="text-white/60 font-medium">BPM</span>
          </div>

          {/* Increase button */}
          <motion.button
            onClick={() => adjustTempo(5)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={tempo >= max}
          >
            <Plus className="w-4 h-4 text-white/80" />
          </motion.button>
        </div>

        {/* Tempo slider */}
        <div className="mt-4 relative">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${((tempo - min) / (max - min)) * 100}%`,
                backgroundColor: getTempoColor(tempo)
              }}
              initial={{ width: 0 }}
              animate={{ width: `${((tempo - min) / (max - min)) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Slider input */}
          <input
            type="range"
            min={min}
            max={max}
            step="1"
            value={tempo}
            onChange={(e) => {
              const newTempo = parseInt(e.target.value);
              setTempo(newTempo);
              setInputValue(newTempo.toString());
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Visual Thumb */}
          <motion.div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
            style={{
              left: `calc(${((tempo - min) / (max - min)) * 100}% - 8px)`,
              top: '-4px', // Pasek h-2 (8px), środek na 4px. Kropka 16px, środek na 8px. 4px - 8px = -4px
              backgroundColor: getTempoColor(tempo),
              zIndex: 5
            }}
            animate={{
              left: `calc(${((tempo - min) / (max - min)) * 100}% - 8px)`,
              scale: 1
            }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Range indicators */}
        <div className="flex justify-between text-xs text-white/40 mt-2">
          <span>{min} BPM</span>
          <span>{max} BPM</span>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Slow', value: 80 },
          { label: 'Medium', value: 120 },
          { label: 'Fast', value: 140 },
          { label: 'Reset', value: defaultValue, isReset: true }
        ].map((preset) => (
          <motion.button
            key={preset.label}
            onClick={() => {
              if (preset.isReset) {
                resetTempo();
              } else {
                setTempo(preset.value);
                setInputValue(preset.value.toString());
              }
            }}
            className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              tempo === preset.value && !preset.isReset
                ? 'bg-accent-from text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {preset.isReset && <RotateCcw className="w-3 h-3" />}
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Tempo tap feature */}
      <div className="text-center">
        <motion.button
          onClick={handleTapTempo}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isTapping
              ? 'bg-accent-from text-white shadow-lg'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isTapping ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.2 }}
        >
          {isTapping ? `Tap ${tapTimes.length}/4` : 'Tap to set tempo'}
        </motion.button>
        {isTapping && (
          <p className="text-xs text-white/40 mt-2">
            Keep tapping to the beat...
          </p>
        )}
      </div>
    </div>
  );
};

export default TempoInput;
