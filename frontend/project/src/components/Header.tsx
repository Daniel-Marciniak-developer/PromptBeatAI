import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';

interface HeaderProps {
  hideLogo?: boolean;
}

const Header: React.FC<HeaderProps> = ({ hideLogo = false }) => {
  return (
    <motion.header
      className="flex items-center justify-between p-6 md:p-8 min-h-[80px]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Logo */}
      <AnimatePresence mode="wait">
        {!hideLogo && (
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
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
        )}
      </AnimatePresence>

      {/* Placeholder when logo is hidden to maintain header space */}
      {hideLogo && <div />}
    </motion.header>
  );
};

export default Header;