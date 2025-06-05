import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import CaptureArea from "@/components/capture-area";
import ActivityFeed from "@/components/activity-feed";
import TodosView from "@/components/todos-view";
import CollectionsView from "@/components/collections-view";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import BottomNavigation from "@/components/bottom-navigation";
import InputBar from "@/components/input-bar";
import SimpleTextInput from "@/components/simple-text-input";
import FullScreenCapture from "@/components/full-screen-capture";
import Settings from "@/pages/settings";

import { Settings as SettingsIcon } from "lucide-react";

export default function Home() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections" | "settings">("activity");
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Text note creation mutation
  const createTextNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create text note");
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
      console.error("Text note error:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTextSubmit = (text: string) => {
    console.log('🏠 HOME handleTextSubmit called with:', text);
    createTextNoteMutation.mutate(text);
  };

  // Check URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'collections' || tab === 'todos' || tab === 'activity') {
      setActiveTab(tab as "activity" | "todos" | "collections");
    }
  }, [location]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Swipe gesture handlers for tab switching
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100;
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100;
    
    if (isLeftSwipe) {
      // Swipe left to go to next tab
      if (activeTab === 'activity') setActiveTab('todos');
      else if (activeTab === 'todos') setActiveTab('collections');
    } else if (isRightSwipe) {
      // Swipe right to go to previous tab
      if (activeTab === 'collections') setActiveTab('todos');
      else if (activeTab === 'todos') setActiveTab('activity');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return <ActivityFeed onTodoModalClose={() => setActiveTab("activity")} />;
      case "todos":
        return <TodosView />;
      case "collections":
        return <CollectionsView />;
      case "settings":
        return <Settings />;
      default:
        return <ActivityFeed onTodoModalClose={() => setActiveTab("activity")} />;
    }
  };

  return (
    <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>
      
      {/* Main Content */}
      <div className="pb-24">
        {/* Tab Content */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderTabContent()}
        </div>
      </div>

      {/* Input Bar */}
      {activeTab !== "settings" && (
        <SimpleTextInput 
          onCameraCapture={() => setIsFullScreenCaptureOpen(true)}
          onNewNote={() => setIsVoiceModalOpen(true)}
        />
      )}

      {/* Bottom Navigation Tabs */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setIsFullScreenCaptureOpen(false);
          setActiveTab(tab);
        }}
      />

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
    </div>
  );
}
