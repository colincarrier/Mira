import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NoteWithTodos, InsertNote } from "@shared/schema";
import { queryKeys } from "@/utils/queryKeys";

export function useNotes() {
  const queryClient = useQueryClient();

  const {
    data: notes,
    isLoading,
    error,
  } = useQuery<NoteWithTodos[]>({
    queryKey: queryKeys.notes.all,
    placeholderData: (previousData) => previousData, // Prevent empty list flashes
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: InsertNote) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      // Force refresh all related data
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      // Also refetch immediately
      queryClient.refetchQueries({ queryKey: queryKeys.notes.all });
      queryClient.refetchQueries({ queryKey: ["/api/todos"] });
    },
    onError: (error) => {
      console.error("Failed to create note:", error);
    },
  });

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
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote: createNoteMutation.mutate,
    createVoiceNote: createVoiceNoteMutation.mutate,
    isCreating: createNoteMutation.isPending || createVoiceNoteMutation.isPending,
  };
}
