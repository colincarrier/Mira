import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-white z-50 transform transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`} style={{ willChange: 'transform' }}>
      {/* Mobile app container with max width */}
      <div className="mx-auto max-w-sm w-full h-full flex flex-col">
        <div className="safe-area-top"></div>
        
        <header className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={onClose}
              className="flex items-center text-[hsl(var(--ios-blue))] touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-lg font-semibold">Settings</h1>
            <div className="w-12"></div>
          </div>
        </header>
        
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

            <div className="pt-8">
              <div className="text-center text-sm text-[hsl(var(--ios-gray))]">
                <p>Mira v1.0.0</p>
                <p className="mt-1">Your trusted memory companion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}