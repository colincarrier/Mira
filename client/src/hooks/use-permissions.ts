
import { useState, useEffect, useCallback, useRef } from 'react';

interface PermissionState {
  camera: PermissionState | 'unknown';
  microphone: PermissionState | 'unknown';
  mediaDevices: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'unknown',
    microphone: 'unknown',
    mediaDevices: false
  });

  // Track if we've already requested permissions to avoid repeated prompts
  const permissionRequestCache = useRef<{
    camera: boolean;
    microphone: boolean;
    lastCameraRequest: number;
    lastMicrophoneRequest: number;
  }>({
    camera: false,
    microphone: false,
    lastCameraRequest: 0,
    lastMicrophoneRequest: 0
  });

  // Check existing permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!navigator.permissions) {
        setPermissions(prev => ({ ...prev, mediaDevices: !!navigator.mediaDevices }));
        return;
      }

      try {
        const [cameraPermission, microphonePermission] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName })
        ]);

        setPermissions({
          camera: cameraPermission.state,
          microphone: microphonePermission.state,
          mediaDevices: !!navigator.mediaDevices
        });

        // Update cache based on current permission state
        if (cameraPermission.state === 'granted') {
          permissionRequestCache.current.camera = true;
        }
        if (microphonePermission.state === 'granted') {
          permissionRequestCache.current.microphone = true;
        }

        // Listen for permission changes
        cameraPermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
          if (cameraPermission.state === 'granted') {
            permissionRequestCache.current.camera = true;
          } else if (cameraPermission.state === 'denied') {
            permissionRequestCache.current.camera = false;
          }
        });

        microphonePermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, microphone: microphonePermission.state }));
          if (microphonePermission.state === 'granted') {
            permissionRequestCache.current.microphone = true;
          } else if (microphonePermission.state === 'denied') {
            permissionRequestCache.current.microphone = false;
          }
        });
      } catch (error) {
        console.log('Permission API not fully supported, will request as needed');
        setPermissions(prev => ({ ...prev, mediaDevices: !!navigator.mediaDevices }));
      }
    };

    checkPermissions();
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    // Don't request again if we already have permission
    if (permissions.camera === 'granted') {
      return true;
    }

    // Don't request again if user denied recently (within 30 seconds)
    const now = Date.now();
    const timeSinceLastRequest = now - permissionRequestCache.current.lastCameraRequest;
    if (permissions.camera === 'denied' && timeSinceLastRequest < 30000) {
      console.log('Camera permission denied recently, not requesting again');
      return false;
    }

    // Don't request if we've already tried and it was denied
    if (permissionRequestCache.current.camera && permissions.camera === 'denied') {
      console.log('Camera permission previously denied');
      return false;
    }

    try {
      permissionRequestCache.current.lastCameraRequest = now;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      permissionRequestCache.current.camera = true;
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      permissionRequestCache.current.camera = false;
      return false;
    }
  }, [permissions.camera]);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    // Don't request again if we already have permission
    if (permissions.microphone === 'granted') {
      return true;
    }

    // Don't request again if user denied recently (within 30 seconds)
    const now = Date.now();
    const timeSinceLastRequest = now - permissionRequestCache.current.lastMicrophoneRequest;
    if (permissions.microphone === 'denied' && timeSinceLastRequest < 30000) {
      console.log('Microphone permission denied recently, not requesting again');
      return false;
    }

    // Don't request if we've already tried and it was denied
    if (permissionRequestCache.current.microphone && permissions.microphone === 'denied') {
      console.log('Microphone permission previously denied');
      return false;
    }

    try {
      permissionRequestCache.current.lastMicrophoneRequest = now;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      permissionRequestCache.current.microphone = true;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      permissionRequestCache.current.microphone = false;
      return false;
    }
  }, [permissions.microphone]);

  const requestBothPermissions = useCallback(async (): Promise<{ camera: boolean; microphone: boolean }> => {
    // Check if we already have both permissions
    if (permissions.camera === 'granted' && permissions.microphone === 'granted') {
      return { camera: true, microphone: true };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: true 
      });
      stream.getTracks().forEach(track => track.stop());

      setPermissions(prev => ({ 
        ...prev, 
        camera: 'granted', 
        microphone: 'granted' 
      }));

      permissionRequestCache.current.camera = true;
      permissionRequestCache.current.microphone = true;

      return { camera: true, microphone: true };
    } catch (error) {
      console.error('Media permissions denied:', error);
      
      // Try to get individual permissions to see which one failed
      const cameraResult = await requestCameraPermission();
      const microphoneResult = await requestMicrophonePermission();
      
      return { camera: cameraResult, microphone: microphoneResult };
    }
  }, [permissions.camera, permissions.microphone, requestCameraPermission, requestMicrophonePermission]);

  return {
    permissions,
    hasCamera: permissions.camera === 'granted',
    hasMicrophone: permissions.microphone === 'granted',
    canRequestPermissions: permissions.mediaDevices,
    requestCameraPermission,
    requestMicrophonePermission,
    requestBothPermissions,
    needsCameraPermission: permissions.camera !== 'granted' && permissions.camera !== 'denied',
    needsMicrophonePermission: permissions.microphone !== 'granted' && permissions.microphone !== 'denied'
  };
}
