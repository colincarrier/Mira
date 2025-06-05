import { Home, CheckSquare, Folder, Settings } from "lucide-react";
import { useOfflineStore } from "@/store/offline-store";

interface BottomNavigationProps {
  activeTab: "activity" | "todos" | "collections" | "settings";
  onTabChange: (tab: "activity" | "todos" | "collections" | "settings") => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { pendingChanges } = useOfflineStore();
  const syncCount = pendingChanges.length;

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
            <span className="text-xs">Remind</span>
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
            className={`tab-button ${activeTab === "settings" ? "active" : ""} relative`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
            {syncCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {syncCount > 9 ? '9+' : syncCount}
              </div>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
