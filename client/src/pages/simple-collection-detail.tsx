import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { Item, Collection } from "@shared/schema";

export default function SimpleCollectionDetail() {
  const [match, params] = useRoute("/collection/:id");
  const collectionId = params?.id ? parseInt(params.id) : null;

  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
    enabled: !!collectionId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: [`/api/collections/${collectionId}/items`],
    enabled: !!collectionId,
  });

  if (!match || !collectionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Collection not found</div>
      </div>
    );
  }

  if (collectionLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading collection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 flex items-center space-x-3">
          <button 
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-2">
            <div className="text-2xl">
              {collection?.icon === "play" && "▶️"}
              {collection?.icon === "checklist" && "✅"}
              {collection?.icon === "shopping-cart" && "🛒"}
              {collection?.icon === "home" && "🏠"}
              {collection?.icon === "briefcase" && "💼"}
              {collection?.icon === "user" && "👤"}
              {collection?.icon === "users" && "👥"}
              {collection?.icon === "map-pin" && "📍"}
              {collection?.icon === "book" && "📚"}
              {collection?.icon === "utensils" && "🍽️"}
              {collection?.icon === "heart" && "❤️"}
              {collection?.icon === "folder" && "📁"}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{collection?.name}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Items ({items?.length || 0})
            </h2>
            <p className="text-sm text-gray-600">
              Individual items extracted from your notes
            </p>
          </div>

          {items && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.type}
                        </span>
                        {item.context && (
                          <div className="text-xs text-gray-500">
                            {item.context}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600">
                Items will appear here when you create notes that mention specific {collection?.name.toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}