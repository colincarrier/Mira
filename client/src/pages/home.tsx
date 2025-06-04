import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import CaptureArea from "@/components/capture-area";
import ActivityFeed from "@/components/activity-feed";
import TodosView from "@/components/todos-view";
import CollectionsView from "@/components/collections-view";
import VoiceModal from "@/components/voice-modal";
import SettingsModal from "@/components/settings-modal";
import BottomNavigation from "@/components/bottom-navigation";
import FullScreenCapture from "@/components/full-screen-capture";

import { Settings } from "lucide-react";

export default function Home() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections">("activity");

  // Check URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'collections' || tab === 'todos' || tab === 'activity') {
      setActiveTab(tab as "activity" | "todos" | "collections");
    }
  }, [location]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);

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


        {/* Quick Capture - removed for now */}

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
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onNewNote={() => setIsFullScreenCaptureOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
        onCloseCapture={() => setIsFullScreenCaptureOpen(false)}
      />

      {/* Modals */}
      <VoiceModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewNote={() => setIsFullScreenCaptureOpen(true)}
        onCloseCapture={() => setIsFullScreenCaptureOpen(false)}
      />

      {/* Full Screen Capture */}
      <FullScreenCapture
        isOpen={isFullScreenCaptureOpen}
        onClose={() => setIsFullScreenCaptureOpen(false)}
      />
    </div>
  );
}
