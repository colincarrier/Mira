import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Camera, Mic } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import IOSActionSheet from './ios-action-sheet';

interface SimpleTextInputProps {
  onSendMessage: (message: string) => void;
  onCameraCapture?: () => void;
  onNewNote?: () => void;
  placeholder?: string;
  showCamera?: boolean;
  showMediaPicker?: boolean;
  className?: string;
}

export default function SimpleTextInput({
  onSendMessage,
  onCameraCapture,
  onNewNote = () => {},
  placeholder = "Type a message...",
  showCamera = true,
  showMediaPicker = true,
  className = ""
}: SimpleTextInputProps) {
  const [inputText, setInputText] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();


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
    if (inputText.trim()) {
      createNoteMutation.mutate(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePhotoLibrary = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (

    <div 
      className="fixed left-4 right-4 z-50"
      style={{ 
        bottom: 'calc(3.5rem + 16px)' // Nav height + gap, consistent with other input bars
      }}
    >
      <div className="relative bg-white rounded-2xl p-3 shadow-lg border border-gray-300">
        <div className="flex items-center gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
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
          {showMediaPicker && (
                <button 
                  onClick={() => setShowActionSheet(true)}
                  className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                  title="Add media"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
          {inputText.trim() ? (
            <button
              onClick={handleSubmit}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <>
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

      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Custom iOS Action Sheet */}
      <IOSActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onPhotoLibrary={handlePhotoLibrary}
        onChooseFile={handleChooseFile}
      />
    </div>

  );
}