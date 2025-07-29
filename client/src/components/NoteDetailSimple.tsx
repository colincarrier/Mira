import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { NoteWithTodos } from '@shared/schema';
import { marked } from 'marked';
import InputBar from '@/components/input-bar';
import { parseRichContext } from '@/utils/parseRichContext';
import { parseMiraResponse } from '@/utils/parseMiraResponse';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TaskBadge } from './TaskBadge';

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
    staleTime: 0, // Always fresh data for real-time enhancement updates
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refresh every 3 seconds to show AI enhancement progress
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Parse V3 MiraResponse with legacy fallback
  const rc = React.useMemo(() => {
    if (!note) return null;
    
    console.log('🔍 NoteDetailSimple parsing note:', {
      id: note.id,
      hasMiraResponse: !!note.miraResponse,
      hasRichContext: !!note.richContext,
      miraResponseType: typeof note.miraResponse
    });
    
    try {
      // Try V3 MiraResponse first
      if (note.miraResponse) {
        console.log('🔍 Attempting V3 MiraResponse parsing...');
        const v3Result = parseMiraResponse(note.miraResponse);
        if (v3Result) {
          console.log('✅ Successfully parsed V3 MiraResponse:', {
            hasContent: !!v3Result.content,
            contentPreview: v3Result.content?.substring(0, 50)
          });
          return v3Result;
        }
        console.log('❌ V3 parsing failed, falling back to legacy');
      }
      
      // Fall back to legacy richContext
      console.log('🔍 Attempting legacy richContext parsing...');
      const legacyResult = parseRichContext(note.richContext);
      console.log('Legacy parse result:', legacyResult ? 'success' : 'failed');
      return legacyResult;
    } catch (error) {
      console.error('🚨 parseRichContext error in detail page:', error, 'for note:', note?.id);
      return null;
    }
  }, [note?.miraResponse, note?.richContext, note?.id]);
  
  const safe = React.useMemo(() => {
    if (!note) return { title: '', original: '', content: '' };
    
    console.log('🔍 Building safe object:', {
      noteId: note.id,
      hasRc: !!rc,
      rcContent: !!rc?.content,
      rcContentLength: rc?.content?.length,
      rcType: typeof rc
    });
    
    // V3 format uses 'content' instead of separate title/aiBody/perspective
    if (rc?.content) {
      const result = {
        title: note.aiGeneratedTitle ?? note.content?.split('\n')[0] ?? 'Untitled',
        original: note.content !== rc.content ? note.content : '',
        content: rc.content
      };
      console.log('✅ Using V3 content format:', {
        title: result.title,
        hasOriginal: !!result.original,
        contentLength: result.content.length
      });
      return result;
    }
    
    // Legacy format fallback
    const result = {
      title: rc?.title ?? note.aiGeneratedTitle ?? note.content?.split('\n')[0] ?? 'Untitled',
      original: rc?.original ?? ((rc?.title || '') !== note.content ? note.content : ''),
      content: rc?.aiBody ?? ''
    };
    console.log('📄 Using legacy format:', {
      title: result.title,
      hasOriginal: !!result.original,
      contentLength: result.content.length
    });
    return result;
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

        {/* V3 Enhanced Analysis - Living Document */}
        {safe.content && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">AI</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-blue-900">Strategic Intelligence</h3>
                {rc?.miraV3 && (
                  <span className="text-xs text-blue-600">V3 Enhanced • {rc.miraV3.meta?.intent}</span>
                )}
              </div>
            </div>
            <div className="text-base text-gray-800 leading-relaxed bg-white p-3 rounded-lg shadow-sm">
              <MarkdownRenderer content={safe.content} />
            </div>
          </div>
        )}

        {/* V3 Tasks Section */}
        {rc?.tasks && rc.tasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">📋 Generated Tasks</h3>
            <div className="space-y-2">
              {rc.tasks.map((task: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">{task.title}</span>
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

        {/* AI Quick Insights */}
        {rc?.quickInsights && rc.quickInsights.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">🔍 Quick Insights</h3>
            <ul className="space-y-1 list-disc list-inside">
              {rc.quickInsights.map((insight: string, index: number) => (
                <li key={index} className="text-sm text-gray-700">{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI-Generated Tasks */}
        {note.todos && note.todos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">✅ Related Tasks</h3>
            <div className="space-y-2">
              {note.todos.map((todo: any) => (
                <TaskBadge key={todo.id} task={todo} />
              ))}
            </div>
          </div>
        )}

        {/* V3 Links Section */}
        {rc?.links && rc.links.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">🔗 Resources</h3>
            {rc.links.slice(0, 3).map((link: any, index: number) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-blue-600">{link.title || link.url}</div>
                {link.description && (
                  <div className="text-xs text-gray-500 mt-1">{link.description}</div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Input bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <InputBar />
      </div>
    </div>
  );
}