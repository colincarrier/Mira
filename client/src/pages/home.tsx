import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections">("activity");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);

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
    <div className="max-w-sm mx-auto bg-[hsl(var(--background))] min-h-screen relative overflow-hidden">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>
      
      {/* Main Content */}
      <div className="pb-20">


        {/* Quick Capture */}
        <CaptureArea onVoiceCapture={() => setIsVoiceModalOpen(true)} />

        {/* Tab Content */}
        <div className="px-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onNewNote={() => setIsFullScreenCaptureOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Modals */}
      <VoiceModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Full Screen Capture */}
      <FullScreenCapture
        isOpen={isFullScreenCaptureOpen}
        onClose={() => setIsFullScreenCaptureOpen(false)}
      />
    </div>
  );
}
