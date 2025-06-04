import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Palette, Database, Info, Moon, Sun, Monitor, Trash2, BarChart3 } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const handleExportData = async () => {
    if (!notes) return;
    
    const exportData = {
      notes: notes,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mira-notes-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
      // Implementation would require a delete all endpoint
      console.log('Clear all data requested');
    }
  };

  const noteCount = notes?.length || 0;
  const todoCount = notes?.reduce((acc, note) => acc + note.todos.length, 0) || 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">
            Settings
          </h2>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-6">
        {/* Statistics Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Statistics</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{noteCount}</div>
                <div className="text-sm text-gray-500">Notes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{todoCount}</div>
                <div className="text-sm text-gray-500">Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Appearance</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette size={20} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Theme</div>
                  <div className="text-xs text-gray-500">Choose your preferred theme</div>
                </div>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded transition-colors ${theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded transition-colors ${theme === 'dark' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-2 rounded transition-colors ${theme === 'system' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <Monitor size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Data Management</h2>
          </div>
          <div className="p-4 space-y-4">
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Download size={20} className="text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export Data</div>
                <div className="text-xs text-gray-500">Download all your notes as JSON</div>
              </div>
            </button>
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 size={20} className="text-red-600" />
              <div>
                <div className="text-sm font-medium text-red-600">Clear All Data</div>
                <div className="text-xs text-gray-500">Delete all notes and tasks</div>
              </div>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">About</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg">
              <Info size={20} className="text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Mira</div>
                <div className="text-xs text-gray-500">AI-powered memory and productivity app</div>
                <div className="text-xs text-gray-400 mt-1">Version 1.0.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}