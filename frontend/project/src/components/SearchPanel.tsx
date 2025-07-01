import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Music,
  Clock,
  Play,
  Heart,
  Filter,
  ArrowRight,
  History
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'history' | 'favorite';
  title: string;
  description: string;
  metadata?: any;
  action: () => void;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'history' | 'favorite'>('history');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('promptbeat-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search term to recent searches
  const saveSearchTerm = (term: string) => {
    if (term.trim() && !recentSearches.includes(term)) {
      const updated = [term, ...recentSearches.slice(0, 9)]; // Keep only 10 recent searches
      setRecentSearches(updated);
      localStorage.setItem('promptbeat-recent-searches', JSON.stringify(updated));
    }
  };

  // Get all searchable data
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();



    // Search history
    const history = JSON.parse(localStorage.getItem('promptbeat-history') || '[]');
    history.forEach((item: any) => {
      if (
        selectedType === 'history' &&
        (item.prompt.toLowerCase().includes(term) ||
         item.style.toLowerCase().includes(term))
      ) {
        results.push({
          id: `history-${item.id}`,
          type: 'history',
          title: `History: ${item.style}`,
          description: item.prompt,
          metadata: { timestamp: item.timestamp, duration: item.duration },
          action: () => {
            onOpenHistory();
            onClose();
          }
        });
      }
    });

    // Search favorites
    const favorites = JSON.parse(localStorage.getItem('promptbeat-favorites') || '[]');
    favorites.forEach((fav: any) => {
      if (
        selectedType === 'favorite' &&
        (fav.name.toLowerCase().includes(term) ||
         fav.prompt.toLowerCase().includes(term) ||
         fav.style.toLowerCase().includes(term) ||
         fav.tags.some((tag: string) => tag.toLowerCase().includes(term)))
      ) {
        results.push({
          id: `favorite-${fav.id}`,
          type: 'favorite',
          title: fav.name,
          description: fav.prompt,
          metadata: { style: fav.style, tags: fav.tags },
          action: () => {
            console.log('Play favorite:', fav);
            onClose();
          }
        });
      }
    });



    return results.slice(0, 20); // Limit to 20 results
  }, [searchTerm, selectedType, onOpenHistory, onOpenSettings, onClose]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'history': return History;
      case 'favorite': return Heart;
      default: return Music;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'history': return '#4ecdc4';
      case 'favorite': return '#f093fb';
      default: return '#ffffff';
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      saveSearchTerm(term);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('promptbeat-recent-searches');
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
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Global Search</h2>
                <p className="text-white/60 text-sm">Search across history and favorites</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search everything..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50 text-lg"
              autoFocus
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'history', label: 'History', icon: History },
              { key: 'favorite', label: 'Favorites', icon: Heart }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedType === key
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!searchTerm.trim() ? (
            <div>
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white/80 font-medium">Recent Searches</h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-white/40 hover:text-white/60 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(term)}
                        className="bg-white/5 hover:bg-white/10 text-white/70 px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Start typing to search across all your content</p>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => {
                const Icon = getTypeIcon(result.type);
                const color = getTypeColor(result.type);
                
                return (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={result.action}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium truncate">{result.title}</h4>
                          <span 
                            className="text-xs px-2 py-1 rounded capitalize"
                            style={{ 
                              backgroundColor: `${color}20`,
                              color: color
                            }}
                          >
                            {result.type}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm line-clamp-2">{result.description}</p>
                        {result.metadata && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                            {result.metadata.style && (
                              <span>Style: {result.metadata.style}</span>
                            )}
                            {result.metadata.duration && (
                              <span>Duration: {result.metadata.duration}s</span>
                            )}
                            {result.metadata.tags && (
                              <span>Tags: {result.metadata.tags.slice(0, 2).join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {searchResults.length > 0 && (
          <div className="p-6 border-t border-white/10">
            <p className="text-white/40 text-sm text-center">
              {searchResults.length} results found
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SearchPanel;
