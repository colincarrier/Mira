import { useQuery } from "@tanstack/react-query";
import { Coffee, Lightbulb, Book, Folder, ChevronRight } from "lucide-react";

interface CollectionWithCount {
  id: number;
  name: string;
  icon: string;
  color: string;
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
    default:
      return Folder;
  }
};

const getColorClass = (color: string) => {
  switch (color) {
    case "orange":
      return "bg-[hsl(var(--ios-orange))]";
    case "purple":
      return "bg-[hsl(var(--ios-purple))]";
    case "green":
      return "bg-[hsl(var(--ios-green))]";
    case "blue":
      return "bg-[hsl(var(--ios-blue))]";
    default:
      return "bg-[hsl(var(--ios-gray))]";
  }
};

export default function CollectionsView() {
  const { data: collections, isLoading } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
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
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Collections</h2>
          <button className="text-sm text-[hsl(var(--ios-blue))] font-medium">New</button>
        </div>
        <div className="text-center py-8">
          <p className="text-[hsl(var(--ios-gray))]">No collections yet. AI will create them automatically as you add notes!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Collections</h2>
        <button className="text-sm text-[hsl(var(--ios-blue))] font-medium">New</button>
      </div>

      <div className="space-y-4">
        {collections.map((collection) => {
          const IconComponent = getIconComponent(collection.icon);
          const colorClass = getColorClass(collection.color);
          
          return (
            <div key={collection.id} className="note-card">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{collection.name}</h3>
                  <p className="text-sm text-[hsl(var(--ios-gray))]">
                    {collection.noteCount} note{collection.noteCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[hsl(var(--ios-gray))]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
