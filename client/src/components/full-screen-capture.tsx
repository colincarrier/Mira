import { useState } from "react";
import { X, Type, Camera, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech";
import type { InsertNote } from "@shared/schema";

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('text');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    startListening, 
    stopListening, 
    transcript, 
    isListening, 
    resetTranscript 
  } = useSpeechRecognition();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: InsertNote) => {
      return apiRequest("/api/notes", {
        method: "POST",
        body: noteData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note created",
        description: "Your note has been saved successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setContent('');
    setMode('text');
    resetTranscript();
    onClose();
  };

  const handleSave = () => {
    const finalContent = mode === 'voice' ? transcript : content;
    if (!finalContent.trim()) return;

    createNoteMutation.mutate({
      content: finalContent,
      mode: mode,
    });
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    } else {
      startListening();
      setIsRecording(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">New Note</h2>
        <Button 
          onClick={handleSave} 
          disabled={createNoteMutation.isPending || (!content.trim() && !transcript.trim())}
          size="sm"
        >
          {createNoteMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Mode Selection */}
      <div className="flex border-b">
        <Button
          variant={mode === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('text')}
          className="flex-1 rounded-none"
        >
          <Type className="h-4 w-4 mr-2" />
          Text
        </Button>
        <Button
          variant={mode === 'camera' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('camera')}
          className="flex-1 rounded-none"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
        <Button
          variant={mode === 'voice' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('voice')}
          className="flex-1 rounded-none"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        {mode === 'text' && (
          <Textarea
            placeholder="Start typing your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-none focus:ring-0 text-lg"
            autoFocus
          />
        )}

        {mode === 'camera' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Camera functionality coming soon</p>
            </div>
          </div>
        )}

        {mode === 'voice' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 mb-4">
              <Textarea
                placeholder="Your transcribed text will appear here..."
                value={transcript}
                readOnly
                className="w-full h-full resize-none border-none focus:ring-0 text-lg bg-gray-50"
              />
            </div>
            <div className="text-center">
              <Button
                onClick={handleVoiceToggle}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="rounded-full w-16 h-16"
              >
                <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>
              <p className="mt-2 text-sm text-gray-500">
                {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}