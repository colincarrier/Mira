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
    play: Icons.Play,
  };
  return iconMap[iconName] || Icons.Folder;
};

interface SuperNoteData {
  collection: Collection;
  aggregatedContent: string;
  description: string;
  insights: string[];
  structuredItems?: any;
  allTodos?: any[];
  items: any[];
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
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!collection && !!notes && !!id,
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

      {/* Collection Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center">
            <IconComponent className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{collection.name}</h2>
            <p className="text-xs text-gray-500">
              {superNote ? `${superNote.itemCount} items` : `${notes.length} notes`}
            </p>
          </div>
        </div>
        
        {superNote && (
          <p className="text-sm text-gray-600 mb-3">{superNote.description}</p>
        )}

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
          /* Individual Items View */
          <div className="pb-4">
            {/* Items Subheading */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Items</h3>
            </div>

            {/* Individual Line Items */}
            <div className="divide-y divide-gray-100">
              {superNote.items && superNote.items.length > 0 ? (
                (() => {
                  // Separate completed and uncompleted items
                  const uncompleted = superNote.items.filter((item: any) => !item.isProcessed);
                  const completed = superNote.items.filter((item: any) => item.isProcessed);
                  
                  return [...uncompleted, ...completed].map((item: any, index: number) => {
                    const timeAgo = (() => {
                      const now = new Date();
                      const itemDate = new Date(item.createdAt);
                      const diffInSeconds = Math.floor((now.getTime() - itemDate.getTime()) / 1000);
                      
                      if (diffInSeconds < 60) return 'now';
                      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                      return `${Math.floor(diffInSeconds / 86400)}d ago`;
                    })();

                    return (
                      <div 
                        key={item.id || index} 
                        className={`px-4 py-3 transition-colors ${item.isProcessed ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (item.sourceNoteId) {
                                setLocation(`/notes/${item.sourceNoteId}`);
                              }
                            }}
                          >
                            <h4 className={`text-sm font-medium truncate ${item.isProcessed ? 'text-gray-500' : 'text-gray-900'}`}>
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className={`text-xs mt-1 line-clamp-1 ${item.isProcessed ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <span className="text-xs text-gray-400">{timeAgo}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Add API call to update item processed status
                                console.log('Toggle item processed:', item.id);
                              }}
                              className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center hover:border-blue-500 transition-colors"
                            >
                              {item.isProcessed && (
                                <Icons.Check className="w-3 h-3 text-blue-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No items yet</p>
                </div>
              )}
            </div>

            {/* Source Notes Link */}
            {superNote.notes && superNote.notes.length > 0 && (
              <div className="border-t border-gray-100 mt-6 pt-4 px-4">
                <button
                  onClick={() => {
                    // Navigate to the first source note if only one, otherwise show a list
                    if (superNote.notes.length === 1) {
                      setLocation(`/notes/${superNote.notes[0].id}`);
                    } else {
                      // For now, navigate to the most recent note
                      const mostRecent = superNote.notes.sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0];
                      setLocation(`/notes/${mostRecent.id}`);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View original note{superNote.notes.length > 1 ? 's' : ''} →
                </button>
              </div>
            )}
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