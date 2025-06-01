import { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, Type, Upload, FileText } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
      // Focus textarea after a brief delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use this feature",
        variant: "destructive"
      });
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
      toast({
        title: "Note created successfully!",
      });
      onClose();
      setNoteText('');
    },
    onError: () => {
      toast({
        title: "Failed to create note",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!noteText.trim()) {
      toast({
        title: "Please enter some text",
        variant: "destructive"
      });
      return;
    }

    createNoteMutation.mutate({
      content: noteText.trim(),
      mode: captureMode
    });
  };

  const handleCaptureModeChange = (mode: CaptureMode) => {
    setCaptureMode(mode);
    if (mode === 'text') {
      textareaRef.current?.focus();
    }
  };

  const captureModes = [
    { mode: 'text' as CaptureMode, icon: Type, label: 'Text', color: 'bg-[hsl(var(--soft-sky-blue))]' },
    { mode: 'camera' as CaptureMode, icon: Camera, label: 'Photo', color: 'bg-[hsl(var(--dusty-teal))]' },
    { mode: 'voice' as CaptureMode, icon: Mic, label: 'Voice', color: 'bg-[hsl(var(--seafoam-green))]' },
    { mode: 'upload-image' as CaptureMode, icon: Upload, label: 'Upload Image', color: 'bg-[hsl(var(--pale-sage))]' },
    { mode: 'upload-file' as CaptureMode, icon: FileText, label: 'Upload File', color: 'bg-[hsl(var(--sand-taupe))]' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-60 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content area */}
      <div className="absolute inset-0 flex flex-col">
        {/* Main capture area */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          {/* Camera capture button for photo/video modes */}
          {(captureMode === 'camera') && (
            <div className="flex justify-center mb-8">
              <button
                className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-sm"
                onTouchStart={() => {
                  // Handle photo capture on tap, video recording on hold
                  console.log('Capture button pressed');
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white"></div>
              </button>
            </div>
          )}
          
          {/* Text input area - positioned above keyboard */}
          {captureMode === 'text' && (
            <div className="mx-4 mb-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-24 resize-none border-none outline-none bg-transparent text-lg placeholder-gray-500"
                  autoFocus
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">
                    {noteText.length} characters
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={createNoteMutation.isPending}
                    className="px-6 py-2 bg-[hsl(var(--soft-sky-blue))] text-white rounded-full font-medium disabled:opacity-50"
                  >
                    {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other capture modes */}
          {captureMode !== 'text' && captureMode !== 'camera' && (
            <div className="mx-4 mb-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl text-center">
                <div className="mb-4">
                  {(() => {
                    const IconComponent = captureModes.find(m => m.mode === captureMode)?.icon;
                    return IconComponent ? <IconComponent className="w-12 h-12 mx-auto text-gray-600" /> : null;
                  })()}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {captureModes.find(m => m.mode === captureMode)?.label} Capture
                </h3>
                <p className="text-gray-600 text-sm">
                  This feature will be available soon!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Capture mode buttons above keyboard area */}
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <div className="flex justify-center space-x-4 py-4 px-6">
            {captureModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <button
                  key={mode.mode}
                  onClick={() => handleCaptureModeChange(mode.mode)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    captureMode === mode.mode
                      ? `${mode.color} text-white shadow-lg scale-110`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}