import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, X, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SafeFullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice';

export default function SafeFullScreenCapture({ isOpen, onClose }: SafeFullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Keyboard height detection
  useEffect(() => {
    const handleResize = () => {
      if (!isMountedRef.current) return;
      
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - viewportHeight;
      setKeyboardHeight(diff > 100 ? diff : 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  // Camera setup
  useEffect(() => {
    if (captureMode === 'camera' && isOpen) {
      startCamera();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [captureMode, isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (isMountedRef.current) {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !isMountedRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    // Convert to blob and create note
    canvas.toBlob(async (blob) => {
      if (!blob || !isMountedRef.current) return;

      try {
        const formData = new FormData();
        formData.append('image', blob, 'capture.jpg');
        formData.append('title', noteTitle || 'Camera Capture');
        formData.append('content', noteText || 'Image captured from camera');

        const response = await fetch('/api/notes/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to save image');

        if (isMountedRef.current) {
          toast({
            title: "Success",
            description: "Photo captured and saved!",
          });
          onClose();
        }
      } catch (error) {
        console.error('Error saving photo:', error);
        if (isMountedRef.current) {
          toast({
            title: "Error",
            description: "Failed to save photo. Please try again.",
            variant: "destructive",
          });
        }
      }
    }, 'image/jpeg', 0.8);
  };

  const handleCreateNote = async () => {
    if (!noteText.trim() || !isMountedRef.current) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle || 'Quick Note',
          content: noteText,
        }),
      });

      if (!response.ok) throw new Error('Failed to create note');

      if (isMountedRef.current) {
        toast({
          title: "Success",
          description: "Note created successfully!",
        });
        setNoteText('');
        setNoteTitle('');
        onClose();
      }
    } catch (error) {
      console.error('Error creating note:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to create note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button onClick={onClose} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">
          {captureMode === 'camera' ? 'Camera' : captureMode === 'voice' ? 'Voice' : 'New Note'}
        </h1>
        <div className="w-10" />
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-4 p-4 bg-gray-900">
        <button
          onClick={() => setCaptureMode('text')}
          className={`px-4 py-2 rounded-full ${
            captureMode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setCaptureMode('camera')}
          className={`px-4 py-2 rounded-full ${
            captureMode === 'camera' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Camera
        </button>
        <button
          onClick={() => setCaptureMode('voice')}
          className={`px-4 py-2 rounded-full ${
            captureMode === 'voice' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Voice
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {captureMode === 'camera' && (
          <div className="relative h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-8 h-8 text-black" />
              </button>
            </div>
          </div>
        )}

        {captureMode === 'text' && (
          <div className="p-4 h-full bg-white" style={{ paddingBottom: keyboardHeight + 16 }}>
            <input
              ref={titleRef}
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title (optional)"
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-lg"
            />
            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your note here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none text-base"
              autoFocus
            />
            <button
              onClick={handleCreateNote}
              disabled={!noteText.trim()}
              className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 inline mr-2" />
              Create Note
            </button>
          </div>
        )}

        {captureMode === 'voice' && (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-white">
              <Mic className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Voice recording feature</p>
              <p className="text-gray-400">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}