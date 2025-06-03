import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, X, Send, ArrowLeft, Settings } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';
import { useToast } from '@/hooks/use-toast';

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice' | 'upload-image' | 'upload-file';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { createNote, createVoiceNote } = useNotes();
  const { toast } = useToast();

  // Keyboard height detection for mobile
  useEffect(() => {
    const handleResize = () => {
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
      stopCamera();
    }

    return () => stopCamera();
  }, [captureMode, isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert to blob and create note
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string)?.split(',')[1];
          if (base64) {
            createNote({
              content: noteText || 'Photo captured',
              mode: 'smart'
            });
            
            setNoteText('');
            onClose();
            toast({
              title: "Photo saved",
              description: "Your photo has been added to your notes.",
            });
          }
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleSendNote = () => {
    if (!noteText.trim()) return;

    createNote({
      content: noteText.trim(),
      mode: 'smart'
    });
    
    setNoteText('');
    onClose();
    toast({
      title: "Note saved",
      description: "Your note has been added successfully.",
    });
  };

  const handleVoiceCapture = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Voice recording not supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        createVoiceNote(blob);
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        onClose();
        toast({
          title: "Voice note saved",
          description: "Your voice note has been transcribed and saved.",
        });
      };

      mediaRecorder.start();

      // Stop recording after 30 seconds max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Camera view */}
      {captureMode === 'camera' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* X button for camera mode */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-[300] w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Text mode background */}
      {captureMode !== 'camera' && (
        <div className="absolute inset-0 bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">Close</span>
            </button>
            
            <span className="text-gray-900 dark:text-white text-lg font-medium">
              New Note
            </span>
            
            <div className="w-16"></div>
          </div>

          {/* Text editor area */}
          <div className="p-4 h-full">
            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Start typing your note..."
              className="w-full h-full resize-none border-none outline-none bg-transparent text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Bottom navigation and controls */}
      <div 
        className="absolute left-0 right-0 z-[200] transition-all duration-300"
        style={{ bottom: `${keyboardHeight}px` }}
      >
        {/* Text input dialog for camera mode */}
        {captureMode === 'camera' && (
          <div className="mx-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add caption..."
                  className="w-full h-12 resize-none border-none outline-none bg-transparent text-base placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white pr-12 leading-6"
                  inputMode="text"
                  enterKeyHint="done"
                />
                {noteText.trim() ? (
                  <button
                    onClick={handleSendNote}
                    className="absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCaptureMode('voice')}
                    className="absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera controls - bottom navigation */}
        {captureMode === 'camera' && (
          <div className="flex items-center justify-between px-4 pb-8">
            {/* To Notes button aligned with capture button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-black/50 text-white px-4 py-3 rounded-full hover:bg-black/70 transition-colors text-sm backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>to notes</span>
            </button>
            
            {/* Camera button - perfect circle */}
            <div className="relative">
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-white/40 -m-2"></div>
              <button
                onClick={capturePhoto}
                className="relative w-20 h-20 rounded-full bg-white border-4 border-white/50 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-white"></div>
              </button>
            </div>
            
            {/* Settings button for balance */}
            <button
              onClick={() => setCaptureMode('text')}
              className="p-3 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 bg-black/50 backdrop-blur-sm"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Voice controls */}
        {captureMode === 'voice' && (
          <div className="flex justify-center pb-8">
            <button
              onClick={handleVoiceCapture}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* Save button for text mode */}
        {captureMode !== 'camera' && noteText.trim() && (
          <div className="flex justify-center pb-8">
            <button
              onClick={handleSendNote}
              className="px-6 py-3 bg-[#007AFF] text-white rounded-full text-base font-medium shadow-lg hover:bg-[#0056CC] transition-colors"
            >
              Save Note
            </button>
          </div>
        )}
      </div>

      {/* Mode switcher - only show when not in camera mode */}
      {captureMode !== 'camera' && (
        <div className="absolute top-4 right-4 z-[200]">
          <div className="flex gap-2">
            <button
              onClick={() => setCaptureMode('camera')}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCaptureMode('voice')}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}