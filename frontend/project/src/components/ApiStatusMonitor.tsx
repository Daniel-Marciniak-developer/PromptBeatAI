import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface ApiStatusMonitorProps {
  className?: string;
}

interface ApiHealth {
  status: 'online' | 'offline' | 'checking';
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

export const ApiStatusMonitor: React.FC<ApiStatusMonitorProps> = ({ className = '' }) => {
  const [apiHealth, setApiHealth] = useState<ApiHealth>({ status: 'checking' });
  const [isExpanded, setIsExpanded] = useState(false);

  // Sprawdź status API
  const checkApiHealth = async (): Promise<ApiHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:8000/docs', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'online',
          responseTime,
          lastChecked: new Date()
        };
      } else {
        return {
          status: 'offline',
          lastChecked: new Date(),
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'offline',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  };

  // Sprawdzaj status co 30 sekund
  useEffect(() => {
    const checkStatus = async () => {
      const health = await checkApiHealth();
      setApiHealth(health);
    };

    // Sprawdź od razu
    checkStatus();

    // Następnie co 30 sekund
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (apiHealth.status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'checking':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (apiHealth.status) {
      case 'online':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'offline':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'checking':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
    }
  };

  const getStatusText = () => {
    switch (apiHealth.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <motion.div
        className={`border rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-200 ${getStatusColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Compact view */}
        <div className="flex items-center space-x-2 p-2 px-3">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
          {apiHealth.status === 'online' && apiHealth.responseTime && (
            <span className="text-xs opacity-60">
              {formatResponseTime(apiHealth.responseTime)}
            </span>
          )}
        </div>

        {/* Expanded view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10 p-3 space-y-2"
            >
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="opacity-60">Endpoint:</span>
                  <span>localhost:8000</span>
                </div>
                
                {apiHealth.responseTime && (
                  <div className="flex justify-between">
                    <span className="opacity-60">Response Time:</span>
                    <span>{formatResponseTime(apiHealth.responseTime)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="opacity-60">Last Checked:</span>
                  <span>{formatLastChecked(apiHealth.lastChecked)}</span>
                </div>
                
                {apiHealth.error && (
                  <div className="flex justify-between">
                    <span className="opacity-60">Error:</span>
                    <span className="text-red-300 text-xs">{apiHealth.error}</span>
                  </div>
                )}
              </div>

              {/* Manual refresh button */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setApiHealth({ status: 'checking' });
                  const health = await checkApiHealth();
                  setApiHealth(health);
                }}
                className="w-full flex items-center justify-center space-x-1 py-1 px-2 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
              >
                <Zap className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
