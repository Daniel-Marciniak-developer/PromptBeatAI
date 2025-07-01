import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SelectDropdown from './SelectDropdown';
import { 
  X, 
  Download, 
  Music, 
  Clock, 
  FileAudio, 
  Trash2, 
  Play,
  Folder,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DownloadItem {
  id: string;
  projectId: string;
  projectName: string;
  fileName: string;
  format: 'mp3' | 'wav' | 'flac';
  quality: string;
  size: number; // in bytes
  downloadedAt: Date;
  status: 'completed' | 'failed' | 'pending';
  url?: string;
  duration: number;
}

interface DownloadsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRedownload: (item: DownloadItem) => void;
}

const DownloadsPanel: React.FC<DownloadsPanelProps> = ({
  isOpen,
  onClose,
  onRedownload
}) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState<'all' | 'mp3' | 'wav' | 'flac'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'format'>('date');

  // Load downloads from localStorage on mount
  useEffect(() => {
    const savedDownloads = localStorage.getItem('promptbeat-downloads');
    if (savedDownloads) {
      const parsed = JSON.parse(savedDownloads);
      setDownloads(parsed.map((item: any) => ({
        ...item,
        downloadedAt: new Date(item.downloadedAt)
      })));
    }
  }, []);

  // Save downloads to localStorage whenever downloads change
  useEffect(() => {
    localStorage.setItem('promptbeat-downloads', JSON.stringify(downloads));
  }, [downloads]);

  const filteredAndSortedDownloads = downloads
    .filter(item => {
      const matchesSearch = item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormat = filterFormat === 'all' || item.format === filterFormat;
      return matchesSearch && matchesFormat;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.downloadedAt.getTime() - a.downloadedAt.getTime();
        case 'name':
          return a.projectName.localeCompare(b.projectName);
        case 'size':
          return b.size - a.size;
        case 'format':
          return a.format.localeCompare(b.format);
        default:
          return 0;
      }
    });

  const deleteDownload = (downloadId: string) => {
    setDownloads(prev => prev.filter(item => item.id !== downloadId));
  };

  const clearAllDownloads = () => {
    if (confirm('Are you sure you want to clear all download history?')) {
      setDownloads([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTotalSize = () => {
    return downloads.reduce((total, item) => total + item.size, 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      case 'pending': return RefreshCw;
      default: return Download;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'mp3': return '#3b82f6';
      case 'wav': return '#10b981';
      case 'flac': return '#8b5cf6';
      default: return '#6b7280';
    }
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
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Downloads</h2>
                <p className="text-white/60 text-sm">
                  Manage your downloaded music files • {downloads.length} files • {formatFileSize(getTotalSize())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {downloads.length > 0 && (
                <button
                  onClick={clearAllDownloads}
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
          <div className="mt-4 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search downloads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              <SelectDropdown
                options={[
                  { value: 'date', label: 'Sort by Date' },
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'size', label: 'Sort by Size' },
                  { value: 'format', label: 'Sort by Format' }
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value as any)}
                className="min-w-[140px]"
              />
              <SelectDropdown
                options={[
                  { value: 'all', label: 'All Formats' },
                  { value: 'mp3', label: 'MP3' },
                  { value: 'wav', label: 'WAV' },
                  { value: 'flac', label: 'FLAC' }
                ]}
                value={filterFormat}
                onChange={(value) => setFilterFormat(value as any)}
                className="min-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Downloads List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredAndSortedDownloads.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">
                {downloads.length === 0 ? 'No downloads yet' : 'No downloads match your search'}
              </p>
              <p className="text-white/40 text-sm">
                Download music files to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDownloads.map((item) => {
                const StatusIcon = getStatusIcon(item.status);
                const statusColor = getStatusColor(item.status);
                const formatColor = getFormatColor(item.format);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <FileAudio className="w-5 h-5 text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium truncate">{item.projectName}</h4>
                            <span 
                              className="text-xs px-2 py-1 rounded uppercase font-medium"
                              style={{ 
                                backgroundColor: `${formatColor}20`,
                                color: formatColor
                              }}
                            >
                              {item.format}
                            </span>
                            <div className="flex items-center gap-1">
                              <StatusIcon 
                                className="w-3 h-3" 
                                style={{ color: statusColor }}
                              />
                              <span 
                                className="text-xs capitalize"
                                style={{ color: statusColor }}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-white/60 text-sm truncate">{item.fileName}</p>
                          <div className="flex items-center gap-4 text-xs text-white/40 mt-1">
                            <span>{formatFileSize(item.size)}</span>
                            <span>{item.duration}s</span>
                            <span>{item.quality}</span>
                            <span>{formatDate(item.downloadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => console.log('Play download:', item)}
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Play download"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        {item.status === 'completed' && item.url && (
                          <a
                            href={item.url}
                            download={item.fileName}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Download again"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {item.status === 'failed' && (
                          <button
                            onClick={() => onRedownload(item)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 rounded-lg transition-colors"
                            title="Retry download"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDownload(item.id)}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                          title="Remove from list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between items-center text-sm text-white/40">
            <span>
              {filteredAndSortedDownloads.length} of {downloads.length} downloads
            </span>
            <span>
              Total size: {formatFileSize(getTotalSize())}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DownloadsPanel;
