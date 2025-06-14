import { useState, useEffect, useCallback } from 'react';

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

        // Listen for permission changes
        cameraPermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, camera: cameraPermission.state }));
        });

        microphonePermission.addEventListener('change', () => {
          setPermissions(prev => ({ ...prev, microphone: microphonePermission.state }));
        });
      } catch (error) {
        console.log('Permission API not fully supported, will request as needed');
        setPermissions(prev => ({ ...prev, mediaDevices: !!navigator.mediaDevices }));
      }
    };

    checkPermissions();
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      return false;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      return false;
    }
  }, []);

  const requestBothPermissions = useCallback(async (): Promise<{ camera: boolean; microphone: boolean }> => {
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

      return { camera: true, microphone: true };
    } catch (error) {
      console.error('Media permissions denied:', error);
      return { camera: false, microphone: false };
    }
  }, []);

  return {
    permissions,
    hasCamera: permissions.camera === 'granted',
    hasMicrophone: permissions.microphone === 'granted',
    canRequestPermissions: permissions.mediaDevices,
    requestCameraPermission,
    requestMicrophonePermission,
    requestBothPermissions,
    needsCameraPermission: permissions.camera !== 'granted',
    needsMicrophonePermission: permissions.microphone !== 'granted'
  };
}