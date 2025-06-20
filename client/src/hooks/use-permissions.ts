import { useState, useEffect, useCallback, useRef } from 'react';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

interface MiraPermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaDevices: boolean;
}

interface PermissionCache {
  camera: {
    granted: boolean;
    timestamp: number;
    lastDenied: number;
  };
  microphone: {
    granted: boolean;
    timestamp: number;
    lastDenied: number;
  };
}

const PERMISSION_CACHE_KEY = 'mira-permissions-cache';
const CACHE_VALIDITY_HOURS = 24;
const DENIAL_COOLDOWN_MINUTES = 5;

function loadPermissionCache(): PermissionCache {
  try {
    const cached = localStorage.getItem(PERMISSION_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to load permission cache:', error);
  }
  
  return {
    camera: { granted: false, timestamp: 0, lastDenied: 0 },
    microphone: { granted: false, timestamp: 0, lastDenied: 0 }
  };
}

function savePermissionCache(cache: PermissionCache) {
  try {
    localStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save permission cache:', error);
  }
}

function isCacheValid(timestamp: number): boolean {
  const now = Date.now();
  const hoursOld = (now - timestamp) / (1000 * 60 * 60);
  return hoursOld < CACHE_VALIDITY_HOURS;
}

function isInDenialCooldown(lastDenied: number): boolean {
  const now = Date.now();
  const minutesSinceDenial = (now - lastDenied) / (1000 * 60);
  return minutesSinceDenial < DENIAL_COOLDOWN_MINUTES;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<MiraPermissionState>({
    camera: 'unknown',
    microphone: 'unknown',
    mediaDevices: !!navigator.mediaDevices
  });

  const permissionCache = useRef<PermissionCache>(loadPermissionCache());

  // Check existing permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      setPermissions(prev => ({ ...prev, mediaDevices: !!navigator.mediaDevices }));
      
      if (!navigator.permissions) {
        return;
      }

      try {
        const [cameraPermission, microphonePermission] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName })
        ]);

        setPermissions({
          camera: cameraPermission.state as PermissionStatus,
          microphone: microphonePermission.state as PermissionStatus,
          mediaDevices: !!navigator.mediaDevices
        });

        // Update cache based on current permission state
        const cache = permissionCache.current;
        const now = Date.now();
        
        if (cameraPermission.state === 'granted') {
          cache.camera = { granted: true, timestamp: now, lastDenied: 0 };
        }
        if (microphonePermission.state === 'granted') {
          cache.microphone = { granted: true, timestamp: now, lastDenied: 0 };
        }
        
        savePermissionCache(cache);

        // Listen for permission changes
        cameraPermission.addEventListener('change', () => {
          const newState = cameraPermission.state as PermissionStatus;
          setPermissions(prev => ({ ...prev, camera: newState }));
          
          if (newState === 'granted') {
            cache.camera = { granted: true, timestamp: Date.now(), lastDenied: 0 };
            savePermissionCache(cache);
          } else if (newState === 'denied') {
            cache.camera = { granted: false, timestamp: 0, lastDenied: Date.now() };
            savePermissionCache(cache);
          }
        });

        microphonePermission.addEventListener('change', () => {
          const newState = microphonePermission.state as PermissionStatus;
          setPermissions(prev => ({ ...prev, microphone: newState }));
          
          if (newState === 'granted') {
            cache.microphone = { granted: true, timestamp: Date.now(), lastDenied: 0 };
            savePermissionCache(cache);
          } else if (newState === 'denied') {
            cache.microphone = { granted: false, timestamp: 0, lastDenied: Date.now() };
            savePermissionCache(cache);
          }
        });
      } catch (error) {
        console.log('Permission API not fully supported, will request as needed');
      }
    };

    checkPermissions();
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const cache = permissionCache.current;
    
    // Check persistent cache first
    if (cache.camera.granted && isCacheValid(cache.camera.timestamp)) {
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      return true;
    }

    // Check current browser permission state
    if (permissions.camera === 'granted') {
      // Update cache with fresh grant
      cache.camera = { granted: true, timestamp: Date.now(), lastDenied: 0 };
      savePermissionCache(cache);
      return true;
    }

    // Don't request if recently denied
    if (isInDenialCooldown(cache.camera.lastDenied)) {
      console.log('Camera permission in denial cooldown');
      return false;
    }

    try {
      // Request with progressive fallback
      let stream: MediaStream | null = null;
      
      try {
        // Try with ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
      } catch (specificError) {
        console.log('Specific camera constraints failed, trying basic:', specificError);
        // Fallback to basic video constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        
        // Update both state and persistent cache
        setPermissions(prev => ({ ...prev, camera: 'granted' }));
        cache.camera = { granted: true, timestamp: Date.now(), lastDenied: 0 };
        savePermissionCache(cache);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Camera permission error details:', {
        name: error?.name,
        message: error?.message,
        constraint: error?.constraint
      });
      
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      cache.camera = { granted: false, timestamp: 0, lastDenied: Date.now() };
      savePermissionCache(cache);
      
      return false;
    }
  }, [permissions.camera]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    const cache = permissionCache.current;
    
    // Check persistent cache first
    if (cache.microphone.granted && isCacheValid(cache.microphone.timestamp)) {
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      return true;
    }

    // Check current browser permission state
    if (permissions.microphone === 'granted') {
      // Update cache with fresh grant
      cache.microphone = { granted: true, timestamp: Date.now(), lastDenied: 0 };
      savePermissionCache(cache);
      return true;
    }

    // Don't request if recently denied
    if (isInDenialCooldown(cache.microphone.lastDenied)) {
      console.log('Microphone permission in denial cooldown');
      return false;
    }

    try {
      // Detect best audio format and constraints
      const supportedFormats = [
        'audio/webm',
        'audio/webm;codecs=opus', 
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ].filter(format => MediaRecorder.isTypeSupported(format));

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      // Update both state and persistent cache
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      cache.microphone = { granted: true, timestamp: Date.now(), lastDenied: 0 };
      savePermissionCache(cache);
      
      return true;
    } catch (error: any) {
      console.error('Microphone permission error details:', {
        name: error?.name,
        message: error?.message,
        constraint: error?.constraint
      });
      
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      cache.microphone = { granted: false, timestamp: 0, lastDenied: Date.now() };
      savePermissionCache(cache);
      
      return false;
    }
  }, [permissions.microphone]);

  const requestBothPermissions = useCallback(async (): Promise<{ camera: boolean; microphone: boolean }> => {
    const cache = permissionCache.current;
    
    // Check if we already have both permissions from cache
    const cameraValid = cache.camera.granted && isCacheValid(cache.camera.timestamp);
    const microphoneValid = cache.microphone.granted && isCacheValid(cache.microphone.timestamp);
    
    if (cameraValid && microphoneValid) {
      setPermissions(prev => ({ 
        ...prev, 
        camera: 'granted', 
        microphone: 'granted' 
      }));
      return { camera: true, microphone: true };
    }

    try {
      // Request both at once with fallbacks
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      stream.getTracks().forEach(track => track.stop());

      const now = Date.now();
      setPermissions(prev => ({ 
        ...prev, 
        camera: 'granted', 
        microphone: 'granted' 
      }));

      // Update cache for both
      cache.camera = { granted: true, timestamp: now, lastDenied: 0 };
      cache.microphone = { granted: true, timestamp: now, lastDenied: 0 };
      savePermissionCache(cache);

      return { camera: true, microphone: true };
    } catch (error) {
      console.error('Combined media permissions error:', error);
      
      // Try individual permissions with detailed error handling
      const cameraResult = await requestCameraPermission();
      const microphoneResult = await requestMicrophonePermission();
      
      return { camera: cameraResult, microphone: microphoneResult };
    }
  }, [permissions.camera, permissions.microphone, requestCameraPermission, requestMicrophonePermission]);

  const clearPermissionCache = useCallback(() => {
    localStorage.removeItem(PERMISSION_CACHE_KEY);
    permissionCache.current = loadPermissionCache();
    setPermissions({
      camera: 'unknown',
      microphone: 'unknown',
      mediaDevices: !!navigator.mediaDevices
    });
  }, []);

  // Initialize permissions from cache on mount
  useEffect(() => {
    const cache = permissionCache.current;
    if (cache.camera.granted && isCacheValid(cache.camera.timestamp)) {
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
    }
    if (cache.microphone.granted && isCacheValid(cache.microphone.timestamp)) {
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
    }
  }, []);

  return {
    permissions,
    hasCamera: permissions.camera === 'granted' || (permissionCache.current.camera.granted && isCacheValid(permissionCache.current.camera.timestamp)),
    hasMicrophone: permissions.microphone === 'granted' || (permissionCache.current.microphone.granted && isCacheValid(permissionCache.current.microphone.timestamp)),
    canRequestPermissions: permissions.mediaDevices,
    requestCameraPermission,
    requestMicrophonePermission,
    requestBothPermissions,
    clearPermissionCache,
    needsCameraPermission: permissions.camera !== 'granted' && !isInDenialCooldown(permissionCache.current.camera.lastDenied),
    needsMicrophonePermission: permissions.microphone !== 'granted' && !isInDenialCooldown(permissionCache.current.microphone.lastDenied)
  };
}