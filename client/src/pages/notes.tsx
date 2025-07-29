
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ActivityFeed from "@/components/activity-feed";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import BottomNavigation from "@/components/bottom-navigation";
import InputBar from "@/components/input-bar";
import FullScreenCapture from "@/components/full-screen-capture";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import { useRealTimeUpdates } from "@/hooks/use-realtime-updates";
import type { NoteWithTodos } from "@shared/schema";

export default function Notes() {
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Enable real-time updates for immediate note visibility
  useRealTimeUpdates();

  // Check for any notes currently being processed with real-time updates
  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
    staleTime: 0, // Always fresh data for real-time updates
    gcTime: 60000, // Keep in cache for 1 minute only
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 1000, // Refresh every 1 second for immediate updates
    refetchIntervalInBackground: true, // Continue refetching even when tab not focused
  });
  
  const hasProcessingNotes = notes?.some(note => note.isProcessing) || false;

  // Text note creation mutation with optimistic updates
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
    onMutate: async (text: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/notes"] });

      // Snapshot the previous value
      const previousNotes = queryClient.getQueryData(["/api/notes"]);

      // Optimistically update with processing preview
      const tempNote = {
        id: `temp-${Date.now()}`,
        content: text,
        isProcessing: true,
        aiEnhanced: false,
        createdAt: new Date().toISOString(),
        mode: "text" as const,
        userId: null,
        isShared: false,
        shareId: null,
        privacyLevel: "private" as const,
        audioUrl: null,
        mediaUrl: null,
        transcription: null,
        imageData: null,
        aiSuggestion: null,
        aiContext: null,
        aiGeneratedTitle: null,
        collectionId: null,
        vectorDense: null,
        vectorSparse: null,
        intentVector: null,
        version: 1,
        originalContent: null,
        lastUserEdit: new Date().toISOString(),
        protectedContent: null,
        processingPath: null,
        classificationScores: null,
        // Processing preview rich context
        richContext: JSON.stringify({
          title: "Processing...",
          aiBody: "AI is analyzing your note and generating strategic insights...",
          perspective: "Intelligence processing in progress",
          todos: []
        })
      };

      // Add to top of notes list immediately
      queryClient.setQueryData(["/api/notes"], (old: any) => 
        [tempNote, ...(old || [])]
      );

      // Return context for potential rollback
      return { previousNotes, tempNote };
    },

    onError: (err, text, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousNotes) {
        queryClient.setQueryData(["/api/notes"], context.previousNotes);
      }
    },
    onSuccess: (newNote, text, context: any) => {
      // Replace temporary note with real note
      queryClient.setQueryData(["/api/notes"], (old: any) => {
        if (!old) return [newNote];
        // Remove temp note and add real note at the top
        const filtered = old.filter((note: any) => note.id !== context?.tempNote?.id);
        return [newNote, ...filtered];
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note saved",
        description: "Your note has been created and AI analysis is in progress.",
        duration: 3000,
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
