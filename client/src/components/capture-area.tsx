import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaptureAreaProps {
  onVoiceCapture: () => void;
}

export default function CaptureArea({ onVoiceCapture }: CaptureAreaProps) {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/notes", {
        content,
        mode: "text",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setText("");
      toast({
        title: "Note captured",
        description: "Your note has been saved and is being enhanced by AI.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const content = text.trim();
    if (content) {
      createNoteMutation.mutate(content);
    }
  };

  const handleImageCapture = () => {
    toast({
      title: "Coming soon",
      description: "Image capture will be available in a future update.",
    });
  };

  return (
    <div className="px-4 py-6 bg-white">
      <div className="relative">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full h-24 p-4 border border-gray-200 rounded-2xl resize-none text-base placeholder-[hsl(var(--ios-gray))] focus:outline-none focus:border-[hsl(var(--ios-blue))] transition-colors"
          style={{ fontFamily: 'inherit' }}
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-3">
            <button 
              onClick={handleImageCapture}
              className="ios-button-secondary"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              onClick={onVoiceCapture}
              className="w-10 h-10 rounded-full bg-[hsl(var(--ios-blue))] flex items-center justify-center"
            >
              <Mic className="w-4 h-4 text-white" />
            </button>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={!text.trim() || createNoteMutation.isPending}
            className="ios-button disabled:opacity-50"
          >
            {createNoteMutation.isPending ? "Capturing..." : "Capture"}
          </button>
        </div>
      </div>
    </div>
  );
}
