// Part 1: Clean iOS-style note detail component with optimistic updates
import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateTempId } from '../utils/id';
import type { Task } from '../../../shared/types';
import { queueOffline } from '../db/offlineQueue';

// Define Note type since it's not exported from shared/types
interface Note {
  id: number;
  content: string;
  aiGeneratedTitle?: string;
  isProcessing?: boolean;
  miraResponse?: {
    tasks: Task[];
  };
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    processingTimeMs: number;
  };
}

interface NoteDetailSimpleProps {
  note?: Note;
}

function NoteDetailSimple({ note: propNote }: NoteDetailSimpleProps) {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [optimisticNote, setOptimisticNote] = useState<Note | null>(null);
  
  const { data: note, isLoading } = useQuery({
    queryKey: ['/api/notes', id],
    enabled: !!id && !propNote,
  });

  const currentNote = propNote || note || optimisticNote;

  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
    }
  }, [currentNote]);

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      // Optimistic update
      const optimistic = {
        ...currentNote,
        content: newContent,
        isProcessing: true,
      } as Note;
      setOptimisticNote(optimistic);

      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update');
        }
        
        return response.json();
      } catch (error) {
        // Queue for offline sync
        await queueOffline({
          id: generateTempId(),
          kind: 'note',
          payload: { id, content: newContent, action: 'update' },
        });
        throw error;
      }
    },
    onSuccess: () => {
      setIsEditing(false);
      setOptimisticNote(null);
    },
    onError: (error) => {
      console.warn('Note update failed, queued for offline sync:', error);
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (content !== currentNote?.content) {
      updateMutation.mutate(content);
    } else {
      setIsEditing(false);
    }
  };

  if (isLoading && !propNote) {
    return <div className="p-4 animate-pulse">Loading...</div>;
  }

  if (!currentNote) {
    return <div className="p-4 text-gray-500">Note not found</div>;
  }

  const tasks = currentNote.miraResponse?.tasks || [];
  const tokenUsage = currentNote.tokenUsage;

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-lg font-medium text-gray-900 dark:text-white">
          {currentNote.aiGeneratedTitle || 'Note'}
        </h1>
        <div className="flex items-center gap-2">
          {currentNote.isProcessing && (
            <span className="text-blue-500 text-sm">AI analyzing...</span>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Write your note..."
            autoFocus
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{currentNote.content}</p>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Extracted Tasks
            </h3>
            <div className="space-y-2">
              {tasks.map((task: Task, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token Usage Debug Info */}
        {tokenUsage && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <div>Tokens: {tokenUsage.inputTokens}in / {tokenUsage.outputTokens}out / {tokenUsage.totalTokens}total</div>
            <div>Model: {tokenUsage.model} | Time: {tokenUsage.processingTimeMs}ms</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetailSimple;