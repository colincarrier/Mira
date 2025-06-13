import React, { useState, useRef } from "react";
import { Send, Camera, Mic, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SimpleTextInputProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onNewNote?: () => void;
  placeholder?: string;
  context?: "notes" | "remind" | "note_detail";
  showCamera?: boolean;
  showMediaPicker?: boolean;
  onToggleSubmenu?: () => void; // Add this line
}

export default function SimpleTextInput({ 
  onCameraCapture, 
  onNewNote, 
  onTextSubmit,
  placeholder = "What's on your mind?",
  context = "notes",
  showCamera = true,
  showMediaPicker = true,
  onToggleSubmenu // Add this line
}: SimpleTextInputProps) {
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

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const placeholderResponse = await fetch("/api/notes/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: "📷 Processing image...",
          type: "image"
        }),
        credentials: "include",
      });
      
      if (!placeholderResponse.ok) {
        throw new Error("Failed to create placeholder note");
      }
      
      const placeholderNote = await placeholderResponse.json();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      
      const formData = new FormData();
      formData.append("image", file);
      formData.append("noteId", placeholderNote.id.toString());
      
      const response = await fetch("/api/notes/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setIsSubmenuOpen(false);
      toast({
        title: "Image processed",
        description: "Your image has been analyzed and enhanced by AI.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const placeholderResponse = await fetch("/api/notes/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: `📄 Processing ${file.name}...`,
          type: "file"
        }),
        credentials: "include",
      });
      
      if (!placeholderResponse.ok) {
        throw new Error("Failed to create placeholder note");
      }
      
      const placeholderNote = await placeholderResponse.json();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("noteId", placeholderNote.id.toString());
      
      const response = await fetch("/api/notes/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setIsSubmenuOpen(false);
      toast({
        title: "File processed",
        description: "Your file has been analyzed and enhanced by AI.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("File upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (text.trim()) {
      if (onTextSubmit) {
        onTextSubmit(text.trim());
      } else {
        createNoteMutation.mutate(text.trim());
      }
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToggleSubmenu = () => {
    // Create a native file picker that accepts both images and files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,*/*'; // Accept images and all file types
    input.multiple = false;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.type.startsWith('image/')) {
          uploadImageMutation.mutate(file);
        } else {
          uploadFileMutation.mutate(file);
        }
      }
    };
    
    input.click();
  };

  

  return (

    <div className="fixed bottom-24 left-4 right-4 z-50">

      <div className="relative bg-white rounded-2xl p-3 shadow-lg border border-gray-300">
        <div className="flex items-center gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
            <>
              {showMediaPicker && (
                <button 
                  onClick={handleToggleSubmenu}
                  className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                  title="Add media"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={handleSubmit}
                disabled={createNoteMutation.isPending}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {showMediaPicker && (
                <button 
                  onClick={handleToggleSubmenu}
                  className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                  title="Add media"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              {showCamera && (
                <button 
                  onClick={onCameraCapture}
                  className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#a8bfa1' }}
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
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