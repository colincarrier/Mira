import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import CaptureArea from "@/components/capture-area";
import ActivityFeed from "@/components/activity-feed";
import TodosView from "@/components/todos-view";
import CollectionsView from "@/components/collections-view";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import BottomNavigation from "@/components/bottom-navigation";
import FloatingInputBar from "@/components/floating-input-bar";
import FullScreenCapture from "@/components/full-screen-capture";
import Settings from "@/pages/settings";

import { Settings as SettingsIcon } from "lucide-react";

export default function Home() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections" | "settings">("activity");
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);

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

      {/* Bottom Navigation */}
      {/* Floating Input Bar */}
      <FloatingInputBar
        onNewNote={() => {
          setShowSubmenu(false);
          setIsFullScreenCaptureOpen(true);
        }}
        onCameraCapture={() => {
          setShowSubmenu(false);
          setIsFullScreenCaptureOpen(true);
        }}
        showSubmenu={showSubmenu}
        onToggleSubmenu={() => {
          setIsFullScreenCaptureOpen(false);
          setShowSubmenu(!showSubmenu);
        }}
        isHidden={activeTab === "settings"}
      />

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
