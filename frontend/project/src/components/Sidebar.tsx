import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  History, 
  Settings, 
  Music, 
  Headphones, 
  Download, 
  Share2,
  Heart,
  Folder,
  Search
} from 'lucide-react';

interface SidebarProps {
  onNewProject?: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  onOpenProjects?: () => void;
  onSidebarStateChange?: (isExpanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNewProject,
  onOpenHistory,
  onOpenSettings,
  onOpenProjects,
  onSidebarStateChange
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Notify parent about sidebar state changes
  useEffect(() => {
    onSidebarStateChange?.(isHovered);
  }, [isHovered, onSidebarStateChange]);

  const menuItems = [
    { icon: Plus, label: 'New Project', action: onNewProject, color: '#ff6b6b' },
    { icon: History, label: 'History', action: onOpenHistory, color: '#4ecdc4' },
    { icon: Folder, label: 'Projects', action: onOpenProjects, color: '#45b7d1' },
    { icon: Heart, label: 'Favorites', action: () => {}, color: '#f093fb' },
    { icon: Search, label: 'Search', action: () => {}, color: '#feca57' },
    { icon: Download, label: 'Downloads', action: () => {}, color: '#48dbfb' },
    { icon: Share2, label: 'Share', action: () => {}, color: '#ff9ff3' },
    { icon: Settings, label: 'Settings', action: onOpenSettings, color: '#54a0ff' },
  ];

  return (
    <>
      {/* Invisible hover trigger area */}
      <div
        className="fixed left-0 top-0 w-20 h-full z-[100]"
        onMouseEnter={() => setIsHovered(true)}
        style={{ pointerEvents: 'auto' }}
      />

      <motion.div
        className="fixed left-0 top-0 h-full z-[100] flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Collapsed Sidebar */}
        <motion.div
          className="bg-black/80 backdrop-blur-lg border-r border-white/10 flex flex-col items-center py-6"
          animate={{
            width: isHovered ? 0 : 80,
            opacity: isHovered ? 0 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
        {/* Logo */}
        <motion.div 
          className="mb-8 p-3 bg-gradient-to-r from-accent-from to-accent-to rounded-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Music className="w-6 h-6 text-white" />
        </motion.div>

        {/* Menu Icons */}
        <div className="flex flex-col space-y-4">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={item.action}
            >
              <item.icon 
                className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" 
                style={{ color: isHovered ? item.color : undefined }}
              />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Expanded Sidebar */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-black/90 backdrop-blur-xl border-r border-white/10 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <motion.div 
                className="mb-8"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">PromptBeat</h2>
                </div>
                <p className="text-white/60 text-sm">AI Music Generator</p>
              </motion.div>

              {/* Menu Items */}
              <motion.div 
                className="space-y-2 flex-1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
                    whileHover={{ x: 5 }}
                    onClick={item.action}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <item.icon 
                        className="w-4 h-4"
                        style={{ color: item.color }}
                      />
                    </div>
                    <span className="text-white/80 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>

              {/* Footer */}
              <motion.div 
                className="mt-auto pt-6 border-t border-white/10"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Pro Mode</p>
                    <p className="text-white/50 text-xs">Unlimited generations</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
};

export default Sidebar;
