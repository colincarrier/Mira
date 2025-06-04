import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Info, Moon, Sun, Monitor, Trash2, Trophy, Zap, Brain, Target, Crown, Star, TrendingUp, User, Edit3, LogIn, LogOut, X } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('claude');
  const [showEmojis, setShowEmojis] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickProfile, setShowQuickProfile] = useState(false);
  const [showBioPreview, setShowBioPreview] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: userProfile } = useQuery<{
    personalBio?: string;
    preferences?: any;
    onboardingCompleted?: boolean;
  }>({
    queryKey: ["/api/profile", "demo"],
  });

  const onboardingMutation = useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      return await apiRequest("/api/profile/onboarding", "POST", {
        onboardingData: answers,
        userId: "demo"
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Created",
        description: "Your AI assistant profile has been generated and saved!",
      });
      setShowOnboarding(false);
      setOnboardingAnswers({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create profile from onboarding",
        variant: "destructive"
      });
    }
  });

  const quickProfileMutation = useMutation({
    mutationFn: async (profileData: string) => {
      return await apiRequest("/api/profile/quick", "POST", {
        profileData,
        userId: "demo"
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Created",
        description: "Your personal bio has been generated and saved!",
      });
      setShowQuickProfile(false);
      setProfileText('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive"
      });
    }
  });

  const onboardingQuestions = [
    { id: 'name', question: 'What should I call you?', placeholder: 'Your preferred name...' },
    { id: 'role', question: 'What do you do for work or study?', placeholder: 'Your profession, role, or field of study...' },
    { id: 'goals', question: 'What are your main goals or priorities right now?', placeholder: 'Personal goals, work projects, life aspirations...' },
    { id: 'challenges', question: 'What challenges are you currently facing?', placeholder: 'Work challenges, personal obstacles, areas for improvement...' },
    { id: 'interests', question: 'What are your main interests and hobbies?', placeholder: 'Activities you enjoy, topics you are passionate about...' },
    { id: 'communication', question: 'How do you prefer to communicate and receive information?', placeholder: 'Direct, detailed, casual, formal, with examples, bullet points...' },
    { id: 'schedule', question: 'What does your typical day or week look like?', placeholder: 'Daily routine, work schedule, peak productivity times...' },
    { id: 'values', question: 'What values or principles are important to you?', placeholder: 'Core beliefs, what matters most in decisions...' },
    { id: 'learning', question: 'How do you prefer to learn new things?', placeholder: 'Visual, hands-on, reading, videos, practice, examples...' },
    { id: 'support', question: 'What kind of support or assistance would be most helpful?', placeholder: 'Organization, reminders, research, planning, brainstorming...' }
  ];

  const handleSubmitOnboarding = () => {
    const answeredQuestions = Object.keys(onboardingAnswers).length;
    if (answeredQuestions < 3) {
      toast({
        title: "Please answer more questions",
        description: "Answer at least 3 questions to create your profile.",
        variant: "destructive"
      });
      return;
    }
    onboardingMutation.mutate(onboardingAnswers);
  };

  const handleQuickProfile = () => {
    if (profileText.trim()) {
      quickProfileMutation.mutate(profileText);
    }
  };

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
        {/* Stats & Achievements */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Your Journey
            </h2>
          </div>
          <div className="p-3 space-y-3">
            {/* Stats Grid - 2 Rows by 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{noteCount}</div>
                <div className="text-xs text-blue-600">Notes</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">{todoCount}</div>
                <div className="text-xs text-purple-600">To-do's</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{productivityScore}%</div>
                <div className="text-xs text-green-600">Done</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="text-lg font-bold text-orange-600">{streakDays}</div>
                <div className="text-xs text-orange-600">Streak days</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Achievements</span>
                <span className="text-xs text-gray-500">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
              </div>
              <div className="space-y-1">
                {achievements.slice(0, 3).map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`flex items-center gap-2 p-1 rounded ${
                      achievement.unlocked 
                        ? 'bg-yellow-50 border border-yellow-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className={`text-sm ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Profile */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Personal Profile
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-sm text-gray-600">
              Help Mira learn about you to provide more personalized assistance.
            </div>
            <div className="space-y-3">
              {userProfile?.personalBio ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Your AI Assistant Profile</span>
                  </div>
                  <div className="text-xs text-green-700 mb-2">
                    {userProfile.personalBio.slice(0, 150)}...
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowBioPreview(true)}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" />
                      Read Full Bio
                    </button>
                    <button 
                      onClick={() => setShowQuickProfile(true)}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowOnboarding(true)}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">?</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-blue-900">Complete Onboarding</div>
                        <div className="text-xs text-blue-600">Answer questions to personalize Mira</div>
                      </div>
                    </div>
                    <div className="text-blue-600 text-sm">Start</div>
                  </button>
                  <button 
                    onClick={() => setShowQuickProfile(true)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600">📋</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">Quick Profile</div>
                        <div className="text-xs text-gray-500">Paste info about yourself</div>
                      </div>
                    </div>
                    <div className="text-gray-600 text-sm">Add</div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* API Usage (Compact) */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              AI Usage
            </h2>
          </div>
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-indigo-50 rounded">
                <div className="text-sm font-bold text-indigo-600">{apiStats?.openai?.requests || 0}</div>
                <div className="text-xs text-indigo-600">OpenAI</div>
              </div>
              <div className="p-2 bg-cyan-50 rounded">
                <div className="text-sm font-bold text-cyan-600">{apiStats?.claude?.requests || 0}</div>
                <div className="text-xs text-cyan-600">Claude</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-sm font-bold text-green-600">${((apiStats?.openai?.cost || 0) + (apiStats?.claude?.cost || 0)).toFixed(3)}</div>
                <div className="text-xs text-green-600">Cost</div>
              </div>
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

        {/* Account Section - Compact at Bottom */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Demo User</div>
                  <div className="text-xs text-gray-500">Not logged in</div>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/api/login'}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                <LogIn size={12} />
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Help Mira Learn About You</h2>
                <button 
                  onClick={() => setShowOnboarding(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  Answer these questions to help Mira provide more personalized assistance. You can skip questions and come back later.
                </p>
                
                {onboardingQuestions.map((q, index) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {index + 1}. {q.question}
                    </label>
                    <textarea
                      value={onboardingAnswers[q.id] || ''}
                      onChange={(e) => setOnboardingAnswers(prev => ({
                        ...prev,
                        [q.id]: e.target.value
                      }))}
                      placeholder={q.placeholder}
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                ))}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {Object.keys(onboardingAnswers).length} of {onboardingQuestions.length} answered
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowOnboarding(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSubmitOnboarding}
                      disabled={onboardingMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {onboardingMutation.isPending ? 'Creating Profile...' : 'Create AI Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Profile Modal */}
      {showQuickProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Quick Profile</h2>
                <button 
                  onClick={() => {
                    setShowQuickProfile(false);
                    setProfileText('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Paste information about yourself - bio, resume, personality test results, or anything that helps Mira understand you better.
                </p>
                
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  placeholder="Tell me about yourself... your role, interests, goals, work style, or anything else that would help an AI assistant understand you better."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                />
                
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => {
                      setShowQuickProfile(false);
                      setProfileText('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleQuickProfile}
                    disabled={!profileText.trim() || quickProfileMutation.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {quickProfileMutation.isPending ? 'Generating...' : 'Generate AI Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bio Preview Modal */}
      {showBioPreview && userProfile?.personalBio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your AI Assistant Profile</h2>
                <button 
                  onClick={() => setShowBioPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-gray-700">
                  {userProfile.personalBio}
                </div>
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button 
                  onClick={() => setShowBioPreview(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}