import { useState } from "react";
import { Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function SimpleTextInput() {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content,
          mode: "text"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create note");
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
      console.error("Note creation error:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (text.trim()) {
      createNoteMutation.mutate(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50">
      <div className="bg-red-500 rounded-2xl p-4 shadow-lg border-4 border-black">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="TEST INPUT - Type here..."
            className="flex-1 bg-white border-2 border-gray-800 outline-none text-lg p-2 rounded"
          />
          <button 
            onClick={handleSubmit}
            disabled={createNoteMutation.isPending}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 border-2 border-black"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}