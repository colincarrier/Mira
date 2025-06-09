import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Mic, Upload, Send, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MediaContextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'camera' | 'image' | 'file' | null;
  capturedImage?: string;
  selectedFile?: File;
}

export default function MediaContextDialog({
  isOpen,
  onClose,
  mediaType,
  capturedImage,
  selectedFile
}: MediaContextDialogProps) {
  const [contextText, setContextText] = useState("");
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiIdentification, setAiIdentification] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    
    // Auto-analyze media when dialog opens
    if (isOpen && (capturedImage || selectedFile)) {
      analyzeMediaContent();
    }
  }, [isOpen, capturedImage, selectedFile]);

  const analyzeMediaContent = async () => {
    if (!capturedImage && !selectedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      
      if (capturedImage) {
        // Convert base64 to blob for analysis
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        formData.append('image', blob, 'capture.jpg');
      } else if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      formData.append('analyzeOnly', 'true');
      
      const response = await fetch('/api/analyze-media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (response.ok) {
        const analysis = await response.json();
        setAiIdentification(analysis.identification || "");
        // AI analysis stays separate - never populate user's text field
      }
    } catch (error) {
      console.error('Media analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const createMediaNoteMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      
      // Send AI analysis and user context separately
      if (aiIdentification) {
        formData.append('aiAnalysis', aiIdentification);
      }
      if (contextText.trim()) {
        formData.append('userContext', contextText.trim());
      }
      
      // Add media based on type
      if (mediaType === 'camera' && capturedImage) {
        // Convert base64 to blob
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        formData.append('image', blob, 'capture.jpg');
        formData.append('mode', 'image');
      } else if (mediaType === 'image' && selectedFile) {
        formData.append('image', selectedFile);
        formData.append('mode', 'image');
      } else if (mediaType === 'file' && selectedFile) {
        formData.append('file', selectedFile);
        formData.append('mode', 'file');
      }
      
      // Add voice context if recorded
      if (audioBlob) {
        formData.append('audio', audioBlob, 'context.webm');
        formData.append('hasVoiceContext', 'true');
      }
      
      const response = await fetch('/api/notes/media', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create media note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Media Note Created",
        description: "Your media note with context has been saved successfully.",
        duration: 3000,
      });
      handleClose();
    },
    onError: (error) => {
      console.error('Media note creation error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to create media note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setContextText("");
    setUserHasTyped(false);
    setAiIdentification("");
    setAudioBlob(null);
    setRecordingTime(0);
    if (isRecording) {
      stopVoiceRecording();
    }
    onClose();
  };

  const handleSubmit = () => {
    if (!contextText.trim() && !audioBlob && !capturedImage && !selectedFile) {
      toast({
        title: "Add Context",
        description: "Please add some text or voice context for your media.",
        variant: "destructive",
      });
      return;
    }
    
    createMediaNoteMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaPreview = () => {
    if (mediaType === 'camera' && capturedImage) {
      return (
        <div className="relative">
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Camera Capture
          </div>
        </div>
      );
    }
    
    if ((mediaType === 'image' || mediaType === 'file') && selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        return (
          <div className="relative">
            <img 
              src={URL.createObjectURL(selectedFile)} 
              alt="Selected" 
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {selectedFile.name}
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
            <Upload className="w-8 h-8 text-gray-500" />
            <div>
              <div className="font-medium text-sm">{selectedFile.name}</div>
              <div className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mediaType === 'camera' && <Camera className="w-5 h-5" />}
            {mediaType === 'image' && <Upload className="w-5 h-5" />}
            {mediaType === 'file' && <Upload className="w-5 h-5" />}
            Add Context to Your Media
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Media Preview */}
          {getMediaPreview()}
          
          {/* AI Analysis Display - Only show if meaningful results */}
          {isAnalyzing && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Analysis
              </label>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 min-h-[60px]">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              </div>
            </div>
          )}
          {!isAnalyzing && aiIdentification && aiIdentification.trim() && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Analysis
              </label>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 min-h-[60px]">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {aiIdentification}
                </div>
              </div>
            </div>
          )}
          
          {/* Voice Recording Status */}
          {isRecording && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording voice context: {formatTime(recordingTime)}
              </div>
            </div>
          )}
          
          {audioBlob && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Voice context recorded ({formatTime(recordingTime)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAudioBlob(null);
                    setRecordingTime(0);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* User Context Input - Separate from AI analysis */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Context (Optional)
            </label>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center gap-2">
              <input
                ref={textareaRef}
                value={contextText}
                onChange={(e) => {
                  setContextText(e.target.value);
                  setUserHasTyped(true);
                }}
                placeholder="Add your own notes or context about this media..."
                className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              {/* Microphone button */}
              <button
                type="button"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`p-2 rounded-full transition-colors ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
              
              {/* Send button */}
              <button
                onClick={handleSubmit}
                disabled={createMediaNoteMutation.isPending || (!contextText.trim() && !audioBlob)}
                className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
              >
                {createMediaNoteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}