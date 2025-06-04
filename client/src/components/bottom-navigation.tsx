import { Home, CheckSquare, Folder, Settings, Plus, Camera, Mic, Send } from "lucide-react";
import { useState, useRef } from "react";
import UniversalInputBar from "./universal-input-bar";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections" | "settings";
  onTabChange: (tab: "activity" | "todos" | "collections" | "settings") => void;
  onNewNote: () => void;
  onSettings: () => void;
  onCloseCapture?: () => void;
  hideAddButton?: boolean;
  onCameraCapture?: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onNewNote, onSettings, onCloseCapture, hideAddButton, onCameraCapture }: BottomNavigationProps) {
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: "activity" | "todos" | "collections" | "settings") => {
    onCloseCapture?.();
    onTabChange(tab);
  };

  const handleTextSubmit = (text: string) => {
    if (text.trim()) {
      // Create a quick note with the submitted text
      // For now, trigger the new note functionality
      onNewNote();
    }
  };

  const handleSettings = () => {
    onCloseCapture?.();
    onSettings();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Swipe right to hide (minimum 50px horizontal, max 30px vertical)
    if (deltaX > 50 && deltaY < 30) {
      setIsAddButtonHidden(true);
    }
    // Swipe left to show
    else if (deltaX < -50 && deltaY < 30) {
      setIsAddButtonHidden(false);
    }
    
    setTouchStart(null);
  };
  return (
    <>
      {/* Chat-style input box - anchored above navigation */}
      {hideAddButton === true ? null : (
        <div 
          ref={addButtonRef}
          className={`fixed bottom-24 left-4 right-4 transition-transform duration-300 ${
            isAddButtonHidden ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            bottom: '6rem',
            left: '1rem',
            right: '1rem'
          }}
        >
          <UniversalInputBar
            onTextSubmit={handleTextSubmit}
            onCameraCapture={onCameraCapture}
            onMediaUpload={onNewNote}
            placeholder="Add/edit anything..."
          />
        </div>
      )}
      {/* Hidden state indicator - tap to restore */}
      {isAddButtonHidden && hideAddButton !== true && (
        <div 
          className="fixed bottom-24 right-4 cursor-pointer"
          onClick={() => setIsAddButtonHidden(false)}
          style={{ zIndex: 10000 }}
        >
          <div className="w-12 h-6 bg-gray-400/50 rounded-full flex items-center justify-center">
            <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full border-t border-[hsl(var(--border))] safe-area-bottom z-[50]" style={{ backgroundColor: '#f1efe8' }}>
        <div className="flex justify-around py-3">
          <button 
            onClick={() => handleTabChange("activity")}
            className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Notes</span>
          </button>
          
          <button 
            onClick={() => handleTabChange("todos")}
            className={`tab-button ${activeTab === "todos" ? "active" : ""}`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs">To-Dos</span>
          </button>
          
          <button 
            onClick={() => handleTabChange("collections")}
            className={`tab-button ${activeTab === "collections" ? "active" : ""}`}
          >
            <Folder className="w-5 h-5" />
            <span className="text-xs">Collections</span>
          </button>
          
          <button 
            onClick={() => handleTabChange("settings")}
            className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
}
