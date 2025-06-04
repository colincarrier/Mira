import { Home, CheckSquare, Folder, Plus, Settings, Mic } from "lucide-react";
import { useState, useRef } from "react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onSettings: () => void;
  onCloseCapture?: () => void;
  hideAddButton?: boolean;
}

export default function BottomNavigation({ activeTab, onTabChange, onNewNote, onSettings, onCloseCapture, hideAddButton }: BottomNavigationProps) {
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: "activity" | "todos" | "collections") => {
    onCloseCapture?.();
    onTabChange(tab);
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
      {/* Chat-style input box - positioned relative to navigation */}
      {hideAddButton !== true && (
        <div 
          ref={addButtonRef}
          className={`absolute -top-20 left-4 right-4 transition-transform duration-300 ${
            isAddButtonHidden ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ zIndex: 10000 }}
        >
          <div className="border border-gray-300 rounded-full px-4 py-3 shadow-lg flex items-center gap-3 bg-white">
            <input
              type="text"
              placeholder="Add/edit anything..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-[hsl(var(--muted-foreground))] text-[hsl(var(--foreground))]"
              onFocus={onNewNote}
              readOnly
            />
            <button 
              onClick={onNewNote}
              className="w-8 h-8 dark:bg-gray-200 hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-gray-800 rounded-full flex items-center justify-center transition-colors bg-[#a8bfa1]"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onNewNote}
              className="w-8 h-8 hover:bg-[hsl(var(--muted))]/80 rounded-full flex items-center justify-center transition-colors bg-[#a1c4cfcc]"
            >
              <Mic className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>
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
      <nav className="fixed bottom-0 left-0 right-0 w-full border-t border-[hsl(var(--border))] safe-area-bottom z-[50] relative" style={{ backgroundColor: '#f1efe8' }}>
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
            onClick={handleSettings}
            className="tab-button"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
}
