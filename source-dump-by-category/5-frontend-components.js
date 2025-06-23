// ==========================================
// MIRA AI - FRONTEND COMPONENTS
// ==========================================

// PROFILE PAGE WITH BIO SYSTEM (client/src/pages/profile.tsx)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, CheckCircle, Info, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [showQuickProfile, setShowQuickProfile] = useState(false);
  const [showBioPreview, setShowBioPreview] = useState(false);
  const [profileText, setProfileText] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user profile data
  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile", "demo"],
  });

  // Quick profile mutation
  const quickProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      return await apiRequest("/api/profile/quick", "POST", {
        profileData,
        userId: "demo"
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Created",
        description: "Your AI assistant profile has been generated!",
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

  const handleQuickProfile = async () => {
    if (!profileText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some information about yourself",
        variant: "destructive"
      });
      return;
    }
    quickProfileMutation.mutate(profileText);
  };

  return (
    <div className="min-h-screen bg-[#f1efe8] pb-20">
      <div className="p-4 space-y-6">
        {/* Personal Profile Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">Personal Profile</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-sm text-gray-600">
              Help Mira learn about you to provide more personalized assistance.
            </div>
            <div className="space-y-3">
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
                      Update Bio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowQuickProfile(true)}
                    className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 text-sm font-medium"
                  >
                    Quick Profile (30 seconds)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Profile Modal */}
      {showQuickProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Quick Profile</h2>
                <button 
                  onClick={() => setShowQuickProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tell me about yourself in your own words. This helps me provide more personalized assistance.
                </p>
                
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  placeholder="Tell me about yourself... your role, interests, goals, work style..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                />
                
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowQuickProfile(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleQuickProfile}
                    disabled={quickProfileMutation.isPending || !profileText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickProfileMutation.isPending ? 'Creating...' : 'Add Profile'}
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

// ==========================================
// NOTE CARD COMPONENT (client/src/components/note-card.tsx)
// ==========================================

import React from 'react';
import { ArrowRight } from 'lucide-react';

function formatContent(content) {
  if (!content) return { hasStructure: false, title: '', description: '', bullets: [] };
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { hasStructure: false, title: '', description: '', bullets: [] };
  
  const title = lines[0].substring(0, 60);
  
  // Check for bullet-point structure
  const bulletLines = lines.slice(1).filter(line => 
    line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/)
  );
  
  if (bulletLines.length >= 2) {
    return {
      hasStructure: true,
      title,
      description: '',
      bullets: bulletLines.map(line => 
        line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').substring(0, 50)
      ).slice(0, 4)
    };
  }
  
  // For longer content, split into title and description
  if (lines.length > 1) {
    const description = lines.slice(1).join(' ').substring(0, 120);
    return {
      hasStructure: false,
      title,
      description: description.length >= 120 ? description.trim() : description,
      bullets: []
    };
  }
  
  return {
    hasStructure: false,
    title,
    description: '',
    bullets: []
  };
}

export default function NoteCard({ note, onClick }) {
  const formattedContent = formatContent(note.content);
  
  // Parse rich context for V2 features
  let nextStepsForCard = [];
  try {
    if (note.richContext) {
      const richData = JSON.parse(note.richContext);
      nextStepsForCard = (richData.nextSteps || []).slice(0, 2);
    }
  } catch (e) {
    // Fallback to empty array
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {new Date(note.createdAt).toLocaleString()}
          </span>
          <div className={`w-2 h-2 rounded-full ${
            note.mode === 'text' ? 'bg-blue-400' :
            note.mode === 'voice' ? 'bg-green-400' :
            note.mode === 'image' ? 'bg-purple-400' : 'bg-gray-400'
          }`} />
        </div>
      </div>

      {/* Content Display - iOS Notes Style */}
      <div className="mb-3">
        <div className="text-base leading-relaxed text-gray-900 line-clamp-3">
          {formattedContent.hasStructure ? (
            <>
              <div className="font-medium mb-1">{formattedContent.title}</div>
              <ul className="space-y-0.5 text-sm leading-tight text-gray-600">
                {formattedContent.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 mt-0.5 flex-shrink-0">•</span>
                    <span className="line-clamp-1">{bullet}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="line-clamp-3">{note.content}</div>
          )}
        </div>
      </div>

      {/* V2 Intelligence Content - Next Steps Only */}
      {nextStepsForCard.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-2">
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Suggested</span>
          </div>
          <div className="space-y-1">
            {nextStepsForCard.map((step, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs p-2 bg-blue-50 rounded-md">
                <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {note.isProcessing && (
        <div className="flex items-center space-x-2 text-xs text-blue-600 mb-2">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span>Processing with AI...</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// INPUT BAR COMPONENT (client/src/components/input-bar.tsx)
// ==========================================

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Mic, Camera } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function InputBar() {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      return await apiRequest('/api/notes', 'POST', noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createNoteMutation.mutate({
      content: content.trim(),
      mode: 'text'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a note, voice memo, or image..."
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-lg ${
              isRecording 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
            <Camera className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createNoteMutation.isPending}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}