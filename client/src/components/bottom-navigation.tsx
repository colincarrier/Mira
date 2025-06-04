import { Home, CheckSquare, Folder, Plus, Settings, Mic, Camera, Send } from "lucide-react";
import { useState } from "react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onSettings: () => void;
  onCloseCapture?: () => void;
  hideAddButton?: boolean;
  onCameraCapture?: () => void;
}

export default function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  onNewNote, 
  onSettings, 
  onCloseCapture, 
  hideAddButton, 
  onCameraCapture 
}: BottomNavigationProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

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

  return (
    <>
      {/* Chat-style input box - anchored above navigation */}
      {hideAddButton !== true && (
        <div 
          className="fixed bottom-24 left-4 right-4 transition-transform duration-300"
          style={{ 
            zIndex: 9999,
            transform: 'translateX(0px)',
            opacity: 1
          }}
        >
          {/* Main chat input container */}
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2 min-h-[48px]">
            {/* Dynamic textarea with proper line handling */}
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 leading-relaxed"
              rows={1}
              style={{
                minHeight: '20px',
                maxHeight: '80px',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
            />

            {/* Action buttons container */}
            <div className="flex items-center gap-1">
              {!isTyping ? (
                <>
                  {/* Mic button with light blue background */}
                  <button
                    onClick={() => onNewNote()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200"
                    style={{ backgroundColor: '#a1c4cfcc' }}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Camera button with light blue background */}
                  <button
                    onClick={() => onNewNote()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200"
                    style={{ backgroundColor: '#9bb8d3' }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Plus button with green background */}
                  <button
                    onClick={() => onNewNote()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200"
                    style={{ backgroundColor: '#a8bfa1' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* Plus button (collapsed state) */}
                  <button
                    onClick={() => onNewNote()}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200"
                    style={{ backgroundColor: '#a8bfa1' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Send button */}
                  <button
                    onClick={handleSendMessage}
                    className="w-8 h-8 rounded-full bg-[#007AFF] hover:bg-[#0056CC] flex items-center justify-center text-white transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3" style={{ zIndex: 9998 }}>
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {/* Navigation tabs */}
          <button
            onClick={() => handleTabChange("activity")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              activeTab === "activity"
                ? "text-[#007AFF] bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Notes</span>
          </button>

          <button
            onClick={() => handleTabChange("todos")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              activeTab === "todos"
                ? "text-[#007AFF] bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Todos</span>
          </button>

          <button
            onClick={() => handleTabChange("collections")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              activeTab === "collections"
                ? "text-[#007AFF] bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Folder className="w-5 h-5" />
            <span className="text-xs font-medium">Collections</span>
          </button>

          <button
            onClick={handleSettings}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            style={{ backgroundColor: '#f9fafb' }}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}