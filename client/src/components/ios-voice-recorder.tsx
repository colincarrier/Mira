import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Mic, Square, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IOSVoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSVoiceRecorder({ isOpen, onClose }: IOSVoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<'ready' | 'recording' | 'paused' | 'stopped' | 'processing'>('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      // Check if online
      if (!navigator.onLine) {
        // Store offline voice note
        const offlineNote = {
          content: `🎤 Voice recording (${Math.round(recordingTime)}s) - Pending transcription`,
          mode: "voice",
          audioBlob: audioBlob,
          audioUrl: URL.createObjectURL(audioBlob),
          isProcessing: true,
          isOffline: true,
          recordingDuration: recordingTime,
          createdAt: new Date().toISOString()
        };
        
        // Store in offline storage
        const { useOfflineStore } = await import("@/store/offline-store");
        const note = await useOfflineStore.getState().createNote(offlineNote);
        
        return note;
      }

      // Online flow - existing logic
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("duration", recordingTime.toString());

      const response = await fetch("/api/notes/voice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create voice note");
      }

      return response.json();
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      handleReset();
      onClose();
      
      if (note.isOffline) {
        toast({
          title: "Voice note saved offline",
          description: "Recording saved locally. Will be transcribed when internet is available.",
        });
      } else {
        toast({
          title: "Voice note saved",
          description: "Your voice note has been transcribed and enhanced by AI.",
        });
      }
    },
    onError: (error) => {
      console.error("Voice note error:", error);
      toast({
        title: "Error",
        description: "Failed to save voice note. Please try again.",
        variant: "destructive",
      });
      setRecordingState('stopped');
    },
  });

  //TODO: Implement usePermissions hook

  const usePermissions = () => {
    const [hasMicrophone, setHasMicrophone] = useState(false);
    const [needsMicrophonePermission, setNeedsMicrophonePermission] = useState(false);

    useEffect(() => {
      const checkMicrophonePermission = async () => {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

          setHasMicrophone(permissionStatus.state === 'granted');
          setNeedsMicrophonePermission(permissionStatus.state !== 'granted');

          permissionStatus.addEventListener('change', () => {
            setHasMicrophone(permissionStatus.state === 'granted');
            setNeedsMicrophonePermission(permissionStatus.state !== 'granted');
          });
        } catch (error) {
          console.error("Error checking microphone permission:", error);
          // Assume permission is needed if there's an error checking
          setNeedsMicrophonePermission(true);
        }
      };

      // Check initial microphone permission
      checkMicrophonePermission();

      // Listen for changes in permission status
    }, []);

    const requestMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasMicrophone(true);
        setNeedsMicrophonePermission(false);
        return true; // Permission granted
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
        setHasMicrophone(false);
        setNeedsMicrophonePermission(true);
        return false; // Permission denied
      }
    };

    return { hasMicrophone, requestMicrophonePermission, needsMicrophonePermission };
  };

  const { hasMicrophone, requestMicrophonePermission, needsMicrophonePermission } = usePermissions();

  const setupAudioContext = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Not Supported",
        description: "Audio recording is not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if we already have permission, if not request it
      if (needsMicrophonePermission) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to record audio. This permission will be remembered.",
            variant: "destructive",
          });
          return false;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Setup audio context for waveform visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      source.connect(analyserRef.current);

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setRecordingState('stopped');
        stopWaveformAnimation();
      };

      return true;
    } catch (error) {
      console.error("Error setting up audio:", error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, hasMicrophone, requestMicrophonePermission, needsMicrophonePermission]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Convert to waveform data (simplified for visualization)
    const waveform = [];
    const step = Math.floor(dataArrayRef.current.length / 40); // 40 bars for waveform

    for (let i = 0; i < dataArrayRef.current.length; i += step) {
      let sum = 0;
      for (let j = 0; j < step && i + j < dataArrayRef.current.length; j++) {
        sum += dataArrayRef.current[i + j];
      }
      waveform.push(sum / step / 255); // Normalize to 0-1
    }

    setWaveformData(waveform);

    if (recordingState === 'recording') {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [recordingState]);

  const startWaveformAnimation = useCallback(() => {
    updateWaveform();
  }, [updateWaveform]);

  const stopWaveformAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    const success = await setupAudioContext();
    if (!success) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setRecordingState('recording');
      setRecordingTime(0);

      // Initialize waveform with immediate animation
      setWaveformData(Array(40).fill(0).map(() => Math.random() * 0.4 + 0.2));
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start waveform animation immediately
      startWaveformAnimation();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopWaveformAnimation();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Resume waveform animation
      startWaveformAnimation();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopWaveformAnimation();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      // Check minimum duration (1.5 seconds)
      if (recordingTime < 1.5) {
        toast({
          title: "Voice note too short",
          description: "Please record for at least 1.5 seconds",
          variant: "destructive",
        });
        return;
      }
      
      setRecordingState('processing');
      createVoiceNoteMutation.mutate(audioBlob);
    }
  };

  const handleReset = () => {
    setRecordingState('ready');
    setRecordingTime(0);
    setAudioBlob(null);
    setWaveformData([]);
    chunksRef.current = [];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    stopWaveformAnimation();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }

    return () => {
      handleReset();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">Voice Recording</h2>
          <div className="text-3xl font-mono text-blue-600 dark:text-blue-400">
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="h-20 mb-8 flex items-end justify-center space-x-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          {waveformData.length > 0 ? (
            waveformData.map((amplitude, index) => (
              <div
                key={index}
                className={`w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full transition-all duration-100 ${
                  recordingState === 'recording' ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${Math.max(4, amplitude * 60)}px`,
                  opacity: recordingState === 'recording' ? 0.8 + amplitude * 0.2 : 0.6
                }}
              />
            ))
          ) : (
            <div className="text-gray-400 text-sm">
              {recordingState === 'ready' ? 'Tap to start recording' : 'No audio data'}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center items-center space-x-4">
          {recordingState === 'ready' && (
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                title="Pause recording"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center text-white transition-colors"
                title="Stop recording"
              >
                <Square className="w-6 h-6" />
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <div className="flex items-center space-x-3">
              <button
                onClick={resumeRecording}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                title="Resume recording"
              >
                <Play className="w-5 h-5 ml-1" />
              </button>
              <button
                onClick={stopRecording}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors"
                title="Stop recording"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (recordingTime >= 1.5) {
                    handleSave();
                  } else {
                    toast({
                      title: "Voice note too short",
                      description: "Please record for at least 1.5 seconds",
                      variant: "destructive",
                    });
                  }
                }}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center space-x-2"
                title="Send recording"
              >
                <span>Send</span>
              </button>
            </div>
          )}

          {recordingState === 'stopped' && (
            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                Save Note
              </button>
            </div>
          )}

          {recordingState === 'processing' && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          )}
        </div>

        {recordingState === 'stopped' && audioBlob && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Recording saved ({(audioBlob.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>
    </div>
  );
}