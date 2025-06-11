/**
 * Enhanced Offline Storage System with Development Cache Busting
 * Provides comprehensive local storage with intelligent cache management
 */

interface StorageItem {
  data: any;
  timestamp: number;
  version: string;
  type: 'api' | 'user' | 'cache';
  expiry?: number;
}

interface CacheConfig {
  maxAge: number;
  priority: 'high' | 'medium' | 'low';
  syncOnReconnect: boolean;
}

class OfflineStorageManager {
  private dbName = 'MiraOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isDevelopment = import.meta.env.DEV || location.hostname === 'localhost';
  
  // Cache configurations for different data types
  private cacheConfigs: Record<string, CacheConfig> = {
    'api/notes': { maxAge: 5 * 60 * 1000, priority: 'high', syncOnReconnect: true },
    'api/todos': { maxAge: 5 * 60 * 1000, priority: 'high', syncOnReconnect: true },
    'api/collections': { maxAge: 15 * 60 * 1000, priority: 'medium', syncOnReconnect: true },
    'user/preferences': { maxAge: 24 * 60 * 60 * 1000, priority: 'high', syncOnReconnect: false },
    'cache/images': { maxAge: 60 * 60 * 1000, priority: 'low', syncOnReconnect: false }
  };

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for different data types
        if (!db.objectStoreNames.contains('api')) {
          const apiStore = db.createObjectStore('api', { keyPath: 'key' });
          apiStore.createIndex('timestamp', 'timestamp');
          apiStore.createIndex('type', 'type');
        }
        
        if (!db.objectStoreNames.contains('user')) {
          const userStore = db.createObjectStore('user', { keyPath: 'key' });
          userStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('expiry', 'expiry');
        }
      };
    });
  }

  // Store data with intelligent caching strategy
  async store(key: string, data: any, type: 'api' | 'user' | 'cache' = 'api'): Promise<void> {
    if (!this.db) await this.init();
    
    const config = this.cacheConfigs[key] || this.cacheConfigs['api/notes'];
    const now = Date.now();
    
    // In development, use shorter cache times
    const maxAge = this.isDevelopment ? Math.min(config.maxAge, 2 * 60 * 1000) : config.maxAge;
    
    const item: StorageItem = {
      data,
      timestamp: now,
      version: this.isDevelopment ? `dev-${now}` : '1.0.0',
      type,
      expiry: now + maxAge
    };

    const transaction = this.db!.transaction([type], 'readwrite');
    const store = transaction.objectStore(type);
    
    await new Promise((resolve, reject) => {
      const request = store.put({ key, ...item });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve data with staleness checking
  async retrieve(key: string, type: 'api' | 'user' | 'cache' = 'api'): Promise<any | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([type], 'readonly');
    const store = transaction.objectStore(type);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const now = Date.now();
        const config = this.cacheConfigs[key] || this.cacheConfigs['api/notes'];
        
        // Check if data is stale
        const maxAge = this.isDevelopment ? Math.min(config.maxAge, 2 * 60 * 1000) : config.maxAge;
        const isStale = now - result.timestamp > maxAge;
        
        if (isStale && this.isDevelopment) {
          // In development, return null for stale data to force refresh
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear stale cache entries
  async clearStaleEntries(): Promise<void> {
    if (!this.db) await this.init();
    
    const now = Date.now();
    const stores = ['api', 'user', 'cache'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value;
          const config = this.cacheConfigs[data.key] || this.cacheConfigs['api/notes'];
          const maxAge = this.isDevelopment ? Math.min(config.maxAge, 2 * 60 * 1000) : config.maxAge;
          
          if (now - data.timestamp > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }

  // Development: Force clear all caches
  async clearAllCaches(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['api', 'user', 'cache'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('All offline caches cleared for development');
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ total: number; byType: Record<string, number>; oldestEntry: number }> {
    if (!this.db) await this.init();
    
    const stats = { total: 0, byType: { api: 0, user: 0, cache: 0 }, oldestEntry: Date.now() };
    const stores = ['api', 'user', 'cache'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => {
          stats.byType[storeName as keyof typeof stats.byType] = request.result;
          stats.total += request.result;
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
      
      // Find oldest entry
      const index = store.index('timestamp');
      await new Promise((resolve, reject) => {
        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            stats.oldestEntry = Math.min(stats.oldestEntry, cursor.value.timestamp);
          }
          resolve(undefined);
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    return stats;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

// Enhanced service worker communication
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  
  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered');
        
        // Handle updates in development
        if (import.meta.env.DEV) {
          this.registration.addEventListener('updatefound', () => {
            console.log('New ServiceWorker version available in development');
            this.registration?.update();
          });
        }
      } catch (error) {
        console.warn('ServiceWorker registration failed:', error);
      }
    }
  }

  // Force cache clearing for development
  async clearCaches(): Promise<boolean> {
    if (!this.registration || !this.registration.active) return false;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };
      
      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  // Get cache status
  async getCacheStatus(): Promise<{ caches: string[]; isDevelopment: boolean; version: string }> {
    if (!this.registration || !this.registration.active) {
      return { caches: [], isDevelopment: false, version: 'unknown' };
    }
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

// Development cache busting utilities
export const devCacheUtils = {
  // Force refresh all data in development
  async forceRefresh(): Promise<void> {
    if (import.meta.env.DEV) {
      await offlineStorage.clearAllCaches();
      await serviceWorkerManager.clearCaches();
      
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Force reload
      window.location.reload();
    }
  },

  // Get comprehensive cache information
  async getCacheInfo(): Promise<{
    offlineStorage: any;
    serviceWorker: any;
    browserCaches: string[];
  }> {
    const info = {
      offlineStorage: await offlineStorage.getCacheStats(),
      serviceWorker: await serviceWorkerManager.getCacheStatus(),
      browserCaches: 'caches' in window ? await caches.keys() : []
    };
    
    console.log('Cache Information:', info);
    return info;
  }
};