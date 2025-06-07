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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      
      // Add context text if provided
      if (contextText.trim()) {
        formData.append('content', contextText.trim());
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
      
      const response = await fetch('/api/notes', {
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
          
          {/* Text Context Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Add text context (optional)
            </label>
            <Textarea
              ref={textareaRef}
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="Describe what this media is about, add notes, or ask questions..."
              className="min-h-[80px] resize-none"
            />
          </div>
          
          {/* Voice Context */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Or add voice context (optional)
            </label>
            
            {!audioBlob && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? `Stop (${formatTime(recordingTime)})` : 'Record Voice Context'}
                </Button>
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
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMediaNoteMutation.isPending}
              className="flex-1 flex items-center gap-2"
            >
              {createMediaNoteMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Create Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}