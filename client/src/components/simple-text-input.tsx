import { useState } from "react";
import { Send, Camera, Mic, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SimpleTextInputProps {
  onCameraCapture?: () => void;
  onNewNote?: () => void;
}

export default function SimpleTextInput({ onCameraCapture, onNewNote }: SimpleTextInputProps = {}) {
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
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-300">
        <div className="flex items-center gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add/edit anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900 resize-none"
            rows={1}
            style={{
              minHeight: '20px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          {text.trim() ? (
            <button 
              onClick={handleSubmit}
              disabled={createNoteMutation.isPending}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button 
                onClick={onCameraCapture}
                className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#a8bfa1' }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                onClick={onNewNote}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[#374252]"
                style={{ backgroundColor: '#9bb8d3' }}
              >
                <Mic className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}