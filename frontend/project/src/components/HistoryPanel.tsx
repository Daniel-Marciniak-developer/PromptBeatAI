import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Music, 
  Play, 
  Trash2, 
  Download,
  RotateCcw,
  Calendar
} from 'lucide-react';

interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  duration: number;
  style: string;
  settings: any;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreFromHistory: (item: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  onRestoreFromHistory
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('promptbeat-history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.style.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const now = new Date();
    const itemDate = item.timestamp;
    
    switch (timeFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      default:
        return true;
    }
  });

  const deleteHistoryItem = (itemId: string) => {
    const updatedHistory = history.filter(item => item.id !== itemId);
    setHistory(updatedHistory);
    localStorage.setItem('promptbeat-history', JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptbeat-history');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  const groupHistoryByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    items.forEach(item => {
      const dateKey = item.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (!isOpen) return null;

  const groupedHistory = groupHistoryByDate(filteredHistory);

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generation History</h2>
                <p className="text-white/60 text-sm">Browse your previous generations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-red-400 hover:bg-red-400/20 px-3 py-1 rounded-lg transition-colors text-sm"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-accent-from/50"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter as any)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm capitalize ${
                    timeFilter === filter 
                      ? 'bg-accent-from text-white' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {history.length === 0 ? 'No generation history yet' : 'No items match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedHistory.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <h3 className="text-white/60 text-sm font-medium">
                      {new Date(dateKey).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                                {item.style}
                              </span>
                              <span className="text-xs text-white/40">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-white/80 text-sm mb-2 line-clamp-2">{item.prompt}</p>
                            <div className="flex items-center gap-4 text-xs text-white/40">
                              <div className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {item.duration}s
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => onRestoreFromHistory(item)}
                              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Restore this generation"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-white/40 text-sm text-center">
            {filteredHistory.length} of {history.length} generations
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HistoryPanel;
