import { ChevronLeft, Brain } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import AIComparison from "./ai-comparison";
import BottomNavigation from "./bottom-navigation";


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "activity" | "todos" | "collections";
  onTabChange: (tab: "activity" | "todos" | "collections") => void;
  onNewNote: () => void;
  onCloseCapture?: () => void;
}

export default function SettingsModal({ isOpen, onClose, activeTab, onTabChange, onNewNote, onCloseCapture }: SettingsModalProps) {
  const [showAIComparison, setShowAIComparison] = useState(false);

  if (showAIComparison) {
    return (
      <div className={`fixed inset-0 bg-white z-40 ${
        isOpen ? "block" : "hidden"
      }`}>
        <div className="mx-auto max-w-sm w-full h-full flex flex-col">
          <div className="safe-area-top"></div>
          
          <div className="flex items-center justify-between mb-4 px-4 pt-6">
            <h2 className="text-2xl font-serif font-medium">AI Comparison</h2>
            <button 
              onClick={() => setShowAIComparison(false)}
              className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-20">
            <AIComparison />
          </div>
          
          {/* Bottom Navigation */}
          <BottomNavigation 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              onTabChange(tab);
              onClose();
            }}
            onNewNote={onNewNote}
            onSettings={onClose}
            onCloseCapture={onCloseCapture}
            hideAddButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-white z-40 ${
      isOpen ? "block" : "hidden"
    }`}>
      {/* Mobile app container with max width */}
      <div className="mx-auto max-w-sm w-full h-full flex flex-col">
        <div className="safe-area-top"></div>
        
        <div className="flex items-center justify-between mb-4 px-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-20">
            <div>
              <h3 className="text-lg font-semibold mb-4">AI & Voice</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-enhance notes</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Let AI improve your notes automatically</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emoji in titles</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Add emojis to note titles for visual clarity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Voice transcription</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Convert speech to text</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Smart suggestions</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Get AI-powered follow-up suggestions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <button 
                  onClick={() => setShowAIComparison(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">AI Comparison Tool</p>
                      <p className="text-sm text-[hsl(var(--ios-gray))]">Compare OpenAI vs Claude results</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Local processing only</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Process data on device when possible</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Help improve the app</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Storage</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-backup</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Backup your notes to cloud storage</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Offline access</p>
                    <p className="text-sm text-[hsl(var(--ios-gray))]">Access notes without internet</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Account</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium mb-2">Not signed in</p>
                  <p className="text-sm text-[hsl(var(--ios-gray))] mb-4">
                    Sign in to sync your notes across devices and enable collaboration features.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => window.location.href = '/api/login'}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => window.location.href = '/api/logout'}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <div className="text-center text-sm text-[hsl(var(--ios-gray))]">
                <p>Mira v1.0.0</p>
                <p className="mt-1">Your trusted memory companion</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={(tab: "activity" | "todos" | "collections") => {
            onTabChange(tab);
            onClose();
          }}
          onNewNote={onNewNote}
          onSettings={onClose}
          onCloseCapture={onCloseCapture}
          hideAddButton={true}
        />

      </div>
    </div>
  );
}