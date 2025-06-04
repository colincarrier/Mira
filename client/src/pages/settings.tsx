import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Info, Moon, Sun, Monitor, Trash2, Trophy, Zap, Brain, Target, Crown, Star, TrendingUp, User, Edit3, LogIn, LogOut } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [aiModel, setAiModel] = useState<'openai' | 'claude'>('claude');
  const [showEmojis, setShowEmojis] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickProfile, setShowQuickProfile] = useState(false);
  const [profileText, setProfileText] = useState('');
  
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
    mutationFn: async () => {
      const onboardingNote = await apiRequest("/api/notes", "POST", {
        content: `# Getting to Know You - Mira Onboarding

Welcome to Mira! I'm here to be your intelligent memory and productivity partner. To provide you with the most personalized and helpful experience, I'd love to learn about you. Please take a few minutes to answer these questions - the more you share, the better I can assist you.

## Basic Questions

**1. What should I call you?**
_Your preferred name..._

**2. What do you do for work or study?**
_Your profession, role, or field of study..._

**3. What are your main goals or priorities right now?**
_Personal goals, work projects, life aspirations..._

**4. What challenges are you currently facing?**
_Work challenges, personal obstacles, areas for improvement..._

**5. What are your main interests and hobbies?**
_Activities you enjoy, topics you are passionate about..._

**6. How do you prefer to communicate and receive information?**
_Direct, detailed, casual, formal, with examples, bullet points..._

**7. What does your typical day or week look like?**
_Daily routine, work schedule, peak productivity times..._

**8. What values or principles are important to you?**
_Core beliefs, what matters most in decisions..._

**9. How do you prefer to learn new things?**
_Visual, hands-on, reading, videos, practice, examples..._

**10. What kind of support or assistance would be most helpful?**
_Organization, reminders, research, planning, brainstorming..._

## Advanced Questions (Optional)

**11. How do you typically make important decisions?**
_Analytical, intuitive, collaborative, quick, deliberate..._

**12. How do you handle stress and pressure?**
_Coping mechanisms, what helps you stay calm..._

**13. How do you work best with others?**
_Team dynamics, leadership style, collaboration preferences..._

**14. What is your relationship with technology and tools?**
_Comfort level, preferred apps, automation preferences..._

**15. How do you approach creative or problem-solving tasks?**
_Creative process, inspiration sources, ideation methods..._

**16. How do you prefer to receive feedback and suggestions?**
_Direct, gentle, detailed, with examples, timing preferences..._

**17. What motivates and energizes you most?**
_Achievements, helping others, learning, recognition..._

**18. What kind of environment do you work best in?**
_Quiet, collaborative, structured, flexible, home, office..._

**19. Where do you see yourself in the next 1-3 years?**
_Career goals, personal development, life changes..._

**20. What makes you unique or what should I know that others might not?**
_Special skills, unusual experiences, personal quirks..._

---

## Additional Information

Feel free to paste any additional information about yourself here - personality test results, resume excerpts, contact lists, or anything else that would help me understand you better:

_Your additional information..._

---

Once you've completed this, I'll create a personalized profile to help me assist you more effectively!`,
        mode: "onboarding"
      });
      return onboardingNote;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Onboarding Started",
        description: "Your personalized questionnaire has been created. Complete it to help Mira learn about you!",
      });
      setShowOnboarding(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create onboarding questionnaire",
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

  const handleCreateOnboarding = () => {
    onboardingMutation.mutate();
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
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
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
                <div className="text-xs text-orange-600">Streak</div>
              </div>
            </div>

            {/* Achievements Full Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Achievements</span>
                <span className="text-xs text-gray-500">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
              </div>
              <div className="space-y-2">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      achievement.unlocked 
                        ? 'bg-yellow-50 border border-yellow-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className={`text-xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{achievement.description}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {achievement.progress}/{achievement.target}
                        </span>
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
                    <span className="text-sm font-medium text-green-900">Your Profile</span>
                  </div>
                  <div className="text-xs text-green-700 line-clamp-3">
                    {userProfile.personalBio}
                  </div>
                  <button 
                    onClick={() => setShowQuickProfile(true)}
                    className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Update Profile
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleCreateOnboarding}
                    disabled={onboardingMutation.isPending}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
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
                    <div className="text-blue-600 text-sm">
                      {onboardingMutation.isPending ? 'Creating...' : 'Start'}
                    </div>
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
    </div>
  );
}