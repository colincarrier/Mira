import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mic, Square, Send } from "lucide-react";
import { queryKeys } from "@/utils/queryKeys";
import { usePermissions } from "@/hooks/use-permissions";

interface InlineVoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export default function InlineVoiceRecorder({ 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  className = ""
}: InlineVoiceRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const queryClient = useQueryClient();
  const { 
    hasMicrophone, 
    requestMicrophonePermission, 
    needsMicrophonePermission,
    permissions 
  } = usePermissions();

  const createVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      // Check if online
      if (!navigator.onLine) {
        // Store offline voice note
        const offlineNote = {
          content: `🎤 Voice recording (${Math.round(recordingTime)}s) - Pending transcription`,
          mode: "voice" as const,
          audioBlob: audioBlob,
          audioUrl: URL.createObjectURL(audioBlob),
          isProcessing: true,
          isOffline: true,
          recordingDuration: recordingTime,
          createdAt: new Date().toISOString(),
          version: 1,
          aiGeneratedTitle: null,
          userId: null,
          isShared: false,
          shareId: null,
          privacyLevel: "private" as const,
          mediaUrl: null,
          transcription: null,
          imageData: null,
          aiEnhanced: false,
          aiSuggestion: null,
          aiContext: null,
          richContext: null,
          miraResponse: null,
          richContextBackup: null,
          migratedAt: null,
          miraResponseCreatedAt: null,
          collectionId: null,
          vectorDense: null,
          vectorSparse: null,
          intentVector: null,
          originalContent: null,
          lastUserEdit: null,
          protectedContent: null,
          processingPath: null,
          classificationScores: null,
          tokenUsage: null,
          doc_json: null,
          todos: []
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      handleReset();
      

    },
    onError: (error) => {
      console.error("Voice note error:", error);

      handleReset();
    },
  });

  const setupAudioContext = useCallback(async () => {
    try {
      // Use centralized permission management
      if (!hasMicrophone) {
        console.log("Requesting microphone permission...");
        const granted = await requestMicrophonePermission();
        if (!granted) {
          const isDenied = permissions.microphone === 'denied';

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
      
      // Setup media recorder with optimal settings
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 // High quality audio
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        setAudioBlob(blob);
        stopWaveformAnimation();
        
        // Auto-save the recording
        createVoiceNoteMutation.mutate(blob);
      };
      
      return true;
    } catch (error: any) {
      console.error("Error setting up audio details:", {
        name: error?.name,
        message: error?.message,
        constraint: error?.constraint
      });
      
      let errorMessage = "Unable to access microphone. ";
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "Microphone permission was denied. Please enable microphone access in your browser settings.";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "No microphone found on this device.";
      } else if (error?.name === 'NotReadableError') {
        errorMessage = "Microphone is already in use by another application.";
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = `Microphone settings not supported: ${error?.constraint || 'unknown constraint'}`;
      } else {
        errorMessage += `${error?.message || error?.name || 'Unknown error'}`;
      }
      

      return false;
    }
  }, [createVoiceNoteMutation, hasMicrophone, requestMicrophonePermission, permissions.microphone]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isRecording) return;
    
    // Read real-time audio frequency data from microphone
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Process authentic audio data into visual bars
    const waveform: number[] = [];
    const bufferLength = dataArrayRef.current.length;
    const samplesPerBar = Math.floor(bufferLength / 32);
    
    for (let i = 0; i < bufferLength; i += samplesPerBar) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < samplesPerBar && i + j < bufferLength; j++) {
        sum += dataArrayRef.current[i + j];
        count++;
      }
      const amplitude = count > 0 ? (sum / count) / 255 : 0;
      waveform.push(amplitude);
    }
    
    setWaveformData(waveform);
    
    // Continue real-time animation loop
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, [isRecording]);

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
      mediaRecorderRef.current.start(100);
      onStartRecording();
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start waveform animation
      startWaveformAnimation();
    }
  };

  const stopRecording = () => {
    // Check duration BEFORE stopping recorder
    if (recordingTime < 1.5) {
      console.log(`Voice recording too short: ${recordingTime}s, discarding`);
      handleReset();

      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      onStopRecording();
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

  const handleReset = () => {
    onStopRecording();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleReset();
    };
  }, []);

  if (!isRecording && waveformData.length === 0) {
    // Show mic button to start recording
    return (
      <button
        onClick={startRecording}
        className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  // Show inline recording interface
  return (
    <div className={`flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg ${className}`}>
      {/* Recording indicator and time */}
      <div className="flex items-center space-x-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        
        {isRecording && (
          <div className="text-sm font-mono text-red-600 dark:text-red-400">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Enhanced Streaming Waveform */}
      <div className="flex-1 h-8 flex items-end justify-center space-x-0.5 overflow-hidden">
        {waveformData.length > 0 ? (
          waveformData.map((amplitude, index) => (
            <div
              key={`${Date.now()}-${index}`}
              className={`w-0.5 rounded-full transition-all duration-75 ease-out ${
                isRecording 
                  ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400' 
                  : 'bg-gradient-to-t from-gray-400 to-gray-300'
              }`}
              style={{
                height: `${Math.max(2, amplitude * 28)}px`,
                opacity: isRecording ? Math.max(0.6, 0.8 + amplitude * 0.2) : 0.5,
                transform: `scaleY(${Math.max(0.1, amplitude + 0.1)})`,
                animation: isRecording && amplitude > 0.1 ? 'pulse 0.5s ease-in-out' : 'none'
              }}
            />
          ))
        ) : isRecording ? (
          // Immediate visual feedback while audio initializes
          <div className="flex items-center space-x-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-2 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-xs flex items-center">
            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
            Ready to record
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {createVoiceNoteMutation.isPending && (
        <div className="flex items-center space-x-2 text-blue-600 text-xs">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}