import { Home, CheckSquare, Folder, Plus, Settings } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onSettings: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onNewNote, onSettings }: BottomNavigationProps) {
  return (
    <>
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

      {/* Floating Action Button */}
      <button
        onClick={onNewNote}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[hsl(var(--sage-green))] hover:bg-[hsl(var(--sage-green))]/90 text-white rounded-full shadow-lg flex items-center justify-center z-[60] transition-all duration-200 active:scale-95"
        aria-label="Create new note"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
