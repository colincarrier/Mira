import { Home, CheckSquare, Folder, Plus, Settings, Mic, Camera, Send } from "lucide-react";
import { useState, useRef } from "react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onSettings: () => void;
  onCloseCapture?: () => void;
  hideAddButton?: boolean;
  onCameraCapture?: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onNewNote, onSettings, onCloseCapture, hideAddButton, onCameraCapture }: BottomNavigationProps) {
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: "activity" | "todos" | "collections") => {
    onCloseCapture?.();
    onTabChange(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsTyping(value.length > 0);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // TODO: Send the message
      console.log("Sending message:", inputValue);
      setInputValue("");
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      {hideAddButton !== true && (
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
          <div className="border border-gray-300 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-1.5 bg-white">
            <textarea
              placeholder="Add/edit anything..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900 resize-none overflow-hidden"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
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
            {isTyping ? (
              <>
                <button 
                  onClick={onNewNote}
                  className="w-8 h-8 bg-[#a8bfa1] hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSendMessage}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onNewNote}
                  className="w-8 h-8 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors bg-[#f1efe8] text-[#374252]"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={onCameraCapture || onNewNote}
                  className="w-8 h-8 hover:bg-blue-600 text-gray-700 rounded-full flex items-center justify-center transition-colors bg-[#a8bfa1]"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button 
                  onClick={onNewNote}
                  className="w-8 h-8 bg-[#a1c4cfcc] hover:bg-blue-600 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </>
            )}
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
