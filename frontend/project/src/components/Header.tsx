import React from 'react';
import { motion } from 'framer-motion';
import { Music, Share } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header 
      className="flex items-center justify-between p-6 md:p-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Logo */}
      <motion.div 
        className="flex items-center space-x-3"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-from to-accent-to rounded-lg blur-md opacity-50" />
          <div className="relative bg-glass backdrop-blur-md border border-white/10 rounded-lg p-2">
            <Music className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent-from to-accent-to bg-clip-text text-transparent">
            PromptBeat
          </h1>
          <p className="text-sm text-white/60">AI Music Generator</p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex items-center space-x-4">
        {[
          { icon: Share, label: 'Share' }
        ].map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            className="ghost-button group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden md:inline ml-2">{label}</span>
          </motion.button>
        ))}
      </div>
    </motion.header>
  );
};

export default Header;