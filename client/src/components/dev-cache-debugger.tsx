import { useState, useEffect } from "react";
import { RefreshCw, Database, Trash2, Info } from "lucide-react";
import { offlineStorage, serviceWorkerManager, devCacheUtils } from "@/store/offline-storage";

interface CacheStats {
  offlineStorage: {
    total: number;
    byType: Record<string, number>;
    oldestEntry: number;
  };
  serviceWorker: {
    caches: string[];
    isDevelopment: boolean;
    version: string;
  };
  browserCaches: string[];
}

export default function DevCacheDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  useEffect(() => {
    if (isOpen) {
      loadCacheStats();
    }
  }, [isOpen]);

  const loadCacheStats = async () => {
    try {
      const stats = await devCacheUtils.getCacheInfo();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const handleClearAllCaches = async () => {
    setIsClearing(true);
    try {
      await devCacheUtils.forceRefresh();
    } catch (error) {
      console.error('Failed to clear caches:', error);
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <>
      {/* Floating debug button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-[60] bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Cache Debugger (Dev Only)"
      >
        <Database className="w-5 h-5" />
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Development Cache Debugger
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={loadCacheStats}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Stats
                </button>
                <button
                  onClick={handleClearAllCaches}
                  disabled={isClearing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearing ? 'Clearing...' : 'Clear All & Reload'}
                </button>
              </div>

              {/* Cache Statistics */}
              {cacheStats && (
                <div className="space-y-6">
                  {/* Offline Storage Stats */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Offline Storage (IndexedDB)
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Total Entries:</span>
                        <span className="ml-2 font-mono">{cacheStats.offlineStorage.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Oldest Entry:</span>
                        <span className="ml-2 font-mono">
                          {formatTime(cacheStats.offlineStorage.oldestEntry)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-300">By Type:</span>
                        <div className="ml-4 mt-1">
                          {Object.entries(cacheStats.offlineStorage.byType).map(([type, count]) => (
                            <div key={type} className="flex justify-between">
                              <span className="capitalize">{type}:</span>
                              <span className="font-mono">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Worker Stats */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Service Worker Caches
                    </h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Mode:</span>
                        <span className={`font-mono ${cacheStats.serviceWorker.isDevelopment ? 'text-yellow-600' : 'text-green-600'}`}>
                          {cacheStats.serviceWorker.isDevelopment ? 'Development' : 'Production'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Version:</span>
                        <span className="font-mono">{cacheStats.serviceWorker.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Active Caches:</span>
                        <div className="ml-4 mt-1 max-h-20 overflow-y-auto">
                          {cacheStats.serviceWorker.caches.map((cache, index) => (
                            <div key={index} className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {cache}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Caches */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Browser Cache API
                    </h3>
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300">Cache Names:</span>
                        <span className="font-mono">{cacheStats.browserCaches.length}</span>
                      </div>
                      {cacheStats.browserCaches.length > 0 && (
                        <div className="ml-4 max-h-20 overflow-y-auto">
                          {cacheStats.browserCaches.map((cache, index) => (
                            <div key={index} className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {cache}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Development Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Development Tips
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• Caches are automatically shortened in development mode</li>
                      <li>• API cache: 2min max, Static cache: 5min max</li>
                      <li>• Service Worker uses timestamped versions for cache busting</li>
                      <li>• Clear All & Reload forces a complete refresh of all caches</li>
                    </ul>
                  </div>
                </div>
              )}

              {!cacheStats && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Click "Refresh Stats" to load cache information
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}