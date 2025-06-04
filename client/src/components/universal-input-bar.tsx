import { Camera, Mic, Plus, Send, Square } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UniversalInputBarProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onVoiceCapture?: () => void;
  onMediaUpload?: () => void;
  placeholder?: string;
  className?: string;
}

export default function UniversalInputBar({
  onTextSubmit,
  onCameraCapture,
  onVoiceCapture,
  onMediaUpload,
  placeholder = "Add/edit anything...",
  className = ""
}: UniversalInputBarProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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
      handleResetRecording();
      toast({
        title: "Voice note saved",
        description: "Your voice note has been transcribed and enhanced by AI.",
      });
    },
    onError: (error) => {
      console.error("Voice note error:", error);
      toast({
        title: "Error",
        description: "Failed to save voice note. Please try again.",
        variant: "destructive",
      });
      handleResetRecording();
    },
  });

  const setupAudioContext = useCallback(async () => {
    try {
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
        stopWaveformAnimation();
        createVoiceNoteMutation.mutate(blob);
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
  }, [toast, createVoiceNoteMutation]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Convert to waveform data for inline display
    const waveform = [];
    const step = Math.floor(dataArrayRef.current.length / 40); // 40 bars for inline waveform
    
    for (let i = 0; i < dataArrayRef.current.length; i += step) {
      let sum = 0;
      for (let j = 0; j < step && i + j < dataArrayRef.current.length; j++) {
        sum += dataArrayRef.current[i + j];
      }
      waveform.push(sum / step / 255); // Normalize to 0-1
    }
    
    setWaveformData(waveform);
    
    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
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
      setIsRecording(true);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const handleResetRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
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
      handleResetRecording();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    setIsTyping(value.trim().length > 0);
    
    // Auto-resize textarea
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleSendMessage = () => {
    if (inputText.trim() && onTextSubmit) {
      onTextSubmit(inputText.trim());
      setInputText("");
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`relative flex items-center gap-1.5 bg-white rounded-2xl p-3 shadow-lg border border-gray-300 ${className}`}>
      {/* Waveform overlay when recording */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-2xl z-10">
          <div className="flex items-center space-x-3 w-full px-4">
            <div className="text-sm font-mono text-red-600">
              {formatTime(recordingTime)}
            </div>
            <div className="flex-1 h-8 flex items-end justify-center space-x-1">
              {waveformData.length > 0 ? (
                waveformData.map((amplitude, index) => (
                  <div
                    key={index}
                    className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full transition-all duration-100 animate-pulse"
                    style={{
                      height: `${Math.max(2, amplitude * 24)}px`,
                      opacity: 0.8 + amplitude * 0.2
                    }}
                  />
                ))
              ) : (
                <div className="text-red-500 text-sm">Recording...</div>
              )}
            </div>
            {createVoiceNoteMutation.isPending && (
              <div className="text-blue-600 text-xs">Processing...</div>
            )}
          </div>
        </div>
      )}
      <textarea
        value={inputText}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={isRecording ? "Recording voice note..." : placeholder}
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900 resize-none overflow-hidden"
        rows={1}
        style={{
          minHeight: '20px',
          maxHeight: '120px'
        }}
        disabled={isRecording}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 120) + 'px';
        }}
      />
      <div className="flex items-center gap-1.5">
        {isTyping && !isRecording ? (
          <>
            <button 
              onClick={onMediaUpload}
              className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSendMessage}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onMediaUpload}
              className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onCameraCapture}
              className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#a8bfa1' }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20 relative hover:opacity-90 text-[#374252]"
              style={{ backgroundColor: isRecording ? '#ef4444' : '#9bb8d3' }}
              disabled={createVoiceNoteMutation.isPending}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}