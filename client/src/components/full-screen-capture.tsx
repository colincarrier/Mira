import { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, MessageCircle, Upload, FileText, Image, Type, Send, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice' | 'upload-image' | 'upload-file';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text'); // Default to text input
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoCamera, setAutoCamera] = useState(() => localStorage.getItem('mira-auto-camera') !== 'false'); // Default true
  const [autoMic, setAutoMic] = useState(() => localStorage.getItem('mira-auto-mic') === 'true');
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && !showFullEditor) {
      if (autoCamera && captureMode !== 'camera') {
        setCaptureMode('camera');
      }
      // Don't auto-start microphone to prevent hanging
      
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
  }, [isOpen, captureMode, showFullEditor, autoCamera]);

  // Save auto settings to localStorage
  useEffect(() => {
    localStorage.setItem('mira-auto-camera', autoCamera.toString());
  }, [autoCamera]);

  useEffect(() => {
    localStorage.setItem('mira-auto-mic', autoMic.toString());
  }, [autoMic]);

  const handleTextFocus = () => {
    setIsTextFocused(true);
    stopCamera();
    // Don't show full editor immediately, just focus the text area
  };

  const handleSendNote = async () => {
    const content = noteTitle.trim() ? `${noteTitle.trim()}\n\n${noteText.trim()}` : noteText.trim();
    
    if (content) {
      try {
        // Create note immediately with combined title and content
        const response = await apiRequest("POST", "/api/notes", {
          content: content,
          mode: "standard"
        });
        const newNote = await response.json();
        
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
        
        // Clear the form
        setNoteTitle('');
        setNoteText('');
        
        // Close this modal and navigate to the new note
        onClose();
        
        // Navigate to the new note detail page
        window.location.href = `/note/${newNote.id}`;
      } catch (error) {
        console.error("Error creating note:", error);
        toast({
          title: "Error",
          description: "Failed to create note. Please try again.",
          variant: "destructive",
        });
      }
    }
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
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

  const startMicrophone = async () => {
    try {
      // Only start microphone when explicitly requested, not on auto
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopMicrophone = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsRecording(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedMedia(imageData);
        handleSaveWithMedia(imageData);
      }
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

  // No more loading screen - notes are created immediately

  // Main capture interface
  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden">
      {/* iOS Notes-style background when camera is off */}
      {captureMode !== 'camera' && !showFullEditor && (
        <div className="absolute inset-0 bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Notes app header */}
          <div className="pt-12 pb-4 px-4">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-1">Notes</h1>
              <p className="text-sm text-[#8E8E93] dark:text-[#8E8E93]">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {/* Note content area */}
          <div className="px-4 flex-1">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-[#8E8E93] text-[#1C1C1E] dark:text-white dark:placeholder-[#8E8E93]"
              />
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start writing..."
                className="w-full min-h-[400px] bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder-[#8E8E93] text-[#1C1C1E] dark:text-white dark:placeholder-[#8E8E93]"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera view - only show if camera mode and not in full editor */}
      {captureMode === 'camera' && !showFullEditor && (
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

      {/* Voice mode recording indicator */}
      {captureMode === 'voice' && !showFullEditor && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className={`w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center mb-8 ${isRecording ? 'animate-pulse bg-red-500/30' : ''}`}>
              <Mic className={`w-16 h-16 ${isRecording ? 'text-red-300' : 'text-white'}`} />
            </div>
            <p className="text-xl font-semibold mb-2">
              {isRecording ? 'Recording...' : 'Tap to start recording'}
            </p>
            <p className="text-white/70">Speak your thoughts</p>
          </div>
        </div>
      )}

      {/* Full editor mode */}
      {showFullEditor && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 z-[110]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowFullEditor(false)}
                className="text-blue-500 font-medium"
              >
                Cancel
              </button>
              <h1 className="font-semibold text-lg">New Note</h1>
              <button
                onClick={handleSendNote}
                className="text-blue-500 font-medium"
              >
                Save
              </button>
            </div>

            {/* Note editor */}
            <div className="flex-1 p-4 space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
              />
              <textarea
                placeholder="Description"
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                className="w-full flex-1 bg-transparent border-none outline-none resize-none placeholder-gray-400 text-base leading-relaxed"
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header with Mira logo and settings */}
      {!showFullEditor && (
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-6 z-[200]">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-white text-xl font-bold tracking-wide">
            Mira
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && !showFullEditor && (
        <div className="absolute top-20 right-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-[200] min-w-[200px]">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Auto Settings</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Camera Auto-on</span>
              <button
                onClick={() => setAutoCamera(!autoCamera)}
                className="flex items-center"
              >
                {autoCamera ? (
                  <ToggleRight className="w-6 h-6 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Mic Auto-on</span>
              <button
                onClick={() => setAutoMic(!autoMic)}
                className="flex items-center"
              >
                {autoMic ? (
                  <ToggleRight className="w-6 h-6 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode selection buttons - floating on the right */}
      {!showFullEditor && (
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-60">
          <button
            onClick={() => {
              setCaptureMode('text');
              stopCamera();
              stopMicrophone();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              captureMode === 'text' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => {
              setCaptureMode('camera');
              stopMicrophone();
              startCamera();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              captureMode === 'camera' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
            }`}
          >
            <Camera className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => {
              setCaptureMode('voice');
              stopCamera();
              if (isRecording) {
                stopMicrophone();
              } else {
                startMicrophone();
              }
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              captureMode === 'voice' ? 'bg-red-500 text-white' : 'bg-white/30 text-white'
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setCaptureMode('upload-image')}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              captureMode === 'upload-image' ? 'bg-blue-500 text-white' : 'bg-white/30 text-white'
            }`}
          >
            <Image className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom actions and input */}
      {!showFullEditor && (
        <div className="absolute bottom-0 left-0 right-0 z-[200]">
          {/* Camera capture button */}
          {captureMode === 'camera' && (
            <div className="flex justify-center pb-8">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-white"></div>
              </button>
            </div>
          )}

          {/* Voice recording button */}
          {captureMode === 'voice' && (
            <div className="flex justify-center pb-8">
              <button
                onClick={() => {
                  if (isRecording) {
                    stopMicrophone();
                  } else {
                    startMicrophone();
                  }
                }}
                className={`w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center hover:scale-105 transition-transform ${
                  isRecording ? 'bg-red-500' : 'bg-white/20'
                }`}
              >
                <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-white'}`} />
              </button>
            </div>
          )}

          {/* Save button for note content - only show when there's content */}
          {captureMode !== 'camera' && !showFullEditor && (noteText.trim() || noteTitle.trim()) && (
            <div className="absolute bottom-8 right-4">
              <button
                onClick={handleSendNote}
                className="px-6 py-3 bg-[#007AFF] text-white rounded-full text-base font-medium shadow-lg hover:bg-[#0056CC] transition-colors"
              >
                Save Note
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}