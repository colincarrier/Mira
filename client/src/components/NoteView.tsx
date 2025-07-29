// ---------- client/src/components/NoteView.tsx ------------
// Unified Note View component for both card and detail display (V3)

import React from 'react';
import { parseMiraResponse, getDisplayContent } from '@/utils/parseMiraResponse';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ExternalLink, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface NoteViewProps {
  note: any;
  view: 'card' | 'detail';
  className?: string;
}

export function NoteView({ note, view, className = '' }: NoteViewProps) {
  const displayData = getDisplayContent(note);
  
  if (view === 'card') {
    return <NoteCardView note={note} displayData={displayData} className={className} />;
  }
  
  return <NoteDetailView note={note} displayData={displayData} className={className} />;
}

function NoteCardView({ note, displayData, className }: { note: any; displayData: any; className: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Note title and metadata */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 mb-1">
          {note.aiGeneratedTitle || note.content?.split('\n')[0] || 'Untitled'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{note.mode === 'voice' ? '🎤' : note.mode === 'image' ? '📷' : '📝'}</span>
          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          {displayData.hasV3 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">V3</span>}
        </div>
      </div>

      {/* AI-enhanced content preview */}
      {displayData.content && (
        <div className="mb-3 text-sm text-gray-700 line-clamp-3">
          <MarkdownRenderer content={displayData.content.substring(0, 200) + '...'} />
        </div>
      )}

      {/* Tasks preview */}
      {displayData.tasks.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="w-3 h-3" />
          <span>{displayData.tasks.length} task{displayData.tasks.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

function NoteDetailView({ note, displayData, className }: { note: any; displayData: any; className: string }) {
  // Parse V3 response for additional data
  const v3Response = parseMiraResponse(note.miraResponse || note.mira_response);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Original content if different */}
      {note.content && note.content !== displayData.content && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Original Input</h4>
          <div className="text-sm text-blue-800 whitespace-pre-wrap">{note.content}</div>
        </div>
      )}

      {/* V3 Enhanced Content */}
      {displayData.content && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">AI</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-blue-900">
                {displayData.hasV3 ? 'V3 Help-First Analysis' : 'AI Analysis'}
              </h3>
              {v3Response?.meta && (
                <span className="text-xs text-blue-600">
                  {v3Response.meta.intent} • {v3Response.meta.confidence.toFixed(1)} confidence
                </span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <MarkdownRenderer content={displayData.content} />
          </div>
        </div>
      )}

      {/* V3 Tasks */}
      {displayData.tasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Action Items ({displayData.tasks.length}/3 max)
          </h4>
          <div className="space-y-2">
            {displayData.tasks.map((task: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600">✓</span>
                <span className="flex-1 text-gray-700">{task.title || task}</span>
                {task.priority && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* V3 Links */}
      {v3Response?.links && v3Response.links.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Helpful Links
          </h4>
          <div className="space-y-2">
            {v3Response.links.map((link: any, index: number) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{link.title || link.url}</div>
                  {link.description && <div className="text-sm text-gray-600">{link.description}</div>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* V3 Reminders */}
      {v3Response?.reminders && v3Response.reminders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Scheduled Reminders
          </h4>
          <div className="space-y-2">
            {v3Response.reminders.map((reminder: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="w-4 h-4 text-yellow-600" />
                <div className="flex-1">
                  <div className="text-gray-700">{new Date(reminder.timeISO).toLocaleString()}</div>
                  {reminder.leadMins && (
                    <div className="text-sm text-gray-500">
                      Reminder {reminder.leadMins} minutes before
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing status */}
      {note.isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-blue-700">AI analysis in progress...</span>
        </div>
      )}

      {/* V3 Metadata */}
      {v3Response?.meta && (
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <span>Model: {v3Response.meta.model}</span>
            <span>Processing: {v3Response.meta.processingTimeMs}ms</span>
            <span>Intent: {v3Response.meta.intent}</span>
            <span>Version: V{v3Response.meta.v}</span>
          </div>
        </div>
      )}
    </div>
  );
}