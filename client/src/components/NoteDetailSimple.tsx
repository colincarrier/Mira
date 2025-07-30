import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { NoteWithTodos, Todo, Task } from '@shared/schema';
import { MarkdownRenderer } from './MarkdownRenderer';
import { parseMiraResponse } from '../utils/parseMiraResponse';
import InputBar from './input-bar';

interface NoteDetailSimpleProps {
  note?: NoteWithTodos;
}

function NoteDetailSimple({ note: propNote }: NoteDetailSimpleProps) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [optimisticNote, setOptimisticNote] = useState<NoteWithTodos | null>(null);
  
  console.log('NoteDetailSimple mounting with id:', id);
  
  const { data: note, isLoading } = useQuery<NoteWithTodos>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id && !propNote,
  });

  console.log('Query data:', { note, isLoading, id });
  const currentNote = propNote || note || optimisticNote;
  
  console.log('Current note:', currentNote);
  
  const mira = React.useMemo(
    () =>
      currentNote?.miraResponse
        ? parseMiraResponse(currentNote.miraResponse)
        : null,
    [currentNote?.miraResponse]
  );
  
  console.log('Mira response:', mira);

  useEffect(() => {
    if (currentNote?.content) {
      setContent(currentNote.content);
    }
  }, [currentNote]);

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      // Optimistic update
      const optimistic: NoteWithTodos = {
        ...currentNote,
        id: currentNote?.id || 0,
        content: newContent,
        todos: currentNote?.todos || [],
      } as NoteWithTodos;
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
        console.warn('Note update failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsEditing(false);
      setOptimisticNote(null);
    },
    onError: (error) => {
      console.warn('Note update failed:', error);
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
    console.log('Loading note...');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentNote) {
    console.log('No current note found');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="text-gray-500">Note not found</div>
      </div>
    );
  }

  const tasks: Task[] = [];
  const tokenUsage = null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">
            Note #{currentNote?.id}
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
            <p className="whitespace-pre-wrap">{currentNote?.content}</p>
          </div>
        )}
        
        {/* AI-generated content */}
        {mira && mira.meta?.v === 3 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Strategic Intelligence
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={mira.content || ''} />
            </div>
          </div>
        )}

        {/* AI-extracted Tasks from V3 */}
        {mira?.tasks && mira.tasks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              AI-Extracted Tasks
            </h3>
            <div className="space-y-2">
              {mira.tasks.map((task: any, index: number) => {
                // Handle both string and object title formats
                const title = typeof task.title === 'string' 
                  ? task.title 
                  : task.title?.description || task.title?.link || 'Untitled task';
                  
                return (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-900 dark:text-white">{title}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>
      
      {/* InputBar at bottom */}
      {currentNote && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <InputBar
            noteId={currentNote.id}
          />
        </div>
      )}
    </div>
  );
}

export default NoteDetailSimple;