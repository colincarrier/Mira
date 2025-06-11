
import { CheckSquare, FileText, User } from "lucide-react";
import { useOfflineStore } from "@/store/offline-store";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  // No longer need activeTab prop since we'll use location-based routing
}

export default function BottomNavigation({}: BottomNavigationProps) {
  const { pendingChanges } = useOfflineStore();
  const [location, navigate] = useLocation();
  const syncCount = pendingChanges.length;

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full border-t border-[hsl(var(--border))] safe-area-bottom z-[50]" style={{ backgroundColor: '#f1efe8' }}>
      <div className="flex justify-around py-1.5">
        <button 
          onClick={() => navigate("/remind")}
          className={`tab-button ${isActive("/remind") ? "active" : ""}`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-xs">Remind</span>
        </button>
        
        <button 
          onClick={() => navigate("/")}
          className={`tab-button ${isActive("/") ? "active" : ""}`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-xs">Notes</span>
        </button>
        
        <button 
          onClick={() => navigate("/profile")}
          className={`tab-button ${isActive("/profile") ? "active" : ""} relative`}
        >
          <User className="w-4 h-4" />
          <span className="text-xs">Profile</span>
          {syncCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {syncCount > 9 ? '9+' : syncCount}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}
