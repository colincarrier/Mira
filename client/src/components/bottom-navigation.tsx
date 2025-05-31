import { Home, CheckSquare, Folder } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] safe-area-bottom">
      <div className="flex">
        <button 
          onClick={() => onTabChange("activity")}
          className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Activity</span>
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
      </div>
    </nav>
  );
}
