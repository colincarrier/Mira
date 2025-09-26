import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Shell, Fish, Anchor, Ship, Eye, GraduationCap, Sparkles, Zap, Gem, Circle, MoreHorizontal, Star, Archive, Trash2, Camera, Mic, Paperclip, Image, File, Copy, ArrowUpRight, Plus, Bell, Calendar, ExternalLink, Info, ArrowRight, Undo2, AlertTriangle, CheckCircle, X, Play, Pause } from "lucide-react";
import InputBar from "@/components/input-bar";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos, Todo } from "@shared/schema";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { saveNote, SavePayload } from "@/utils/saveNote";
import { CriticalInfoDialog } from "@/components/CriticalInfoDialog";
import { useCriticalInfo } from "@/hooks/useCriticalInfo";
import { useEnhancementSocket } from "@/hooks/useEnhancementSocket";
import { featureFlags } from "@shared/featureFlags";
import { NoteEditor } from "@/components/NoteEditor";
import { useNoteStream } from "@/hooks/useNoteStream";
import { useFlushQueue } from "@/hooks/useFlushQueue";
import { JSONContent } from "@shared/types";
import { Step } from "prosemirror-transform";
import { extractTasksFromTipTap } from "@/utils/extract-tasks-tiptap";
import { extractTitle } from "@/utils/titleExtraction";
import { parseAIContent } from "@/utils/markdownHelpers";
import { useBeforeUnload } from 'react-use';
import { debounce } from 'lodash-es';

// Voice Note Detail Player Component
interface VoiceNoteDetailPlayerProps {
  note: NoteWithTodos;
}

