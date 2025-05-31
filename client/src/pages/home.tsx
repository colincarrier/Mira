import { useState } from "react";
import CaptureArea from "@/components/capture-area";
import ActivityFeed from "@/components/activity-feed";
import TodosView from "@/components/todos-view";
import CollectionsView from "@/components/collections-view";
import VoiceModal from "@/components/voice-modal";
import SettingsModal from "@/components/settings-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { Settings } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections">("activity");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case "activity":
        return <ActivityFeed />;
      case "todos":
        return <TodosView />;
      case "collections":
        return <CollectionsView />;
      default:
        return <ActivityFeed />;
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-[hsl(var(--background))] min-h-screen relative overflow-hidden">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>
      
      {/* Main Content */}
      <div className="pb-20">
        {/* Header */}
        <header className="bg-[hsl(var(--background))] px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Mira</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Your trusted memory</p>
            </div>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="ios-button-secondary"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Quick Capture */}
        <CaptureArea onVoiceCapture={() => setIsVoiceModalOpen(true)} />

        {/* Tab Content */}
        <div className="px-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <VoiceModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </div>
  );
}
