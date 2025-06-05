import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, MessageSquare, Plus, Share, MoreVertical } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { getCollectionColor } from "@/lib/collection-colors";
import * as Icons from "lucide-react";
import { useState } from "react";
import type { NoteWithTodos, Collection } from "@shared/schema";

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    coffee: Icons.Coffee,
    lightbulb: Icons.Lightbulb,
    book: Icons.Book,
    heart: Icons.Heart,
    star: Icons.Star,
    briefcase: Icons.Briefcase,
    home: Icons.Home,
    car: Icons.Car,
    plane: Icons.Plane,
    checklist: Icons.CheckSquare,
    calendar: Icons.Calendar,
    location: Icons.MapPin,
    shopping: Icons.ShoppingBag,
  };
  return iconMap[iconName] || Icons.Folder;
};

interface SuperNoteData {
  collection: Collection;
  aggregatedContent: string;
  insights: string[];
  structuredItems?: any;
  allTodos?: any[];
  notes: NoteWithTodos[];
  itemCount: number;
  todoCount?: number;
}

export default function CollectionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isGeneratingSuper, setIsGeneratingSuper] = useState(false);

  const { data: collection } = useQuery<Collection>({
    queryKey: ["/api/collections", id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id,
  });

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/collections", id, "notes"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id,
  });

  const generateSuperNoteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No collection ID");
      const response = await apiRequest("POST", `/api/collections/${id}/super-note`);
      return response.json();
    },
    onSuccess: (data: SuperNoteData) => {
      queryClient.setQueryData(["/api/collections", id, "super-note"], data);
    },
  });

  const { data: superNote } = useQuery<SuperNoteData>({
    queryKey: ["/api/collections", id, "super-note"],
    enabled: !!collection && !!notes,
  });

  const handleGenerateSuper = () => {
    setIsGeneratingSuper(true);
    generateSuperNoteMutation.mutate();
  };

  if (!collection || !notes || !id || id === null) {
    return (
      <div className="mx-auto max-w-sm w-full h-full flex flex-col">
        <header className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation("/")}
              className="flex items-center text-[hsl(var(--ios-blue))] touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-lg font-semibold">Loading...</h1>
            <div className="w-12"></div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(collection?.icon || 'folder');
  const colors = getCollectionColor(collection?.color || 'gray');

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setLocation("/?tab=collections")}
            className="flex items-center text-[hsl(var(--ios-blue))] touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-lg font-semibold truncate">{collection.name}</h1>
          <button className="p-2 touch-manipulation">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      {/* Collection Info */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <IconComponent className={`w-8 h-8 ${colors.text}`} />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{collection.name}</h2>
            <p className="text-sm text-gray-500">{notes.length} notes collected</p>
          </div>
        </div>

        {!superNote && (
          <button
            onClick={handleGenerateSuper}
            disabled={isGeneratingSuper || generateSuperNoteMutation.isPending}
            className="w-full bg-[hsl(var(--ios-blue))] text-white py-3 rounded-xl font-medium disabled:opacity-50 touch-manipulation"
          >
            {isGeneratingSuper || generateSuperNoteMutation.isPending 
              ? 'Creating Super Note...' 
              : 'Generate Super Note'
            }
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {superNote ? (
          /* Super Note View - Aggregated Content */
          <div className="p-4">
            {/* Aggregated Content Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Collection Summary</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {superNote.aggregatedContent}
                </p>
              </div>
            </div>

            {/* Quick Insights */}
            {superNote.insights && superNote.insights.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3 text-gray-900">Key Insights</h4>
                <div className="space-y-2">
                  {superNote.insights.filter(Boolean).map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {superNote.structuredItems?.recommendedActions && superNote.structuredItems.recommendedActions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3 text-gray-900">Recommended Actions</h4>
                <div className="space-y-2">
                  {superNote.structuredItems.recommendedActions.map((action: any, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-3">
                      <h5 className="font-medium text-sm text-blue-900">{action.title}</h5>
                      <p className="text-xs text-blue-700 mt-1">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Notes - Clickable */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-900">Source Notes ({superNote.notes?.length || 0})</h4>
              <div className="space-y-2">
                {(superNote.notes || []).map((note) => {
                  const timeAgo = (() => {
                    const now = new Date();
                    const noteDate = new Date(note.createdAt);
                    const diffInSeconds = Math.floor((now.getTime() - noteDate.getTime()) / 1000);
                    
                    if (diffInSeconds < 60) return 'now';
                    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                    return `${Math.floor(diffInSeconds / 86400)}d ago`;
                  })();

                  return (
                    <div 
                      key={note.id} 
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/notes/${note.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {note.mode === 'voice' && <Icons.Mic className="w-4 h-4 text-blue-500" />}
                          {note.mode === 'camera' && <Icons.Camera className="w-4 h-4 text-green-500" />}
                          {note.mode === 'file' && <Icons.File className="w-4 h-4 text-purple-500" />}
                          {note.mode === 'text' && <Icons.MessageSquare className="w-4 h-4 text-gray-500" />}
                          <span className="text-xs text-gray-500">{timeAgo}</span>
                        </div>
                        {note.todos && note.todos.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Icons.CheckSquare className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-gray-600">
                              {note.todos.filter(t => t.completed).length}/{note.todos.length}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {note.content ? note.content.split('\n')[0].replace(/^\[.*?\]\s*/, '') : 'Untitled Note'}
                      </p>
                      {note.todos && note.todos.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {note.todos.slice(0, 2).map((todo) => (
                            <div key={todo.id} className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${todo.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className={`text-xs ${todo.completed ? 'text-green-600 line-through' : 'text-gray-600'}`}>
                                {todo.title}
                              </span>
                            </div>
                          ))}
                          {note.todos.length > 2 && (
                            <p className="text-xs text-gray-500">+{note.todos.length - 2} more tasks</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={handleGenerateSuper}
              disabled={generateSuperNoteMutation.isPending}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium disabled:opacity-50 touch-manipulation hover:bg-gray-200 transition-colors"
            >
              {generateSuperNoteMutation.isPending ? 'Regenerating...' : 'Regenerate Super Note'}
            </button>
          </div>
        ) : notes.length > 0 ? (
          /* Regular Notes List */
          <div className="p-4">
            <div className="space-y-2">
              {notes.map((note, index) => {
                const timeAgo = (() => {
                  const now = new Date();
                  const noteDate = new Date(note.createdAt);
                  const diffInSeconds = Math.floor((now.getTime() - noteDate.getTime()) / 1000);
                  
                  if (diffInSeconds < 60) return 'now';
                  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                  return `${Math.floor(diffInSeconds / 86400)}d ago`;
                })();

                return (
                  <div 
                    key={note.id} 
                    className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => setLocation(`/notes/${note.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {note.content ? note.content.split('\n')[0].replace(/^\[.*?\]\s*/, '').substring(0, 80) : 'Untitled Note'}
                        {note.content && note.content.length > 80 && '...'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-3 flex-shrink-0">
                      {note.todos && note.todos.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Icons.CheckSquare className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-gray-600">
                            {note.todos.filter(t => t.completed).length}/{note.todos.length}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        {note.mode === 'standard' && <Icons.MessageSquare className="w-3 h-3 text-gray-400" />}
                        {note.mode === 'voice' && <Icons.Mic className="w-3 h-3 text-blue-500" />}
                        {note.mode === 'camera' && <Icons.Camera className="w-3 h-3 text-green-500" />}
                        {note.mode === 'file' && <Icons.File className="w-3 h-3 text-purple-500" />}
                      </div>
                      
                      <span className="text-xs text-gray-500 min-w-0">{timeAgo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <Icons.Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notes in this collection yet</p>
          </div>
        )}
      </div>
    </div>
  );
}