import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PianoRollProps {
  currentTime: number;
  duration: number;
}

const PianoRoll: React.FC<PianoRollProps> = ({ currentTime, duration }) => {
  // Generate mock piano roll data
  const notes = useMemo(() => {
    const instruments = [
      { color: '#ff6b6b', name: 'Piano' },
      { color: '#4ecdc4', name: 'Bass' },
      { color: '#45b7d1', name: 'Strings' },
      { color: '#96ceb4', name: 'Synth' },
      { color: '#ffeaa7', name: 'Drums' }
    ];

    const noteData = [];
    for (let i = 0; i < 50; i++) {
      const instrument = instruments[Math.floor(Math.random() * instruments.length)];
      const startTime = Math.random() * duration;
      const noteDuration = 0.5 + Math.random() * 2;
      const pitch = 20 + Math.random() * 60;
      
      noteData.push({
        id: i,
        startTime,
        duration: noteDuration,
        pitch,
        color: instrument.color,
        instrument: instrument.name
      });
    }
    return noteData;
  }, [duration]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {notes.map((note) => {
        const left = (note.startTime / duration) * 100;
        const width = (note.duration / duration) * 100;
        const top = (note.pitch / 80) * 100;
        const isActive = currentTime >= note.startTime && 
                        currentTime <= note.startTime + note.duration;

        return (
          <motion.div
            key={note.id}
            className="absolute h-1 rounded-full"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              top: `${top}%`,
              backgroundColor: note.color,
              opacity: isActive ? 1 : 0.6,
              boxShadow: isActive ? `0 0 8px ${note.color}` : 'none'
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: isActive ? 1 : 0.6 }}
            transition={{ 
              delay: note.startTime / duration * 2,
              duration: 0.3,
              ease: "easeOut"
            }}
          />
        );
      })}
    </div>
  );
};

export default PianoRoll;