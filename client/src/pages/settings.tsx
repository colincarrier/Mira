import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Palette, Info, Moon, Sun, Monitor, Trash2, Trophy, Zap, Brain, Target, Crown, Star, TrendingUp } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('claude');
  const [showEmojis, setShowEmojis] = useState(true);

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const { data: apiStats } = useQuery<{
    openai: { requests: number; tokens: number; cost: number };
    claude: { requests: number; tokens: number; cost: number };
    totalRequests: number;
  }>({
    queryKey: ["/api/stats/api-usage"],
  });

  const handleClearData = async () => {
    if (confirm('Are you sure you want to delete all notes? This cannot be undone.')) {
      console.log('Clear all data requested');
    }
  };

  const noteCount = notes?.length || 0;
  const todoCount = notes?.reduce((acc, note) => acc + note.todos.length, 0) || 0;
  const completedTodos = notes?.reduce((acc, note) => acc + note.todos.filter(t => t.completed).length, 0) || 0;
  
  // Achievement calculations
  const achievements = [
    { 
      id: 'first_note', 
      name: 'Getting Started', 
      description: 'Create your first note', 
      icon: '🌱', 
      unlocked: noteCount >= 1,
      progress: Math.min(noteCount, 1),
      target: 1
    },
    { 
      id: 'prolific_writer', 
      name: 'Prolific Writer', 
      description: 'Create 50 notes', 
      icon: '📝', 
      unlocked: noteCount >= 50,
      progress: Math.min(noteCount, 50),
      target: 50
    },
    { 
      id: 'task_master', 
      name: 'Task Master', 
      description: 'Complete 100 tasks', 
      icon: '✅', 
      unlocked: completedTodos >= 100,
      progress: Math.min(completedTodos, 100),
      target: 100
    },
    { 
      id: 'ai_enthusiast', 
      name: 'AI Enthusiast', 
      description: 'Process 25 notes with AI', 
      icon: '🤖', 
      unlocked: (apiStats?.totalRequests || 0) >= 25,
      progress: Math.min(apiStats?.totalRequests || 0, 25),
      target: 25
    }
  ];

  const streakDays = 7; // Mock streak data
  const productivityScore = Math.round(((completedTodos / Math.max(todoCount, 1)) * 100));

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
        {/* Achievement Dashboard */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Your Journey
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{noteCount}</div>
                <div className="text-sm text-blue-600">📝 Notes Created</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedTodos}</div>
                <div className="text-sm text-green-600">✅ Tasks Done</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{streakDays}</div>
                <div className="text-sm text-purple-600">🔥 Day Streak</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{productivityScore}%</div>
                <div className="text-sm text-orange-600">📊 Completion Rate</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Achievements
              </h3>
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.name}
                    </div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'}`}
                        style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                      />
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <Star className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Usage & Costs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Usage & Costs
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                <div className="text-xl font-bold text-indigo-600">{apiStats?.openai?.requests || 0}</div>
                <div className="text-xs text-indigo-600">OpenAI Requests</div>
                <div className="text-xs text-gray-500">${(apiStats?.openai?.cost || 0).toFixed(4)}</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg">
                <div className="text-xl font-bold text-cyan-600">{apiStats?.claude?.requests || 0}</div>
                <div className="text-xs text-cyan-600">Claude Requests</div>
                <div className="text-xs text-gray-500">${(apiStats?.claude?.cost || 0).toFixed(4)}</div>
              </div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${((apiStats?.openai?.cost || 0) + (apiStats?.claude?.cost || 0)).toFixed(4)}</div>
              <div className="text-sm text-green-600">💰 Total Cost This Month</div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• OpenAI tokens used: {apiStats?.openai?.tokens || 0}</div>
              <div>• Claude tokens used: {apiStats?.claude?.tokens || 0}</div>
              <div>• Average cost per request: ${(((apiStats?.openai?.cost || 0) + (apiStats?.claude?.cost || 0)) / Math.max((apiStats?.openai?.requests || 0) + (apiStats?.claude?.requests || 0), 1)).toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">AI Settings</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">AI Model</div>
                  <div className="text-xs text-gray-500">Choose your preferred AI provider</div>
                </div>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAiModel('openai')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${aiModel === 'openai' ? 'bg-white shadow-sm text-green-600' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  🤖 OpenAI
                </button>
                <button
                  onClick={() => setAiModel('claude')}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${aiModel === 'claude' ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                  🧠 Claude
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Show Emojis</div>
                  <div className="text-xs text-gray-500">Add emojis to note titles</div>
                </div>
              </div>
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showEmojis ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showEmojis ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
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