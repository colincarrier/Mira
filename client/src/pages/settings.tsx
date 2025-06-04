import { ArrowLeft, User, Bell, Palette, Database, Info, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const [, navigate] = useLocation();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Account</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <User size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Profile</div>
                <div className="text-xs text-gray-500">Manage your profile information</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Preferences</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Bell size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Notifications</div>
                <div className="text-xs text-gray-500">Configure notification settings</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Palette size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Appearance</div>
                <div className="text-xs text-gray-500">Customize the app's look</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Data & Storage</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Database size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export Data</div>
                <div className="text-xs text-gray-500">Download your notes and data</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Shield size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Privacy</div>
                <div className="text-xs text-gray-500">Manage your privacy settings</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">About</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Info size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">App Information</div>
                <div className="text-xs text-gray-500">Version, terms, and support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}