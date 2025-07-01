import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Music,
  Clock,
  Play,
  Trash2,
  Star
} from 'lucide-react';

interface FavoriteProject {
  id: string;
  name: string;
  prompt: string;
  createdAt: Date;
  addedToFavoritesAt: Date;
  duration: number;
  style: string;
  tags: string[];
}

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromFavorites: (projectId: string) => void;
  refreshTrigger?: number;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  isOpen,
  onClose,
  onRemoveFromFavorites,
  refreshTrigger = 0
}) => {
  const [favorites, setFavorites] = useState<FavoriteProject[]>([]);

  // Simple function to load favorites
  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('promptbeat-favorites');
      console.log('📦 Loading favorites from localStorage:', saved);

      if (saved) {
        const parsed = JSON.parse(saved);
        const processed = parsed.map((fav: any) => ({
          ...fav,
          createdAt: typeof fav.createdAt === 'string' ? new Date(fav.createdAt) : fav.createdAt,
          addedToFavoritesAt: typeof fav.addedToFavoritesAt === 'string' ? new Date(fav.addedToFavoritesAt) : fav.addedToFavoritesAt
        }));
        console.log('✅ Loaded favorites:', processed);
        setFavorites(processed);
      } else {
        console.log('📭 No favorites in localStorage');
        setFavorites([]);
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      setFavorites([]);
    }
  };

  // Load favorites when refreshTrigger changes
  useEffect(() => {
    console.log('🔄 Refresh trigger changed:', refreshTrigger);
    loadFavorites();
  }, [refreshTrigger]);

  // Load favorites when panel opens
  useEffect(() => {
    if (isOpen) {
      console.log('🚪 Panel opened, loading favorites');
      loadFavorites();
    }
  }, [isOpen]);



  const removeFromFavorites = (projectId: string) => {
    console.log('🗑️ Removing favorite from panel:', projectId);
    onRemoveFromFavorites(projectId);
    // Don't update local state here - let the parent handle it and trigger refresh
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-5xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Favorite Projects</h2>
                <p className="text-white/60 text-sm">Your saved favorite music projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>


        </div>

        {/* Favorites List */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-pink-400/30 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">No Favorites Yet</h3>
              <p className="text-white/60 mb-4">
                Start adding your favorite beats to see them here
              </p>
              <p className="text-white/40 text-sm">
                Click the heart icon on any generated beat to add it to favorites
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {favorites.map((favorite) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4 hover:from-pink-500/20 hover:to-purple-500/20 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <h3 className="text-white font-medium truncate">{favorite.name}</h3>
                        <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                          {favorite.style}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{favorite.prompt}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Added {formatDate(favorite.addedToFavoritesAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {favorite.duration}s
                        </div>
                      </div>
                      {favorite.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {favorite.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => console.log('Play favorite:', favorite)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Play favorite"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromFavorites(favorite.id)}
                        className="p-2 text-pink-400 hover:text-pink-300 hover:bg-pink-400/20 rounded-lg transition-colors"
                        title="Remove from favorites"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-white/40 text-sm text-center">
            {favorites.length} favorite projects
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FavoritesPanel;
