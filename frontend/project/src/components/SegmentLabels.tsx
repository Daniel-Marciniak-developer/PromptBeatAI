import React from 'react';
import { motion } from 'framer-motion';

interface SegmentLabelsProps {
  duration: number;
}

const SegmentLabels: React.FC<SegmentLabelsProps> = ({ duration }) => {
  const segments = [
    { label: 'Intro', start: 0, color: '#6f00ff' },
    { label: 'Verse A', start: 0.15, color: '#009dff' },
    { label: 'Chorus', start: 0.4, color: '#ff6b6b' },
    { label: 'Verse B', start: 0.6, color: '#4ecdc4' },
    { label: 'Bridge', start: 0.8, color: '#ffeaa7' },
    { label: 'Outro', start: 0.9, color: '#96ceb4' }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8">
      {segments.map((segment, index) => {
        const nextSegment = segments[index + 1];
        const width = nextSegment 
          ? (nextSegment.start - segment.start) * 100 
          : (1 - segment.start) * 100;

        return (
          <motion.div
            key={segment.label}
            className="absolute bottom-0 h-full group cursor-pointer"
            style={{
              left: `${segment.start * 100}%`,
              width: `${width}%`
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            {/* Segment divider line */}
            <div 
              className="absolute left-0 top-0 w-px h-full opacity-30"
              style={{ backgroundColor: segment.color }}
            />
            
            {/* Hover label */}
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
              initial={false}
            >
              {segment.label}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
                style={{ backgroundColor: segment.color }}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SegmentLabels;