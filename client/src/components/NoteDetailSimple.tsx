import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { NoteWithTodos } from '@shared/schema';
import { marked } from 'marked';
import InputBar from '@/components/input-bar';
import { parseRichContext } from '@/utils/parseRichContext';

// Helper function to convert markdown to HTML
function mdToHtml(markdown: string): string {
  return marked(markdown) as string;
}

export default function NoteDetailSimple() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: note, isLoading, error } = useQuery<NoteWithTodos>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id,
    staleTime: 60000, // Cache individual notes for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Parse richContext with robust fallbacks and error handling
  const rc = React.useMemo(() => {
    if (!note) return null;
    try {
      return parseRichContext(note.richContext);
    } catch (error) {
      console.error('🚨 parseRichContext error in detail page:', error, 'for note:', note?.id);
      return null;
    }
  }, [note?.richContext, note?.id]);
  
  const safe = React.useMemo(() => {
    if (!note) return { title: '', original: '', aiBody: '', perspective: '' };
    return {
      title: rc?.title ?? note.aiGeneratedTitle ?? note.content?.split('\n')[0] ?? 'Untitled',
      original: rc?.original ?? ((rc?.title || '') !== note.content ? note.content : ''),
      aiBody: rc?.aiBody ?? '',
      perspective: rc?.perspective ?? ''
    };
  }, [note, rc]);

  // NOW EARLY RETURNS ARE SAFE AFTER ALL HOOKS
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
            <h1 className="text-lg font-semibold text-gray-900">{safe.title}</h1>
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
      <div className="space-y-6 px-4 py-6">
        {/* Original content if different from title */}
        {safe.original && (
          <div className="bg-blue-50 rounded p-4 text-sm whitespace-pre-wrap">
            {safe.original}
          </div>
        )}

        {/* AI Enhanced Content */}
        {safe.aiBody && (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {safe.aiBody}
          </div>
        )}

        {/* Perspective */}
        {safe.perspective && (
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{safe.perspective}</p>
        )}
      </div>

      {/* Input bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <InputBar />
      </div>
    </div>
  );
}