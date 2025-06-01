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
  notes: NoteWithTodos[];
  itemCount: number;
}

export default function CollectionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isGeneratingSuper, setIsGeneratingSuper] = useState(false);

  const { data: collection } = useQuery<Collection>({
    queryKey: ["/api/collections", id],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/collections", id, "notes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const generateSuperNoteMutation = useMutation({
    mutationFn: async () => {
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

  if (!collection || !notes) {
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
            onClick={() => setLocation("/")}
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
          <div className="p-4 space-y-6">
            {/* Super Note Content */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Super Note</h3>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800">
                {superNote.aggregatedContent.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            {superNote.insights && superNote.insights.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">AI Insights</h3>
                {superNote.insights.map((insight, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">{insight}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Individual Notes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Source Notes ({notes.length})</h3>
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => setLocation(`/note/${note.id}`)}
                  className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow touch-manipulation"
                >
                  <p className="text-sm text-gray-800 line-clamp-3">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    {note.todos && note.todos.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {note.todos.length} todo{note.todos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Super Note</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate an intelligent summary that aggregates all your notes in this collection with AI insights and connections.
              </p>
            </div>

            {/* Preview of individual notes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Notes in Collection ({notes.length})</h3>
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => setLocation(`/note/${note.id}`)}
                  className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow touch-manipulation"
                >
                  <p className="text-sm text-gray-800 line-clamp-2">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    {note.todos && note.todos.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {note.todos.length} todo{note.todos.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}