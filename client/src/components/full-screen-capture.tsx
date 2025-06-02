import { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, MessageCircle, Upload, FileText, Image, Type } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice' | 'upload-image' | 'upload-file';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [noteText, setNoteText] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && !showFullEditor) {
      if (captureMode === 'camera') {
        startCamera();
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, captureMode, showFullEditor]);

  const handleTextFocus = () => {
    setIsTextFocused(true);
    stopCamera();
    // Don't show full editor immediately, just focus the text area
  };

  const handleCameraCapture = () => {
    // Simulate photo capture and auto-analyze
    setCapturedMedia('captured-photo.jpg');
    setNoteText(''); // Clear any existing text
    // Auto-save the captured media with AI analysis
    handleSaveWithMedia('captured-photo.jpg');
    stopCamera();
  };

  const handleSaveWithMedia = (mediaUrl: string) => {
    // Automatically analyze captured media and save note
    createNoteMutation.mutate({
      content: `[Image captured: ${mediaUrl}]`,
      mode: 'enhanced' // Use enhanced mode for better AI analysis
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { content: string; mode: string }) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNoteText('');
      setCapturedMedia(null);
      setShowFullEditor(false);
      setIsTextFocused(false);
      onClose();
      toast({
        description: "Note saved and analyzed by AI.",
      });
    },
  });

  const handleSave = () => {
    if (noteText.trim()) {
      createNoteMutation.mutate({
        content: noteText.trim(),
        mode: 'text'
      });
    }
  };

  if (!isOpen) return null;

  // Auto-processing mode - no need for full editor since AI handles everything
  if (showFullEditor) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing with AI...</p>
        </div>
      </div>
    );
  }

  // Main capture interface
  return (
    <div className="fixed inset-0 z-[100] bg-black w-screen h-screen overflow-hidden">
      {/* Camera view - only show if camera mode and not in full editor */}
      {captureMode === 'camera' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              width: '100vw', 
              height: '100vh',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </>
      )}

      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-60 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Mode selection buttons - floating on the right */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-60">
        <button
          onClick={() => setCaptureMode('text')}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            captureMode === 'text' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
          }`}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setCaptureMode('camera')}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            captureMode === 'camera' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
          }`}
        >
          <Camera className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setCaptureMode('upload-image')}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            captureMode === 'upload-image' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
          }`}
        >
          <Image className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setCaptureMode('upload-file')}
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            captureMode === 'upload-file' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
          }`}
        >
          <FileText className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 flex flex-col justify-end pb-4">
          
          {/* Shorter text input area - only show when not in camera mode */}
          {captureMode !== 'camera' && (
            <div className="mx-4 mb-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-2xl max-w-md mx-auto">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onFocus={handleTextFocus}
                    placeholder="Add new note"
                    className="w-full h-10 resize-none border-none outline-none bg-transparent text-base placeholder-gray-500 pr-10"
                    inputMode="text"
                    enterKeyHint="done"
                    autoFocus={captureMode === 'text'}
                  />
                  <button
                    onClick={() => setCaptureMode('voice')}
                    className={`absolute right-2 top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      captureMode === 'voice' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera capture button - only show in camera mode */}
          {captureMode === 'camera' && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleCameraCapture}
                className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-sm"
              >
                <div className="w-16 h-16 rounded-full bg-white"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}