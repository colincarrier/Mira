
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ActivityFeed from "@/components/activity-feed";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import BottomNavigation from "@/components/bottom-navigation";
import InputBar from "@/components/input-bar";
import FullScreenCapture from "@/components/full-screen-capture";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import type { NoteWithTodos } from "@shared/schema";

export default function Notes() {
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for any notes currently being processed
  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });
  
  const hasProcessingNotes = notes?.some(note => note.isProcessing) || false;

  // Text note creation mutation
  const createTextNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text",
          context: "note_creation" // Context for AI to know this is note-focused
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create text note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Note saved",
        description: "Your note has been created successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Text note error:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTextSubmit = (text: string) => {
    console.log('📝 NOTES handleTextSubmit called with:', text);
    createTextNoteMutation.mutate(text);
  };

  return (
    <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>
      
      {/* Main Content */}
      <div className="pb-24">
        <ActivityFeed />
      </div>

      {/* Context-specific Input Bar for Notes */}
      <InputBar 
        onCameraCapture={() => setIsFullScreenCaptureOpen(true)}
        onNewNote={() => setIsVoiceModalOpen(true)}
        onTextSubmit={handleTextSubmit}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      <IOSVoiceRecorder 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />

      {/* Full Screen Capture */}
      <FullScreenCapture
        isOpen={isFullScreenCaptureOpen}
        onClose={() => setIsFullScreenCaptureOpen(false)}
      />

      {/* Global AI Processing Indicator */}
      <AIProcessingIndicator isProcessing={hasProcessingNotes} position="fixed" />
    </div>
  );
}
