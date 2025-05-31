import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();

  const createVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      const response = await fetch("/api/notes/voice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create voice note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      onClose();
      toast({
        title: "Voice note captured",
        description: "Your voice note has been transcribed and enhanced by AI.",
      });
    },
    onError: () => {
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
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      startListening();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopListening();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    onClose();
  };

  const handleSave = () => {
    if (audioBlob) {
      createVoiceNoteMutation.mutate(audioBlob);
    } else if (transcript) {
      // Fallback to text note if we have transcript but no audio
      createVoiceNoteMutation.mutate(new Blob([transcript], { type: "text/plain" }));
    }
  };

  useEffect(() => {
    if (isOpen && !isRecording && !audioBlob) {
      startRecording();
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
          <h3 className="text-xl font-semibold mb-2">Voice Recording</h3>
          <p className="text-[hsl(var(--ios-gray))]">
            {isRecording ? "Speak your thoughts" : "Processing..."}
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center justify-center space-x-1 mb-8 h-16">
          {isRecording && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[hsl(var(--ios-blue))] rounded-full recording-wave"
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
          <div className="mb-6 p-3 bg-[hsl(var(--ios-light-gray))] rounded-xl">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        {/* Recording Timer */}
        <div className="text-center mb-8">
          <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-8">
          <button 
            onClick={cancelRecording}
            className="w-16 h-16 rounded-full bg-[hsl(var(--ios-light-gray))] flex items-center justify-center"
          >
            <X className="w-6 h-6 text-[hsl(var(--ios-gray))]" />
          </button>
          
          {isRecording ? (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center animate-pulse"
            >
              <Square className="w-8 h-8 text-white" />
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={createVoiceNoteMutation.isPending}
              className="w-20 h-20 rounded-full bg-[hsl(var(--ios-green))] flex items-center justify-center disabled:opacity-50"
            >
              {createVoiceNoteMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-white font-semibold">Save</span>
              )}
            </button>
          )}
          
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className="w-16 h-16 rounded-full bg-[hsl(var(--ios-light-gray))] flex items-center justify-center"
          >
            <Pause className="w-6 h-6 text-[hsl(var(--ios-gray))]" />
          </button>
        </div>
      </div>
    </div>
  );
}
