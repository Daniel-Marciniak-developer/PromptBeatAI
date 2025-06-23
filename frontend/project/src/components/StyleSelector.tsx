import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StyleSelector: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState('Lo-fi');
  
  const styles = [
    { name: 'Lo-fi', gradient: 'from-purple-500 to-pink-500' },
    { name: 'Hip-hop', gradient: 'from-red-500 to-orange-500' },
    { name: 'EDM', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Cinematic', gradient: 'from-gray-600 to-gray-800' },
    { name: 'Classical', gradient: 'from-yellow-600 to-amber-600' },
    { name: 'Podcast', gradient: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {styles.map((style) => (
        <motion.button
          key={style.name}
          onClick={() => setSelectedStyle(style.name)}
          className={`relative p-4 rounded-xl border-2 transition-all ${
            selectedStyle === style.name
              ? 'border-accent-from bg-white/10'
              : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`w-full h-16 bg-gradient-to-r ${style.gradient} rounded-lg mb-3 opacity-80`} />
          <span className="text-white font-medium">{style.name}</span>
          
          {selectedStyle === style.name && (
            <motion.div
              className="absolute inset-0 border-2 border-accent-from rounded-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default StyleSelector;