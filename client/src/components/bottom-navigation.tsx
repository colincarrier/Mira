import { Home, CheckSquare, Folder, Plus, Settings, Mic } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onSettings: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onNewNote, onSettings }: BottomNavigationProps) {
  return (
    <>
      {/* Chat-style input box */}
      <div className="fixed bottom-16 left-4 right-4 z-[60]">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-full px-4 py-3 shadow-lg flex items-center gap-3">
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
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] safe-area-bottom z-[50]">
        <div className="flex justify-around">
          <button 
            onClick={() => onTabChange("activity")}
            className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Notes</span>
          </button>
          
          <button 
            onClick={() => onTabChange("todos")}
            className={`tab-button ${activeTab === "todos" ? "active" : ""}`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs">To-Dos</span>
          </button>
          
          <button 
            onClick={() => onTabChange("collections")}
            className={`tab-button ${activeTab === "collections" ? "active" : ""}`}
          >
            <Folder className="w-5 h-5" />
            <span className="text-xs">Collections</span>
          </button>
          
          <button 
            onClick={onSettings}
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