function VoiceNoteDetailPlayer({ note }: VoiceNoteDetailPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (!audioRef.current || !note.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Generate waveform based on content
  const generateWaveform = () => {
    const text = note.transcription || note.content;
    const chars = text.split('');
    return Array.from({ length: 64 }, (_, i) => {
      const charCode = chars[i % chars.length]?.charCodeAt(0) || 65;
      const amplitude = (charCode % 100) / 100 * 0.6 + 0.4;
      return amplitude;
    });
  };

  const waveformData = generateWaveform();
  const formatTime = (time: number) => {
    if (!time || !isFinite(time) || isNaN(time)) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6 bg-white">
      {note.audioUrl && (
        <audio
          ref={audioRef}
          src={note.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
      <div className="flex items-center space-x-4">
        <button 
          onClick={togglePlayback}
          disabled={!note.audioUrl}
          className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>
        <div 
          className="flex-1 h-8 flex items-end justify-start space-x-0.5 cursor-pointer overflow-hidden"
          onClick={handleSeek}
          style={{ maxWidth: 'calc(100vw - 200px)' }}
        >
          {waveformData.map((amplitude, i) => {
            const progress = (duration > 0 && isFinite(duration) && !isNaN(duration) && isFinite(currentTime) && !isNaN(currentTime)) ? currentTime / duration : 0;
            const isActive = i / waveformData.length <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-t from-blue-700 to-blue-500' 
                    : 'bg-gradient-to-t from-blue-600 to-blue-400 opacity-70 hover:opacity-90'
                }`}
                style={{
                  height: `${Math.max(4, amplitude * 28)}px`
                }}
              />
            );
          })}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-mono text-blue-600 font-medium">
            {duration > 0 && isFinite(duration) && !isNaN(duration) ? formatTime(duration) : '0:00'}
          </div>
          <div className="text-xs text-blue-500">
            {currentTime > 0 && duration > 0 && isFinite(currentTime) && !isNaN(currentTime) ? formatTime(currentTime) : 'Voice Note'}
          </div>
        </div>
      </div>
      
      {/* Fixed input bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <InputBar />
      </div>
    </div>
  );
}
import { createCalendarEventFromContent, addToGoogleCalendar } from "@/lib/calendarUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import MediaDisplay from "@/components/media-display";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ReminderDialog } from "@/components/reminder-dialog";
import { parseMiraResponse, extractTasks, normalizeNote, queryKeys } from "@/utils";

// --- Pure helpers (no React hooks) ---
function computeIsProcessing(note: any): boolean {
  if (!note) return false;
  const raw =
    (note as any).isProcessing ??
    (note as any).is_processing ??
    (note as any).processing ??
    null;
  if (typeof raw === 'string') {
    const s = raw.toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return !!raw;
}

// Returns a ProseMirror-like JSON doc; never throws, never returns null
function computeDocFromNote(note: any) {
  const fallback = { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  if (!note) return fallback;

  const candidate = (note as any)?.docJson ?? (note as any)?.doc_json ?? null;
  if (!candidate) {
    const text = note?.content ?? '';
    return text
      ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
      : fallback;
  }
  try {
    const parsed = typeof candidate === 'string' ? JSON.parse(candidate) : candidate;
    return parsed?.type === 'doc' ? parsed : fallback;
  } catch {
    const text = note?.content ?? '';
    return text
      ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
      : fallback;
  }
}

export default function NoteDetail() {
  // ====== 1. ALL ROUTER HOOKS (always first) ======
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  // ====== 2. ALL STATE HOOKS (always called) ======
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [clarificationInput, setClarificationInput] = useState('');
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle'|'dirty'|'saving'|'saved'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAI, setPendingAI] = useState<any[] | null>(null);

  // ====== 3. ALL REF HOOKS ======
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // ====== 4. QUERY CLIENT (before queries/mutations) ======
  const queryClient = useQueryClient();
  
  // ====== 5. CUSTOM HOOKS (always called) ======
  useFlushQueue();

  const { data: note, isLoading, error } = useQuery<NoteWithTodos>({
    queryKey: queryKeys.notes.detail(Number(id)),
    enabled: !!id,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false, // Temporarily disabled to prevent polling during render issues
    refetchOnWindowFocus: false, // Prevent refetch on tab focus which can trigger loops
  });
  
  // Version history query
  const { data: versionHistory } = useQuery<Array<{
    id: string;
    version: number;
    changeType: string;
    changeDescription: string;
    createdAt: string;
    content: string;
  }>>({
    queryKey: queryKeys.notes.versions(Number(id)),
    enabled: !!id && showVersionHistory,
  });

  // Reset state when navigating to a different note
  useEffect(() => {
    if (id) {
      // Reset editing state when changing notes
      setIsEditing(false);
      setEditedContent('');
      setEditedTitle('');
      setContextInput('');
      setShowContextDialog(false);
      setShowVersionHistory(false);
      setShowApprovalDialog(false);
      setPendingChanges(null);
      setClarificationInput('');
      setShowReminderDialog(false);
      setIsProcessing(false);
      setSaveStatus('idle');
      setIsSaving(false);
    }
  }, [id]);

  const saveMutation = useMutation({
    mutationFn: (payload: SavePayload) => saveNote(payload),
    onSuccess: (updated) => {
      // Use consistent cache keys from queryKeys
      if (note?.id) {
        queryClient.setQueryData(queryKeys.notes.detail(note.id), updated);  // detail
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });       // list
      setSaveStatus('saved');
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 1500);
    },
    onError: (error) => {
      console.error('[saveMutation]', error);
      setSaveStatus('dirty');
      setIsSaving(false);

      // ---------- user-visible toast ----------
      const toast = document.createElement('div');
      toast.className =
        'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Save failed – please retry.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3_000);
      // ----------------------------------------
    }
  });

  // ====== 8. MEMO HOOKS (must be before conditional returns) ======
  const debouncedSave = useMemo(
    () =>
      debounce((txt: string) => {
        if (!note || !txt.trim()) return;
        setSaveStatus('saving');
        saveMutation.mutate({ id: note.id, content: txt, source: 'textarea' });
      }, 2000),
    [note?.id],
  );
  
  const mira = React.useMemo(() => {
    if (!note?.miraResponse) return null;
    try {
      return parseMiraResponse(note.miraResponse);
    } catch (e) {
      console.error('Failed to parse miraResponse:', e);
      return null;
    }
  }, [note?.miraResponse]);

  // -------- INSTANT SAVE ON BLUR --------
  const handleBlur = () => {
    if (note?.id && editedContent !== note.content && !isSaving) {
      saveMutation.mutate({ id: note.id, content: editedContent, source: 'textarea' });
    }
  };

  // ====== 9. CALLBACK HOOKS ======
  const commitFromEditor = useCallback(
    async (doc: JSONContent, steps: Step[]) => {
      // Guard against empty payload to prevent HTML caching
      if (!doc && steps?.length === 0) return;
      if (!note?.id) return;
      
      try {
        await saveMutation.mutateAsync({
          id: note.id,
          docJson: doc,
          source: 'editor'
        });
      } catch (e) {
        console.error('[editor commit]', e);
      }

      // 2) Extract & persist tasks
      try {
        const tasks = extractTasksFromTipTap(doc);
        if (tasks.length) {
          await fetch(`/api/notes/${id}/tasks`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks }),
          });
        }
      } catch (err) { 
        console.error('[tasks]', err);
      }
    },
    [id, note?.id, saveMutation]
  );

  // ====== 10. MORE CUSTOM HOOKS (all must be before conditional returns) ======
  // Parse rich context for critical info hook
  let richContextData = null;
  try {
    if (note?.richContext && typeof note.richContext === 'string' && note.richContext.trim() !== '') {
      richContextData = JSON.parse(note.richContext);
    }
  } catch (e) {
    console.error("Failed to parse richContext:", e);
    richContextData = null;
  }
  
  const { criticalQuestion, isVisible, dismissDialog, handleAnswer } = useCriticalInfo(richContextData || null);
  useEnhancementSocket(note?.id ?? undefined);
  
  // Stable callback for SSE updates to prevent reconnection loops
  const handleSSEPatch = useCallback((stepJsons: any[]) => {
    setPendingAI(stepJsons);
  }, []);
  
  useNoteStream(id || '', handleSSEPatch);


  // Mutations
  // Note: updateNoteMutation removed - using saveMutation for all saves

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {

      navigate("/");
    },
    onError: () => {

    }
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      if (!todo || !todo.id) {
        throw new Error('Invalid todo for toggle');
      }
      await apiRequest("PATCH", `/api/todos/${todo.id}`, {
        completed: !todo.completed
      });
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });
      }
    },
    onError: (error) => {
      console.error('Toggle todo error:', error);
    }
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (targetVersion: number) => {
      const response = await apiRequest("POST", `/api/notes/${id}/rollback`, { targetVersion });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });
      setShowVersionHistory(false);
    },
    onError: () => {
      console.error("Rollback failed");
    }
  });

  // Approve changes mutation
  const approveChangesMutation = useMutation({
    mutationFn: async ({ suggestedChanges, userApproved }: { suggestedChanges: string; userApproved: boolean }) => {
      const response = await apiRequest("POST", `/api/notes/${id}/approve-changes`, { suggestedChanges, userApproved });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });
      setShowApprovalDialog(false);
      setPendingChanges(null);

    },
    onError: () => {

    }
  });

  // Clarification mutation  
  const clarifyMutation = useMutation({
    mutationFn: async ({ originalInstruction, clarification }: { originalInstruction: string; clarification: string }) => {
      const response = await apiRequest("POST", `/api/notes/${id}/clarify`, { originalInstruction, clarification });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });
      setClarificationInput('');

    },
    onError: () => {

    }
  });



  useEffect(() => {
    if (note && note.id === Number(id)) {
      // Only update if it's the current note
      setEditedContent(note.content || '');
      setEditedTitle(note.content?.split('\n')[0] || 'Untitled Note');
    }
  }, [note, id]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editedContent]);

  useBeforeUnload(
    saveStatus === 'dirty' && note ? 
      () => {
        saveMutation.mutateAsync({ id: note.id, content: editedContent, source: 'textarea' });
        return true;
      } : 
      false
  );
  
  // ========== CONDITIONAL RETURNS (only AFTER all hooks) ==========

  const handleQuestionClick = (question: string) => {
    // Question click handler - functionality to be implemented
    console.log('Question clicked:', question);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mira Note',
          text: formatNoteForSharing(note!),
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(formatNoteForSharing(note!));

    }
  };

  const handleDeleteNote = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate();
    }
  };

  const handleSendMessage = async (text: string) => {
    console.log("Processing message:", text);
    setIsProcessing(true);
    
    // Show processing toast
    const processingToast = document.createElement('div');
    processingToast.className = 'fixed bottom-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] flex items-center gap-2';
    processingToast.innerHTML = '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Processing your request...';
    document.body.appendChild(processingToast);

    try {
      // Automatic clarification vs evolution detection
      const clarification = /^actually[,:\s]|^sorry[,:\s]|^i meant|^correction[,:\s]|^no[,:\s]/i.test(text);
      const endpoint = clarification ? 'clarify' : 'evolve';
      
      console.log(`Using ${endpoint} endpoint for:`, text);

      const response = await fetch(`/api/notes/${id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          endpoint === 'clarify' ? {
            originalInstruction: note?.content || '',
            clarification: text.trim()
          } : {
            instruction: text.trim(),
            existingContent: note?.content || "",
            existingContext: note?.aiContext || "",
            existingTodos: note?.todos || [],
            existingRichContext: note?.richContext
          }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error(`${endpoint} endpoint error:`, errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`AI ${endpoint} result:`, result);

      // Refresh the note data
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      
      // Show success toast
      processingToast.remove();
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]';
      successToast.textContent = '✓ Note updated successfully';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 2000);

    } catch (error) {
      console.error("Failed to process message:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Show error toast
      processingToast.remove();
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed bottom-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999]';
      errorToast.textContent = `Error: ${errorMessage}`;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNoteForSharing = (note: NoteWithTodos) => {
    let shareText = `📝 ${note.content}\n\n`;

    if (note.aiContext) {
      shareText += `💡 Context:\n${note.aiContext}\n\n`;
    }

    if (note.aiSuggestion) {
      shareText += `🤔 Follow-up:\n${note.aiSuggestion}\n\n`;
    }

    if (note.todos && note.todos.length > 0) {
      shareText += `✅ Action Items:\n`;
      note.todos.forEach((todo) => {
        const status = todo.completed ? '✓' : '○';
        shareText += `${status} ${todo.title}\n`;
      });
      shareText += '\n';
    }

    if (note.collection) {
      shareText += `📁 Collection: ${note.collection.name}\n\n`;
    }

    shareText += `Shared from Mira`;

    return shareText;
  };

  // Enhanced content rendering with rich media
  const renderEnhancedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi;
      const videoRegex = /https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv)(\?[^\s]*)?/gi;
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;

      if (imageRegex.test(line)) {
        const imageUrls = line.match(imageRegex);
        imageUrls?.forEach((url, imgIndex) => {
          elements.push(
            <div key={`${index}-img-${imgIndex}`} className="my-3">
              <img 
                src={url} 
                alt="Inline image" 
                className="w-full rounded-lg border border-[hsl(var(--border))] max-h-80 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          );
        });
      } else if (videoRegex.test(line)) {
        const videoUrls = line.match(videoRegex);
        videoUrls?.forEach((url, vidIndex) => {
          elements.push(
            <div key={`${index}-vid-${vidIndex}`} className="my-3">
              <video 
                src={url} 
                controls 
                className="w-full rounded-lg border border-[hsl(var(--border))] max-h-80"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        });
      } else if (youtubeRegex.test(line)) {
        let match;
        let ytIndex = 0;
        youtubeRegex.lastIndex = 0;
        while ((match = youtubeRegex.exec(line)) !== null) {
          const videoId = match[1];
          elements.push(
            <div key={`${index}-yt-${ytIndex}`} className="my-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
          ytIndex++;
        }
      } else if (line.trim()) {
        elements.push(
          <p key={`${index}-text`} className="mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  // ========== CONDITIONAL RETURNS SECTION ==========
  // Handle error state
  if (error) {
    console.error('Note detail error:', error);
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-xl font-semibold mb-2">Error loading note</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            There was an error loading this note. Please try again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="flex items-center gap-3 p-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="px-4 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Validate id parameter
  if (!id || isNaN(Number(id))) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-xl font-semibold mb-2">Invalid Note ID</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            The note ID is invalid.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  if (!note && !isLoading && !error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-xl font-semibold mb-2">Note not found</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            This note may have been deleted or moved.
          </p>
          <button
            onClick={() => {
              // Check referrer to return to appropriate page
              const referrer = document.referrer;
              if (referrer && referrer.includes('/remind')) {
                navigate("/remind");
              } else if (referrer && referrer.includes('/collections')) {
                navigate("/?tab=collections");
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate("/");
              }
            }}
            className="px-4 py-2 bg-[hsl(var(--sage-green))] text-white rounded-md"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  // Final null check (after all other checks)
  if (!note) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-xl font-semibold mb-2">Note not found</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            This note may have been deleted or is still initializing.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to notes
          </button>
        </div>
      </div>
    );
  }

  // Compute derived values using pure helper functions (no hooks)
  const normalizedIsProcessing = computeIsProcessing(note);
  const parsedDoc = computeDocFromNote(note);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between py-3 border-b border-[hsl(var(--border))] bg-[#f5f5f5]">
          <div className="flex items-center gap-3 pl-4">
            <button
              onClick={() => {
                // Check if we came from a specific page
                const referrer = document.referrer;
                if (referrer && (referrer.includes('/remind') || referrer.includes('/collections'))) {
                  window.history.back();
                } else if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate("/");
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {/* Enhanced AI processing indicator */}
            <AIProcessingIndicator 
              isProcessing={!note?.aiEnhanced || normalizedIsProcessing}
              message="Updating"
              size="sm"
              onStop={() => {
                // Stop AI processing
                if (note) {
                  saveMutation.mutate({ id: note.id, content: note.content, source: 'ai' });
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 pr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-6 h-6 rounded-md bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" />
                  Star Note
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                  <Undo2 className="w-4 h-4 mr-2" />
                  Version History
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={handleDeleteNote}
                  disabled={deleteNoteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleShare}
              className="w-6 h-6 rounded-md bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
              title="Share note"
            >
              <ArrowUpRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            </button>
            <button
              onClick={() => setShowReminderDialog(true)}
              className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
              title="Set reminder"
            >
              <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>
        </div>

        {/* Document Body - Editable like iOS Notes */}
        <div className="flex-1 bg-white">
          <div className="px-4 py-3 space-y-2 pb-[80px]">
            {/* Media Display - Full functionality with sharing and download */}
            {note.mediaUrl && (
              <div className="mb-6">
                <MediaDisplay 
                  mediaUrl={note.mediaUrl} 
                  filename={note.mediaUrl.split('/').pop()} 
                  showControls={true}
                />
              </div>
            )}

            {/* Enhanced Voice Note Player */}
            {note.mode === "voice" && note.transcription && (
              <VoiceNoteDetailPlayer note={note} />
            )}

            {/* Unified Document Editor */}
            {featureFlags.NOTE_EDITOR_V4 ? (
              <NoteEditor
                note={{ 
                  id: note.id.toString(), 
                  doc_json: note.doc_json || {
                    type: 'doc',
                    content: [
                      {
                        type: 'heading',
                        attrs: { level: 1 },
                        content: [{ type: 'text', text: note.aiGeneratedTitle || note.content.split('\n')[0] || 'Untitled' }]
                      },
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: note.content }]
                      },
                      ...(mira?.content ? [{
                        type: 'paragraph',
                        attrs: { author: 'ai' },
                        content: [{ type: 'text', text: mira.content }]
                      }] : [])
                    ]
                  }
                }}
                onCommit={commitFromEditor}
                pendingAI={pendingAI}
              />
            ) : (
              <>
                {/* Legacy textarea implementation */}
                {note.aiGeneratedTitle && note.aiGeneratedTitle !== note.content && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">What you wrote:</h4>
                    <div className="text-gray-700 text-sm leading-relaxed">{note.content}</div>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  data-note-id={note.id}
                  value={editedContent}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setEditedContent(txt);
                    setSaveStatus('dirty');
                    debouncedSave(txt);
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  onBlur={async () => {
                    if (editedContent !== note?.content && note?.id && !isSaving) {
                      setIsSaving(true);
                      setSaveStatus('saving');
                      try {
                        await saveMutation.mutateAsync({ id: note.id, content: editedContent, source: 'textarea' });
                      } catch (error) {
                        console.error('[onBlur save]', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  className="w-full min-h-[120px] text-base leading-relaxed bg-transparent border-none outline-none resize-none font-normal text-gray-800 placeholder-gray-400 mb-4"
                  placeholder={note.aiGeneratedTitle ? "AI analysis and enhanced content..." : "Start writing..."}
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    overflow: 'hidden'
                  }}
                />

                {/* Save status indicator */}
                {saveStatus !== 'idle' && (
                  <div className="absolute right-3 top-2 text-xs text-gray-500">
                    {saveStatus === 'dirty'   && '• Unsaved'}
                    {saveStatus === 'saving'  && '• Saving…'}
                    {saveStatus === 'saved'   && '✓ Saved'}
                  </div>
                )}

                {/* AI Enhanced Content - ChatGPT Style with Rich Formatting */}
                {mira?.content && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="text-sm text-gray-500 mb-3 font-medium">AI Response:</div>
                    <MarkdownRenderer 
                      content={parseAIContent(mira.content)}
                      className="text-gray-800"
                    />
                  </div>
                )}
              </>
            )}

            {/* V3 Tasks with Priority Styling */}
            {Array.isArray(mira?.tasks) && mira.tasks.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-gray-500 mb-3 font-medium">AI-Extracted Tasks:</h4>
                <div className="space-y-2">
                  {mira.tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm text-gray-800">
                        {typeof t === "string"
                          ? t
                          : (t && typeof t === "object" && "title" in t
                               ? (t as any).title
                               : JSON.stringify(t))}
                      </span>
                      {t && typeof t === "object" && "priority" in t && (t as any).priority && (t as any).priority !== 'normal' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          (t as any).priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {(t as any).priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        

        {/* Research Results - V2 Intelligence Data */}
        {richContextData && (
          <div className="px-4 mb-4">
            {/* Research Results from suggestedLinks + entities */}
            {((richContextData.suggestedLinks && richContextData.suggestedLinks.length > 0) || 
              (richContextData.entities && richContextData.entities.length > 0)) && (
              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500 mb-3 font-medium">Research Results:</div>
                <div className="space-y-2">
                  {/* Display suggested links */}
                  {richContextData.suggestedLinks?.slice(0, 3).map((item: any, index: number) => (
                    <div 
                      key={`link-${index}`} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => item.url && window.open(item.url, '_blank')}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                  ))}
                  
                  {/* Display entities as research items */}
                  {richContextData.entities?.slice(0, 2).map((entity: any, index: number) => (
                    <div 
                      key={`entity-${index}`} 
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {entity.name?.name || entity.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {entity.type} - Relevance: {entity.name?.relevance ? (entity.name.relevance * 100).toFixed(0) + '%' : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Consolidated Todos with Optional Additions */}
        {note.todos && Array.isArray(note.todos) && note.todos.length > 0 && (
          <div className="bg-yellow-50 mx-4 mb-4 rounded-lg border border-yellow-200">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-base">Action Items</h4>
              <div className="space-y-3">
                {note.todos.map((todo: Todo) => (
                  <div key={todo.id} className="flex items-center gap-3">
                    <button
                      onClick={() => todo && todo.id && toggleTodoMutation.mutate(todo)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        todo.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}
                    >
                      {todo.completed && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </button>
                    <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {todo.title}
                    </span>
                    <button
                      onClick={() => {
                        const calendarEvent = createCalendarEventFromContent(todo.title, todo.title);
                        if (calendarEvent) {
                          addToGoogleCalendar(calendarEvent);

                        } else {
                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(todo.title)}&details=${encodeURIComponent(`From note: ${note.content}`)}`;
                          window.open(calendarUrl, '_blank');

                        }
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Optional Todo Suggestions */}
              {note.richContext && (() => {
                try {
                  const richData = JSON.parse(note.richContext);
                  const nextSteps = richData.nextSteps || [];

                  // Show next steps as optional todos if they exist and aren't already todos
                  const existingTodoTitles = (note.todos || []).map((t: Todo) => t.title.toLowerCase());
                  const optionalTodos = nextSteps.filter((step: string) => 
                    !existingTodoTitles.some((todoTitle: string) => 
                      todoTitle.includes(step.toLowerCase().slice(0, 15)) ||
                      step.toLowerCase().includes(todoTitle.slice(0, 15))
                    )
                  );

                  return optionalTodos.length > 0 ? (
                    <div className="mt-4 pt-3 border-t border-yellow-200">
                      <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Suggested</h5>
                      <div className="space-y-2">
                        {optionalTodos.slice(0, 3).map((step: string, index: number) => (
                          <div key={`optional-${index}`} className="flex items-center gap-3 p-2 bg-yellow-25 rounded border border-yellow-100">
                            <div className="w-4 h-4 border border-gray-300 rounded opacity-50"></div>
                            <span className="text-sm text-gray-700 flex-1">
                              {typeof step === 'object'
                                ? ((step as any)?.description || (step as any)?.task || JSON.stringify(step))
                                : step}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  try {
                                    await apiRequest('/api/todos/add-optional', 'POST', {
                                      title: step,
                                      noteId: note.id
                                    });

                                    // Refresh the note to show the new todo
                                    queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(Number(id)) });


                                  } catch (error) {

                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Add to todos"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        )}

        {/* Extracted Items Display */}
        {note.items && note.items.length > 0 && (
          <div className="bg-green-50 mx-4 mb-4 rounded-lg border border-green-200">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-base flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                Items Added to Collection
              </h4>
              <div className="space-y-3">
                {note.items.map((item: any, index: number) => (
                  <div key={item.id || index} className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                        )}
                        {item.category && (
                          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded inline-block mt-2">
                            {item.category}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Shopping Links Display */}
                    {item.detailedContent && (() => {
                      try {
                        const details = typeof item.detailedContent === 'string' ? JSON.parse(item.detailedContent) : item.detailedContent;
                        return details.shoppingLinks && details.shoppingLinks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-100">
                            <div className="text-xs text-gray-600 mb-2">🛒 Shopping Links:</div>
                            <div className="space-y-1">
                              {details.shoppingLinks.slice(0, 3).map((link: any, linkIndex: number) => (
                                <a
                                  key={linkIndex}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                >
                                  <div className="font-medium truncate">{link.title}</div>                                  {link.description && (
                                    <div className="text-gray-500 truncate mt-1">{link.description.slice(0, 80)}...</div>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}

                    {item.metadata && (() => {
                      try {
                        const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                        return Object.keys(metadata).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-100">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(metadata).map(([key, value]: [string, any]) => (
                                value && (
                                  <span key={key} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {key}: {String(value)}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                ))}
              </div>
              {note.collection && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-sm text-green-700">
                    📚 Added to "{note.collection.name}" collection
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subtle Entities Section at Bottom */}
        {note.richContext && (() => {
          try {
            const richData = JSON.parse(note.richContext);
            return richData.entities && richData.entities.length > 0 ? (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-1">
                  {richData.entities.map((entity: any, index: number) => (
                    <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {entity.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          } catch {
            return null;
          }
        })()}

        {/* Document Metadata - Bottom of page */}
        <div className="px-4 py-4 pb-28 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 space-y-1">
          <div>Last modified {note.createdAt ? formatDistanceToNow(new Date(note.createdAt)) + ' ago' : 'Unknown'}</div>
          <div>Created {note.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown date'}</div>
          <div className="text-gray-400">Note ID: #{note.id}</div>
        </div>


      </div>
      {/* Input Bar - Context Aware */}
      <InputBar
        noteId={note?.id}
        onTextSubmit={handleSendMessage}
        onCameraCapture={() => {
          console.log('Camera capture triggered from note detail');
        }}
        onNewNote={() => {
          console.log('New note triggered from note detail');
        }}
      />

      {/* Version History Dialog */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-96">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Current Version</div>
                  <div className="text-xs text-gray-500">
                    {note?.content?.substring(0, 100)}...
                  </div>
                </div>
              </div>

              {versionHistory && Array.isArray(versionHistory) && versionHistory.map((version) => (
                <div key={version.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      Version {version.version} - {version.changeType}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {version.changeDescription} | {format(new Date(version.createdAt), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {version.content?.substring(0, 80)}...
                    </div>
                    <button
                      onClick={() => rollbackMutation.mutate(version.version)}
                      disabled={rollbackMutation.isPending}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {rollbackMutation.isPending ? 'Rolling back...' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog for High-Risk Changes */}
      {showApprovalDialog && pendingChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">AI Wants to Make Changes</h3>
              </div>
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setPendingChanges(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-96">
              <div className="text-sm text-gray-600">
                AI detected valuable content that could be affected by these changes. Please review before proceeding.
              </div>

              {pendingChanges.warnings && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-800 mb-2">Protected Content:</div>
                  <ul className="space-y-1">
                    {pendingChanges.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-xs text-orange-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Suggested Changes:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                  {typeof pendingChanges.suggestedChanges === 'string' 
                    ? pendingChanges.suggestedChanges 
                    : JSON.stringify(pendingChanges.suggestedChanges, null, 2)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Or clarify your instruction:</div>
                <textarea
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  placeholder="Explain what you meant in more detail..."
                  className="w-full p-2 border rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setPendingChanges(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              {clarificationInput && (
                <button
                  onClick={() => {
                    clarifyMutation.mutate({
                      originalInstruction: pendingChanges.originalInstruction || '',
                      clarification: clarificationInput
                    });
                    setShowApprovalDialog(false);
                    setPendingChanges(null);
                  }}
                  disabled={clarifyMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {clarifyMutation.isPending ? 'Clarifying...' : 'Clarify & Apply'}
                </button>
              )}

              <button
                onClick={() => {
                  approveChangesMutation.mutate({
                    suggestedChanges: pendingChanges.suggestedChanges,
                    userApproved: true
                  });
                }}
                disabled={approveChangesMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-1 inline" />
                {approveChangesMutation.isPending ? 'Applying...' : 'Approve Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Dialog */}
      <ReminderDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        prePopulatedText={`Reminder: ${note?.content?.split('\n')[0] || 'Untitled Note'}`}
        onReminderUpdated={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });

        }}
      />
    </div>
  );
}