import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, X, Send, ArrowLeft, Settings } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import IOSVoiceRecorder from '@/components/ios-voice-recorder';
import MediaContextDialog from '@/components/media-context-dialog';

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('camera');
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [capturedImageData, setCapturedImageData] = useState<string>("");
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { createNote, createVoiceNote } = useNotes();
  const { toast } = useToast();

  // Keyboard height detection
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
  }, [captureMode, isOpen, cameraFacing]);

  const { hasCamera, requestCameraPermission, needsCameraPermission, permissions } = usePermissions();

  const startCamera = async () => {
    try {
      console.log("Starting camera...");

      // Check if we already have camera permission
      if (hasCamera) {
        console.log("Camera permission already granted, proceeding...");
      } else if (permissions.camera === 'denied') {
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera access in your browser settings to use this feature.",
          variant: "destructive",
        });
        return;
      } else {
        // Request permission if we don't have it
        console.log("Requesting camera permission...");
        const granted = await requestCameraPermission();
        if (!granted) {
          toast({
            title: "Camera Permission Required",
            description: "Camera access is needed to take photos. Please allow access and try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Start with basic constraints and progressively enhance
      let constraints: MediaStreamConstraints = { 
        video: { facingMode: cameraFacing },
        audio: false 
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (specificCameraError) {
        console.log(`${cameraFacing} camera failed, trying opposite camera:`, specificCameraError);
        
        // Try the opposite camera
        try {
          constraints = { 
            video: { facingMode: cameraFacing === 'environment' ? 'user' : 'environment' },
            audio: false 
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (secondError) {
          console.log(`Both specific cameras failed, trying any camera:`, secondError);
          
          // Final fallback to any available camera
          constraints = { 
            video: true,
            audio: false 
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      console.log("Camera stream obtained:", stream);

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;

        // Set video attributes
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        // Wait for metadata and play
        videoRef.current.onloadedmetadata = async () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          try {
            await videoRef.current?.play();
            console.log('Video playing successfully');
          } catch (playError) {
            console.error('Video play error:', playError);
            // Force play on user interaction
            videoRef.current?.addEventListener('click', () => {
              videoRef.current?.play();
            }, { once: true });
          }
        };

        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      let errorMessage = "Could not access camera. ";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission was denied. Please enable camera access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera settings are not supported by this device.";
      } else {
        errorMessage += `${error.message || error.name || 'Unknown error'}`;
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
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

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const capturedDataUrl = e.target?.result as string;
          if (capturedDataUrl) {
            setCapturedImageData(capturedDataUrl);
            setShowMediaDialog(true);
          }
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const flipCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleSendNote = () => {
    if (!noteText.trim() && !noteTitle.trim()) return;

    const content = noteTitle.trim() 
      ? `${noteTitle.trim()}\n\n${noteText.trim()}`
      : noteText.trim();

    createNote({
      content,
      mode: 'smart'
    });

    setNoteText('');
    setNoteTitle('');
    onClose();
    toast({
      title: "Note saved",
      description: "Your note has been added successfully.",
    });
  };

  // Audio visualization effect
  useEffect(() => {
    let animationFrame: number;

    if (isRecording && analyserRef.current) {
      const updateWaveform = () => {
        const analyser = analyserRef.current!;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Convert to visual levels (32 bars)
        const barCount = 32;
        const levels: number[] = [];
        const samplesPerBar = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += dataArray[i * samplesPerBar + j];
          }
          const average = sum / samplesPerBar;
          levels.push(Math.max(8, (average / 255) * 50)); // Scale to 8-50px height
        }

        setAudioLevels(levels);
        animationFrame = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording]);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

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
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up recording
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        createVoiceNote(blob);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setIsRecording(false);
        setAudioLevels([]);
        onClose();

        toast({
          title: "Voice note saved",
          description: "Your voice note has been transcribed and saved.",
        });
      };

      setIsRecording(true);
      mediaRecorder.start();

      // Auto-stop after 30 seconds
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
    <div className="fixed inset-0 z-[40] bg-black">

      {/* Camera Mode */}
      {captureMode === 'camera' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-gray-900"
            style={{ 
              minHeight: '100vh',
              minWidth: '100vw'
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded - dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
              // Ensure video starts playing
              if (videoRef.current?.paused) {
                videoRef.current.play().catch(console.error);
              }
            }}
            onCanPlay={() => {
              console.log('Video can play');
              // Auto-play when ready
              if (videoRef.current?.paused) {
                videoRef.current.play().catch(console.error);
              }
            }}
            onError={(e) => console.error('Video error:', e)}
            onPlay={() => console.log('Video started playing')}
            onPause={() => console.log('Video paused')}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Top controls */}
          <div className="absolute top-4 right-4 z-[10001]">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Camera flip button - positioned in middle right */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-[10001]">
            <button
              onClick={flipCamera}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
              title={`Switch to ${cameraFacing === 'environment' ? 'front' : 'rear'} camera`}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>

          {/* Main capture button - positioned above input bar */}
          <button
            onClick={capturePhoto}
            className="fixed left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white/50 hover:border-white/70 transition-all shadow-2xl"
            style={{ 
              zIndex: 10001,
              bottom: 'calc(3.5rem + 16px + 80px + 4px)', // Adjusted for shorter nav + input bar position + height + gap
              backgroundColor: 'transparent'
            }}
          >
          </button>

          {/* Bottom mode switcher */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10001]">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  stopCamera();
                  setCaptureMode('voice');
                  setIsVoiceRecorderOpen(false);
                }}
                className="p-3 rounded-full bg-white/30 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCaptureMode('text')}
                className="p-3 rounded-full bg-white/30 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Mode */}
      {captureMode === 'voice' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">Close</span>
            </button>

            <span className="text-gray-900 dark:text-white text-lg font-medium">Voice Note</span>

            <div className="w-16"></div>
          </div>

          {/* Voice recording interface */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRecording ? 'Recording...' : 'Tap to record'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isRecording ? 'Tap again to stop' : 'Your voice will be transcribed automatically'}
              </p>
            </div>

            {/* Waveform visualization */}
            {isRecording && (
              <div className="mb-8 w-64 h-16 flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                {audioLevels.length > 0 ? (
                  audioLevels.map((level, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                      style={{ height: `${level}px` }}
                    />
                  ))
                ) : (
                  Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gray-400 rounded-full"
                      style={{ height: '8px' }}
                    />
                  ))
                )}
              </div>
            )}

            <button
              onClick={handleVoiceCapture}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>

            {/* Recording timer */}
            {isRecording && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                    00:{recordingTime.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* Mode switcher */}
            <div className="mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setCaptureMode('camera')}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCaptureMode('voice')}
                    className="p-2 rounded-full bg-blue-500 text-white"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCaptureMode('text')}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Mode - iOS Notes Style */}
      {captureMode === 'text' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Notes</span>
            </button>

            <button
              onClick={handleSendNote}
              disabled={!noteText.trim() && !noteTitle.trim()}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0056CC] transition-colors"
            >
              Done
            </button>
          </div>

          {/* iOS Notes-style editor */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ paddingBottom: `${keyboardHeight}px` }}
          >
            <div className="p-4 h-full">
              {/* Title */}
              <input
                ref={titleRef}
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-2"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />

              {/* Date */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              {/* Content */}
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start writing..."
                className="w-full h-full resize-none border-none outline-none bg-transparent text-base leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: '1.6'
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Bottom floating controls */}
          <div className="absolute bottom-6 left-4 right-4 z-[200]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCaptureMode('camera')}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsVoiceRecorderOpen(true)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCaptureMode('text')}
                  className="p-2 rounded-full bg-blue-500 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Voice Recorder */}
      <IOSVoiceRecorder 
        isOpen={isVoiceRecorderOpen} 
        onClose={() => setIsVoiceRecorderOpen(false)} 
      />

      {/* Media Context Dialog */}
      <MediaContextDialog
        isOpen={showMediaDialog}
        onClose={() => setShowMediaDialog(false)}
        mediaType="camera"
        capturedImage={capturedImageData}
      />
    </div>
  );
}

// Placeholder for usePermissions hook
function usePermissions() {
  const [hasCamera, setHasCamera] = useState(false);
  const [needsCameraPermission, setNeedsCameraPermission] = useState(true);

  useEffect(() => {
    const checkCameraPermission = async () => {
      if (navigator.permissions) {
        const { state } = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasCamera(state === 'granted');
        setNeedsCameraPermission(state !== 'granted');
      } else {
        // Permissions API not supported - assume permission is needed
        setNeedsCameraPermission(true);
      }
    };

    checkCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasCamera(true);
      setNeedsCameraPermission(false);
      return true;
    } catch (error) {
      console.error("Camera permission error:", error);
      setHasCamera(false);
      setNeedsCameraPermission(true);
      return false;
    }
  };

  return { hasCamera, requestCameraPermission, needsCameraPermission };
}