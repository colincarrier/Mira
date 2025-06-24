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

  const rc = note.richContext ? JSON.parse(note.richContext) : {};

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
      <div className="space-y-6 px-4 py-6">
        {/* Title bar styled like iOS heading */}
        <h1 className="text-2xl font-semibold leading-snug">{rc.title}</h1>

        {/* Original snippet (only if needed) */}
        {rc.original && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
            {rc.original}
          </div>
        )}

        {/* AI body */}
        {rc.aiBody && (
          <pre className="whitespace-pre-wrap text-base leading-relaxed">{rc.aiBody}</pre>
        )}

        {/* Perspective */}
        {rc.perspective && (
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{rc.perspective}</p>
        )}
      </div>
    </div>
  );
}