
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/utils/queryKeys";
import { queryClient } from "@/lib/queryClient";
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
  const [forceRefreshCount, setForceRefreshCount] = useState(0);
  
  const { toast } = useToast();
  const qc = useQueryClient();
  
  // Enable real-time updates for immediate note visibility
  useRealTimeUpdates();

  // Check for any notes currently being processed with real-time updates
  const { data: notes, isFetching, error, refetch } = useQuery<NoteWithTodos[]>({
    queryKey: [...queryKeys.notes.all, forceRefreshCount], // Add refresh count to force new query
    staleTime: 5000, // 5 seconds stale time for faster updates
    gcTime: 60000, // Keep in cache for 1 minute only
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev, // Never flash empty
  });
  
  // Log query state
  if (error) {
    console.error('[Notes Page] Query error:', error);
  }
  
  const hasProcessingNotes = notes?.some((note: NoteWithTodos) => note.isProcessing) || false;

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
      await qc.cancelQueries({ queryKey: queryKeys.notes.all });

      // Snapshot the previous value
      const previousNotes = qc.getQueryData(queryKeys.notes.all);

      // Optimistically update with processing preview
      const tempId = `temp-${crypto.randomUUID()}`;
      const tempNote = {
        id: tempId,
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
      qc.setQueryData(queryKeys.notes.all, (old: any) => 
        [tempNote, ...(old || [])]
      );

      // Return context for potential rollback
      return { previousNotes, tempNote };
    },

    onError: (err, text, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousNotes) {
        qc.setQueryData(queryKeys.notes.all, context.previousNotes);
      }
    },
    onSuccess: (newNote, text, context: any) => {
      // Replace temporary note with real note
      qc.setQueryData(queryKeys.notes.all, (old: any) => {
        if (!old) return [newNote];
        // Remove temp note and add real note at the top
        const filtered = old.filter((note: any) => note.id !== context?.tempNote?.id);
        return [newNote, ...filtered];
      });
      
      qc.invalidateQueries({ queryKey: ["/api/todos"] });
      qc.invalidateQueries({ queryKey: queryKeys.notes.all, exact: false });
      qc.refetchQueries({ queryKey: queryKeys.notes.all });
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
      
      {/* Debug Info */}
      <div className="p-2 bg-gray-100 border border-gray-300 m-2 rounded text-xs">
        <p>Notes Status: {isLoading ? 'Loading...' : error ? `Error: ${error}` : `Loaded ${notes?.length || 0} notes`}</p>
        <p>First Note ID: {notes?.[0]?.id || 'None'}</p>
        <p>Last Fetch: {new Date().toLocaleTimeString()}</p>
        <button 
          onClick={() => {
            console.log('Manual refetch triggered');
            qc.invalidateQueries({ queryKey: queryKeys.notes.all });
            refetch();
          }}
          className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Manual Refresh
        </button>
      </div>
      
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
