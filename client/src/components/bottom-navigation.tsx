import { Home, CheckSquare, Folder, Settings } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections" | "settings";
  onTabChange: (tab: "activity" | "todos" | "collections" | "settings") => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full border-t border-[hsl(var(--border))] safe-area-bottom z-[50]" style={{ backgroundColor: '#f1efe8' }}>
        <div className="flex justify-around py-3">
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
            onClick={() => onTabChange("settings")}
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
