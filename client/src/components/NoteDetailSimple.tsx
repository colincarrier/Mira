import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { NoteWithTodos } from '@shared/schema';

export default function NoteDetailSimple() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: note, isLoading, error } = useQuery<NoteWithTodos>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1efe8] pb-20">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-[#f1efe8] pb-20">
        <div className="p-4">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </button>
          <div className="text-center py-8">
            <h1 className="text-xl font-semibold mb-2">Note not found</h1>
            <p className="text-gray-600">This note may have been deleted or moved.</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse rich context for new layout
  let rc;
  try {
    rc = note.richContext ? JSON.parse(note.richContext) : { 
      title: note.aiGeneratedTitle || note.content.split('\n')[0] || 'Untitled',
      original: note.content,
      aiBody: note.aiContext || ''
    };
  } catch (e) {
    rc = { 
      title: note.aiGeneratedTitle || note.content.split('\n')[0] || 'Untitled',
      original: note.content,
      aiBody: note.aiContext || ''
    };
  }

  return (
    <div className="min-h-screen bg-[#f1efe8] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{rc.title}</h1>
            {note.isProcessing && (
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">AI processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Original Content */}
        {rc.original && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {rc.original}
            </div>
          </div>
        )}

        {/* AI Enhancement */}
        {rc.aiBody && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">AI Analysis</h3>
            <pre className="whitespace-pre-wrap text-sm text-blue-800">
              {rc.aiBody}
            </pre>
          </div>
        )}

        {/* Todos */}
        {note.todos && note.todos.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Action Items</h3>
            <div className="space-y-2">
              {note.todos.map((todo) => (
                <div key={todo.id} className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {todo.completed && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm ${
                    todo.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                  }`}>
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}