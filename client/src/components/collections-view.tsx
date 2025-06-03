import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Coffee, Lightbulb, Book, Folder, ChevronRight, Heart, Star, Briefcase, Home, Car, Plane, CheckSquare, Calendar, MapPin, ShoppingBag, Search, Mic, Filter, Plus } from "lucide-react";
import { getCollectionColor } from "@/lib/collection-colors";
import { useLocation } from "wouter";

interface CollectionWithCount {
  id: number;
  name: string;
  icon: string;
  color: string;
  iconUrl?: string;
  noteCount: number;
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
    default:
      return Folder;
  }
};



export default function CollectionsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent" | "count">("recent");
  const [, setLocation] = useLocation();
  
  const { data: collections, isLoading } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
  });

  const filteredAndSortedCollections = collections?.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Collections</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Search size={18} />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy("recent")}
          className={`px-3 py-1.5 text-xs rounded-full ${
            sortBy === "recent" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setSortBy("count")}
          className={`px-3 py-1.5 text-xs rounded-full ${
            sortBy === "count" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          Most Notes
        </button>
        <button
          onClick={() => setSortBy("name")}
          className={`px-3 py-1.5 text-xs rounded-full ${
            sortBy === "name" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          A-Z
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filteredAndSortedCollections.map((collection) => {
          const IconComponent = getIconComponent(collection.icon);
          const colors = getCollectionColor(collection.color);
          
          return (
            <div 
              key={collection.id} 
              onClick={() => setLocation(`/collection/${collection.id}`)}
              className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer touch-manipulation"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <IconComponent className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-medium text-xs leading-tight">{collection.name}</h3>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {collection.noteCount}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="mt-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[hsl(var(--ocean-blue))] rounded-full flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
