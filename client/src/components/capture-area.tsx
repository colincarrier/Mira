import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Mic, Type, Upload, File, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CaptureAreaProps {
  onVoiceCapture: () => void;
}

export default function CaptureArea({ onVoiceCapture }: CaptureAreaProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState("");
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
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
      setIsTextDialogOpen(false);
      setIsExpanded(false);

    },
    onError: () => {

    },
  });

  const handleSubmit = () => {
    const content = text.trim();
    if (content) {
      createNoteMutation.mutate(content);
    }
  };

  const handleImageCapture = () => {

  };

  const quickActions = [
    {
      icon: Type,
      label: "Text",
      color: "soft-sky-blue",
      action: () => setIsTextDialogOpen(true)
    },
    {
      icon: Mic,
      label: "Voice",
      color: "seafoam-green", 
      action: onVoiceCapture
    },
    {
      icon: Camera,
      label: "Photo",
      color: "dusty-teal",
      action: () => console.log("Photo capture coming soon")
    },
    {
      icon: Upload,
      label: "Upload",
      color: "pale-sage",
      action: () => toast({ title: "Coming soon", description: "File upload will be available soon." })
    },
    {
      icon: File,
      label: "File",
      color: "sand-taupe",
      action: () => toast({ title: "Coming soon", description: "File attachment will be available soon." })
    }
  ];

  return (
    <>
      {/* Floating iOS-style Capture Button */}
      <div className="fixed bottom-8 right-6 z-50">
        <div className={`transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
          {isExpanded && (
            <div className="flex flex-col space-y-3 mb-4 animate-slideUp">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-12 h-12 rounded-full bg-[hsl(var(--${action.color}))] text-[hsl(var(--foreground))] shadow-lg active:scale-95 transition-transform flex items-center justify-center`}
                  title={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full bg-[hsl(var(--soft-sky-blue))] text-[hsl(var(--foreground))] shadow-lg active:scale-95 transition-all flex items-center justify-center ${isExpanded ? 'rotate-45' : ''}`}
        >
          {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Text Input Dialog */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[120px] resize-none border-[hsl(var(--border))] focus:ring-[hsl(var(--soft-sky-blue))]"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsTextDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || createNoteMutation.isPending}
                className="bg-[hsl(var(--soft-sky-blue))] hover:bg-[hsl(var(--dusty-teal))] text-[hsl(var(--foreground))]"
              >
                {createNoteMutation.isPending ? "Saving..." : "Capture"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
