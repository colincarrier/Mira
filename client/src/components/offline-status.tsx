import { useState, useEffect } from 'react';
import { useOfflineStore } from '@/store/offline-store';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function OfflineStatus() {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingItems,
    conflictItems,
    syncWithServer
  } = useOfflineStore();

  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = () => {
    if (conflictItems > 0) return 'bg-red-500';
    if (!isOnline) return 'bg-yellow-500';
    if (pendingItems > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (conflictItems > 0) return `${conflictItems} conflicts`;
    if (!isOnline) return 'Offline';
    if (pendingItems > 0) return `${pendingItems} pending`;
    return 'All synced';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="w-3 h-3 animate-spin" />;
    if (conflictItems > 0) return <AlertCircle className="w-3 h-3" />;
    if (!isOnline) return <WifiOff className="w-3 h-3" />;
    if (pendingItems > 0) return <Clock className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  const handleManualSync = async () => {
    if (isOnline && !isSyncing) {
      await syncWithServer();
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed top-4 right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors cursor-pointer"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
              <span className="text-xs text-gray-600">
                {getStatusText()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync status - click for details</p>
          </TooltipContent>
        </Tooltip>

        {/* Detailed Status Panel */}
        {showDetails && (
          <div className="absolute top-12 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Sync Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Last Sync */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium">{formatLastSync(lastSyncTime)}</span>
            </div>

            {/* Pending Items */}
            {pendingItems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending changes:</span>
                <Badge variant="secondary">{pendingItems}</Badge>
              </div>
            )}

            {/* Conflicts */}
            {conflictItems > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Conflicts:</span>
                <Badge variant="destructive">{conflictItems}</Badge>
              </div>
            )}

            {/* Auto-sync status */}
            {isOnline && (
              <div className="text-xs text-gray-500 text-center">
                {isSyncing ? 'Syncing changes...' : 'Auto-sync enabled'}
              </div>
            )}

            {/* Offline Mode Info */}
            {!isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Offline Mode
                </h4>
                <p className="text-xs text-blue-700">
                  You can continue using Mira offline. Changes will sync automatically when connection is restored.
                </p>
              </div>
            )}

            {/* Capabilities in Offline Mode */}
            {!isOnline && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-700">Available offline:</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>• Create and edit notes</li>
                  <li>• Voice recording</li>
                  <li>• Todo management</li>
                  <li>• View collections</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}