import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { queryKeys } from "@/utils/queryKeys";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
  const [recordingState, setRecordingState] = useState<'ready' | 'recording' | 'stopped' | 'processing'>('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { transcript, isListening, startListening, stopListening, confidence } = useSpeechRecognition();

  const createVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setRecordingState('ready');
      setRecordingTime(0);
      setAudioBlob(null);
      onClose();
      toast({
        title: "Voice note saved",
        description: "Your voice note has been transcribed and enhanced by AI.",
      });
    },
    onError: () => {
      setRecordingState('stopped');
      toast({
        title: "Error",
        description: "Failed to process voice note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Check minimum duration (1.5 seconds)
        if (recordingTime < 1.5) {
          console.log(`Voice recording too short: ${recordingTime}s, discarding`);
          setAudioBlob(null);
          setRecordingTime(0);
          setRecordingState('ready');
          stream.getTracks().forEach(track => track.stop());
          toast({
            title: "Recording too short",
            description: "Voice notes must be at least 1.5 seconds long.",
            variant: "destructive",
          });
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setRecordingState('stopped');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      startListening();
      setRecordingState('recording');
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive",
      });
      setRecordingState('ready');
    }
  };

  const pauseRecording = () => {
    if (recordingState === 'recording') {
      stopListening();
      setRecordingState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (recordingState === 'paused') {
      startListening();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    // Check duration BEFORE stopping
    if (recordingTime < 1.5) {
      console.log(`Voice recording too short: ${recordingTime}s, discarding`);
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingState('ready');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      toast({
        title: "Recording too short",
        description: "Voice notes must be at least 1.5 seconds long.",
        variant: "destructive",
      });
      return;
    }

    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      stopListening();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingState('ready');
    onClose();
  };

  const handleSave = () => {
    // Check minimum duration before saving
    if (recordingTime < 1.5) {
      console.log(`Voice recording too short: ${recordingTime}s, discarding`);
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingState('ready');
      toast({
        title: "Voice note too short", 
        description: "Please record for at least 1.5 seconds",
        variant: "destructive",
      });
      return;
    }

    if (audioBlob) {
      setRecordingState('processing');
      createVoiceNoteMutation.mutate(audioBlob);
    } else {
      toast({
        title: "No recording found",
        description: "Please record audio before saving",
        variant: "destructive",
      });
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecordingState('ready');
      setRecordingTime(0);
      setAudioBlob(null);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl p-6 safe-area-bottom animate-slideUp">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-2">
            {recordingState === 'ready' && 'Ready to Record'}
            {recordingState === 'recording' && 'Recording...'}
            {recordingState === 'stopped' && 'Recording Complete'}
            {recordingState === 'processing' && 'Saving...'}
          </h3>
          <p className="text-[hsl(var(--muted-foreground))]">
            {recordingState === 'ready' && 'Tap the record button to start'}
            {recordingState === 'recording' && 'Speak your thoughts'}
            {recordingState === 'stopped' && 'Tap save to create your note'}
            {recordingState === 'processing' && 'Processing your voice note...'}
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center justify-center space-x-1 mb-8 h-16">
          {recordingState === 'recording' && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[hsl(var(--soft-sky-blue))] rounded-full recording-wave"
                  style={{ 
                    "--delay": `${i * 0.1}s`,
                    height: "20px"
                  } as React.CSSProperties}
                ></div>
              ))}
            </>
          )}
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="mb-6 p-3 bg-[hsl(var(--muted))] rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-[hsl(var(--foreground))] flex-1">{transcript}</p>
              {confidence > 0 && (
                <div className="ml-2 flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>
            {isListening && (
              <div className="text-xs text-[hsl(var(--muted-foreground))] animate-pulse">Listening...</div>
            )}
          </div>
        )}

        {/* Recording Timer */}
        <div className="text-center mb-8">
          <span className="text-2xl font-mono text-[hsl(var(--foreground))]">{formatTime(recordingTime)}</span>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-6">
          <button 
            onClick={cancelRecording}
            className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] flex items-center justify-center transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>

          {recordingState === 'ready' && (
            <button 
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-[hsl(var(--soft-sky-blue))] hover:bg-[hsl(var(--dusty-teal))] flex items-center justify-center transition-colors shadow-lg"
              title="Start Recording"
            >
              <div className="w-6 h-6 rounded-full bg-white"></div>
            </button>
          )}

          {recordingState === 'recording' && (
            <button 
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center animate-pulse transition-colors shadow-lg"
              title="Stop Recording"
            >
              <Square className="w-6 h-6 text-white" />
            </button>
          )}

          {recordingState === 'stopped' && (
            <button 
              onClick={handleSave}
              disabled={createVoiceNoteMutation.isPending}
              className="w-16 h-16 rounded-full bg-[hsl(var(--seafoam-green))] hover:bg-[hsl(var(--dusty-teal))] flex items-center justify-center disabled:opacity-50 transition-colors shadow-lg"
              title="Save Voice Note"
            >
              {createVoiceNoteMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-white font-semibold text-sm">Save</span>
              )}
            </button>
          )}

          {recordingState === 'processing' && (
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[hsl(var(--soft-sky-blue))] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="w-14 h-14"></div> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  );
}