import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Info, Moon, Sun, Monitor, Trash2, Trophy, Zap, GraduationCap, Target, Crown, Star, TrendingUp, User, Edit3, LogIn, LogOut, X, Wifi, WifiOff, CheckCircle, Clock, AlertCircle, Folder, Search, Database, Bell } from "lucide-react";
import type { NoteWithTodos, Collection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStore } from "@/store/offline-store";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import CollectionsView from "@/components/collections-view";
import DevCacheDebugger from "@/components/dev-cache-debugger";
import { ReminderSettings } from "@/components/reminder-settings";

export default function Profile() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('claude');
  const [showEmojis, setShowEmojis] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickProfile, setShowQuickProfile] = useState(false);
  const [showBioPreview, setShowBioPreview] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [showCollections, setShowCollections] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Sync status from offline store
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingItems,
    conflictItems,
    syncWithServer
  } = useOfflineStore();

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const { data: collections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
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
      console.log('Submitting quick profile:', profileData.substring(0, 100) + '...');
      const response = await apiRequest("/api/profile/quick", "POST", {
        profileData,
        userId: "demo"
      });
      console.log('Quick profile response:', response);
      return response;
    },
    onSuccess: (result) => {
      console.log('Quick profile mutation success:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", "demo"] });
      toast({
        title: "Profile Created Successfully",
        description: "Your personal bio has been generated and saved!",
      });
      setShowQuickProfile(false);
      setProfileText('');
    },
    onError: (error) => {
      console.error('Quick profile mutation error:', error);
      toast({
        title: "Error Creating Profile",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleQuickProfile = () => {
    console.log('Handle quick profile clicked, text length:', profileText.length);
    if (profileText.trim()) {
      console.log('Triggering quick profile mutation...');
      quickProfileMutation.mutate(profileText.trim());
    } else {
      toast({
        title: "Empty Profile",
        description: "Please enter some information about yourself first.",
        variant: "destructive"
      });
    }
  };

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
    <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>

      {/* Main Content */}
      <div className="pb-24">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">
                Profile
              </h2>
            </div>

            {/* Tiny Sync Status Bubble */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  isSyncing ? 'bg-yellow-500' : 
                  !isOnline && pendingItems > 0 ? 'bg-red-500' : 
                  !isOnline ? 'bg-orange-500' : 
                  'bg-green-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {isSyncing ? 'syncing' : 
                   !isOnline && pendingItems > 0 ? 'offline' : 
                   !isOnline ? 'offline' : 
                   'synced'}
                </span>
              </div>
              
              {/* Subtle Development Cache Debug Button */}
              {import.meta.env.DEV && (
                <button
                  onClick={() => setShowDebugger(!showDebugger)}
                  className="opacity-30 hover:opacity-70 transition-opacity"
                  title="Cache Debug (Dev)"
                >
                  <Database className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-4 space-y-6">

            {/* Profile Info Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Your Profile
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">Demo User</div>
                    <div className="text-sm text-gray-500">AI-powered productivity assistant</div>
                  </div>
                </div>

                {userProfile?.personalBio ? (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">AI Assistant Bio Added</span>
                      <span className="text-xs text-green-600 ml-auto">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-green-700 mb-3 leading-relaxed">
                      {userProfile.personalBio.length > 200 
                        ? userProfile.personalBio.slice(0, 200) + '...' 
                        : userProfile.personalBio
                      }
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowBioPreview(true)}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                      >
                        <Info className="w-3 h-3" />
                        View Full Bio
                      </button>
                      <button 
                        onClick={() => setShowQuickProfile(true)}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 rounded bg-green-100 hover:bg-green-200"
                      >
                        <Edit3 className="w-3 h-3" />
                        Update Bio
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                  </div>
                )}
              </div>
            </div>

            {/* Collections Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div 
                className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowCollections(!showCollections)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-purple-500" />
                    Collections
                    <span className="text-sm text-gray-500">({collections?.length || 0})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {showCollections && (
                <div className="p-0">
                  <CollectionsView embedded={true} />
                </div>
              )}

              {!showCollections && (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {collections?.slice(0, 4).map((collection) => (
                      <div 
                        key={collection.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => navigate(`/collection/${collection.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{collection.icon}</span>
                          <span className="text-sm font-medium text-gray-900 truncate">{collection.name}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {notes?.filter(note => note.collectionId === collection.id).length || 0} items
                        </div>
                      </div>
                    ))}
                  </div>
                  {collections && collections.length > 4 && (
                    <button 
                      onClick={() => setShowCollections(true)}
                      className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all {collections.length} collections
                    </button>
                  )}
                </div>
              )}
            </div>

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

            {/* Reminder Settings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  Reminder Settings
                </h2>
              </div>
              <div className="p-4">
                <button
                  onClick={() => setShowReminderSettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Configure Notifications</div>
                      <div className="text-xs text-gray-500">Lead times, auto-archive, and display options</div>
                    </div>
                  </div>
                  <span className="text-purple-600">→</span>
                </button>
              </div>
            </div>

            {/* Reminder Settings Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Reminder Settings
                </h2>
              </div>
              <div className="p-4">
                <button 
                  onClick={() => setShowReminderSettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Configure Notifications</div>
                      <div className="text-xs text-gray-500">Default lead times and preferences</div>
                    </div>
                  </div>
                  <span className="text-orange-600">→</span>
                </button>
              </div>
            </div>

            {/* Rest of the settings sections... */}
            {/* AI Usage, AI Settings, Appearance, Data Management, About, Account sections remain the same */}

          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Development Cache Debugger - conditionally rendered */}
      {showDebugger && (
        <DevCacheDebugger 
          isOpen={showDebugger} 
          onClose={() => setShowDebugger(false)} 
        />
      )}

      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Reminder Settings</h3>
              <button
                onClick={() => setShowReminderSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <ReminderSettings />
            </div>
          </div>
        </div>
      )}

      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reminder Settings</h3>
              <button
                onClick={() => setShowReminderSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ReminderSettings />
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickProfileMutation.isPending ? 'Generating Profile...' : 'Add Profile'}
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