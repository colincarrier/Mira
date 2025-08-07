import { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, Type, Upload, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/utils/queryKeys";

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice' | 'upload-image' | 'upload-file';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [noteText, setNoteText] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 300);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { content: string; mode: string }) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      setNoteText('');
      onClose();
      toast({
        description: "Note created successfully!",
      });
    },
  });

  const handleSave = () => {
    if (noteText.trim()) {
      createNoteMutation.mutate({
        content: noteText.trim(),
        mode: 'text'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/30" />

      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-60 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 flex flex-col justify-end pb-4">
          
          {/* Text input area - always visible above camera controls */}
          <div className="mx-4 mb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add new note"
                className="w-full h-16 resize-none border-none outline-none bg-transparent text-lg placeholder-gray-500"
                inputMode="text"
                enterKeyHint="done"
              />
              {noteText.length > 0 && (
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">
                    {noteText.length} characters
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={createNoteMutation.isPending}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium disabled:opacity-50"
                  >
                    {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Camera capture button */}
          <div className="flex justify-center mb-8">
            <button
              className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}