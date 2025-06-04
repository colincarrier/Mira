import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Coffee, Lightbulb, Book, Folder, ChevronRight, Heart, Star, Briefcase, Home, Car, Plane, CheckSquare, Calendar, MapPin, ShoppingBag, Search, Mic, Filter, Plus, Users, Play, Utensils } from "lucide-react";
import { getCollectionColor } from "@/lib/collection-colors";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface CollectionWithCount {
  id: number;
  name: string;
  icon: string;
  color: string;
  iconUrl?: string;
  noteCount: number;
  openTodoCount: number;
  createdAt: string;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "coffee":
      return Coffee;
    case "lightbulb":
      return Lightbulb;
    case "book":
      return Book;
    case "heart":
      return Heart;
    case "star":
      return Star;
    case "briefcase":
      return Briefcase;
    case "home":
      return Home;
    case "car":
      return Car;
    case "plane":
      return Plane;
    case "checklist":
      return CheckSquare;
    case "calendar":
      return Calendar;
    case "location":
      return MapPin;
    case "shopping":
      return ShoppingBag;
    case "users":
      return Users;
    case "play":
      return Play;
    case "utensils":
      return Utensils;
    default:
      return Folder;
  }
};



export default function CollectionsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent" | "count">("recent");
  const [draggedCollection, setDraggedCollection] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: collections, isLoading } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedCollections: CollectionWithCount[]) => {
      // Update display order for each collection
      const updates = reorderedCollections.map((collection, index) => ({
        id: collection.id,
        displayOrder: index
      }));
      
      return apiRequest("POST", "/api/collections/reorder", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });

  // Define the preferred order for collections
  const collectionOrder = ["To-do's", "Personal", "Home", "Work"];
  
  const getCollectionPriority = (name: string) => {
    const index = collectionOrder.indexOf(name);
    return index === -1 ? 999 : index;
  };

  const filteredAndSortedCollections = collections?.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // First sort by priority (To-do's, Personal, Home, Work)
    const aPriority = getCollectionPriority(a.name);
    const bPriority = getCollectionPriority(b.name);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Then sort by selected criteria
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "count":
        return b.noteCount - a.noteCount;
      default:
        return 0;
    }
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between mb-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Collections</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="note-card animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between mb-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Collections</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">No collections yet. AI will create them automatically as you add notes!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between mb-4 pt-6">
        <h2 className="text-2xl font-serif font-medium">Collections</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Search size={18} />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>



      <div className="grid grid-cols-3 gap-2">
        {filteredAndSortedCollections.map((collection, index) => {
          const IconComponent = getIconComponent(collection.icon);
          const colors = getCollectionColor(collection.color);
          
          return (
            <div 
              key={collection.id} 
              draggable
              onDragStart={(e) => {
                setDraggedCollection(collection.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggedCollection(null);
                setDragOverIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDragLeave={() => {
                setDragOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedCollection && draggedCollection !== collection.id) {
                  const draggedIndex = filteredAndSortedCollections.findIndex(c => c.id === draggedCollection);
                  const targetIndex = index;
                  
                  if (draggedIndex !== -1 && targetIndex !== -1) {
                    const reorderedCollections = [...filteredAndSortedCollections];
                    const [draggedItem] = reorderedCollections.splice(draggedIndex, 1);
                    reorderedCollections.splice(targetIndex, 0, draggedItem);
                    
                    reorderMutation.mutate(reorderedCollections);
                  }
                }
                setDraggedCollection(null);
                setDragOverIndex(null);
              }}
              onClick={() => setLocation(`/collection/${collection.id}`)}
              className={`bg-[hsl(var(--card))] border transition-all cursor-pointer touch-manipulation h-24 ${
                draggedCollection === collection.id ? 'opacity-50 scale-95' : ''
              } ${
                dragOverIndex === index && draggedCollection !== collection.id 
                  ? 'border-blue-400 border-2' 
                  : 'border-[hsl(var(--border))]'
              } rounded-lg p-3 hover:shadow-sm`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  {collection.iconUrl ? (
                    <img 
                      src={collection.iconUrl} 
                      alt={collection.name}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <IconComponent className={`w-6 h-6 ${colors.text}`} />
                  )}
                </div>
                <div className="space-y-1 flex-1 flex flex-col justify-end">
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center text-center">{collection.name}</h3>
                  <div className="space-y-0 min-h-[2rem] flex flex-col justify-center">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight">
                      {collection.noteCount} {collection.noteCount === 1 ? 'note' : 'notes'}
                    </p>
                    {collection.openTodoCount > 0 && (
                      <p className="text-[10px] text-orange-600 font-medium leading-tight">
                        {collection.openTodoCount} to-do{collection.openTodoCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
