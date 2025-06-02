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

  if (!collection || !notes || !id) {
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

  const IconComponent = getIconComponent(collection.icon);
  const colors = getCollectionColor(collection.color);

  return (
    <div className="mx-auto max-w-sm w-full h-full flex flex-col bg-white">
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
        {notes.length > 0 ? (
          <div className="p-4">
            {/* Notes Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notes.map((note, index) => (
                      <tr 
                        key={note.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setLocation(`/notes/${note.id}`)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {note.content ? note.content.split('\n')[0].replace(/^\[.*?\]\s*/, '').substring(0, 60) : 'Untitled Note'}
                              {note.content && note.content.length > 60 && '...'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {note.content ? note.content.length : 0} characters
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {note.todos && note.todos.length > 0 ? (
                              <div className="flex items-center space-x-1">
                                <Icons.CheckSquare className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-600">
                                  {note.todos.filter(t => t.completed).length}/{note.todos.length}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No tasks</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {note.mode === 'standard' && <Icons.MessageSquare className="w-4 h-4 text-gray-400" />}
                            {note.mode === 'voice' && <Icons.Mic className="w-4 h-4 text-blue-500" />}
                            {note.mode === 'camera' && <Icons.Camera className="w-4 h-4 text-green-500" />}
                            {note.mode === 'file' && <Icons.File className="w-4 h-4 text-purple-500" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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